//! Receiver-backed checks use isolated child processes for global SDK/environment state.

use super::*;
use opentelemetry::metrics::MeterProvider as _;
use opentelemetry_proto::tonic::{
    collector::{
        logs::v1::{
            logs_service_server::{LogsService, LogsServiceServer},
            ExportLogsServiceRequest, ExportLogsServiceResponse,
        },
        metrics::v1::{
            metrics_service_server::{MetricsService, MetricsServiceServer},
            ExportMetricsServiceRequest, ExportMetricsServiceResponse,
        },
        trace::v1::{
            trace_service_server::{TraceService, TraceServiceServer},
            ExportTraceServiceRequest, ExportTraceServiceResponse,
        },
    },
    common::v1::{any_value::Value, KeyValue as ProtoKeyValue},
    logs::v1::LogRecord,
    metrics::v1::metric::Data,
    trace::v1::Span,
};
use std::{
    io::{Read, Write},
    process::{Child, Command, Stdio},
    sync::{
        atomic::{AtomicBool, AtomicUsize, Ordering},
        Mutex,
    },
};
use tokio_stream::StreamExt;
use tonic::{Request as RpcRequest, Response as RpcResponse, Status};

mod workflows;

/// Captured protobuf requests and controllable collector availability.
#[derive(Clone, Default)]
struct Received {
    /// Successful trace ingestion requests.
    traces: Arc<Mutex<Vec<ExportTraceServiceRequest>>>,
    /// Successful log ingestion requests.
    logs: Arc<Mutex<Vec<ExportLogsServiceRequest>>>,
    /// Successful metric ingestion requests.
    metrics: Arc<Mutex<Vec<ExportMetricsServiceRequest>>>,
    /// Rejects exports during the outage test.
    unavailable: Arc<AtomicBool>,
    /// Counts calls for each ingestion service, including rejected calls.
    attempts: Arc<[AtomicUsize; 3]>,
    /// Counts TCP connections, including connections without an RPC.
    connections: Arc<AtomicUsize>,
}
impl Received {
    /// Records the attempted signal before accepting or rejecting its request.
    fn accept(&self, signal: usize) -> Result<(), Status> {
        self.attempts[signal].fetch_add(1, Ordering::SeqCst);
        if self.unavailable.load(Ordering::SeqCst) {
            Err(Status::unavailable("fixture collector unavailable"))
        } else {
            Ok(())
        }
    }
    /// Returns the received spans independently of protobuf batch boundaries.
    fn spans(&self) -> Vec<Span> {
        self.traces
            .lock()
            .unwrap()
            .iter()
            .flat_map(|batch| &batch.resource_spans)
            .flat_map(|resource| &resource.scope_spans)
            .flat_map(|scope| scope.spans.clone())
            .collect()
    }
    /// Returns the received LogRecords independently of batch boundaries.
    fn records(&self) -> Vec<LogRecord> {
        self.logs
            .lock()
            .unwrap()
            .iter()
            .flat_map(|batch| &batch.resource_logs)
            .flat_map(|resource| &resource.scope_logs)
            .flat_map(|scope| scope.log_records.clone())
            .collect()
    }
}

#[tonic::async_trait]
impl TraceService for Received {
    /// Captures a decoded OTLP trace export request.
    async fn export(
        &self,
        request: RpcRequest<ExportTraceServiceRequest>,
    ) -> Result<RpcResponse<ExportTraceServiceResponse>, Status> {
        self.accept(0)?;
        self.traces.lock().unwrap().push(request.into_inner());
        Ok(RpcResponse::new(Default::default()))
    }
}
#[tonic::async_trait]
impl LogsService for Received {
    /// Captures a decoded OTLP logs export request.
    async fn export(
        &self,
        request: RpcRequest<ExportLogsServiceRequest>,
    ) -> Result<RpcResponse<ExportLogsServiceResponse>, Status> {
        self.accept(1)?;
        self.logs.lock().unwrap().push(request.into_inner());
        Ok(RpcResponse::new(Default::default()))
    }
}
#[tonic::async_trait]
impl MetricsService for Received {
    /// Captures a decoded OTLP metrics export request.
    async fn export(
        &self,
        request: RpcRequest<ExportMetricsServiceRequest>,
    ) -> Result<RpcResponse<ExportMetricsServiceResponse>, Status> {
        self.accept(2)?;
        self.metrics.lock().unwrap().push(request.into_inner());
        Ok(RpcResponse::new(Default::default()))
    }
}

