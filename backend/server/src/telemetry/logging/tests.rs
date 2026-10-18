use super::*;
use crate::telemetry::{config::TelemetryConfig, trace_request, RequestMetrics};
use axum::{body::Body, extract::Request, routing::get, Router};
use opentelemetry::metrics::MeterProvider as _;
use opentelemetry_sdk::{
    logs::InMemoryLogExporter,
    metrics::{
        data::{AggregatedMetrics, MetricData},
        InMemoryMetricExporter, PeriodicReader, SdkMeterProvider,
    },
    propagation::TraceContextPropagator,
    trace::InMemorySpanExporter,
};
use std::{
    io::Write,
    sync::{Arc, Mutex},
    time::Duration,
};
use tower::ServiceExt;
use tracing::instrument::WithSubscriber;
use tracing_subscriber::util::SubscriberInitExt;

/// Isolated JSON sink, shared by one fixture's writer handles.
#[derive(Clone, Default)]
struct Capture(Arc<Mutex<Vec<u8>>>);
impl Write for Capture {
    /// Saves JSON bytes for assertions.
    fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
        self.0.lock().unwrap().extend_from_slice(bytes);
        Ok(bytes.len())
    }
    /// Captured bytes need no flushing.
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

/// Real in-memory SDK providers and a local JSON destination.
struct Fixture {
    /// SDK tracing lifecycle.
    traces: SdkTracerProvider,
    /// Captured finished spans.
    spans: InMemorySpanExporter,
    /// SDK logging lifecycle.
    logs: SdkLoggerProvider,
    /// Captured LogRecords.
    records: InMemoryLogExporter,
    /// JSON destination.
    capture: Capture,
}
impl Fixture {
    /// Creates independent providers without environment or global changes.
    fn new() -> Self {
        let spans = InMemorySpanExporter::default();
        let records = InMemoryLogExporter::default();
        Self {
            traces: SdkTracerProvider::builder()
                .with_sampler(opentelemetry_sdk::trace::Sampler::AlwaysOn)
                .with_simple_exporter(spans.clone())
                .build(),
            spans,
            logs: SdkLoggerProvider::builder()
                .with_simple_exporter(records.clone())
                .build(),
            records,
            capture: Capture::default(),
        }
    }
    /// Uses the production subscriber builder with a capture writer.
    fn subscriber(&self, level: LogLevel) -> impl tracing::Subscriber + Send + Sync + 'static {
        let capture = self.capture.clone();
        subscriber(level, &self.traces, Some(&self.logs), move || {
            capture.clone()
        })
    }
    /// Parses all local JSON events.
    fn json(&self) -> Vec<serde_json::Value> {
        String::from_utf8(self.capture.0.lock().unwrap().clone())
            .unwrap()
            .lines()
            .map(|line| serde_json::from_str(line).unwrap())
            .collect()
    }
}
impl Drop for Fixture {
    /// Stops both providers even if an assertion unwinds.
    fn drop(&mut self) {
        let _ = self.logs.shutdown();
        let _ = self.traces.shutdown();
    }
}

/// Emits every severity from both application and representative dependency targets.
fn emit_matrix() {
    tracing::trace!(target: "server::phase3_test", "app-TRACE");
    tracing::debug!(target: "server::phase3_test", "app-DEBUG");
    tracing::info!(target: "server::phase3_test", "app-INFO");
    tracing::warn!(target: "server::phase3_test", "app-WARN");
    tracing::error!(target: "server::phase3_test", "app-ERROR");
    tracing::trace!(target: "sqlx::query", "dep-TRACE");
    tracing::debug!(target: "sqlx::query", "dep-DEBUG");
    tracing::info!(target: "sqlx::query", "dep-INFO");
    tracing::warn!(target: "sqlx::query", "dep-WARN");
    tracing::error!(target: "sqlx::query", "dep-ERROR");
}

