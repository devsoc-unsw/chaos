use anyhow::Result;
use opentelemetry::KeyValue;
use opentelemetry_sdk::metrics::SdkMeterProvider;
use std::time::Duration;
use sysinfo::{Components, Disks, Networks, ProcessesToUpdate, System};
use tokio::sync::watch;

mod recording;
use recording::{HardwareSnapshot, SnapshotRecorder};

/// Validates that CPU sampling has enough time between baseline and refresh.
fn validate_interval(interval: Duration) -> Result<()> {
    anyhow::ensure!(
        interval >= sysinfo::MINIMUM_CPU_UPDATE_INTERVAL,
        "hardware sampling interval must be at least {} ms",
        sysinfo::MINIMUM_CPU_UPDATE_INTERVAL.as_millis()
    );
    Ok(())
}

/// Continuously samples the host and server process until shutdown is requested.
/// CPU is primed before the first interval; unavailable sensors are omitted.
pub async fn sample_performance(
    provider: SdkMeterProvider,
    stop: watch::Receiver<bool>,
    interval: Duration,
) -> Result<()> {
    validate_interval(interval)?;
    if *stop.borrow() {
        return Ok(());
    }
    anyhow::ensure!(
        sysinfo::IS_SUPPORTED_SYSTEM,
        "sysinfo does not support this OS"
    );
    let recorder = SnapshotRecorder::new(&provider);
    let pid = sysinfo::get_current_pid().map_err(anyhow::Error::msg)?;
    let mut system = System::new();
    system.refresh_cpu_all();
    system.refresh_processes(ProcessesToUpdate::Some(&[pid]), true);
    let mut components = Components::new_with_refreshed_list();
    let mut disks = Disks::new_with_refreshed_list();
    let mut networks = Networks::new_with_refreshed_list();
    tracing::info!(
        interval_ms = interval.as_millis() as u64,
        "Sampling real host/process performance; first CPU reading follows a warm-up interval"
    );

    let mut warned_temperature = false;
    run_sampling(recorder, stop, interval, move || {
        let mut snapshot = HardwareSnapshot::default();
        system.refresh_cpu_all();
        system.refresh_memory();
        system.refresh_processes(ProcessesToUpdate::Some(&[pid]), true);
        components.refresh(true);
        disks.refresh(true);
        networks.refresh(true);

        snapshot.float("chaos.host.cpu.usage",
            system.global_cpu_usage() as f64,
            &[KeyValue::new("cpu", "average")],
        );
        for (index, core) in system.cpus().iter().enumerate() {
            let attributes = [KeyValue::new("cpu", index.to_string())];
            snapshot.float("chaos.host.cpu.usage", core.cpu_usage() as f64, &attributes);
            // Some platforms cannot report frequency; omit unknown values.
            if core.frequency() > 0 {
                snapshot.integer("chaos.host.cpu.frequency", core.frequency(), &attributes);
            }
        }
        for (state, value) in [
            ("used", system.used_memory()),
            ("available", system.available_memory()),
            ("total", system.total_memory()),
        ] {
            snapshot.integer("chaos.host.memory", value, &[KeyValue::new("state", state)]);
        }
        for (state, value) in [("used", system.used_swap()), ("total", system.total_swap())] {
            snapshot.integer("chaos.host.swap", value, &[KeyValue::new("state", state)]);
        }
        let averages = System::load_average();
        for (window, value) in [
            ("1m", averages.one),
            ("5m", averages.five),
            ("15m", averages.fifteen),
        ] {
            snapshot.float("chaos.host.load_average", value, &[KeyValue::new("window", window)]);
        }
        if let Some(process) = system.process(pid) {
            snapshot.float("chaos.process.cpu.usage", process.cpu_usage() as f64, &[]);
            snapshot.integer("chaos.process.memory", process.memory(), &[KeyValue::new("kind", "resident")]);
            snapshot.integer("chaos.process.memory",
                process.virtual_memory(),
                &[KeyValue::new("kind", "virtual")],
            );
        }
        for entry in &disks {
            let mount = entry.mount_point().to_string_lossy().into_owned();
            for (state, value) in [
                ("available", entry.available_space()),
                ("total", entry.total_space()),
            ] {
                snapshot.integer("chaos.host.disk.space",
                    value,
                    &[
                        KeyValue::new("mount", mount.clone()),
                        KeyValue::new("state", state),
                    ],
                );
            }
        }
        for (name, entry) in &networks {
            for (direction, value) in [
                ("receive", entry.received()),
                ("transmit", entry.transmitted()),
            ] {
                snapshot.integer("chaos.host.network.bytes_since_previous_sample",
                    value,
                    &[
                        KeyValue::new("interface", name.clone()),
                        KeyValue::new("direction", direction),
                    ],
                );
            }
        }
        let mut sensor_count = 0;
        for component in &components {
            if let Some(value) = component.temperature().filter(|value| value.is_finite()) {
                snapshot.float("chaos.host.sensor.temperature",
                    value as f64,
                    &[KeyValue::new("sensor", component.label().to_owned())],
                );
                sensor_count += 1;
            }
        }
        if !warned_temperature && sensor_count == 0 {
            warned_temperature = true;
            tracing::warn!("Temperature sensors unavailable on this OS/hardware; no temperature value will be fabricated");
        }
        tracing::info!(
            host_cpu_percent = system.global_cpu_usage(),
            host_memory_used_bytes = system.used_memory(),
            temperature_sensors = sensor_count,
            "Performance sample recorded"
        );
        Ok(snapshot)
    }).await
}

/// Polls a hardware source at the given interval, publishing complete snapshots.
/// False stop updates leave sampling active; true or channel closure stops it.
async fn run_sampling<F>(
    recorder: SnapshotRecorder,
    mut stop: watch::Receiver<bool>,
    interval: Duration,
    mut poll: F,
) -> Result<()>
where
    F: FnMut() -> Result<HardwareSnapshot>,
{
    validate_interval(interval)?;
    loop {
        if *stop.borrow() {
            break;
        }
        tokio::select! {
            biased;
            changed = stop.changed() => {
                if changed.is_err() || *stop.borrow_and_update() { break; }
                continue;
            }
            _ = tokio::time::sleep(interval) => {}
        }
        if *stop.borrow() {
            break;
        }
        recorder.publish(poll()?)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests;
