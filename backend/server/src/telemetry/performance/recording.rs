//! Converts the latest hardware snapshot into observable OpenTelemetry gauges.
use anyhow::Result;
use opentelemetry::{
    metrics::{MeterProvider as _, ObservableGauge},
    KeyValue,
};
use opentelemetry_sdk::metrics::SdkMeterProvider;
use std::sync::{Arc, RwLock};

/// Numeric value reported by an operating system sample.
#[derive(Clone)]
pub(super) enum ReadingValue {
    /// Floating-point utilization, load, or temperature.
    Float(f64),
    /// Integral bytes or frequency.
    Integer(u64),
}

/// One measured quantity and its bounded identifying attributes.
#[derive(Clone)]
pub(super) struct Reading {
    /// Instrument name.
    pub name: &'static str,
    /// OS measurement value.
    pub value: ReadingValue,
    /// CPU, mount, interface, sensor, or state identifiers.
    pub attributes: Vec<KeyValue>,
}

/// All current readings, replaced together after each successful hardware poll.
#[derive(Clone, Default)]
pub(super) struct HardwareSnapshot {
    /// Quantities collected in this poll; unavailable quantities are omitted.
    pub readings: Vec<Reading>,
}

/// Owns the current hardware snapshot for metric callbacks.
pub(super) struct SnapshotRecorder {
    /// Latest snapshot; None while CPU baselines are warming up.
    latest: Arc<RwLock<Option<HardwareSnapshot>>>,
    /// Keep floating-point observable instruments alive for the provider lifetime.
    _floats: Vec<ObservableGauge<f64>>,
    /// Keep integral observable instruments alive for the provider lifetime.
    _integers: Vec<ObservableGauge<u64>>,
}

impl SnapshotRecorder {
    /// Creates the metric recorder for a server provider.
    pub fn new(provider: &SdkMeterProvider) -> Self {
        let latest: Arc<RwLock<Option<HardwareSnapshot>>> = Arc::new(RwLock::new(None));
        let meter = provider.meter("chaos-server-performance");
        let mut floats = Vec::new();
        let mut integers = Vec::new();
        for (name, unit) in [
            ("chaos.host.cpu.usage", "%"),
            ("chaos.host.load_average", "1"),
            ("chaos.process.cpu.usage", "%"),
            ("chaos.host.sensor.temperature", "Cel"),
        ] {
            let current = latest.clone();
            floats.push(
                meter
                    .f64_observable_gauge(name)
                    .with_unit(unit)
                    .with_callback(move |observer| {
                        let Ok(guard) = current.read() else {
                            return;
                        };
                        let Some(snapshot) = guard.as_ref() else {
                            return;
                        };
                        for reading in &snapshot.readings {
                            if reading.name == name {
                                if let ReadingValue::Float(value) = reading.value {
                                    if value.is_finite() {
                                        observer.observe(value, &reading.attributes);
                                    }
                                }
                            }
                        }
                    })
                    .build(),
            );
        }
        for (name, unit) in [
            ("chaos.host.cpu.frequency", "MHz"),
            ("chaos.host.memory", "By"),
            ("chaos.host.swap", "By"),
            ("chaos.process.memory", "By"),
            ("chaos.host.disk.space", "By"),
            ("chaos.host.network.bytes_since_previous_sample", "By"),
            ("chaos.host.temperature.available", "1"),
        ] {
            let current = latest.clone();
            integers.push(
                meter
                    .u64_observable_gauge(name)
                    .with_unit(unit)
                    .with_callback(move |observer| {
                        let Ok(guard) = current.read() else {
                            return;
                        };
                        let Some(snapshot) = guard.as_ref() else {
                            return;
                        };
                        if name == "chaos.host.temperature.available" {
                            observer.observe(u64::from(snapshot.temperature_count() > 0), &[]);
                            return;
                        }
                        for reading in &snapshot.readings {
                            if reading.name == name {
                                if let ReadingValue::Integer(value) = reading.value {
                                    observer.observe(value, &reading.attributes);
                                }
                            }
                        }
                    })
                    .build(),
            );
        }
        Self {
            latest,
            _floats: floats,
            _integers: integers,
        }
    }

    /// Replaces all measurements together, rather than retaining vanished sensors.
    pub fn publish(&self, snapshot: HardwareSnapshot) -> Result<()> {
        *self
            .latest
            .write()
            .map_err(|_| anyhow::anyhow!("hardware snapshot lock poisoned"))? = Some(snapshot);
        Ok(())
    }
}

impl HardwareSnapshot {
    /// Appends a floating-point OS measurement with identifying attributes.
    pub fn float(&mut self, name: &'static str, value: f64, attributes: &[KeyValue]) {
        self.readings.push(Reading {
            name,
            value: ReadingValue::Float(value),
            attributes: attributes.to_vec(),
        });
    }
    /// Appends an integral OS measurement without converting byte units.
    pub fn integer(&mut self, name: &'static str, value: u64, attributes: &[KeyValue]) {
        self.readings.push(Reading {
            name,
            value: ReadingValue::Integer(value),
            attributes: attributes.to_vec(),
        });
    }
    /// Counts finite temperature observations in the current snapshot only.
    pub fn temperature_count(&self) -> usize {
        self.readings
            .iter()
            .filter(|reading| {
                reading.name == "chaos.host.sensor.temperature"
                    && matches!(reading.value, ReadingValue::Float(value) if value.is_finite())
            })
            .count()
    }
}