/// One ephemeral receiver, closed on normal completion or test unwind.
struct Receiver {
    /// Receiver URL passed to the child process.
    endpoint: String,
    /// Captured protobuf messages and counters.
    received: Received,
    /// Graceful server shutdown signal.
    stop: Option<tokio::sync::oneshot::Sender<()>>,
    /// Server worker, awaited on normal completion.
    task: Option<tokio::task::JoinHandle<Result<(), tonic::transport::Error>>>,
}
impl Receiver {
    /// Binds only loopback on an OS-selected port, without touching user services.
    async fn start() -> Self {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let endpoint = format!("http://{}", listener.local_addr().unwrap());
        let received = Received::default();
        let captured = received.clone();
        let incoming =
            tokio_stream::wrappers::TcpListenerStream::new(listener).map(move |connection| {
                if connection.is_ok() {
                    captured.connections.fetch_add(1, Ordering::SeqCst);
                }
                connection
            });
        let (stop, stopped) = tokio::sync::oneshot::channel();
        let services = received.clone();
        let task = tokio::spawn(async move {
            tonic::transport::Server::builder()
                .add_service(TraceServiceServer::new(services.clone()))
                .add_service(LogsServiceServer::new(services.clone()))
                .add_service(MetricsServiceServer::new(services))
                .serve_with_incoming_shutdown(incoming, async {
                    let _ = stopped.await;
                })
                .await
        });
        Self {
            endpoint,
            received,
            stop: Some(stop),
            task: Some(task),
        }
    }
    /// Waits for receiver shutdown and verifies its port is reusable.
    async fn close(mut self) {
        let _ = self.stop.take().unwrap().send(());
        tokio::time::timeout(Duration::from_secs(5), self.task.take().unwrap())
            .await
            .unwrap()
            .unwrap()
            .unwrap();
        let address = self.endpoint.strip_prefix("http://").unwrap();
        let _rebound = tokio::net::TcpListener::bind(address).await.unwrap();
    }
}
impl Drop for Receiver {
    /// Stops the fixture even if an assertion fails.
    fn drop(&mut self) {
        if let Some(stop) = self.stop.take() {
            let _ = stop.send(());
        }
        if let Some(task) = self.task.take() {
            task.abort();
        }
    }
}

