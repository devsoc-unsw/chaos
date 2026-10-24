use super::*;

/// A zero sampling interval must fail before any OS work is performed.
#[tokio::test]
async fn rejects_zero_interval() {
    let (stop, receiver) = watch::channel(true);
    drop(stop);
    let result = sample_performance(SdkMeterProvider::default(), receiver, Duration::ZERO).await;
    assert!(result.is_err(), "zero interval must be rejected");
}

/// A shutdown flag already set at startup must not wait for another change.
#[tokio::test]
async fn respects_shutdown_already_requested() {
    let (_stop, receiver) = watch::channel(true);
    let result = tokio::time::timeout(
        Duration::from_millis(100),
        sample_performance(
            SdkMeterProvider::default(),
            receiver,
            Duration::from_secs(1),
        ),
    )
    .await;
    assert!(result.is_ok(), "sampler ignored the existing shutdown flag");
    assert!(result.unwrap().is_ok());
}

use super::recording::{HardwareSnapshot, Reading, ReadingValue, SnapshotRecorder};
use opentelemetry_sdk::metrics::{
    data::{AggregatedMetrics, MetricData},
    InMemoryMetricExporter, PeriodicReader,
};
use std::collections::BTreeMap;

/// Builds an isolated real SDK exporter, with no global subscriber/provider state.
fn exporter() -> (SdkMeterProvider, InMemoryMetricExporter) {
    let exporter = InMemoryMetricExporter::default();
    let provider = SdkMeterProvider::builder()
        .with_reader(
            PeriodicReader::builder(exporter.clone())
                .with_interval(Duration::from_secs(3600))
                .build(),
        )
        .build();
    (provider, exporter)
}

/// Finds exported values by their labels, verifying gauge type and unit as well.
fn points(
    exporter: &InMemoryMetricExporter,
    name: &str,
    unit: &str,
) -> Vec<(f64, BTreeMap<String, String>)> {
    let exports = exporter.get_finished_metrics().unwrap();
    let Some(last) = exports.last() else {
        return vec![];
    };
    let Some(metric) = last
        .scope_metrics()
        .flat_map(|scope| scope.metrics())
        .find(|metric| metric.name() == name)
    else {
        return vec![];
    };
    assert_eq!(metric.unit(), unit);
    match metric.data() {
        AggregatedMetrics::F64(MetricData::Gauge(gauge)) => gauge
            .data_points()
            .map(|point| {
                (
                    point.value(),
                    point
                        .attributes()
                        .map(|attr| (attr.key.to_string(), attr.value.to_string()))
                        .collect(),
                )
            })
            .collect(),
        AggregatedMetrics::U64(MetricData::Gauge(gauge)) => gauge
            .data_points()
            .map(|point| {
                (
                    point.value() as f64,
                    point
                        .attributes()
                        .map(|attr| (attr.key.to_string(), attr.value.to_string()))
                        .collect(),
                )
            })
            .collect(),
        _ => panic!("expected a hardware gauge"),
    }
}

/// Creates a known hardware reading with one identifying label.
fn reading(
    name: &'static str,
    value: ReadingValue,
    key: &'static str,
    label: &'static str,
) -> Reading {
    Reading {
        name,
        value,
        attributes: vec![KeyValue::new(key, label)],
    }
}

