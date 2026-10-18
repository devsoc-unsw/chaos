use super::*;
use axum::{body::Body, http::StatusCode, routing::any, Router};
use opentelemetry::metrics::MeterProvider as _;
use opentelemetry::trace::Status;
use opentelemetry_sdk::{
    metrics::{
        data::{AggregatedMetrics, MetricData},
        InMemoryMetricExporter,
    },
    trace::{InMemorySpanExporter, SpanData},
};
use tower::ServiceExt;
use tracing::instrument::WithSubscriber;

/// Executes the actual middleware with isolated exporters and no application DB.
async fn request(
    method: &str,
    uri: &str,
    status: StatusCode,
) -> (SpanData, InMemoryMetricExporter) {
    let spans = InMemorySpanExporter::default();
    let traces = SdkTracerProvider::builder()
        .with_simple_exporter(spans.clone())
        .build();
    let exports = InMemoryMetricExporter::default();
    let metrics = SdkMeterProvider::builder()
        .with_reader(
            PeriodicReader::builder(exports.clone())
                .with_interval(Duration::from_secs(3600))
                .build(),
        )
        .build();
    let instruments = RequestMetrics::from_meter(metrics.meter("http-test"));
    let subscriber = tracing_subscriber::registry()
        .with(tracing_opentelemetry::layer().with_tracer(traces.tracer("http-test")));
    global::set_text_map_propagator(TraceContextPropagator::new());
    let app = Router::new()
        .route("/items/:id", any(move || async move { status }))
        .layer(axum::middleware::from_fn_with_state(
            instruments,
            trace_request,
        ));
    let req = Request::builder()
        .method(method)
        .uri(uri)
        .header(
            "traceparent",
            "00-12345678901234567890123456789012-1234567890123456-01",
        )
        .header("authorization", "Bearer PRIVATE_HEADER")
        .header("cookie", "session=PRIVATE_COOKIE")
        .body(Body::from("PRIVATE_BODY"))
        .unwrap();
    let response = app.oneshot(req).with_subscriber(subscriber).await.unwrap();
    let expected = if uri.starts_with("/items/") {
        status
    } else {
        StatusCode::NOT_FOUND
    };
    assert_eq!(response.status(), expected);
    metrics.force_flush().unwrap();
    traces.force_flush().unwrap();
    let exported = spans.get_finished_spans().unwrap();
    assert_eq!(
        exported.len(),
        1,
        "each request must export one server span"
    );
    let span = exported[0].clone();
    assert_eq!(span.name, "http.request");
    assert_eq!(span.span_kind, opentelemetry::trace::SpanKind::Server);
    assert_eq!(attribute(&span, "http.request.method"), method);
    assert_eq!(
        attribute(&span, "http.response.status_code"),
        expected.as_u16().to_string()
    );
    assert_metrics(&exports, method, expected.as_u16());
    metrics.shutdown().unwrap();
    traces.shutdown().unwrap();
    (span, exports)
}

/// Reads a named exported attribute without relying on its internal value type.
fn attribute(span: &SpanData, key: &str) -> String {
    span.attributes
        .iter()
        .find(|a| a.key.as_str() == key)
        .unwrap()
        .value
        .to_string()
}

/// Verifies a completed request exports a counter and a seconds histogram.
fn assert_metrics(exports: &InMemoryMetricExporter, method: &str, status: u16) {
    let finished = exports.get_finished_metrics().unwrap();
    let metrics: Vec<_> = finished
        .last()
        .unwrap()
        .scope_metrics()
        .flat_map(|s| s.metrics())
        .collect();
    let counter = metrics
        .iter()
        .find(|m| m.name() == "http.server.request.count")
        .unwrap();
    match counter.data() {
        AggregatedMetrics::U64(MetricData::Sum(sum)) => {
            let points: Vec<_> = sum.data_points().collect();
            assert_eq!(points.len(), 1);
            assert_eq!(points[0].value(), 1);
            let labels: std::collections::BTreeMap<_, _> = points[0]
                .attributes()
                .map(|a| (a.key.to_string(), a.value.to_string()))
                .collect();
            assert_eq!(labels["http.request.method"], method);
            assert_eq!(labels["http.response.status_code"], status.to_string());
            assert!(labels["http.route"] == "/items/:id" || labels["http.route"] == "unmatched");
        }
        _ => panic!("request count must be a u64 sum"),
    }
    let duration = metrics
        .iter()
        .find(|m| m.name() == "http.server.request.duration")
        .unwrap();
    assert_eq!(duration.unit(), "s");
    match duration.data() {
        AggregatedMetrics::F64(MetricData::Histogram(histogram)) => {
            let points: Vec<_> = histogram.data_points().collect();
            assert_eq!(points.len(), 1);
            assert_eq!(points[0].count(), 1);
            assert!(points[0].sum().is_finite() && points[0].sum() >= 0.0);
        }
        _ => panic!("request duration must be an f64 histogram"),
    }
}

/// Every supported HTTP verb passes through the same telemetry middleware.
#[tokio::test]
async fn records_all_http_methods() {
    for method in ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] {
        request(method, "/items/42", StatusCode::OK).await;
    }
}

/// Expected authentication and authorization failures are still exported.
#[tokio::test]
async fn records_rejected_requests() {
    for status in [
        StatusCode::UNAUTHORIZED,
        StatusCode::FORBIDDEN,
        StatusCode::BAD_REQUEST,
    ] {
        let (span, _) = request("POST", "/items/42", status).await;
        assert_eq!(span.status, Status::Unset);
    }
}

/// Backend failures mark the HTTP span as an OpenTelemetry error.
#[tokio::test]
async fn marks_server_failures_as_errors() {
    let (span, _) = request("GET", "/items/42", StatusCode::INTERNAL_SERVER_ERROR).await;
    assert!(matches!(span.status, Status::Error { .. }));
}

/// Fallback requests are recorded without using arbitrary paths as metric labels.
#[tokio::test]
async fn records_unmatched_routes() {
    let (span, _) = request("GET", "/missing/PRIVATE_PATH", StatusCode::OK).await;
    assert_eq!(attribute(&span, "http.route"), "unmatched");
    assert!(!format!("{span:?}").contains("PRIVATE_PATH"));
}

/// Incoming W3C trace context determines the exported trace and parent span IDs.
#[tokio::test]
async fn propagates_incoming_trace_context() {
    let (span, _) = request("GET", "/items/42", StatusCode::OK).await;
    assert_eq!(
        span.span_context.trace_id().to_string(),
        "12345678901234567890123456789012"
    );
    assert_eq!(span.parent_span_id.to_string(), "1234567890123456");
}

/// Telemetry uses route templates and omits request payloads and credentials.
#[tokio::test]
async fn excludes_sensitive_request_data() {
    let (span, exports) = request(
        "POST",
        "/items/987654321?token=PRIVATE_QUERY",
        StatusCode::OK,
    )
    .await;
    assert_eq!(attribute(&span, "http.route"), "/items/:id");
    let output = format!("{span:?} {:?}", exports.get_finished_metrics().unwrap());
    for secret in [
        "987654321",
        "PRIVATE_QUERY",
        "PRIVATE_HEADER",
        "PRIVATE_COOKIE",
        "PRIVATE_BODY",
    ] {
        assert!(!output.contains(secret), "telemetry leaked {secret}");
    }
}