/// The exact event matrix holds in JSON, LogRecords, and span events; spans/metrics survive.
#[tokio::test]
async fn levels_preserve_spans_metrics_and_log_correlation() {
    assert_eq!(
        tracing::level_filters::STATIC_MAX_LEVEL,
        tracing::level_filters::LevelFilter::TRACE
    );
    for (level, severities) in [
        (LogLevel::Info, &['T', 'D', 'I', 'W', 'E'][..]),
        (LogLevel::Warn, &['W', 'E'][..]),
        (LogLevel::Error, &['E'][..]),
    ] {
        let fixture = Fixture::new();
        let metric_exports = InMemoryMetricExporter::default();
        let metrics = SdkMeterProvider::builder()
            .with_reader(
                PeriodicReader::builder(metric_exports.clone())
                    .with_interval(Duration::from_secs(3600))
                    .build(),
            )
            .build();
        let app = Router::new()
            .route(
                "/items/:id",
                get(|| async {
                    emit_matrix();
                    tracing::debug_span!(target: "sqlx::query", "debug-child").in_scope(|| {});
                    tracing::trace_span!(target: "sqlx::query", "trace-child").in_scope(|| {});
                    "ok"
                }),
            )
            .layer(axum::middleware::from_fn_with_state(
                RequestMetrics::from_meter(metrics.meter("test")),
                trace_request,
            ));
        opentelemetry::global::set_text_map_propagator(TraceContextPropagator::new());
        let request = Request::builder()
            .uri("/items/42?secret=PRIVATE_QUERY")
            .header("authorization", "Bearer PRIVATE_TOKEN")
            .header("cookie", "PRIVATE_COOKIE")
            .header(
                "traceparent",
                "00-12345678901234567890123456789012-1234567890123456-01",
            )
            .body(Body::from("PRIVATE_BODY"))
            .unwrap();
        let response = app
            .oneshot(request)
            .with_subscriber(fixture.subscriber(level))
            .await
            .unwrap();
        assert_eq!(response.status(), axum::http::StatusCode::OK);
        tracing::subscriber::with_default(
            fixture.subscriber(level),
            || tracing::error!(target: "server::phase3_test", "background-ERROR"),
        );
        metrics.force_flush().unwrap();
        let spans = fixture.spans.get_finished_spans().unwrap();
        assert_eq!(
            spans.len(),
            3,
            "INFO, DEBUG and TRACE spans survive at every level"
        );
        let root = spans
            .iter()
            .find(|span| span.name == "http.request")
            .unwrap();
        assert_eq!(
            root.span_context.trace_id().to_string(),
            "12345678901234567890123456789012"
        );
        for child in spans.iter().filter(|span| span.name != "http.request") {
            assert_eq!(child.parent_span_id, root.span_context.span_id());
        }
        let records = fixture.records.get_emitted_logs().unwrap();
        let json = fixture.json();
        for (severity, initial) in [
            ("TRACE", 'T'),
            ("DEBUG", 'D'),
            ("INFO", 'I'),
            ("WARN", 'W'),
            ("ERROR", 'E'),
        ] {
            let expected = usize::from(severities.contains(&initial));
            for prefix in ["app", "dep"] {
                let message = format!("{prefix}-{severity}");
                assert_eq!(
                    json.iter()
                        .filter(|event| event["fields"]["message"] == message)
                        .count(),
                    expected,
                    "JSON: {level:?}/{message}"
                );
                let logs: Vec<_> = records
                    .iter()
                    .filter(|log| {
                        log.record.body().is_some_and(|body| {
                            *body == opentelemetry::logs::AnyValue::String(message.clone().into())
                        })
                    })
                    .collect();
                assert_eq!(logs.len(), expected, "LogRecords: {level:?}/{message}");
                for log in logs {
                    assert_eq!(log.record.severity_text(), Some(severity));
                    assert_eq!(
                        log.record.target().map(|target| target.as_ref()),
                        Some(if prefix == "app" {
                            "server::phase3_test"
                        } else {
                            "sqlx::query"
                        })
                    );
                    let number = match severity {
                        "TRACE" => opentelemetry::logs::Severity::Trace,
                        "DEBUG" => opentelemetry::logs::Severity::Debug,
                        "INFO" => opentelemetry::logs::Severity::Info,
                        "WARN" => opentelemetry::logs::Severity::Warn,
                        "ERROR" => opentelemetry::logs::Severity::Error,
                        _ => unreachable!(),
                    };
                    assert_eq!(log.record.severity_number(), Some(number));
                    let context = log.record.trace_context().unwrap();
                    assert_eq!(context.trace_id, root.span_context.trace_id());
                    assert_eq!(context.span_id, root.span_context.span_id());
                }
                assert_eq!(
                    root.events
                        .iter()
                        .filter(|event| event.name == message)
                        .count(),
                    expected,
                    "span events: {level:?}/{message}"
                );
                for event in root.events.iter().filter(|event| event.name == message) {
                    assert!(event
                        .attributes
                        .iter()
                        .any(|field| field.key.as_str() == "level"
                            && field.value.as_str() == severity));
                }
                for event in json
                    .iter()
                    .filter(|event| event["fields"]["message"] == message)
                {
                    assert_eq!(event["level"], severity);
                    assert_eq!(
                        event["target"],
                        if prefix == "app" {
                            "server::phase3_test"
                        } else {
                            "sqlx::query"
                        }
                    );
                }
            }
        }
        let background = records
            .iter()
            .find(|log| {
                log.record.body().is_some_and(|body| {
                    *body == opentelemetry::logs::AnyValue::String("background-ERROR".into())
                })
            })
            .unwrap();
        assert!(background.record.trace_context().is_none());
        let exported = metric_exports.get_finished_metrics().unwrap();
        let data = exported
            .last()
            .unwrap()
            .scope_metrics()
            .flat_map(|scope| scope.metrics())
            .collect::<Vec<_>>();
        let count = data
            .iter()
            .find(|metric| metric.name() == "http.server.request.count")
            .unwrap();
        assert!(
            matches!(count.data(), AggregatedMetrics::U64(MetricData::Sum(sum)) if sum.data_points().map(|point| point.value()).sum::<u64>() == 1)
        );
        let duration = data
            .iter()
            .find(|metric| metric.name() == "http.server.request.duration")
            .unwrap();
        assert!(
            matches!(duration.data(), AggregatedMetrics::F64(MetricData::Histogram(histogram)) if histogram.data_points().map(|point| point.count()).sum::<u64>() == 1)
        );
        assert!(!format!("{json:?} {spans:?} {records:?}").contains("PRIVATE_"));
        metrics.shutdown().unwrap();
    }
}

