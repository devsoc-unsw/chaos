use super::*;
use axum::{extract::Json, http::StatusCode, response::IntoResponse, routing::post};
use serde::Deserialize;

mod spicedb;

/// Reads only DATABASE_URL, without loading environment files into the test process.
fn database_url() -> anyhow::Result<String> {
    if let Ok(url) = std::env::var("DATABASE_URL") {
        return Ok(url);
    }
    let file = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../.env");
    for setting in dotenvy::from_path_iter(file)
        .map_err(|_| anyhow::anyhow!("Postgres prerequisite missing: DATABASE_URL"))?
    {
        if let Ok((key, value)) = setting {
            if key == "DATABASE_URL" {
                return Ok(value);
            }
        }
    }
    anyhow::bail!("Postgres prerequisite missing: DATABASE_URL")
}

/// Real PostgreSQL and tonic client calls retain request context at every LOG_LEVEL.
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn real_database_and_spicedb_calls_have_bounded_correlated_telemetry() -> anyhow::Result<()> {
    use sqlx::ConnectOptions;
    use tracing::Instrument;
    let options = database_url()?
        .parse::<sqlx::postgres::PgConnectOptions>()
        .map_err(|_| anyhow::anyhow!("Invalid Postgres fixture configuration"))?
        .log_statements(log::LevelFilter::Debug);
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .connect_with(options)
        .await
        .map_err(|_| anyhow::anyhow!("Postgres prerequisite unavailable"))?;
    let (client, stop, server) = spicedb::start().await?;
    opentelemetry::global::set_text_map_propagator(TraceContextPropagator::new());
    for level in [LogLevel::Info, LogLevel::Warn, LogLevel::Error] {
        for (id, status, grpc_code) in [
            (1, StatusCode::OK, 0),
            (2, StatusCode::FORBIDDEN, 0),
            (3, StatusCode::INTERNAL_SERVER_ERROR, 14),
        ] {
            let fixture = Fixture::new();
            let exports = InMemoryMetricExporter::default();
            let metrics = SdkMeterProvider::builder()
                .with_reader(
                    PeriodicReader::builder(exports.clone())
                        .with_interval(Duration::from_secs(3600))
                        .build(),
                )
                .build();
            let query_pool = pool.clone();
            let query_client = client.clone();
            let app = Router::new()
                .route(
                    "/flow/:id",
                    get(move || {
                        let pool = query_pool.clone();
                        let client = query_client.clone();
                        async move {
                            let value: String = sqlx::query_scalar(
                                "SELECT $1::text AS echoed /* PRIVATE_SQL_LITERAL */",
                            )
                            .bind("PRIVATE_BIND")
                            .fetch_one(&pool)
                            .instrument(crate::telemetry::database_span("telemetry.fixture.read"))
                            .await?;
                            assert_eq!(value, "PRIVATE_BIND");
                            crate::spicedb::check_permission(
                                &client,
                                "PRIVATE_KEY",
                                &std::sync::RwLock::new(None),
                                1,
                                "chaos/campaign",
                                id,
                                "review",
                            )
                            .await?;
                            crate::spicedb::write_relationships(
                                &client,
                                "PRIVATE_KEY",
                                vec![crate::spicedb::new_relationship_update(
                        crate::spicedb::authzed::api::v1::relationship_update::Operation::Touch,
                        "chaos/campaign", id, "organisation", "chaos/organisation", 1)],
                            )
                            .await?;
                            Ok::<_, crate::models::error::ChaosError>("ok")
                        }
                    }),
                )
                .layer(axum::middleware::from_fn_with_state(
                    RequestMetrics::from_meter(metrics.meter("dependencies-test")),
                    trace_request,
                ));
            let request = Request::builder()
                .uri(format!("/flow/{id}?token=PRIVATE_QUERY"))
                .header("authorization", "Bearer PRIVATE_HTTP_TOKEN")
                .header(
                    "traceparent",
                    "00-12345678901234567890123456789012-1234567890123456-01",
                )
                .body(Body::empty())
                .unwrap();
            let response = tokio::time::timeout(
                Duration::from_secs(10),
                app.oneshot(request)
                    .with_subscriber(fixture.subscriber(level)),
            )
            .await??;
            assert_eq!(response.status(), status);
            let spans = fixture.spans.get_finished_spans().unwrap();
            let roots: Vec<_> = spans
                .iter()
                .filter(|span| span.span_kind == opentelemetry::trace::SpanKind::Server)
                .collect();
            assert_eq!(roots.len(), 1);
            let root = roots[0];
            assert!(root
                .attributes
                .iter()
                .any(|field| field.key.as_str() == "http.route"
                    && field.value.as_str() == "/flow/:id"));
            assert_eq!(
                root.span_context.trace_id().to_string(),
                "12345678901234567890123456789012"
            );
            assert!(spans
                .iter()
                .all(|span| span.span_context.trace_id() == root.span_context.trace_id()));
            let query = spans
                .iter()
                .find(|span| span.name == "db.postgres.query")
                .unwrap();
            assert_eq!(query.parent_span_id, root.span_context.span_id());
            assert!(query
                .attributes
                .iter()
                .any(|field| field.key.as_str() == "db.operation.name"
                    && field.value.as_str() == "telemetry.fixture.read"));
            let rpc: Vec<_> = spans
                .iter()
                .filter(|span| span.name == "rpc.grpc.client")
                .collect();
            assert_eq!(rpc.len(), if id == 1 { 2 } else { 1 });
            // Existing permission business spans remain between the HTTP root and RPC.
            for call in &rpc {
                let mut parent = call.parent_span_id;
                let mut ancestors = 0;
                while parent != root.span_context.span_id() {
                    let span = spans
                        .iter()
                        .find(|span| span.span_context.span_id() == parent)
                        .expect("RPC ancestor must belong to this request");
                    parent = span.parent_span_id;
                    ancestors += 1;
                    assert!(ancestors < spans.len(), "span ancestry must not cycle");
                }
            }
            let check = rpc
                .iter()
                .find(|span| {
                    span.attributes.iter().any(|field| {
                        field.key.as_str() == "rpc.method"
                            && field.value.as_str() == "CheckPermission"
                    })
                })
                .unwrap();
            assert!(check
                .attributes
                .iter()
                .any(|field| field.key.as_str() == "rpc.grpc.status_code"
                    && field.value == opentelemetry::Value::I64(grpc_code)));
            let json = fixture.json();
            let logs = fixture.records.get_emitted_logs().unwrap();
            let queries: Vec<_> = json
                .iter()
                .filter(|event| event["target"] == "sqlx::query")
                .collect();
            assert_eq!(queries.len(), usize::from(level == LogLevel::Info));
            assert_eq!(
                logs.iter()
                    .filter(|log| log
                        .record
                        .target()
                        .is_some_and(|target| target == "sqlx::query"))
                    .count(),
                queries.len()
            );
            assert_eq!(
                query
                    .events
                    .iter()
                    .filter(|event| event.name == "Database statement completed")
                    .count(),
                queries.len()
            );
            if let Some(event) = queries.first() {
                assert!(event["filename"]
                    .as_str()
                    .unwrap()
                    .contains("sqlx-core-0.9.0/src/logger.rs"));
                assert_eq!(event["fields"]["message"], "Database statement completed");
                let log = logs
                    .iter()
                    .find(|log| {
                        log.record
                            .target()
                            .is_some_and(|target| target == "sqlx::query")
                    })
                    .unwrap();
                assert_eq!(
                    log.record.trace_context().unwrap().span_id,
                    query.span_context.span_id()
                );
            }
            metrics.force_flush().unwrap();
            let exported = exports.get_finished_metrics().unwrap();
            let count = exported
                .last()
                .unwrap()
                .scope_metrics()
                .flat_map(|scope| scope.metrics())
                .find(|metric| metric.name() == "http.server.request.count")
                .unwrap();
            assert!(
                matches!(count.data(), AggregatedMetrics::U64(MetricData::Sum(sum)) if sum.data_points().map(|point| point.value()).sum::<u64>() == 1)
            );
            assert!(!format!("{json:?} {spans:?} {logs:?}").contains("PRIVATE_"));
            metrics.shutdown().unwrap();
        }
    }
    pool.close().await;
    drop(client);
    let _ = stop.send(());
    tokio::time::timeout(Duration::from_secs(5), server).await???;
    Ok(())
}

