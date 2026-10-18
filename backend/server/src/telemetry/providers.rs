//! Provider construction and cleanup for optional remote export.

use anyhow::Result;
use opentelemetry_otlp::{WithExportConfig, WithTonicConfig};
use opentelemetry_sdk::{
    logs::{
        BatchConfigBuilder as LogBatchConfigBuilder, BatchLogProcessor, LogExporter,
        SdkLoggerProvider,
    },
    metrics::{exporter::PushMetricExporter, PeriodicReader, SdkMeterProvider},
    trace::{
        BatchConfigBuilder as SpanBatchConfigBuilder, BatchSpanProcessor, SdkTracerProvider,
        SpanExporter,
    },
    Resource,
};
use std::time::Duration;

/// Upper bound on one collector request; an outage never gates server startup.
const EXPORT_TIMEOUT: Duration = Duration::from_secs(3);
/// Upper bound passed to each provider shutdown.
const SHUTDOWN_TIMEOUT: Duration = Duration::from_secs(5);

/// Constructs remote exporters separately from providers so failure is cleanable.
trait ExporterFactory {
    /// Trace exporter type.
    type Spans: SpanExporter + 'static;
    /// Metric exporter type.
    type Metrics: PushMetricExporter;
    /// Log exporter type.
    type Logs: LogExporter + 'static;
    /// Constructs the remote trace exporter using the validated main endpoint.
    fn spans(&mut self, endpoint: &str) -> Result<Self::Spans>;
    /// Constructs the remote metric exporter using the validated main endpoint.
    fn metrics(&mut self, endpoint: &str) -> Result<Self::Metrics>;
    /// Constructs the remote log exporter using the validated main endpoint.
    fn logs(&mut self, endpoint: &str) -> Result<Self::Logs>;
}

/// Production OTLP gRPC exporter builders, with bounded requests and lazy channels.
struct OtlpExporters;

impl OtlpExporters {
    /// Explicitly loads enabled trust roots for HTTPS without changing plain HTTP.
    fn with_tls_roots<B: WithTonicConfig>(builder: B, endpoint: &str) -> B {
        if endpoint.starts_with("https://") {
            builder.with_tls_config(tonic::transport::ClientTlsConfig::new().with_enabled_roots())
        } else {
            builder
        }
    }
}

impl ExporterFactory for OtlpExporters {
    type Spans = opentelemetry_otlp::SpanExporter;
    type Metrics = opentelemetry_otlp::MetricExporter;
    type Logs = opentelemetry_otlp::LogExporter;

    /// Configures traces without waiting for collector connectivity.
    fn spans(&mut self, endpoint: &str) -> Result<Self::Spans> {
        Self::with_tls_roots(
            opentelemetry_otlp::SpanExporter::builder().with_tonic(),
            endpoint,
        )
        .with_endpoint(endpoint)
        .with_timeout(EXPORT_TIMEOUT)
        .build()
        .map_err(|_| {
            anyhow::anyhow!(
                "Could not configure OTLP trace exporter; check OTEL_EXPORTER_OTLP_* settings"
            )
        })
    }
    /// Configures metrics without waiting for collector connectivity.
    fn metrics(&mut self, endpoint: &str) -> Result<Self::Metrics> {
        Self::with_tls_roots(
            opentelemetry_otlp::MetricExporter::builder().with_tonic(),
            endpoint,
        )
        .with_endpoint(endpoint)
        .with_timeout(EXPORT_TIMEOUT)
        .build()
        .map_err(|_| {
            anyhow::anyhow!(
                "Could not configure OTLP metric exporter; check OTEL_EXPORTER_OTLP_* settings"
            )
        })
    }
    /// Configures logs without waiting for collector connectivity.
    fn logs(&mut self, endpoint: &str) -> Result<Self::Logs> {
        Self::with_tls_roots(
            opentelemetry_otlp::LogExporter::builder().with_tonic(),
            endpoint,
        )
        .with_endpoint(endpoint)
        .with_timeout(EXPORT_TIMEOUT)
        .build()
        .map_err(|_| {
            anyhow::anyhow!(
                "Could not configure OTLP log exporter; check OTEL_EXPORTER_OTLP_* settings"
            )
        })
    }
}

/// Owns every provider, including explicit cleanup if subscriber installation fails.
pub(super) struct Providers {
    /// Trace provider, exporting to OTLP or stdout.
    pub(super) traces: SdkTracerProvider,
    /// Metric provider, exporting to OTLP or stdout.
    pub(super) metrics: SdkMeterProvider,
    /// Remote-only log provider; JSON stderr is the sole local log destination.
    pub(super) logs: Option<SdkLoggerProvider>,
    /// Prevents shutdown from being repeated by Drop after an explicit shutdown.
    closed: bool,
}

