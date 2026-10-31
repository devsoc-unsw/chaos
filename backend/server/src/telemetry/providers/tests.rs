use super::*;
use crate::telemetry::config::TelemetryConfig;
use opentelemetry::{
    metrics::MeterProvider as _,
    trace::{Tracer as _, TracerProvider as _},
};
use opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge;
use opentelemetry_sdk::{
    error::OTelSdkResult,
    logs::InMemoryLogExporter,
    metrics::{data::ResourceMetrics, InMemoryMetricExporter, Temporality},
    trace::InMemorySpanExporter,
};
use std::{
    io::Write,
    sync::{
        atomic::{AtomicBool, AtomicUsize, Ordering},
        Arc, Mutex,
    },
};
use tracing_subscriber::{layer::SubscriberExt, Layer};

/// In-memory metric sink with an observable shutdown hook.
#[derive(Clone, Default)]
struct TestMetrics {
    /// Exported metric data.
    exporter: InMemoryMetricExporter,
    /// Whether exporter cleanup ran.
    stopped: Arc<AtomicBool>,
    /// Injects a shutdown failure to check cleanup of the other providers.
    fail_shutdown: bool,
}

impl PushMetricExporter for TestMetrics {
    /// Captures real metric batches.
    async fn export(&self, metrics: &ResourceMetrics) -> OTelSdkResult {
        self.exporter.export(metrics).await
    }
    /// Flushes captured metric data.
    fn force_flush(&self) -> OTelSdkResult {
        self.exporter.force_flush()
    }
    /// Records cleanup without clearing captured data.
    fn shutdown_with_timeout(&self, _: Duration) -> OTelSdkResult {
        self.stopped.store(true, Ordering::SeqCst);
        if self.fail_shutdown {
            return Err(opentelemetry_sdk::error::OTelSdkError::InternalFailure(
                "injected shutdown failure".into(),
            ));
        }
        Ok(())
    }
    /// Uses cumulative aggregation for deterministic assertions.
    fn temporality(&self) -> Temporality {
        Temporality::Cumulative
    }
}

/// Records log export counts even after the in-memory SDK sink clears on shutdown.
#[derive(Clone, Debug, Default)]
struct TestLogs {
    /// Inspectable log records and shutdown flag.
    exporter: InMemoryLogExporter,
    /// Number of logs delivered to the exporter.
    delivered: Arc<AtomicUsize>,
}

impl LogExporter for TestLogs {
    /// Counts and captures the actual SDK log batch.
    async fn export(&self, batch: opentelemetry_sdk::logs::LogBatch<'_>) -> OTelSdkResult {
        self.delivered
            .fetch_add(batch.iter().count(), Ordering::SeqCst);
        self.exporter.export(batch).await
    }
    /// Forwards cleanup to the in-memory exporter.
    fn shutdown_with_timeout(&self, timeout: Duration) -> OTelSdkResult {
        self.exporter.shutdown_with_timeout(timeout)
    }
    /// Preserves resource metadata in the captured log records.
    fn set_resource(&mut self, resource: &Resource) {
        self.exporter.set_resource(resource);
    }
}

