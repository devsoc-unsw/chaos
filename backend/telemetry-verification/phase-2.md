# Phase 2 — optional remote export

Date: 18 October 2026 (Australia/Sydney).
Implementer: Codex `/root`. Independent reviewer: pending.
Status: **implementation ready for review; acceptance pending**.

The user explicitly requested phase 2 after the phase 1 finding was fixed.
Phase 1's independent acceptance is still pending; this report does not close
either independent gate. No later phase was implemented or accepted.

## Snapshot and baseline

Starting revision: `b85c360d67ee4f3e80ea1551a5337bbd364e3500` plus the existing
uncommitted working tree recorded in [baseline.md](baseline.md) and the phase 1
fix recorded in [phase-1.md](phase-1.md).

Before phase 2 edits, `cargo test --locked --offline --lib --bins` from
`backend/server` exited 0: 24 tests passed in each target, 48 executions total.
The baseline used cached compilation; fresh SQLx compilation needs local Postgres.
Existing application, SpiceDB, documentation, and demo edits were preserved.

Phase 2 source scope:

- `server/src/telemetry/providers.rs`: exporter construction, provider ownership,
  rollback, shutdown, and diagnostic filtering.
- `server/src/telemetry/providers/tests.rs`: ten provider/lifecycle tests.
- `server/src/telemetry/mod.rs`: optional log bridge and provider ownership.
- `server/Cargo.toml` and `server/Cargo.lock`: compatible log bridge, logs features,
  TLS support, and internal diagnostics.
- This report and the plan's implementation/verification status.

Phase 1's `config.rs`, hardware sampling code, HTTP middleware behavior, and
application/database logic were not changed.

SHA-256 of the final source snapshot:

```text
fb4c5d6dab8b8f124a6307ee47b7a3c0f5f9344e8e1c6a2406917c8d9fa4a7ce  telemetry/mod.rs
3efae323e5b8f1c172fde827de14d81dc1a7266ba79139902ed27c8cf726e0ba  telemetry/providers.rs
62d0baa9e8f959c4cff454e767878d72ed0ad513fae426404c489c0f85a63325  telemetry/providers/tests.rs
9c3bc956eccee4eb908b6537b115a8576859b43f77b99e03a9b90c41e658221b  Cargo.toml
7c1e5227c95e5531cbb0ad9597f926b2557d74ea343f5b4c733ff523a03a3b97  Cargo.lock
```

## Implemented behavior

| Configuration | Traces | Metrics | Logs |
| --- | --- | --- | --- |
| Main endpoint missing/blank | Existing stdout exporter | Existing stdout exporter | JSON stderr only; no logger provider or remote exporter |
| Valid main endpoint | OTLP gRPC | OTLP gRPC | OTLP gRPC LogRecords plus existing JSON stderr |

All remote builders receive the same validated, trimmed main endpoint explicitly.
The main endpoint alone selects local versus remote mode. Signal-specific endpoint
variables cannot enable remote construction when the main setting is disabled.
There is no additional local LogRecord exporter, avoiding a second local log copy.
Stdout span/metric exports remain distinct from JSON log events.

All providers receive the existing resource metadata. The production trace sampler
configuration and hardware/metric interval behavior are retained. Remote channels
are lazy: exporter construction does not wait for collector connectivity. HTTP and
HTTPS exporter construction is tested; HTTPS explicitly enables platform trust
roots. Successful TLS handshakes are not claimed here.

OTLP requests have a programmatic three-second timeout. Trace/log batches have
queues of 2048 records and a maximum batch of 512. Experimental gRPC retry support
is not enabled; failed exports may drop data and subsequent periodic batches can
try again. Each provider shutdown is called with a five-second timeout (the locked
metric reader itself uses a fixed five-second shutdown wait). Collector outage,
retry/recovery behavior, and shutdown bounds with real requests still need phase 5.

Every remote exporter is built before starting SDK provider workers. A later
exporter construction failure explicitly shuts down earlier exporters. Providers
also have a Drop cleanup path, so a failed subscriber installation shuts down the
SDK even if layers temporarily retain clones. The sampler is started only after
subscriber installation. Explicit shutdown attempts all three signals before
returning an error, including when sampling or one provider fails; log-provider
shutdown flushes pending records.

## Dependency compatibility and diagnostic policy

`cargo tree --locked --offline -i opentelemetry` exited 0 and shows a single API
version, `opentelemetry 0.32.0`, shared by:

- `opentelemetry-appender-tracing 0.32.0`;
- `opentelemetry_sdk 0.32.1`;
- `opentelemetry-otlp`, `opentelemetry-proto`, and `opentelemetry-stdout 0.32.0`;
- `tracing-opentelemetry 0.33.0` and the server.

The bridge's downloaded Cargo manifest explicitly requires API `0.32` with logs;
the SDK/exporter signatures and lifecycle behavior were inspected in the matching
local crate sources. Version numbers were not assumed interchangeable.

The initial offline dependency resolution was BLOCKED because
`rustls-native-certs` was absent from the cache. `cargo fetch` with network access
resolved the prerequisite and exited 0. Native TLS roots add `rustls-native-certs`,
`openssl-probe 0.2.1`, `core-foundation 0.10.1`, and `security-framework 3.7.0`.
That security-framework release requires bitflags >=2.11 and
security-framework-sys >=2.17, accounting for the lockfile updates from
bitflags 2.10.0 to 2.13.2 and security-framework-sys 2.15.0 to 2.17.0. Existing
OpenTelemetry versions remain locked.

