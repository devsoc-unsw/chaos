//! Server telemetry: JSON logs, HTTP traces/metrics, and continuous OS sampling.

pub mod config;
mod dependencies;
mod logging;
mod operations;
mod performance;
mod providers;

pub use operations::{database_span, spicedb_rpc};

#[cfg(test)]
mod receiver_tests;
#[cfg(test)]
mod tests;

use anyhow::Result;
use axum::{
    extract::{MatchedPath, Request, State},
    middleware::Next,
    response::Response,
};
#[cfg(test)]
use opentelemetry::trace::TracerProvider as _;
use opentelemetry::{
    global,
    metrics::{Counter, Histogram},
    propagation::Extractor,
    trace::TraceContextExt,
    KeyValue,
};
#[cfg(test)]
use opentelemetry_sdk::{
    metrics::{PeriodicReader, SdkMeterProvider},
    trace::SdkTracerProvider,
};
use opentelemetry_sdk::{propagation::TraceContextPropagator, Resource};
use std::{
    sync::Arc,
    time::{Duration, Instant},
};
use tracing::Instrument;
use tracing_opentelemetry::OpenTelemetrySpanExt;
#[cfg(test)]
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

/// Owns telemetry providers and the sampler so shutdown can flush and stop them.
pub struct Telemetry {
    /// Trace, metric, and optional remote log providers.
    providers: providers::Providers,
    /// Stop signal for the performance sampler.
    stop: SamplingStop,
    /// Worker that samples OS information independently of request threads.
    sampler: tokio::task::JoinHandle<Result<()>>,
}

/// Stops the blocking sampler even when startup unwinds after a panic.
struct SamplingStop(
    /// Stop signal sent when the owner is dropped or explicitly shut down.
    tokio::sync::watch::Sender<bool>,
);

impl Drop for SamplingStop {
    /// Wakes the sampler so Tokio runtime shutdown does not wait indefinitely.
    fn drop(&mut self) {
        let _ = self.0.send(true);
    }
}

impl Telemetry {
    /// Initializes JSON logs, exporters, and continuous performance sampling.
    /// A nonblank OTEL_EXPORTER_OTLP_ENDPOINT selects gRPC OTLP; otherwise stdout.
    /// Invalid endpoint or LOG_LEVEL settings fail before providers/workers start.
    pub fn init() -> Result<Self> {
        let config = config::TelemetryConfig::from_env()?;
        // Fail before constructing exporters if no runtime can own the sampler/channels.
        let runtime = tokio::runtime::Handle::try_current()?;
        let seconds: u64 = std::env::var("TELEMETRY_INTERVAL_SECS")
            .unwrap_or_else(|_| "5".into())
            .parse()?;
        anyhow::ensure!(seconds > 0, "TELEMETRY_INTERVAL_SECS must be positive");
        let interval = Duration::from_secs(seconds);
        let resource = Resource::builder()
            .with_service_name(
                std::env::var("OTEL_SERVICE_NAME").unwrap_or_else(|_| "chaos-server".into()),
            )
            .with_attributes([
                KeyValue::new("service.version", env!("CARGO_PKG_VERSION")),
                KeyValue::new("os.type", std::env::consts::OS),
                KeyValue::new("process.pid", i64::from(std::process::id())),
            ])
            .build();
        let providers = providers::Providers::new(config.endpoint.as_deref(), resource, interval)?;
        logging::subscriber(
            config.log_level,
            &providers.traces,
            providers.logs.as_ref(),
            std::io::stderr,
        )
        .try_init()
        .map_err(|error| anyhow::anyhow!(error.to_string()))?;
        global::set_meter_provider(providers.metrics.clone());
        global::set_text_map_propagator(TraceContextPropagator::new());
        let (stop, receiver) = tokio::sync::watch::channel(false);
        let sampler_metrics = providers.metrics.clone();
        let sampler = runtime.spawn_blocking(move || {
            let result = tokio::runtime::Builder::new_current_thread()
                .enable_time()
                .build()?
                .block_on(performance::sample_performance(
                    sampler_metrics,
                    receiver,
                    interval,
                ));
            if let Err(error) = &result {
                tracing::error!(%error, "Performance sampling stopped");
            }
            result
        });
        tracing::info!(interval_seconds = seconds, "Telemetry initialized");
        Ok(Self {
            providers,
            stop: SamplingStop(stop),
            sampler,
        })
    }