/// Owns a child and continuously drains output so local metric dumps cannot block it.
struct Process {
    /// Child test runner with isolated global subscriber and environment.
    child: Child,
    /// Concurrent stdout/stderr readers.
    readers: Vec<std::thread::JoinHandle<Vec<u8>>>,
}
impl Process {
    /// Runs only the child entry point with controlled endpoint/level settings.
    fn start(endpoint: Option<&str>, signal_endpoint: &str, level: &str, mode: &str) -> Self {
        let mut command = Command::new(std::env::current_exe().unwrap());
        // Inherited collector credentials and SDK limits must not affect this fixture.
        for (key, _) in std::env::vars_os() {
            if key.to_str().is_some_and(|key| key.starts_with("OTEL_")) {
                command.env_remove(key);
            }
        }
        command
            .args([
                "--exact",
                "telemetry::receiver_tests::exercise_child",
                "--nocapture",
            ])
            .env("CHAOS_RECEIVER_CHILD", mode)
            .env("LOG_LEVEL", level)
            .env("RUST_LOG", "off")
            .env("TELEMETRY_INTERVAL_SECS", "1")
            .env("OTEL_SERVICE_NAME", "chaos-phase-five")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        for signal in ["TRACES", "LOGS", "METRICS"] {
            command.env(
                format!("OTEL_EXPORTER_OTLP_{signal}_ENDPOINT"),
                signal_endpoint,
            );
            command.env_remove(format!("OTEL_EXPORTER_OTLP_{signal}_HEADERS"));
        }
        for setting in [
            "OTEL_EXPORTER_OTLP_HEADERS",
            "OTEL_TRACES_SAMPLER",
            "OTEL_TRACES_SAMPLER_ARG",
            "OTEL_SPAN_EVENT_ATTRIBUTE_COUNT_LIMIT",
            "OTEL_ATTRIBUTE_COUNT_LIMIT",
            "OTEL_RESOURCE_ATTRIBUTES",
            "OTEL_SDK_DISABLED",
        ] {
            command.env_remove(setting);
        }
        match endpoint {
            Some(url) => {
                command.env("OTEL_EXPORTER_OTLP_ENDPOINT", url);
            }
            None => {
                command.env_remove("OTEL_EXPORTER_OTLP_ENDPOINT");
            }
        }
        let mut child = command.spawn().unwrap();
        let stdout = child.stdout.take().unwrap();
        let stderr = child.stderr.take().unwrap();
        let readers = vec![drain(stdout), drain(stderr)];
        Self { child, readers }
    }
    /// Enforces a wall-clock limit independently of the child runtime and SDK workers.
    async fn finish(mut self) -> (String, String) {
        let deadline = Instant::now()
            + Duration::from_secs(if std::env::var_os("CHAOS_PHASE5_ISOLATED").is_some() {
                270
            } else {
                35
            });
        let status = loop {
            if let Some(status) = self.child.try_wait().unwrap() {
                break status;
            }
            assert!(
                Instant::now() < deadline,
                "telemetry child exceeded 35 seconds"
            );
            tokio::time::sleep(Duration::from_millis(20)).await;
        };
        let output: Vec<_> = self
            .readers
            .drain(..)
            .map(|reader| String::from_utf8(reader.join().unwrap()).unwrap())
            .collect();
        assert!(status.success(), "telemetry child failed: {}", output[1]);
        (output[0].clone(), output[1].clone())
    }
}
impl Drop for Process {
    /// Reaps a timed-out or failed child so samplers/exporters cannot survive it.
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
        for reader in self.readers.drain(..) {
            let _ = reader.join();
        }
    }
}

/// Drains one pipe on its own thread rather than waiting for the child to exit first.
fn drain(mut stream: impl Read + Send + 'static) -> std::thread::JoinHandle<Vec<u8>> {
    std::thread::spawn(move || {
        let mut bytes = Vec::new();
        stream.read_to_end(&mut bytes).unwrap();
        bytes
    })
}

/// Finds a scalar string attribute in decoded protobuf messages.
fn text_attribute<'a>(fields: &'a [ProtoKeyValue], key: &str) -> Option<&'a str> {
    fields
        .iter()
        .find(|field| field.key == key)
        .and_then(|field| field.value.as_ref())
        .and_then(|value| match &value.value {
            Some(Value::StringValue(text)) => Some(text.as_str()),
            _ => None,
        })
}

/// Emits a stable marker at every severity, including in background context.
fn events() {
    tracing::trace!("phase5.event.TRACE");
    tracing::debug!("phase5.event.DEBUG");
    tracing::info!("phase5.event.INFO");
    tracing::warn!("phase5.event.WARN");
    tracing::error!("phase5.event.ERROR");
}

/// Flushes real production providers off runtime threads and reports signal results.
async fn flush(telemetry: &Telemetry) -> (bool, bool, bool) {
    let traces = telemetry.providers.traces.clone();
    let metrics = telemetry.providers.metrics.clone();
    let logs = telemetry.providers.logs.clone();
    tokio::task::spawn_blocking(move || {
        (
            traces.force_flush().is_ok(),
            metrics.force_flush().is_ok(),
            logs.as_ref().is_none_or(|logs| logs.force_flush().is_ok()),
        )
    })
    .await
    .unwrap()
}

