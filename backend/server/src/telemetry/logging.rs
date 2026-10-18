//! Independent event filtering and span collection for local and remote outputs.

use super::{
    config::LogLevel,
    dependencies,
    providers::{export_eligible, exporter_diagnostic},
};
use opentelemetry::{
    logs::{AnyValue, LogRecord as _, Logger, LoggerProvider, Severity},
    trace::TracerProvider as _,
    InstrumentationScope,
};
use opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge;
use opentelemetry_sdk::{
    logs::{SdkLogRecord, SdkLogger, SdkLoggerProvider},
    trace::SdkTracerProvider,
};
use std::sync::OnceLock;
use tracing_log::NormalizeEvent;
use tracing_subscriber::{
    fmt::{
        format::{Format, Json, Writer},
        FmtContext, FormatEvent, FormatFields, MakeWriter,
    },
    layer::{Context, Filter, SubscriberExt},
    registry::LookupSpan,
    Layer,
};

/// JSON formatter that omits arbitrary SDK/transport diagnostic fields and messages.
/// Dependency internals can contain receiver credentials or transport headers.
struct SafeJson {
    /// Standard structured formatting for application and other dependency events.
    normal: Format<Json>,
}

impl<S, N> FormatEvent<S, N> for SafeJson
where
    S: tracing::Subscriber + for<'a> LookupSpan<'a>,
    N: for<'a> FormatFields<'a> + 'static,
{
    /// Keeps severity, target, and callsite for diagnostics without copying payloads.
    fn format_event(
        &self,
        context: &FmtContext<'_, S, N>,
        mut writer: Writer<'_>,
        event: &tracing::Event<'_>,
    ) -> std::fmt::Result {
        let normalized = event.normalized_metadata();
        let metadata = normalized.as_ref().unwrap_or_else(|| event.metadata());
        if exporter_diagnostic(metadata) {
            writeln!(
                writer,
                "{}",
                serde_json::json!({
                    "level": metadata.level().as_str(),
                    "target": metadata.target(),
                    "fields": { "message": "Telemetry transport diagnostic", "callsite": metadata.name() }
                })
            )
        } else if let Some(kind) = dependencies::kind(
            metadata.target(),
            metadata.fields().field("db.statement").is_some(),
        ) {
            let mut measurements = dependencies::Measurements {
                kind,
                fields: Default::default(),
            };
            event.record(&mut measurements);
            measurements
                .fields
                .insert("message".into(), kind.message().into());
            writeln!(
                writer,
                "{}",
                serde_json::json!({
                    "level": metadata.level().as_str(), "target": metadata.target(),
                    "filename": metadata.file(), "line_number": metadata.line(), "fields": measurements.fields
                })
            )
        } else {
            self.normal.format_event(context, writer, event)
        }
    }
}

/// Filters events by LOG_LEVEL while leaving spans eligible at every severity.
fn allowed(metadata: &tracing::Metadata<'_>, level: LogLevel) -> bool {
    metadata.is_span() || *metadata.level() <= level.event_filter()
}

/// Per-layer event policy, including the original targets of converted log records.
#[derive(Clone, Copy)]
struct EventPolicy {
    /// Selected external event level.
    level: LogLevel,
    /// Whether this layer can feed remote export.
    remote: bool,
}

impl<S: tracing::Subscriber> Filter<S> for EventPolicy {
    /// Keeps spans independent of severity while excluding exporter-internal spans.
    fn enabled(&self, metadata: &tracing::Metadata<'_>, _: &Context<'_, S>) -> bool {
        allowed(metadata, self.level)
            && ((!self.remote && !metadata.is_span()) || export_eligible(metadata))
    }
    /// Checks dynamic legacy targets after tracing-log has converted the event.
    fn event_enabled(&self, event: &tracing::Event<'_>, _: &Context<'_, S>) -> bool {
        let normalized = event.normalized_metadata();
        let metadata = normalized.as_ref().unwrap_or_else(|| event.metadata());
        allowed(metadata, self.level) && (!self.remote || export_eligible(metadata))
    }
}

/// Adapts the official bridge to preserve original legacy logger targets in LogRecords.
struct OriginalTargets(SdkLoggerProvider);

