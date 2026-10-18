use std::{thread, time::Duration};

use anyhow::Result;
use opentelemetry::{metrics::MeterProvider as _, KeyValue};
use opentelemetry_sdk::metrics::SdkMeterProvider;
use sysinfo::{Components, Disks, Networks, ProcessesToUpdate, System};

/// Samples the host and this process at the given interval and exports each sample.
/// CPU measurements are primed before the first interval. Missing sensors are
/// reported as unavailable, never as zero-degree temperatures.
pub fn sample_performance(
    provider: SdkMeterProvider,
    samples: usize,
    interval: Duration,
) -> Result<()> {
    anyhow::ensure!(
        sysinfo::IS_SUPPORTED_SYSTEM,
        "sysinfo does not support this OS"
    );
    let meter = provider.meter("chaos-performance-example");
    let cpu = meter
        .f64_gauge("demo.host.cpu.usage")
        .with_unit("%")
        .with_description("Host average or per-logical-CPU utilization")
        .build();
    let frequency = meter
        .u64_gauge("demo.host.cpu.frequency")
        .with_unit("MHz")
        .build();
    let memory = meter.u64_gauge("demo.host.memory").with_unit("By").build();
    let swap = meter.u64_gauge("demo.host.swap").with_unit("By").build();
    let load = meter
        .f64_gauge("demo.host.load_average")
        .with_unit("1")
        .build();
    let process_cpu = meter
        .f64_gauge("demo.process.cpu.usage")
        .with_unit("%")
        .with_description("Current process CPU usage; may exceed 100% across cores")
        .build();
    let process_memory = meter
        .u64_gauge("demo.process.memory")
        .with_unit("By")
        .build();
    let disk = meter
        .u64_gauge("demo.host.disk.space")
        .with_unit("By")
        .build();
    let network = meter
        .u64_gauge("demo.host.network.bytes_since_previous_sample")
        .with_unit("By")
        .with_description("Bytes transferred per interface during the sampling interval")
        .build();
    let temperature = meter
        .f64_gauge("demo.host.sensor.temperature")
        .with_unit("Cel")
        .build();
    let temperature_available = meter
        .u64_gauge("demo.host.temperature.available")
        .with_unit("1")
        .with_description("1 if at least one valid temperature sensor is readable, otherwise 0")
        .build();

    let pid = sysinfo::get_current_pid().map_err(anyhow::Error::msg)?;
    let mut system = System::new();
    system.refresh_cpu_all();
    system.refresh_processes(ProcessesToUpdate::Some(&[pid]), true);
    let mut components = Components::new_with_refreshed_list();
    let mut disks = Disks::new_with_refreshed_list();
    let mut networks = Networks::new_with_refreshed_list();
    tracing::info!(
        samples,
        interval_ms = interval.as_millis() as u64,
        "Sampling real host/process performance; first CPU reading follows a warm-up interval"
    );

    for sample in 1..=samples {
        thread::sleep(interval);
        system.refresh_cpu_all();
        system.refresh_memory();
        system.refresh_processes(ProcessesToUpdate::Some(&[pid]), true);
        components.refresh(true);
        disks.refresh(true);
        networks.refresh(true);

        cpu.record(
            system.global_cpu_usage() as f64,
            &[KeyValue::new("cpu", "average")],
        );
        for (index, core) in system.cpus().iter().enumerate() {
            let attributes = [KeyValue::new("cpu", index.to_string())];
            cpu.record(core.cpu_usage() as f64, &attributes);
            // Some platforms cannot report frequency; omit unknown values.
            if core.frequency() > 0 {
                frequency.record(core.frequency(), &attributes);
            }
        }
        for (state, value) in [
            ("used", system.used_memory()),
            ("available", system.available_memory()),
            ("total", system.total_memory()),
        ] {
            memory.record(value, &[KeyValue::new("state", state)]);
        }
        for (state, value) in [("used", system.used_swap()), ("total", system.total_swap())] {
            swap.record(value, &[KeyValue::new("state", state)]);
        }
        let averages = System::load_average();
        for (window, value) in [
            ("1m", averages.one),
            ("5m", averages.five),
            ("15m", averages.fifteen),
        ] {
            load.record(value, &[KeyValue::new("window", window)]);
        }
        if let Some(process) = system.process(pid) {
            process_cpu.record(process.cpu_usage() as f64, &[]);
            process_memory.record(process.memory(), &[KeyValue::new("kind", "resident")]);
            process_memory.record(
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
                disk.record(
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
                network.record(
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
                temperature.record(
                    value as f64,
                    &[KeyValue::new("sensor", component.label().to_owned())],
                );
                sensor_count += 1;
            }
        }
        temperature_available.record(u64::from(sensor_count > 0), &[]);
        if sample == 1 && sensor_count == 0 {
            tracing::warn!("Temperature sensors unavailable on this OS/hardware; no temperature value will be fabricated");
        }
        tracing::info!(
            sample,
            host_cpu_percent = system.global_cpu_usage(),
            host_memory_used_bytes = system.used_memory(),
            temperature_sensors = sensor_count,
            "Performance sample recorded"
        );
        provider.force_flush()?;
    }
    Ok(())
}