/// Child-only production telemetry lifecycle; never mutates the parent test environment.
#[test]
fn exercise_child() {
    let Ok(mode) = std::env::var("CHAOS_RECEIVER_CHILD") else {
        return;
    };
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(2)
        .enable_all()
        .build()
        .unwrap();
    runtime.block_on(async {
        use axum::{body::Body, http::Request, routing::get, Router};
        use tower::ServiceExt;
        let telemetry = Telemetry::init().unwrap();
        if mode == "workflow" {
            workflows::exercise(&telemetry).await.unwrap();
            telemetry.shutdown().await.unwrap();
            return;
        }
        events();
        let app = Router::new().route("/fixture/:id", get(|| async {
            let child = tracing::trace_span!("phase5.child");
            async {
                events();
                tracing::event!(target: "sqlx::query", tracing::Level::DEBUG,
                    { db.statement = "PRIVATE_SQL", summary = "PRIVATE_SUMMARY", rows_returned = 1_u64 },
                    "PRIVATE_QUERY_MESSAGE");
                "ok"
            }.instrument(child).await
        })).layer(axum::middleware::from_fn_with_state(RequestMetrics::new(), trace_request));
        for id in 1..=2 {
            let response = app.clone().oneshot(Request::builder()
                .uri(format!("/fixture/{id}?token=PRIVATE_QUERY"))
                .header("authorization", "Bearer PRIVATE_TOKEN")
                .header("traceparent", "00-12345678901234567890123456789012-1234567890123456-01")
                .body(Body::empty()).unwrap()).await.unwrap();
            assert_eq!(response.status(), axum::http::StatusCode::OK);
            if id == 1 && mode == "recovery" {
                let results = flush(&telemetry).await;
                assert!(results != (true, true, true), "collector must reject initial exports");
                tokio::task::spawn_blocking(|| {
                    let mut line = String::new();
                    std::io::stdin().read_line(&mut line).unwrap();
                    assert_eq!(line.trim(), "recover");
                }).await.unwrap();
            }
        }
        // Allow the real sampler's CPU warm-up and two collection intervals.
        tokio::time::sleep(Duration::from_millis(2300)).await;
        if mode != "unreachable" { assert_eq!(flush(&telemetry).await, (true, true, true)); }
        // Created after the final flush: only shutdown can deliver these three signals.
        tracing::error!("phase5.shutdown.pending");
        drop(tracing::debug_span!("phase5.shutdown.span"));
        telemetry.providers.metrics.meter("shutdown-test").u64_counter("phase5.shutdown.counter").build().add(11, &[]);
        let started = Instant::now();
        let shutdown = telemetry.shutdown().await;
        if mode != "unreachable" { shutdown.unwrap(); }
        assert!(started.elapsed() < Duration::from_secs(18), "all providers must stop within their combined bounds");
    });
    drop(runtime);
}

/// Asserts actual OTLP receipt, IDs/resources, numeric HTTP labels and the event matrix.
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn receives_all_signals_at_every_log_level() {
    for level in ["INFO", "WARN", "ERROR"] {
        let receiver = Receiver::start().await;
        let process = Process::start(
            Some(&receiver.endpoint),
            "http://127.0.0.1:1",
            level,
            "remote",
        );
        let (_, stderr) = process.finish().await;
        assert_received(&receiver.received, level, &stderr, 2);
        receiver.close().await;
    }
}

