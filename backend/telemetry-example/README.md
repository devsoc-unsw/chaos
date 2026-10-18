# Rust OpenTelemetry terminal example

Run from the repository root:

```sh
RUST_LOG=chaos_telemetry_example=debug cargo run --manifest-path backend/telemetry-example/Cargo.toml
```

This standalone program uses real OpenTelemetry spans and simulated application
work, plus real host/process performance metrics. It needs no `.env`, database,
SpiceDB, collector, or Docker. It runs two requests (one succeeds, one intentionally
fails a permission check), collects five performance samples at one-second
intervals, and exits. The permission failure is expected, so the program still
exits successfully.

## Where to see the output

Watch the terminal where you run the command. `RUST_LOG` is set explicitly above
so an existing shell setting cannot hide the example's spans. There are three outputs:

- **Structured logs**: `INFO`, `DEBUG`, `WARN`, and `ERROR` lines with source file,
  line number, the active span, IDs, roles, and error messages.
- **OpenTelemetry span exports**: blocks containing `TraceId`, `SpanId`,
  `ParentSpanId`, span names, start/end timestamps, attributes, events, and status.
  These appear when each span finishes. Child spans and their request share a
  trace ID; each request gets its own trace ID.
- **OpenTelemetry metric exports**: `Metrics` blocks with instrument names, units,
  gauge values, and attributes. A `Performance sample recorded` log summarizes
  each sample. Metrics are independent of the tracing log-level filter.

## Performance monitoring

`src/performance.rs` reads the operating system with `sysinfo`, records real
OpenTelemetry gauges, and flushes them through a metric exporter after each
sample. It runs on a blocking worker independently of the async application work.
CPU measurements use differences between readings, so the first sample follows
a warm-up interval rather than reporting an uninitialized CPU reading.

| Metric | Meaning |
| --- | --- |
| `demo.host.cpu.usage` | Average and per-logical-CPU usage in percent |
| `demo.host.cpu.frequency` | Per-CPU MHz, when reported by the OS |
| `demo.host.memory` | Used, available, and total RAM in bytes |
| `demo.host.swap` | Used and total swap in bytes |
| `demo.host.load_average` | 1-, 5-, and 15-minute load; these are not percentages |
| `demo.process.cpu.usage` | This demo process's CPU percentage; can exceed 100% across cores |
| `demo.process.memory` | This demo process's resident and virtual memory in bytes |
| `demo.host.disk.space` | Available and total capacity per mounted filesystem |
| `demo.host.network.bytes_since_previous_sample` | Received/transmitted bytes per interface during the sampling interval |
| `demo.host.sensor.temperature` | Celsius per readable hardware sensor |
| `demo.host.temperature.available` | 1 when at least one sensor is readable; otherwise 0 |

These `demo.*` names are custom learning instruments, not a claim of compliance
with OpenTelemetry's standard system metric conventions. Divide byte values by
1,048,576 for MiB or 1,073,741,824 for GiB. Virtual memory is address space, not
physical RAM consumed. Disk mounts may share storage; do not sum their capacities.
Network values are interval byte counts, not cumulative counters or bytes/second.

Hardware sensor access varies by OS and hardware. If unavailable, the demo emits
a warning and availability=0, and omits temperature readings. Sensor labels can
refer to components other than the CPU. Frequency and other OS measurements also
depend on platform support. The tested Mac exposed CPU/RAM metrics but no readable
temperature sensors.

Run longer to observe changes while other work is running:

```sh
RUST_LOG=chaos_telemetry_example=debug DEMO_SAMPLES=60 DEMO_INTERVAL_MS=1000 cargo run --manifest-path backend/telemetry-example/Cargo.toml
```

`DEMO_SAMPLES` must be positive. `DEMO_INTERVAL_MS` must be at least
`sysinfo::MINIMUM_CPU_UPDATE_INTERVAL`; invalid settings return an error. Sampling
and export work add some time to each interval. The program waits for all samples
and shuts down both providers before exiting.

Run natively to monitor your Mac. In Docker Desktop these readings concern the
container/Linux VM environment. Only the current demo process is sampled, not a
separately running Chaos backend. Host metrics are sampled across time; they do
not attribute CPU or memory usage to an individual request span.

The successful request contains `check_permission` and `load_roles` child spans.
The denied request contains an error event and an `Error` span status. The role
lookup is deliberately skipped after permission denial. Lookup and permission
checks sleep briefly to make elapsed time visible.

To save both streams and watch them at the same time:

```sh
RUST_LOG=chaos_telemetry_example=debug cargo run --manifest-path backend/telemetry-example/Cargo.toml 2>&1 | tee /tmp/chaos-telemetry.log
```

To change verbosity:

```sh
RUST_LOG=chaos_telemetry_example=trace cargo run --manifest-path backend/telemetry-example/Cargo.toml
RUST_LOG=chaos_telemetry_example=info cargo run --manifest-path backend/telemetry-example/Cargo.toml
```

The filter controls both layers: filtered events and spans will not be exported.
`trace` shows all instrumentation this example emits; it does not automatically
capture every variable or function in Rust.

See [SAMPLE_OUTPUT.txt](SAMPLE_OUTPUT.txt) for a captured successful run, including
the intentionally denied request. Timestamps, trace IDs, and span IDs change on
each run.

## What to copy into the existing backend

Read `src/main.rs` in this example:

1. `init_telemetry()` installs a subscriber once at startup. In the real server,
   call it after loading `.env` and before `models::app::app().await`. Keep the
   provider alive, and shut it down after the server and background tasks stop.
2. `#[tracing::instrument(skip_all, fields(...))]` creates a span for an async
   function and records only the fields you choose. The macro correctly handles
   async execution; do not hold a `span.enter()` guard across `.await`.
3. `tracing::debug!(roles = ?roles, ...)` prints Debug data. `%error` and `%trace_id`
   use Display. Select fields explicitly rather than logging credentials or
   complete authenticated requests. IDs are strings, preserving large IDs.
4. `Span::current().record(...)` adds a result to a field declared on a span.
   Setting `otel.status_code` to `ERROR` makes a failed span visible to exporters.

For Axum HTTP request spans in `backend/server/src/models/app.rs`, enable
`tower-http`'s `trace` feature and add
`.layer(tower_http::trace::TraceLayer::new_for_http())` to the router. Instrument
handlers and service functions to create nested spans. That layer does not
automatically propagate trace context from other services; distributed tracing
also needs incoming context extraction and outgoing context injection.

This example prints logs using the formatting layer and exports traces and metrics
through separate OpenTelemetry providers. It does not export standalone
OpenTelemetry logs. A graphical trace viewer also
needs an OTLP exporter and a telemetry backend; this demo's viewer is the terminal.
The stdout exporters produce human-readable output, not JSON. Renaming captured
output to `.json` would not convert it. To deploy this monitoring, use batched OTLP
export and usually a Collector hostmetrics receiver for machine-level metrics;
avoid collecting the same host metrics once per backend replica.

References:

- [Rust OpenTelemetry](https://opentelemetry.io/docs/languages/rust/)
- [Tracing/OpenTelemetry bridge and version compatibility](https://docs.rs/crate/tracing-opentelemetry/0.33.0)
- [Stdout exporter](https://docs.rs/opentelemetry-stdout/0.32.0/opentelemetry_stdout/)
- [OS sampling APIs](https://docs.rs/sysinfo/0.38.4/sysinfo/)

The stdout exporter is intended for learning/debugging. The example deliberately
uses a simple exporter to show spans immediately; deployed services normally use
batched OTLP export instead.
