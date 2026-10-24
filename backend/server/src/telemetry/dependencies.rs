//! Bounded representations of real dependency events, excluding SQL and rejection bodies.

use opentelemetry::{
    logs::{AnyValue, LogRecord as _, Logger},
    KeyValue, Value,
};
use opentelemetry_sdk::{
    error::OTelSdkResult,
    logs::{SdkLogRecord, SdkLogger},
    trace::{SpanData, SpanExporter},
    Resource,
};
use std::time::Duration;

/// Dependency event classes whose original payload can contain application data.
#[derive(Clone, Copy)]
pub(super) enum Kind {
    /// SQLx statement completion.
    Query,
    /// Axum extractor rejection.
    Rejection,
}
impl Kind {
    /// Returns a fixed event message, independent of request/query text.
    pub(super) fn message(self) -> &'static str {
        match self {
            Self::Query => "Database statement completed",
            Self::Rejection => "Request extractor rejected request",
        }
    }
    /// Allows only bounded scalar measurements from each dependency.
    fn allows(self, key: &str) -> bool {
        match self {
            Self::Query => matches!(key, "rows_affected" | "rows_returned" | "elapsed_secs"),
            Self::Rejection => key == "status",
        }
    }

    /// Normalizes only allowed measurements, including unsigned integers formatted by the bridge.
    fn span_measurement(self, key: &str, value: &Value) -> Option<Value> {
        if !self.allows(key) {
            return None;
        }
        match value {
            Value::I64(_) => Some(value.clone()),
            Value::F64(number) if number.is_finite() => Some(value.clone()),
            // tracing-opentelemetry's default u64 visitor records decimal strings.
            // Parse strictly into the OTLP integer range, never retain arbitrary text.
            Value::String(text) => text.as_str().parse::<i64>().ok().map(Value::I64),
            _ => None,
        }
    }
}

/// Identifies SQLx statement events by their schema and Axum extractor rejections by target.
pub(super) fn kind(target: &str, has_statement: bool) -> Option<Kind> {
    match target {
        "sqlx::query" if has_statement => Some(Kind::Query),
        "axum::rejection" => Some(Kind::Rejection),
        _ => None,
    }
}

/// Collects only numeric dependency measurements for safe local JSON output.
pub(super) struct Measurements {
    /// Event-specific whitelist.
    pub(super) kind: Kind,
    /// Numeric fields that passed the whitelist.
    pub(super) fields: serde_json::Map<String, serde_json::Value>,
}
impl tracing::field::Visit for Measurements {
    /// Omits arbitrary formatted text, including SQL, summaries, and rejection bodies.
    fn record_debug(&mut self, _: &tracing::field::Field, _: &dyn std::fmt::Debug) {}
    /// Captures bounded unsigned measurements.
    fn record_u64(&mut self, field: &tracing::field::Field, value: u64) {
        if self.kind.allows(field.name()) {
            self.fields.insert(field.name().into(), value.into());
        }
    }
    /// Captures bounded signed measurements.
    fn record_i64(&mut self, field: &tracing::field::Field, value: i64) {
        if self.kind.allows(field.name()) {
            self.fields.insert(field.name().into(), value.into());
        }
    }
    /// Captures finite duration measurements.
    fn record_f64(&mut self, field: &tracing::field::Field, value: f64) {
        if self.kind.allows(field.name()) && value.is_finite() {
            self.fields.insert(field.name().into(), value.into());
        }
    }
}

/// Rebuilds sensitive dependency LogRecords from bounded fields, preserving metadata/context.
pub(super) fn bounded_record(record: &SdkLogRecord, logger: &SdkLogger) -> Option<SdkLogRecord> {
    let target = record.target()?.as_ref();
    let kind = kind(
        target,
        record
            .attributes_iter()
            .any(|(key, _)| key.as_str() == "db.statement"),
    )?;
    let mut bounded = logger.create_log_record();
    bounded.set_target(target.to_owned());
    bounded.set_body(kind.message().into());
    if let Some(name) = record.event_name() {
        bounded.set_event_name(name);
    }
    if let Some(level) = record.severity_number() {
        bounded.set_severity_number(level);
    }
    if let Some(level) = record.severity_text() {
        bounded.set_severity_text(level);
    }
    if let Some(time) = record.timestamp() {
        bounded.set_timestamp(time);
    }
    if let Some(time) = record.observed_timestamp() {
        bounded.set_observed_timestamp(time);
    }
    if let Some(context) = record.trace_context() {
        bounded.set_trace_context(context.trace_id, context.span_id, context.trace_flags);
    }
    for (key, value) in record.attributes_iter() {
        if kind.allows(key.as_str()) && matches!(value, AnyValue::Int(_) | AnyValue::Double(_)) {
            bounded.add_attribute(key.clone(), value.clone());
        }
    }
    Some(bounded)
}

/// Scrubs SQL/rejection payloads before either stdout or OTLP span export.
#[derive(Debug)]
pub(super) struct BoundedSpanExporter<E>(pub(super) E);
impl<E: SpanExporter> SpanExporter for BoundedSpanExporter<E> {
    /// Retains dependency target, severity, and numeric statistics, never raw payloads.
    async fn export(&self, mut spans: Vec<SpanData>) -> OTelSdkResult {
        for span in &mut spans {
            for event in &mut span.events.events {
                // The SDK can discard the target or statement discriminator before export.
                // An incomplete event cannot be classified safely, so omit its payload.
                if event.dropped_attributes_count > 0 {
                    event.name = "Telemetry event with truncated attributes".into();
                    event
                        .attributes
                        .retain(|field| matches!(field.key.as_str(), "target" | "level"));
                    event
                        .attributes
                        .push(KeyValue::new("dependency.event.sanitized", true));
                    continue;
                }
                let target = event
                    .attributes
                    .iter()
                    .find(|field| field.key.as_str() == "target")
                    .map(|field| field.value.as_str().into_owned());
                let Some(kind) = target.as_deref().and_then(|target| {
                    kind(
                        target,
                        event
                            .attributes
                            .iter()
                            .any(|field| field.key.as_str() == "db.statement"),
                    )
                }) else {
                    continue;
                };
                event.name = kind.message().into();
                event.attributes.retain_mut(|field| {
                    if matches!(field.key.as_str(), "target" | "level") {
                        return true;
                    }
                    if let Some(value) = kind.span_measurement(field.key.as_str(), &field.value) {
                        field.value = value;
                        true
                    } else {
                        false
                    }
                });
                event
                    .attributes
                    .push(KeyValue::new("dependency.event.sanitized", true));
            }
        }
        self.0.export(spans).await
    }
    /// Forwards bounded shutdown to the real exporter.
    fn shutdown_with_timeout(&self, timeout: Duration) -> OTelSdkResult {
        self.0.shutdown_with_timeout(timeout)
    }
    /// Flushes the real exporter.
    fn force_flush(&self) -> OTelSdkResult {
        self.0.force_flush()
    }
    /// Preserves resource metadata.
    fn set_resource(&mut self, resource: &Resource) {
        self.0.set_resource(resource);
    }
}