/// Validates protobuf payloads rather than relying on exporter construction or span events alone.
fn assert_received(received: &Received, level: &str, stderr: &str, requests: usize) {
    let spans = received.spans();
    let roots: Vec<_> = spans
        .iter()
        .filter(|span| span.name == "http.request")
        .collect();
    assert_eq!(roots.len(), requests);
    for root in &roots {
        assert_eq!(root.kind, 2);
        assert_eq!(root.span_id.len(), 8);
        assert!(root.span_id.iter().any(|byte| *byte != 0));
        assert_eq!(
            root.trace_id,
            [
                0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78,
                0x90, 0x12
            ]
        );
        assert_eq!(
            text_attribute(&root.attributes, "http.route"),
            Some("/fixture/:id")
        );
        assert!(root
            .attributes
            .iter()
            .any(|field| field.key == "http.response.status_code"
                && field.value.as_ref().and_then(|value| value.value.as_ref())
                    == Some(&Value::IntValue(200))));
        assert_eq!(
            spans
                .iter()
                .filter(|span| span.name == "phase5.child" && span.parent_span_id == root.span_id)
                .count(),
            1
        );
    }
    let records = received.records();
    assert_eq!(
        spans
            .iter()
            .filter(|span| span.name == "phase5.shutdown.span")
            .count(),
        1
    );
    assert_eq!(
        records
            .iter()
            .filter(
                |record| record.body.as_ref().and_then(|body| body.value.as_ref())
                    == Some(&Value::StringValue("phase5.shutdown.pending".into()))
            )
            .count(),
        1
    );
    let enabled: &[(&str, i32)] = match level {
        "INFO" => &[
            ("TRACE", 1),
            ("DEBUG", 5),
            ("INFO", 9),
            ("WARN", 13),
            ("ERROR", 17),
        ],
        "WARN" => &[("WARN", 13), ("ERROR", 17)],
        _ => &[("ERROR", 17)],
    };
    let markers: Vec<_> = records.iter().filter(|record| record.body.as_ref().and_then(|body| body.value.as_ref()).is_some_and(|value| matches!(value, Value::StringValue(text) if text.starts_with("phase5.event.")))).collect();
    let background = usize::from(requests == 2);
    assert_eq!(markers.len(), enabled.len() * (requests + background));
    let local: Vec<serde_json::Value> = stderr
        .lines()
        .filter_map(|line| serde_json::from_str(line).ok())
        .collect();
    for (name, severity) in enabled {
        let marker = format!("phase5.event.{name}");
        assert_eq!(
            local
                .iter()
                .filter(|event| event["fields"]["message"] == marker && event["level"] == *name)
                .count(),
            3
        );
        let matching: Vec<_> = markers
            .iter()
            .filter(|record| {
                record.body.as_ref().and_then(|body| body.value.as_ref())
                    == Some(&Value::StringValue(marker.clone()))
            })
            .collect();
        assert_eq!(matching.len(), requests + background);
        assert!(matching
            .iter()
            .all(|record| record.severity_number == *severity && record.severity_text == *name));
        assert_eq!(
            matching
                .iter()
                .filter(|record| record.trace_id.is_empty())
                .count(),
            background
        );
        for record in matching.iter().filter(|record| !record.trace_id.is_empty()) {
            assert!(spans.iter().any(|span| span.name == "phase5.child"
                && record.trace_id == span.trace_id
                && record.span_id == span.span_id));
        }
    }
    assert_eq!(
        local
            .iter()
            .filter(|event| event["fields"]["message"]
                .as_str()
                .is_some_and(|message| message.starts_with("phase5.event.")))
            .count(),
        enabled.len() * 3
    );
    for root in &roots {
        let child = spans
            .iter()
            .find(|span| span.name == "phase5.child" && span.parent_span_id == root.span_id)
            .unwrap();
        assert_eq!(
            child
                .events
                .iter()
                .filter(|event| event.name.starts_with("phase5.event."))
                .count(),
            enabled.len()
        );
    }
    let batches = received.metrics.lock().unwrap();
    let metrics: Vec<_> = batches
        .iter()
        .flat_map(|batch| &batch.resource_metrics)
        .flat_map(|resource| &resource.scope_metrics)
        .flat_map(|scope| &scope.metrics)
        .collect();
    assert!(metrics.iter().any(|metric| metric.name == "phase5.shutdown.counter" && matches!(&metric.data, Some(Data::Sum(sum)) if sum.data_points.iter().any(|point| matches!(point.value, Some(opentelemetry_proto::tonic::metrics::v1::number_data_point::Value::AsInt(11)))))));
    assert!(metrics
        .iter()
        .any(|metric| metric.name == "chaos.host.cpu.usage"));
    assert!(metrics
        .iter()
        .any(|metric| metric.name == "chaos.process.memory"));
    assert!(metrics.iter().any(|metric| metric.name == "http.server.request.count" && matches!(&metric.data, Some(Data::Sum(sum)) if sum.data_points.iter().any(|point| text_attribute(&point.attributes, "http.route") == Some("/fixture/:id") && matches!(point.value, Some(opentelemetry_proto::tonic::metrics::v1::number_data_point::Value::AsInt(value)) if value == 2)))));
    assert!(metrics.iter().any(|metric| metric.name == "http.server.request.duration" && matches!(&metric.data, Some(Data::Histogram(histogram)) if histogram.data_points.iter().any(|point| point.count == 2))));
    assert!(received
        .traces
        .lock()
        .unwrap()
        .iter()
        .flat_map(|batch| &batch.resource_spans)
        .all(|resource| resource
            .resource
            .as_ref()
            .is_some_and(
                |resource| text_attribute(&resource.attributes, "service.name")
                    == Some("chaos-phase-five")
            )));
    assert!(received
        .logs
        .lock()
        .unwrap()
        .iter()
        .flat_map(|batch| &batch.resource_logs)
        .all(|resource| resource
            .resource
            .as_ref()
            .is_some_and(
                |resource| text_attribute(&resource.attributes, "service.name")
                    == Some("chaos-phase-five")
            )));
    assert!(batches
        .iter()
        .flat_map(|batch| &batch.resource_metrics)
        .all(|resource| resource
            .resource
            .as_ref()
            .is_some_and(
                |resource| text_attribute(&resource.attributes, "service.name")
                    == Some("chaos-phase-five")
            )));
    assert!(!format!("{spans:?} {records:?} {batches:?} {stderr}").contains("PRIVATE_"));
    assert!(!records.iter().any(|record| record.body.as_ref().and_then(|body| body.value.as_ref()).is_some_and(|value| matches!(value, Value::StringValue(text) if text == "Telemetry transport diagnostic"))));
    assert!(received
        .logs
        .lock()
        .unwrap()
        .iter()
        .flat_map(|batch| &batch.resource_logs)
        .flat_map(|resource| &resource.scope_logs)
        .all(|scope| scope.scope.as_ref().is_some_and(|scope| ![
            "opentelemetry",
            "tracing_opentelemetry",
            "h2",
            "hyper",
            "tonic::transport",
            "tower::buffer"
        ]
        .iter()
        .any(|prefix| scope.name.starts_with(prefix)))));
}