/// Exporter diagnostics are readable locally without exposing arbitrary fields or re-exporting.
#[test]
fn diagnostics_are_sanitized_and_similarly_named_application_targets_are_eligible() {
    let fixture = Fixture::new();
    tracing::subscriber::with_default(fixture.subscriber(LogLevel::Info), || {
        tracing::debug!(target: "opentelemetry-otlp", endpoint = "PRIVATE_ENDPOINT", headers = "PRIVATE_HEADERS", "PRIVATE_DIAGNOSTIC");
        tracing::warn!(target: "h2::proto", token = "PRIVATE_TOKEN", "PRIVATE_TRANSPORT");
        tracing::info!(target: "opentelemetry_user", "application event");
    });
    let output = fixture.json();
    assert_eq!(output.len(), 3);
    assert!(!format!("{output:?}").contains("PRIVATE_"));
    let records = fixture.records.get_emitted_logs().unwrap();
    assert_eq!(records.len(), 1);
}

/// User-supplied error messages are never copied into operational log destinations.
#[test]
fn operational_errors_omit_private_messages() {
    let fixture = Fixture::new();
    tracing::subscriber::with_default(fixture.subscriber(LogLevel::Info), || {
        crate::models::error::ChaosError::BadRequestWithMessage("PRIVATE_BODY".into()).print();
        crate::models::error::ChaosError::InternalServerErrorWithMessage("PRIVATE_TOKEN".into())
            .print();
    });
    let json = fixture.json();
    let records = fixture.records.get_emitted_logs().unwrap();
    assert_eq!(json.len(), 2);
    assert_eq!(records.len(), 2);
    assert!(!format!("{json:?} {records:?}").contains("PRIVATE_"));
}

/// Explicit event ancestry overrides the currently entered span for remote correlation.
#[test]
fn explicit_event_parents_control_log_correlation() {
    use opentelemetry::trace::TraceContextExt as _;
    use tracing_opentelemetry::OpenTelemetrySpanExt;
    for level in [LogLevel::Info, LogLevel::Warn, LogLevel::Error] {
        let fixture = Fixture::new();
        let mut expected = None;
        tracing::subscriber::with_default(fixture.subscriber(level), || {
            let active = tracing::info_span!("active");
            let explicit = tracing::info_span!(parent: None, "explicit");
            expected = Some((
                active.context().span().span_context().clone(),
                explicit.context().span().span_context().clone(),
            ));
            active.in_scope(|| {
                tracing::error!(parent: None, "root-event");
                tracing::error!(parent: &explicit, "explicit-event");
                tracing::error!("current-event");
            });
        });
        let (active, explicit) = expected.unwrap();
        let records = fixture.records.get_emitted_logs().unwrap();
        let record = |message: &str| {
            records
                .iter()
                .find(|log| log.record.body() == Some(&AnyValue::String(message.to_owned().into())))
                .unwrap()
        };
        assert!(record("root-event").record.trace_context().is_none());
        let parent = record("explicit-event").record.trace_context().unwrap();
        assert_eq!(parent.trace_id, explicit.trace_id());
        assert_eq!(parent.span_id, explicit.span_id());
        let restored = record("current-event").record.trace_context().unwrap();
        assert_eq!(restored.trace_id, active.trace_id());
        assert_eq!(restored.span_id, active.span_id());
    }
}