/// Expected values must survive OS-to-OpenTelemetry conversion without unit changes.
#[test]
fn exports_expected_hardware_values_and_units() {
    let (provider, exporter) = exporter();
    let recorder = SnapshotRecorder::new(&provider);
    recorder
        .publish(HardwareSnapshot {
            readings: vec![
                reading(
                    "chaos.host.cpu.usage",
                    ReadingValue::Float(37.5),
                    "cpu",
                    "average",
                ),
                reading(
                    "chaos.host.memory",
                    ReadingValue::Integer(8_589_934_592),
                    "state",
                    "used",
                ),
                reading(
                    "chaos.process.memory",
                    ReadingValue::Integer(67_108_864),
                    "kind",
                    "resident",
                ),
                Reading {
                    name: "chaos.process.cpu.usage",
                    value: ReadingValue::Float(125.0),
                    attributes: vec![],
                },
                reading(
                    "chaos.host.disk.space",
                    ReadingValue::Integer(1024),
                    "mount",
                    "/",
                ),
                reading(
                    "chaos.host.network.bytes_since_previous_sample",
                    ReadingValue::Integer(4096),
                    "interface",
                    "en0",
                ),
                reading(
                    "chaos.host.sensor.temperature",
                    ReadingValue::Float(62.5),
                    "sensor",
                    "CPU",
                ),
            ],
        })
        .unwrap();
    provider.force_flush().unwrap();
    for (name, unit, expected, key, label) in [
        ("chaos.host.cpu.usage", "%", 37.5, "cpu", "average"),
        ("chaos.host.memory", "By", 8_589_934_592.0, "state", "used"),
        (
            "chaos.process.memory",
            "By",
            67_108_864.0,
            "kind",
            "resident",
        ),
        ("chaos.host.disk.space", "By", 1024.0, "mount", "/"),
        (
            "chaos.host.network.bytes_since_previous_sample",
            "By",
            4096.0,
            "interface",
            "en0",
        ),
        (
            "chaos.host.sensor.temperature",
            "Cel",
            62.5,
            "sensor",
            "CPU",
        ),
    ] {
        let values = points(&exporter, name, unit);
        assert_eq!(values.len(), 1, "missing {name}");
        assert_eq!(values[0].0, expected, "incorrect {name}");
        assert_eq!(values[0].1.get(key).unwrap(), label);
    }
    assert_eq!(
        points(&exporter, "chaos.process.cpu.usage", "%")[0].0,
        125.0
    );
    assert_eq!(
        points(&exporter, "chaos.host.temperature.available", "1")[0].0,
        1.0
    );
    provider.shutdown().unwrap();
}

/// Missing/invalid sensors must not emit zero-degree or non-finite temperatures.
#[test]
fn unavailable_temperatures_are_not_fabricated() {
    let (provider, exporter) = exporter();
    let recorder = SnapshotRecorder::new(&provider);
    recorder
        .publish(HardwareSnapshot {
            readings: vec![
                reading(
                    "chaos.host.sensor.temperature",
                    ReadingValue::Float(f64::NAN),
                    "sensor",
                    "CPU",
                ),
                reading(
                    "chaos.host.sensor.temperature",
                    ReadingValue::Float(f64::INFINITY),
                    "sensor",
                    "GPU",
                ),
            ],
        })
        .unwrap();
    provider.force_flush().unwrap();
    assert!(points(&exporter, "chaos.host.sensor.temperature", "Cel").is_empty());
    assert_eq!(
        points(&exporter, "chaos.host.temperature.available", "1")[0].0,
        0.0
    );
    provider.shutdown().unwrap();
}

/// A sensor or interface removed on the next poll must disappear from exports.
#[test]
fn replaces_old_values_and_retracts_disconnected_devices() {
    let (provider, exporter) = exporter();
    let recorder = SnapshotRecorder::new(&provider);
    recorder
        .publish(HardwareSnapshot {
            readings: vec![
                reading(
                    "chaos.host.cpu.usage",
                    ReadingValue::Float(10.0),
                    "cpu",
                    "average",
                ),
                reading(
                    "chaos.host.sensor.temperature",
                    ReadingValue::Float(62.5),
                    "sensor",
                    "CPU",
                ),
                reading(
                    "chaos.host.network.bytes_since_previous_sample",
                    ReadingValue::Integer(4096),
                    "interface",
                    "en0",
                ),
            ],
        })
        .unwrap();
    provider.force_flush().unwrap();
    assert_eq!(
        points(&exporter, "chaos.host.sensor.temperature", "Cel")[0].0,
        62.5
    );
    recorder
        .publish(HardwareSnapshot {
            readings: vec![reading(
                "chaos.host.cpu.usage",
                ReadingValue::Float(75.0),
                "cpu",
                "average",
            )],
        })
        .unwrap();
    provider.force_flush().unwrap();
    assert_eq!(points(&exporter, "chaos.host.cpu.usage", "%")[0].0, 75.0);
    assert!(points(&exporter, "chaos.host.sensor.temperature", "Cel").is_empty());
    assert!(points(
        &exporter,
        "chaos.host.network.bytes_since_previous_sample",
        "By"
    )
    .is_empty());
    assert_eq!(
        points(&exporter, "chaos.host.temperature.available", "1")[0].0,
        0.0
    );
    provider.shutdown().unwrap();
}

