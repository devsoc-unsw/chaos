use std::time::Duration;

use anyhow::{bail, Result};
use opentelemetry::trace::{TraceContextExt, TracerProvider as _};
use opentelemetry_sdk::{
    metrics::{PeriodicReader, SdkMeterProvider},
    trace::SdkTracerProvider,
    Resource,
};
use tracing_opentelemetry::OpenTelemetrySpanExt;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

mod performance;

/// Installs console logs and stdout exporters for traces and performance metrics.
/// Returns both providers so main can flush and shut them down before exiting.
fn init_telemetry() -> (SdkTracerProvider, SdkMeterProvider) {
    let resource = Resource::builder()
        .with_service_name("chaos-telemetry-example")
        .build();
    let provider = SdkTracerProvider::builder()
        .with_resource(resource.clone())
        // Export each completed span immediately, making the demo easy to watch.
        .with_simple_exporter(opentelemetry_stdout::SpanExporter::default())
        .build();

    tracing_subscriber::registry()
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("chaos_telemetry_example=debug")),
        )
        // Human-readable logs appear immediately while operations are running.
        .with(
            tracing_subscriber::fmt::layer()
                .with_ansi(false)
                .with_file(true)
                .with_line_number(true),
        )
        // The same tracing spans become real OpenTelemetry spans.
        .with(tracing_opentelemetry::layer().with_tracer(provider.tracer("chaos-example")))
        .init();

    let metrics = SdkMeterProvider::builder()
        .with_resource(resource)
        .with_reader(
            PeriodicReader::builder(opentelemetry_stdout::MetricExporter::default())
                // Each demo sample explicitly flushes for immediate terminal output.
                .with_interval(Duration::from_secs(3600))
                .build(),
        )
        .build();

    (provider, metrics)
}

/// Simulates a database lookup for the supplied string ID and returns role names.
/// This creates a child span and demonstrates recording a vector with Debug.
#[tracing::instrument(skip_all, fields(application_id = %application_id, db.system.name = "postgresql"))]
async fn load_roles(application_id: &str) -> Vec<&'static str> {
    tracing::debug!("Starting simulated database lookup");
    tokio::time::sleep(Duration::from_millis(40)).await;
    let roles = vec!["organiser", "reviewer"];
    tracing::debug!(roles = ?roles, rows = roles.len(), "Roles loaded");
    roles
}

/// Simulates a permission check; returns an error when the supplied flag is true.
/// The failure sets the exported span's OpenTelemetry status to ERROR.
#[tracing::instrument(skip_all, fields(deny = deny, otel.status_code = tracing::field::Empty))]
async fn check_permission(deny: bool) -> Result<()> {
    tokio::time::sleep(Duration::from_millis(20)).await;
    if deny {
        tracing::Span::current().record("otel.status_code", "ERROR");
        tracing::warn!(permission = "view", "Simulated permission denied");
        bail!("simulated permission denied");
    }
    tracing::debug!(
        permission = "view",
        allowed = true,
        "Simulated permission granted"
    );
    Ok(())
}

/// Runs a simulated application request for the supplied ID and failure flag.
/// Returns lookup/permission results and records success or error on the root span.
#[tracing::instrument(
    name = "application_request",
    skip_all,
    fields(application_id = %application_id, deny = deny, otel.status_code = tracing::field::Empty)
)]
async fn process_application(application_id: &str, deny: bool) -> Result<()> {
    // Include the trace ID in a log so it can be matched to exported child spans.
    let context = tracing::Span::current().context();
    let trace_id = context.span().span_context().trace_id().to_string();
    tracing::info!(%trace_id, "Application request started");

    if let Err(error) = check_permission(deny).await {
        tracing::Span::current().record("otel.status_code", "ERROR");
        tracing::error!(%error, %trace_id, "Application request failed");
        return Err(error);
    }

    let roles = load_roles(application_id).await;
    tracing::Span::current().record("otel.status_code", "OK");
    tracing::info!(%trace_id, role_count = roles.len(), "Application request completed");
    Ok(())
}

/// Runs success and failure examples, then flushes all completed telemetry.
/// Returns unexpected errors; the simulated permission denial is expected.
#[tokio::main]
async fn main() -> Result<()> {
    let samples: usize = std::env::var("DEMO_SAMPLES")
        .unwrap_or_else(|_| "5".into())
        .parse()?;
    let interval_ms: u64 = std::env::var("DEMO_INTERVAL_MS")
        .unwrap_or_else(|_| "1000".into())
        .parse()?;
    anyhow::ensure!(samples > 0, "DEMO_SAMPLES must be greater than zero");
    anyhow::ensure!(
        Duration::from_millis(interval_ms) >= sysinfo::MINIMUM_CPU_UPDATE_INTERVAL,
        "DEMO_INTERVAL_MS must be at least {}",
        sysinfo::MINIMUM_CPU_UPDATE_INTERVAL.as_millis()
    );

    let (provider, metrics) = init_telemetry();
    let sampler_provider = metrics.clone();
    // OS sampling runs on a blocking worker, independently of async application work.
    let sampler = tokio::task::spawn_blocking(move || {
        performance::sample_performance(
            sampler_provider,
            samples,
            Duration::from_millis(interval_ms),
        )
    });
    tracing::info!("Demo starting: one successful request, then one failed request");

    let successful_request = process_application("9007199254740993", false).await;
    let denied_request = process_application("9007199254740994", true).await;

    let sampling_result = sampler.await;
    // Shut down both providers even when sampling or one shutdown fails.
    let metric_shutdown = metrics.shutdown();
    let trace_shutdown = provider.shutdown();
    sampling_result??;
    metric_shutdown?;
    trace_shutdown?;
    tracing::info!("Demo finished; spans and performance metrics are printed above");

    successful_request?;
    anyhow::ensure!(denied_request.is_err(), "expected the simulated denial");
    Ok(())
}