/// Exercises the production provider builder with inspectable real SDK exporters.
#[derive(Default)]
struct Factory {
    /// Signal names and endpoints passed into exporter construction.
    calls: Vec<(&'static str, String)>,
    /// Signal whose exporter construction should fail.
    fail_at: Option<&'static str>,
    /// Trace sink and shutdown state.
    spans: InMemorySpanExporter,
    /// Metric sink and shutdown state.
    metrics: TestMetrics,
    /// Log sink and shutdown state.
    logs: TestLogs,
}

impl Factory {
    /// Records construction and injects a failure at the requested signal.
    fn called(&mut self, signal: &'static str, endpoint: &str) -> Result<()> {
        self.calls.push((signal, endpoint.to_owned()));
        anyhow::ensure!(self.fail_at != Some(signal), "injected exporter failure");
        Ok(())
    }
}

impl ExporterFactory for Factory {
    type Spans = InMemorySpanExporter;
    type Metrics = TestMetrics;
    type Logs = TestLogs;
    /// Supplies the trace sink.
    fn spans(&mut self, endpoint: &str) -> Result<Self::Spans> {
        self.called("traces", endpoint)?;
        Ok(self.spans.clone())
    }
    /// Supplies the metric sink.
    fn metrics(&mut self, endpoint: &str) -> Result<Self::Metrics> {
        self.called("metrics", endpoint)?;
        Ok(self.metrics.clone())
    }
    /// Supplies the log sink.
    fn logs(&mut self, endpoint: &str) -> Result<Self::Logs> {
        self.called("logs", endpoint)?;
        Ok(self.logs.clone())
    }
}

/// Local mode must never call any remote exporter builder, including the log builder.
#[test]
fn disabled_export_never_constructs_remote_exporters() {
    for input in [None, Some(""), Some(" \t\n")] {
        let config = TelemetryConfig::parse(input, None).unwrap();
        let mut factory = Factory {
            fail_at: Some("traces"),
            ..Default::default()
        };
        let mut providers = Providers::build(
            config.endpoint.as_deref(),
            Resource::builder().build(),
            Duration::from_secs(3600),
            &mut factory,
        )
        .unwrap();
        assert!(factory.calls.is_empty());
        assert!(providers.logs.is_none());
        providers.shutdown().unwrap();
    }
}

/// Each configured signal reaches a real SDK provider with the same trimmed endpoint.
#[test]
fn remote_signals_export_and_share_resource_metadata() {
    let config = TelemetryConfig::parse(Some(" http://collector.example:4317 \n"), None).unwrap();
    let mut factory = Factory::default();
    let mut providers = Providers::build(
        config.endpoint.as_deref(),
        Resource::builder()
            .with_service_name("phase-two-test")
            .build(),
        Duration::from_secs(3600),
        &mut factory,
    )
    .unwrap();
    assert_eq!(
        factory.calls,
        [
            ("traces", "http://collector.example:4317".to_owned()),
            ("metrics", "http://collector.example:4317".to_owned()),
            ("logs", "http://collector.example:4317".to_owned()),
        ]
    );
    drop(providers.traces.tracer("test").start("test-span"));
    providers
        .metrics
        .meter("test")
        .u64_counter("test.counter")
        .build()
        .add(1, &[]);
    let subscriber = tracing_subscriber::registry().with(
        OpenTelemetryTracingBridge::new(providers.logs.as_ref().unwrap())
            .with_filter(tracing_subscriber::filter::filter_fn(export_eligible)),
    );
    tracing::subscriber::with_default(subscriber, || tracing::info!("remote log"));
    providers.traces.force_flush().unwrap();
    providers.metrics.force_flush().unwrap();
    providers.logs.as_ref().unwrap().force_flush().unwrap();
    let spans = factory.spans.get_finished_spans().unwrap();
    assert_eq!(spans.len(), 1);
    let logs = factory.logs.exporter.get_emitted_logs().unwrap();
    assert_eq!(logs.len(), 1);
    assert!(logs[0]
        .resource
        .iter()
        .any(|(key, value)| key.as_str() == "service.name" && value.as_str() == "phase-two-test"));
    let metrics = factory.metrics.exporter.get_finished_metrics().unwrap();
    assert!(!metrics.is_empty());
    assert!(metrics[0]
        .resource()
        .iter()
        .any(|(key, value)| key.as_str() == "service.name" && value.as_str() == "phase-two-test"));
    providers.shutdown().unwrap();
    assert!(factory.spans.is_shutdown_called());
    assert!(factory.logs.exporter.is_shutdown_called());
    assert!(factory.metrics.stopped.load(Ordering::SeqCst));
}

/// Construction failure cleans up all earlier exporters before any sampler can start.
#[test]
fn construction_failure_shuts_down_preceding_exporters() {
    for signal in ["traces", "metrics", "logs"] {
        let mut factory = Factory {
            fail_at: Some(signal),
            ..Default::default()
        };
        assert!(Providers::build(
            Some("http://collector.example:4317"),
            Resource::builder().build(),
            Duration::from_secs(3600),
            &mut factory,
        )
        .is_err());
        assert_eq!(factory.spans.is_shutdown_called(), signal != "traces");
        assert_eq!(
            factory.metrics.stopped.load(Ordering::SeqCst),
            signal == "logs"
        );
        assert!(!factory.logs.exporter.is_shutdown_called());
    }
}

/// Subscriber references must not keep workers alive after startup cleanup.
#[test]
fn dropping_providers_shuts_down_even_with_retained_clones() {
    let mut factory = Factory::default();
    let providers = Providers::build(
        Some("http://collector.example:4317"),
        Resource::builder().build(),
        Duration::from_secs(3600),
        &mut factory,
    )
    .unwrap();
    let _traces = providers.traces.clone();
    let _metrics = providers.metrics.clone();
    let _logs = providers.logs.clone();
    drop(providers);
    assert!(factory.spans.is_shutdown_called());
    assert!(factory.logs.exporter.is_shutdown_called());
    assert!(factory.metrics.stopped.load(Ordering::SeqCst));
}

/// Shutdown exports pending LogRecords and still stops logs/traces after metric failure.
#[test]
fn shutdown_flushes_logs_even_when_metrics_fail() {
    let mut factory = Factory::default();
    factory.metrics.fail_shutdown = true;
    let mut providers = Providers::build(
        Some("http://collector.example:4317"),
        Resource::builder().build(),
        Duration::from_secs(3600),
        &mut factory,
    )
    .unwrap();
    let subscriber = tracing_subscriber::registry().with(OpenTelemetryTracingBridge::new(
        providers.logs.as_ref().unwrap(),
    ));
    tracing::subscriber::with_default(subscriber, || tracing::info!("pending shutdown log"));
    assert!(providers.shutdown().is_err());
    assert_eq!(factory.logs.delivered.load(Ordering::SeqCst), 1);
    assert!(factory.logs.exporter.is_shutdown_called());
    assert!(factory.spans.is_shutdown_called());
    assert!(factory.metrics.stopped.load(Ordering::SeqCst));
    // An explicit shutdown is not repeated by Drop, including after a shutdown error.
    assert!(providers.shutdown().is_ok());
}

/// HTTP/HTTPS OTLP exporters build lazily without a collector connectivity gate.
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn real_exporters_construct_without_a_collector() {
    for endpoint in [
        "http://127.0.0.1:1",
        "https://collector.example:4317",
        "HTTPS://collector.example:4317",
    ] {
        let mut providers = Providers::new(
            Some(endpoint),
            Resource::builder().build(),
            Duration::from_secs(3600),
        )
        .unwrap();
        assert!(providers.logs.is_some());
        tokio::task::spawn_blocking(move || providers.shutdown())
            .await
            .unwrap()
            .unwrap();
    }
}

/// Captures JSON output without a global subscriber or stderr redirection.
#[derive(Clone, Default)]
struct Capture(Arc<Mutex<Vec<u8>>>);

impl Write for Capture {
    /// Appends bytes to the isolated capture buffer.
    fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
        self.0.lock().unwrap().extend_from_slice(bytes);
        Ok(bytes.len())
    }
    /// Captured output needs no flushing.
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

/// A failing exporter that emits an SDK diagnostic during its export attempt.
#[derive(Debug, Clone, Default)]
struct UnavailableLogs {
    /// Number of records sent to the unavailable sink.
    attempts: Arc<AtomicUsize>,
    /// Installs the isolated subscriber on the SDK export worker for diagnostics.
    dispatch: Arc<Mutex<Option<tracing::Dispatch>>>,
}

impl LogExporter for UnavailableLogs {
    /// Fails the export and emits a diagnostic that must stay local.
    async fn export(&self, batch: opentelemetry_sdk::logs::LogBatch<'_>) -> OTelSdkResult {
        self.attempts
            .fetch_add(batch.iter().count(), Ordering::SeqCst);
        let dispatch = self.dispatch.lock().unwrap().clone().unwrap();
        tracing::dispatcher::with_default(&dispatch, || {
            tracing::warn!(target: "opentelemetry_sdk", "collector unavailable");
        });
        Err(opentelemetry_sdk::error::OTelSdkError::InternalFailure(
            "collector unavailable".into(),
        ))
    }
}

/// SDK and transport diagnostics stay in JSON output and never re-enter remote signals.
#[test]
fn exporter_failure_diagnostics_stay_local_without_feedback() {
    let failing = UnavailableLogs::default();
    let logs = SdkLoggerProvider::builder()
        .with_batch_exporter(failing.clone())
        .build();
    let spans = InMemorySpanExporter::default();
    let traces = SdkTracerProvider::builder()
        .with_simple_exporter(spans.clone())
        .build();
    let capture = Capture::default();
    let writer = capture.clone();
    let subscriber = tracing_subscriber::registry()
        .with(
            tracing_subscriber::fmt::layer()
                .json()
                .with_writer(move || writer.clone()),
        )
        .with(
            tracing_opentelemetry::layer()
                .with_tracer(traces.tracer("test"))
                .with_filter(tracing_subscriber::filter::filter_fn(export_eligible)),
        )
        .with(
            OpenTelemetryTracingBridge::new(&logs)
                .with_filter(tracing_subscriber::filter::filter_fn(export_eligible)),
        );
    let dispatch = tracing::Dispatch::new(subscriber);
    *failing.dispatch.lock().unwrap() = Some(dispatch.clone());
    tracing::dispatcher::with_default(&dispatch, || {
        let span = tracing::info_span!("application");
        let _entered = span.enter();
        tracing::info!("one application event");
        tracing::warn!(target: "h2::proto", "transport diagnostic");
        tracing::warn!(target: "hyper_util::client", "hyper utility diagnostic");
        tracing::warn!(target: "tonic::transport::channel", "channel diagnostic");
        tracing::warn!(target: "tower::buffer::worker", "buffer diagnostic");
    });
    assert!(logs.force_flush().is_err());
    // Break the exporter/subscriber reference cycle before shutdown.
    *failing.dispatch.lock().unwrap() = None;
    assert_eq!(failing.attempts.load(Ordering::SeqCst), 1);
    let output = String::from_utf8(capture.0.lock().unwrap().clone()).unwrap();
    assert!(output.contains("collector unavailable"));
    assert!(output.contains("transport diagnostic"));
    let exported = spans.get_finished_spans().unwrap();
    assert_eq!(exported.len(), 1);
    assert_eq!(
        exported[0].events.len(),
        1,
        "diagnostics must not become remote span events"
    );
    logs.shutdown().unwrap();
    traces.shutdown().unwrap();
}

/// Runs a global-state check in a bounded child process, without mutating parent env.
fn child_check(test: &str, endpoint: Option<&str>) {
    let mut command = std::process::Command::new(std::env::current_exe().unwrap());
    command
        .args(["--exact", test, "--nocapture"])
        .env("CHAOS_TELEMETRY_TEST_CHILD", "1")
        .env("LOG_LEVEL", "INFO")
        .env("RUST_LOG", "warn")
        .env("TELEMETRY_INTERVAL_SECS", "5")
        .env(
            "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
            "http://signal.example:4317",
        )
        .env(
            "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT",
            "http://signal.example:4317",
        )
        .env(
            "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT",
            "http://signal.example:4317",
        )
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    if let Some(endpoint) = endpoint {
        command.env("OTEL_EXPORTER_OTLP_ENDPOINT", endpoint);
    } else {
        command.env_remove("OTEL_EXPORTER_OTLP_ENDPOINT");
    }
    let mut child = command.spawn().unwrap();
    let deadline = std::time::Instant::now() + Duration::from_secs(10);
    loop {
        if child.try_wait().unwrap().is_some() {
            let output = child.wait_with_output().unwrap();
            assert!(
                output.status.success(),
                "child check failed: {}",
                String::from_utf8_lossy(&output.stderr)
            );
            if test.ends_with("local_initialization_and_shutdown_stop_the_sampler") {
                let stderr = String::from_utf8_lossy(&output.stderr);
                assert_eq!(
                    stderr.matches("local shutdown test").count(),
                    1,
                    "a local event must have exactly one JSON log destination"
                );
                assert!(!String::from_utf8_lossy(&output.stdout).contains("local shutdown test"));
            }
            return;
        }
        if std::time::Instant::now() >= deadline {
            child.kill().unwrap();
            let _ = child.wait();
            panic!("child check did not stop within ten seconds; possible leaked worker");
        }
        std::thread::sleep(Duration::from_millis(20));
    }
}

/// Signal-specific environment endpoints cannot turn on remote exporter construction.
#[test]
fn signal_specific_endpoints_cannot_enable_remote_export() {
    if std::env::var_os("CHAOS_TELEMETRY_TEST_CHILD").is_none() {
        for endpoint in [None, Some(""), Some(" \t\n")] {
            child_check("telemetry::providers::tests::signal_specific_endpoints_cannot_enable_remote_export", endpoint);
        }
        return;
    }
    let config = TelemetryConfig::from_env().unwrap();
    let mut factory = Factory {
        fail_at: Some("traces"),
        ..Default::default()
    };
    let mut providers = Providers::build(
        config.endpoint.as_deref(),
        Resource::builder().build(),
        Duration::from_secs(3600),
        &mut factory,
    )
    .unwrap();
    assert!(factory.calls.is_empty());
    assert!(providers.logs.is_none());
    providers.shutdown().unwrap();
}

/// A failed subscriber installation must return before a sampler can hold Tokio open.
#[test]
fn startup_failure_does_not_leave_a_sampler_running() {
    if std::env::var_os("CHAOS_TELEMETRY_TEST_CHILD").is_none() {
        child_check(
            "telemetry::providers::tests::startup_failure_does_not_leave_a_sampler_running",
            None,
        );
        child_check(
            "telemetry::providers::tests::startup_failure_does_not_leave_a_sampler_running",
            Some("http://127.0.0.1:1"),
        );
        return;
    }
    use tracing_subscriber::util::SubscriberInitExt;
    tracing_subscriber::registry().try_init().unwrap();
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(2)
        .enable_all()
        .build()
        .unwrap();
    runtime.block_on(async {
        assert!(crate::telemetry::Telemetry::init().is_err());
    });
    // Drop waits for blocking tasks. The parent enforces a timeout if a sampler leaked.
    drop(runtime);
}

/// Real local initialization and shutdown stop the sampler despite signal overrides.
#[test]
fn local_initialization_and_shutdown_stop_the_sampler() {
    if std::env::var_os("CHAOS_TELEMETRY_TEST_CHILD").is_none() {
        for endpoint in [None, Some(""), Some(" \t\n")] {
            child_check(
                "telemetry::providers::tests::local_initialization_and_shutdown_stop_the_sampler",
                endpoint,
            );
        }
        return;
    }
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(2)
        .enable_all()
        .build()
        .unwrap();
    runtime.block_on(async {
        let telemetry = crate::telemetry::Telemetry::init().unwrap();
        tracing::warn!(target: "server::telemetry_test", "local shutdown test");
        telemetry.shutdown().await.unwrap();
    });
    drop(runtime);
}