/// Isolated global installation bridges legacy log records once and ignores RUST_LOG.
#[test]
fn legacy_bridge_and_rust_log_cannot_override_log_level() {
    let Ok(setting) = std::env::var("CHAOS_PHASE3_LEVEL") else {
        for setting in ["INFO", "WARN", "ERROR"] {
            let mut child = std::process::Command::new(std::env::current_exe().unwrap())
                .args(["--exact", "telemetry::logging::tests::legacy_bridge_and_rust_log_cannot_override_log_level", "--nocapture"])
                .env("CHAOS_PHASE3_LEVEL", setting).env("LOG_LEVEL", setting)
                .env("RUST_LOG", if setting == "INFO" { "off" } else { "trace" })
                .env_remove("OTEL_EXPORTER_OTLP_ENDPOINT")
                .stdout(std::process::Stdio::piped()).stderr(std::process::Stdio::piped())
                .spawn().unwrap();
            let deadline = std::time::Instant::now() + Duration::from_secs(10);
            loop {
                if child.try_wait().unwrap().is_some() {
                    let output = child.wait_with_output().unwrap();
                    assert!(
                        output.status.success(),
                        "{setting}: {} {}",
                        String::from_utf8_lossy(&output.stdout),
                        String::from_utf8_lossy(&output.stderr)
                    );
                    break;
                }
                if std::time::Instant::now() >= deadline {
                    let _ = child.kill();
                    let _ = child.wait();
                    panic!("legacy bridge child timed out");
                }
                std::thread::sleep(Duration::from_millis(20));
            }
        }
        return;
    };
    let config = TelemetryConfig::from_env().unwrap();
    let fixture = Fixture::new();
    fixture.subscriber(config.log_level).try_init().unwrap();
    for (level, name) in [
        (log::Level::Trace, "TRACE"),
        (log::Level::Debug, "DEBUG"),
        (log::Level::Info, "INFO"),
        (log::Level::Warn, "WARN"),
        (log::Level::Error, "ERROR"),
    ] {
        log::log!(target: "legacy_dependency", level, "legacy-{name}");
    }
    log::warn!(target: "h2::proto", "PRIVATE_LEGACY_TRANSPORT");
    log::debug!(target: "opentelemetry-otlp", "PRIVATE_LEGACY_SDK");
    let json = fixture.json();
    let records = fixture.records.get_emitted_logs().unwrap();
    let expected = match setting.as_str() {
        "INFO" => vec!["TRACE", "DEBUG", "INFO", "WARN", "ERROR"],
        "WARN" => vec!["WARN", "ERROR"],
        "ERROR" => vec!["ERROR"],
        _ => unreachable!(),
    };
    let diagnostics = match setting.as_str() {
        "INFO" => 2,
        "WARN" => 1,
        _ => 0,
    };
    assert_eq!(json.len(), expected.len() + diagnostics);
    assert_eq!(records.len(), expected.len());
    assert!(!format!("{json:?} {records:?}").contains("PRIVATE_"));
    assert!(records.iter().all(|log| log
        .record
        .target()
        .is_some_and(|target| target == "legacy_dependency")));
    for name in expected {
        let message = format!("legacy-{name}");
        assert_eq!(
            json.iter()
                .filter(|event| event["fields"]["message"] == message && event["level"] == name)
                .count(),
            1
        );
        assert_eq!(
            records
                .iter()
                .filter(|log| log.record.severity_text() == Some(name)
                    && log.record.body().is_some_and(|body| *body
                        == opentelemetry::logs::AnyValue::String(message.clone().into())))
                .count(),
            1
        );
    }
}