/// Main endpoint absence/blank values cannot activate any remote signal, even with overrides.
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn disabled_export_makes_zero_receiver_connections() {
    for endpoint in [None, Some(""), Some(" \t\n")] {
        let receiver = Receiver::start().await;
        let process = Process::start(endpoint, &receiver.endpoint, "INFO", "local");
        let (stdout, stderr) = process.finish().await;
        assert!(stdout.contains("http.request"));
        assert!(stdout.contains("chaos.host.cpu.usage"));
        assert!(stderr.contains("phase5.event.TRACE"));
        assert_eq!(receiver.received.connections.load(Ordering::SeqCst), 0);
        assert!(receiver
            .received
            .attempts
            .iter()
            .all(|count| count.load(Ordering::SeqCst) == 0));
        receiver.close().await;
    }
}

/// Collector rejection drops failed batches but subsequent exports recover without restart.
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn collector_recovers_without_export_feedback() {
    let receiver = Receiver::start().await;
    receiver.received.unavailable.store(true, Ordering::SeqCst);
    let mut process = Process::start(
        Some(&receiver.endpoint),
        &receiver.endpoint,
        "INFO",
        "recovery",
    );
    let deadline = Instant::now() + Duration::from_secs(15);
    while receiver
        .received
        .attempts
        .iter()
        .any(|count| count.load(Ordering::SeqCst) == 0)
    {
        assert!(
            Instant::now() < deadline,
            "all signals must attempt export during outage"
        );
        tokio::time::sleep(Duration::from_millis(20)).await;
    }
    // All initial exports have returned Unavailable before allowing a second request.
    // A successful later export is required; failed data is not assumed to be retried.
    receiver.received.unavailable.store(false, Ordering::SeqCst);
    process
        .child
        .stdin
        .as_mut()
        .unwrap()
        .write_all(b"recover\n")
        .unwrap();
    let (_, stderr) = process.finish().await;
    assert_received(&receiver.received, "INFO", &stderr, 1);
    receiver.close().await;
}

/// A valid but unresponsive collector cannot prevent requests, sampling, or bounded shutdown.
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn unresponsive_collector_does_not_gate_requests_or_shutdown() {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("http://{}", listener.local_addr().unwrap());
    let process = Process::start(Some(&endpoint), &endpoint, "INFO", "unreachable");
    let (_, stderr) = process.finish().await;
    assert!(stderr.contains("HTTP request completed"));
    assert!(stderr.contains("Performance sample recorded"));
    drop(listener);
}