impl LoggerProvider for OriginalTargets {
    type Logger = OriginalTargetLogger;
    /// Delegates logger creation to the existing SDK provider, without a second bridge.
    fn logger_with_scope(&self, scope: InstrumentationScope) -> Self::Logger {
        OriginalTargetLogger(self.0.logger_with_scope(scope))
    }
}

/// Restores tracing-log's original target before SDK processors receive the record.
struct OriginalTargetLogger(SdkLogger);

impl Logger for OriginalTargetLogger {
    type LogRecord = SdkLogRecord;
    /// Creates a standard SDK log record.
    fn create_log_record(&self) -> Self::LogRecord {
        self.0.create_log_record()
    }
    /// Preserves legacy dependency targets and delegates correlation/export to the SDK.
    fn emit(&self, mut record: Self::LogRecord) {
        if record.target().is_some_and(|target| target == "log") {
            let original = record.attributes_iter().find_map(|(key, value)| {
                if key.as_str() == "log.target" {
                    if let AnyValue::String(target) = value {
                        return Some(target.as_str().to_owned());
                    }
                }
                None
            });
            if let Some(target) = original {
                record.set_target(target);
            }
        }
        let record = dependencies::bounded_record(&record, &self.0).unwrap_or(record);
        self.0.emit(record);
    }
    /// Retains SDK enablement and recursion suppression behavior.
    fn event_enabled(&self, level: Severity, target: &str, name: Option<&str>) -> bool {
        self.0.event_enabled(level, target, name)
    }
}

/// Makes the official log bridge honor explicit tracing event ancestry.
struct EventAncestry<B> {
    /// The single official tracing-to-logs bridge.
    bridge: B,
    /// Non-owning dispatch handle used to activate an explicit event parent.
    dispatch: OnceLock<tracing::dispatcher::WeakDispatch>,
}

impl<S, B> Layer<S> for EventAncestry<B>
where
    S: tracing::Subscriber + for<'a> LookupSpan<'a>,
    B: Layer<S>,
{
    /// Saves a weak reference so the bridge cannot keep its subscriber alive.
    fn on_register_dispatch(&self, dispatch: &tracing::Dispatch) {
        let _ = self.dispatch.set(dispatch.downgrade());
        self.bridge.on_register_dispatch(dispatch);
    }
    /// Overrides current context only when the event declares its own ancestry.
    fn on_event(&self, event: &tracing::Event<'_>, context: Context<'_, S>) {
        if event.is_contextual() {
            self.bridge.on_event(event, context);
            return;
        }
        let parent = event
            .parent()
            .and_then(|id| {
                let dispatch = self.dispatch.get()?.upgrade()?;
                tracing_opentelemetry::get_otel_context(id, &dispatch)
            })
            .unwrap_or_default();
        let _parent = parent.attach();
        self.bridge.on_event(event, context);
    }
}

/// Creates output layers without reading environment or installing global state.
/// LOG_LEVEL affects events in every destination; spans remain independently eligible.
pub(super) fn subscriber<W>(
    level: LogLevel,
    traces: &SdkTracerProvider,
    logs: Option<&SdkLoggerProvider>,
    writer: W,
) -> impl tracing::Subscriber + Send + Sync
where
    W: for<'a> MakeWriter<'a> + Send + Sync + 'static,
{
    let remote = EventPolicy {
        level,
        remote: true,
    };
    let bridge = EventAncestry {
        bridge: logs.map(|logs| OpenTelemetryTracingBridge::new(&OriginalTargets(logs.clone()))),
        dispatch: OnceLock::new(),
    }
    .with_filter(remote);
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .json()
                .with_writer(writer)
                .event_format(SafeJson {
                    normal: tracing_subscriber::fmt::format()
                        .json()
                        .with_file(true)
                        .with_line_number(true),
                })
                // Avoid storing credential-bearing internal span fields for later local events.
                .with_filter(EventPolicy {
                    level,
                    remote: false,
                }),
        )
        .with(
            tracing_opentelemetry::layer()
                .with_tracer(traces.tracer("chaos-server"))
                .with_context_activation(true)
                .with_filter(remote),
        )
        .with(bridge)
}

#[cfg(test)]
mod tests;