impl Providers {
    /// Creates providers without consulting ambient endpoint variables for selection.
    pub(super) fn new(
        endpoint: Option<&str>,
        resource: Resource,
        interval: Duration,
    ) -> Result<Self> {
        Self::build(endpoint, resource, interval, &mut OtlpExporters)
    }

    /// Builds all exporters before starting any SDK worker, with rollback on error.
    fn build<F: ExporterFactory>(
        endpoint: Option<&str>,
        resource: Resource,
        interval: Duration,
        factory: &mut F,
    ) -> Result<Self> {
        let Some(endpoint) = endpoint else {
            return Ok(Self {
                traces: SdkTracerProvider::builder()
                    .with_resource(resource.clone())
                    .with_simple_exporter(opentelemetry_stdout::SpanExporter::default())
                    .build(),
                metrics: SdkMeterProvider::builder()
                    .with_resource(resource)
                    .with_reader(
                        PeriodicReader::builder(opentelemetry_stdout::MetricExporter::default())
                            .with_interval(interval)
                            .build(),
                    )
                    .build(),
                logs: None,
                closed: false,
            });
        };
        let spans = factory.spans(endpoint)?;
        let metrics = match factory.metrics(endpoint) {
            Ok(exporter) => exporter,
            Err(error) => {
                let _ = spans.shutdown_with_timeout(SHUTDOWN_TIMEOUT);
                return Err(error);
            }
        };
        let logs = match factory.logs(endpoint) {
            Ok(exporter) => exporter,
            Err(error) => {
                let _ = spans.shutdown_with_timeout(SHUTDOWN_TIMEOUT);
                let _ = metrics.shutdown_with_timeout(SHUTDOWN_TIMEOUT);
                return Err(error);
            }
        };
        Ok(Self {
            traces: SdkTracerProvider::builder()
                .with_resource(resource.clone())
                .with_span_processor(
                    BatchSpanProcessor::builder(spans)
                        .with_batch_config(
                            SpanBatchConfigBuilder::default()
                                .with_max_queue_size(2048)
                                .with_max_export_batch_size(512)
                                .build(),
                        )
                        .build(),
                )
                .build(),
            metrics: SdkMeterProvider::builder()
                .with_resource(resource.clone())
                .with_reader(
                    PeriodicReader::builder(metrics)
                        .with_interval(interval)
                        .build(),
                )
                .build(),
            logs: Some(
                SdkLoggerProvider::builder()
                    .with_resource(resource)
                    .with_log_processor(
                        BatchLogProcessor::builder(logs)
                            .with_batch_config(
                                LogBatchConfigBuilder::default()
                                    .with_max_queue_size(2048)
                                    .with_max_export_batch_size(512)
                                    .build(),
                            )
                            .build(),
                    )
                    .build(),
            ),
            closed: false,
        })
    }

    /// Flushes and stops every provider even if another provider reports an error.
    pub(super) fn shutdown(&mut self) -> Result<()> {
        if self.closed {
            return Ok(());
        }
        self.closed = true;
        let metrics = self.metrics.shutdown_with_timeout(SHUTDOWN_TIMEOUT);
        let traces = self.traces.shutdown_with_timeout(SHUTDOWN_TIMEOUT);
        let logs = self
            .logs
            .as_ref()
            .map(|logs| logs.shutdown_with_timeout(SHUTDOWN_TIMEOUT))
            .transpose();
        // Run every shutdown before propagating any error.
        metrics?;
        traces?;
        logs?;
        Ok(())
    }
}

impl Drop for Providers {
    /// Cleans up providers on startup failure even when layers retain cloned handles.
    fn drop(&mut self) {
        let _ = self.shutdown();
    }
}

/// Keeps SDK/export-transport diagnostics local to prevent telemetry feedback loops.
/// Other targets, including application-owned outbound spans, remain eligible.
pub(super) fn export_eligible(metadata: &tracing::Metadata<'_>) -> bool {
    let target = metadata.target();
    !target.starts_with("opentelemetry")
        && ![
            "h2",
            "hyper",
            "hyper_util",
            "tonic::transport",
            "tower::buffer",
        ]
        .iter()
        .any(|prefix| {
            target == *prefix
                || target
                    .strip_prefix(prefix)
                    .is_some_and(|rest| rest.starts_with("::"))
        })
}

#[cfg(test)]
mod tests;