/// Intentionally strict body type that makes Axum emit its real rejection event.
#[derive(Deserialize)]
struct Count {
    /// Numeric value rejected when supplied as a string.
    count: u64,
}

/// Axum-generated rejection events are correlated and redact invalid request values.
#[tokio::test]
async fn real_framework_rejections_obey_levels_and_exclude_payloads() {
    opentelemetry::global::set_text_map_propagator(TraceContextPropagator::new());
    for level in [LogLevel::Info, LogLevel::Warn, LogLevel::Error] {
        let fixture = Fixture::new();
        let exports = InMemoryMetricExporter::default();
        let metrics = SdkMeterProvider::builder()
            .with_reader(
                PeriodicReader::builder(exports.clone())
                    .with_interval(Duration::from_secs(3600))
                    .build(),
            )
            .build();
        let app = Router::new()
            .route(
                "/json",
                post(|Json(body): Json<Count>| async move { body.count.to_string() }),
            )
            .route("/only-get", get(|| async { "ok" }))
            .route(
                "/protected",
                get(|| async {
                    let valid = crate::service::jwt::decode_auth_token(
                        "PRIVATE_TOKEN",
                        &jsonwebtoken::DecodingKey::from_secret(b"fixture"),
                        &jsonwebtoken::Validation::default(),
                    );
                    assert!(valid.is_none());
                    crate::models::error::ChaosError::NotLoggedIn.into_response()
                }),
            )
            .layer(axum::middleware::from_fn_with_state(
                RequestMetrics::from_meter(metrics.meter("framework-test")),
                trace_request,
            ));
        for (method, path, body, status, route) in [
            (
                "POST",
                "/json",
                "{\"count\":\"PRIVATE_BODY\"}",
                StatusCode::UNPROCESSABLE_ENTITY,
                "/json",
            ),
            (
                "POST",
                "/only-get",
                "",
                StatusCode::METHOD_NOT_ALLOWED,
                "/only-get",
            ),
            (
                "GET",
                "/missing/PRIVATE_PATH",
                "",
                StatusCode::NOT_FOUND,
                "unmatched",
            ),
            (
                "GET",
                "/protected",
                "",
                StatusCode::UNAUTHORIZED,
                "/protected",
            ),
        ] {
            let request = Request::builder()
                .method(method)
                .uri(path)
                .header("content-type", "application/json")
                .header(
                    "traceparent",
                    "00-12345678901234567890123456789012-1234567890123456-01",
                )
                .body(Body::from(body))
                .unwrap();
            let response = app
                .clone()
                .oneshot(request)
                .with_subscriber(fixture.subscriber(level))
                .await
                .unwrap();
            assert_eq!(response.status(), status);
            let spans = fixture.spans.get_finished_spans().unwrap();
            let root = spans.last().unwrap();
            assert_eq!(root.name, "http.request");
            assert_eq!(
                root.span_context.trace_id().to_string(),
                "12345678901234567890123456789012"
            );
            assert!(root
                .attributes
                .iter()
                .any(|field| field.key.as_str() == "http.route" && field.value.as_str() == route));
            assert!(root
                .attributes
                .iter()
                .any(|field| field.key.as_str() == "http.response.status_code"
                    && field.value == opentelemetry::Value::I64(i64::from(status.as_u16()))));
        }
        let spans = fixture.spans.get_finished_spans().unwrap();
        assert_eq!(spans.len(), 4, "one intended server root per request");
        let json = fixture.json();
        let records = fixture.records.get_emitted_logs().unwrap();
        let framework: Vec<_> = json
            .iter()
            .filter(|event| event["target"] == "axum::rejection")
            .collect();
        assert_eq!(framework.len(), usize::from(level == LogLevel::Info));
        assert_eq!(
            records
                .iter()
                .filter(|log| log
                    .record
                    .target()
                    .is_some_and(|target| target == "axum::rejection"))
                .count(),
            framework.len()
        );
        assert_eq!(
            spans
                .iter()
                .flat_map(|span| span.events.iter())
                .filter(|event| event.name == "Request extractor rejected request")
                .count(),
            framework.len()
        );
        if let Some(event) = framework.first() {
            assert!(event["filename"]
                .as_str()
                .unwrap()
                .contains("axum-0.7.9/src/extract/rejection.rs"));
            let record = records
                .iter()
                .find(|log| {
                    log.record
                        .target()
                        .is_some_and(|target| target == "axum::rejection")
                })
                .unwrap();
            assert_eq!(
                record.record.trace_context().unwrap().span_id,
                spans[0].span_context.span_id()
            );
        }
        metrics.force_flush().unwrap();
        let exported = exports.get_finished_metrics().unwrap();
        let count = exported
            .last()
            .unwrap()
            .scope_metrics()
            .flat_map(|scope| scope.metrics())
            .find(|metric| metric.name() == "http.server.request.count")
            .unwrap();
        assert!(
            matches!(count.data(), AggregatedMetrics::U64(MetricData::Sum(sum)) if sum.data_points().map(|point| point.value()).sum::<u64>() == 4)
        );
        assert!(!format!("{json:?} {spans:?} {records:?}").contains("PRIVATE_"));
        metrics.shutdown().unwrap();
    }
}