/// CPU deltas must not be collected faster than sysinfo's supported minimum.
#[tokio::test]
async fn rejects_interval_below_cpu_minimum() {
    let (_stop, receiver) = watch::channel(false);
    let result = sample_performance(
        SdkMeterProvider::default(),
        receiver,
        sysinfo::MINIMUM_CPU_UPDATE_INTERVAL / 2,
    )
    .await;
    assert!(result.is_err());
}

/// A fresh sampler must wait for the baseline interval instead of reporting zeros.
#[tokio::test]
async fn waits_for_cpu_warmup_before_polling() {
    use std::sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    };
    let (provider, exporter) = exporter();
    let recorder = SnapshotRecorder::new(&provider);
    let calls = Arc::new(AtomicUsize::new(0));
    let polled = calls.clone();
    let (stop, receiver) = watch::channel(false);
    let task = tokio::spawn(run_sampling(
        recorder,
        receiver,
        Duration::from_secs(1),
        move || {
            polled.fetch_add(1, Ordering::SeqCst);
            Ok(HardwareSnapshot::default())
        },
    ));
    tokio::task::yield_now().await;
    provider.force_flush().unwrap();
    assert_eq!(calls.load(Ordering::SeqCst), 0);
    assert!(points(&exporter, "chaos.host.cpu.usage", "%").is_empty());
    stop.send(true).unwrap();
    tokio::time::timeout(Duration::from_secs(1), task)
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    provider.shutdown().unwrap();
}

/// Multiple polls must export fresh values, and a false stop update must not stop them.
#[tokio::test]
async fn polls_continuously_and_exports_updated_values() {
    let (provider, exporter) = exporter();
    let recorder = SnapshotRecorder::new(&provider);
    let (stop, receiver) = watch::channel(false);
    let (ticks, mut observed) = tokio::sync::mpsc::unbounded_channel();
    let mut sequence = 0;
    let task = tokio::spawn(run_sampling(
        recorder,
        receiver,
        sysinfo::MINIMUM_CPU_UPDATE_INTERVAL,
        move || {
            sequence += 1;
            ticks.send(sequence).unwrap();
            Ok(HardwareSnapshot {
                readings: vec![reading(
                    "chaos.host.cpu.usage",
                    ReadingValue::Float(sequence as f64 * 10.0),
                    "cpu",
                    "average",
                )],
            })
        },
    ));
    assert_eq!(
        tokio::time::timeout(Duration::from_secs(2), observed.recv())
            .await
            .unwrap(),
        Some(1)
    );
    provider.force_flush().unwrap();
    assert_eq!(points(&exporter, "chaos.host.cpu.usage", "%")[0].0, 10.0);
    stop.send(false).unwrap();
    assert_eq!(
        tokio::time::timeout(Duration::from_secs(2), observed.recv())
            .await
            .unwrap(),
        Some(2)
    );
    provider.force_flush().unwrap();
    assert_eq!(points(&exporter, "chaos.host.cpu.usage", "%")[0].0, 20.0);
    stop.send(true).unwrap();
    tokio::time::timeout(Duration::from_secs(1), task)
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    assert!(observed.recv().await.is_none());
    provider.shutdown().unwrap();
}

/// Closing the shutdown channel must stop polling even without a true message.
#[tokio::test]
async fn closed_shutdown_channel_stops_sampling() {
    let (provider, _) = exporter();
    let recorder = SnapshotRecorder::new(&provider);
    let (stop, receiver) = watch::channel(false);
    drop(stop);
    tokio::time::timeout(
        Duration::from_millis(100),
        run_sampling(recorder, receiver, Duration::from_secs(1), || {
            panic!("closed sampler must never poll hardware")
        }),
    )
    .await
    .unwrap()
    .unwrap();
    provider.shutdown().unwrap();
}

/// A failed hardware source must return a useful error, not silently keep old data.
#[tokio::test]
async fn propagates_hardware_poll_failures() {
    let (provider, _) = exporter();
    let recorder = SnapshotRecorder::new(&provider);
    let (_stop, receiver) = watch::channel(false);
    let result = tokio::time::timeout(
        Duration::from_secs(2),
        run_sampling(
            recorder,
            receiver,
            sysinfo::MINIMUM_CPU_UPDATE_INTERVAL,
            || anyhow::bail!("hardware read failed"),
        ),
    )
    .await
    .unwrap();
    assert_eq!(result.unwrap_err().to_string(), "hardware read failed");
    provider.shutdown().unwrap();
}