The remote log and tracing layers exclude SDK targets beginning with
`opentelemetry`, plus `h2`, `hyper`, `hyper_util`, `tonic::transport`, and
`tower::buffer` targets and their module descendants. Shared transport diagnostics
can run outside the SDK's thread-local telemetry suppression scope, so they must
not generate more records on the same exporter transport. They remain eligible
for local JSON output. Default legacy filtering now includes WARN/ERROR diagnostics;
an explicitly configured RUST_LOG still controls the interim filter until phase 3.

These shared low-level transport targets also stay local when emitted by other
clients. Application-owned outbound spans and other dependency targets remain
eligible. Phase 4 must account for this policy when verifying actual dependency
instrumentation; this is not a claim that every dependency event is exported.

## Red → green evidence

Commands run from `backend/server`. Fresh SQLx compilation/test commands were
allowed local Postgres access; no environment contents were printed.

| Command/check | Exit | Observed result |
| --- | --- | --- |
| Initial red: `cargo test --locked --offline --lib telemetry::providers::tests` | 101 | New construction/cleanup tests failed to compile before the provider module existed. This is compile-red, not a failing runtime assertion. |
| Diagnostic regression, `cargo test --locked --offline --lib --bins` | 101 | A transport diagnostic created an unwanted second remote LogRecord. Added `hyper_util` to the remote exclusion policy. |
| Green: `cargo test --locked --offline --lib --bins` | 0 | 34 tests passed per target, 68 executions: eight parser, ten provider/lifecycle, and 16 existing HTTP/hardware tests per target. |
| `cargo build --locked --offline` | 0 | Production build passed; existing warnings remain. |
| `cargo fmt --all -- --check` | 0 | Formatting passed. |
| `git diff --check` | 0 | No whitespace errors in tracked changes. |
| `cargo test --locked --offline` | 101 | Both unit targets pass; generated-code doctests: 40 failed, 1 ignored, matching the earlier review result. The full suite is not green. |
| `cargo tree --locked --offline -i opentelemetry` | 0 | One compatible OpenTelemetry API family, as recorded above. |

During test development, a synchronous test exporter could not route a diagnostic
back through the same active tracing callback. The final diagnostic fixture uses
an actual SDK batch worker with an isolated subscriber installed there; the test
observes local diagnostic output and exactly one failed application-record export.

The final assertion for exactly one local JSON event was added after the full
suite command; the affected unit targets were rerun and pass. Production source
was unchanged after the successful production build and full-suite run.

## Expected versus observed test coverage

| Test | Observed evidence |
| --- | --- |
| `disabled_export_never_constructs_remote_exporters` | Missing/empty/whitespace input never calls any remote factory; no remote log provider. |
| `remote_signals_export_and_share_resource_metadata` | Every factory receives the trimmed endpoint; real SDK providers deliver a span, metrics, and one LogRecord to inspectable in-memory exporters. Log/metric service names are asserted; all providers use the same resource by construction. |
| `construction_failure_shuts_down_preceding_exporters` | Injected failure at each signal cleans up preceding exporters before provider/sampler startup. |
| `dropping_providers_shuts_down_even_with_retained_clones` | Drop invokes all exporter shutdown hooks despite retained provider references. |
| `shutdown_flushes_logs_even_when_metrics_fail` | One pending LogRecord is delivered at shutdown; traces/logs still stop after an injected metric shutdown error. |
| `real_exporters_construct_without_a_collector` | Real HTTP/HTTPS exporters build and shut down without waiting for collector connectivity; no records sent in this construction check. |
| `exporter_failure_diagnostics_stay_local_without_feedback` | Failing exporter emits a diagnostic on its SDK batch worker; local JSON contains it; SDK/transport diagnostics do not generate remote LogRecords or span events. Exactly one application record is attempted. |
| `signal_specific_endpoints_cannot_enable_remote_export` | Isolated child processes set all three signal overrides with main endpoint absent/empty/whitespace; zero remote factory calls. |
| `startup_failure_does_not_leave_a_sampler_running` | Occupied subscriber causes startup failure in local and remote modes; each child runtime exits within ten seconds, without a sampler keeping Tokio open. |
| `local_initialization_and_shutdown_stop_the_sampler` | Real local Telemetry startup/shutdown succeeds for all disabled-input forms despite signal overrides; runtime exits, one JSON log appears on stderr, and no duplicate log appears on stdout. |

Children receive their own explicit environment settings. Tests do not mutate the
parent process environment or install a global subscriber in the shared test runner.
The ten-second child deadline kills and reaps a stuck child before failing.

## Remaining verification

- Independent phase 1 acceptance and phase 2 review are pending. This is the
  implementation agent's evidence, not an independent PASS.
- Actual OTLP protobuf receipt, zero remote traffic in disabled mode, collector
  outages/recovery, TLS handshake behavior, and network shutdown limits remain
  receiver-backed phase 5 checks. Factory/in-memory checks do not replace them.
- LOG_LEVEL filtering, request log correlation, and the complete severity/span
  retention matrix belong to phase 3. The current subscriber still uses RUST_LOG.
- Generated-code doctest failures remain outside this change. No application
  workflow, Sequin/reconciliation, or SpiceDB integration test was run for phase 2.

Sanitized durable evidence is recorded above. Session-local captures are
`/tmp/chaos-phase2-baseline.log`, `/tmp/chaos-phase2-red.log`,
`/tmp/chaos-phase2-diagnostics-red.log`, `/tmp/chaos-phase2-green.log`,
`/tmp/chaos-phase2-build.log`, `/tmp/chaos-phase2-full-test.log`, and
`/tmp/chaos-phase2-dependency-tree.log`. These temporary files are not deliverables.