    /// Stops the sampler and flushes all providers, returning any shutdown error.
    pub async fn shutdown(self) -> Result<()> {
        let _ = self.stop.0.send(true);
        let sampling = self.sampler.await;
        // Exporter shutdown may block; keep it off async request threads.
        let mut providers = self.providers;
        let exported = tokio::task::spawn_blocking(move || providers.shutdown()).await;
        sampling??;
        exported??;
        Ok(())
    }
}

/// Reusable instruments for requests, labelled by route template rather than IDs.
#[derive(Clone)]
pub struct RequestMetrics {
    /// Completed HTTP requests.
    requests: Arc<Counter<u64>>,
    /// Time until the response headers/body object is produced, in seconds.
    duration: Arc<Histogram<f64>>,
}

impl RequestMetrics {
    /// Creates HTTP instruments using the installed global meter provider.
    pub fn new() -> Self {
        Self::from_meter(global::meter("chaos-http"))
    }

    /// Creates instruments from a supplied meter for isolated export and testing.
    fn from_meter(meter: opentelemetry::metrics::Meter) -> Self {
        Self {
            requests: Arc::new(meter.u64_counter("http.server.request.count").build()),
            duration: Arc::new(
                meter
                    .f64_histogram("http.server.request.duration")
                    .with_unit("s")
                    .build(),
            ),
        }
    }
}

impl Default for RequestMetrics {
    /// Creates instruments from the installed global meter provider.
    fn default() -> Self {
        Self::new()
    }
}

/// Allows incoming W3C trace context to be extracted without recording headers.
struct HeaderExtractor<'a>(&'a axum::http::HeaderMap);

impl Extractor for HeaderExtractor<'_> {
    /// Returns the string value of a requested propagation header, if valid.
    fn get(&self, key: &str) -> Option<&str> {
        self.0.get(key)?.to_str().ok()
    }
    /// Lists available header names for the propagation API.
    fn keys(&self) -> Vec<&str> {
        self.0.keys().map(|key| key.as_str()).collect()
    }
}

/// Instruments an actual HTTP request, its response status, and elapsed time.
/// Skips bodies, query strings, and credentials; returns the original response.
pub async fn trace_request(
    State(metrics): State<RequestMetrics>,
    request: Request,
    next: Next,
) -> Response {
    let method = request.method().to_string();
    let route = request
        .extensions()
        .get::<MatchedPath>()
        .map(|path| path.as_str())
        .unwrap_or("unmatched")
        .to_owned();
    let span = tracing::info_span!("http.request", otel.kind = "server", http.request.method = %method,
        http.route = %route, http.response.status_code = tracing::field::Empty, otel.status_code = tracing::field::Empty);
    let parent = global::get_text_map_propagator(|propagator| {
        propagator.extract(&HeaderExtractor(request.headers()))
    });
    if let Err(error) = span.set_parent(parent) {
        tracing::debug!(%error, "Could not attach incoming trace context");
    }
    async move {
        let started = Instant::now();
        let response = next.run(request).await;
        let status = response.status().as_u16();
        let elapsed = started.elapsed().as_secs_f64();
        let span = tracing::Span::current();
        span.record("http.response.status_code", i64::from(status));
        if status >= 500 {
            span.record("otel.status_code", "ERROR");
        }
        let attributes = [
            KeyValue::new("http.request.method", method),
            KeyValue::new("http.route", route),
            KeyValue::new("http.response.status_code", i64::from(status)),
        ];
        metrics.requests.add(1, &attributes);
        metrics.duration.record(elapsed, &attributes);
        let context = span.context();
        let trace_id = context.span().span_context().trace_id().to_string();
        tracing::info!(%trace_id, status, duration_ms = elapsed * 1000.0, "HTTP request completed");
        response
    }
    .instrument(span)
    .await
}
