# Phase 3 — LOG_LEVEL and structured events

Date: 18 October 2026. Implementer/reviewer: Codex `/root`.
Status: **implementation and self-checks complete; independent acceptance pending**.

## Follow-up review before phase 4

The user requested review, fixes, and a phase 3 commit before phase 4. Self-review
found a correlation defect: an explicitly unparented event inherited the active
request context, and an explicit alternate parent was ignored by the SDK bridge.
`explicit_event_parents_control_log_correlation` failed before the correction.

The official log bridge is now wrapped with event-ancestry handling. Contextual
events retain the active context; explicit roots clear it, and explicit parents
use the locked tracing-opentelemetry public `get_otel_context` API. Scoped guards
restore the previous context, and a weak dispatch reference avoids a subscriber
reference cycle. The wrapper itself remains non-optional because the locked
tracing-subscriber Option layer does not forward dispatch registration.

The regression verifies explicit roots, alternate parents, and restoration at
INFO/WARN/ERROR. Final `cargo test --locked --offline` exited 0: 39 tests pass in
each unit target (78 executions), plus 1 passing and 1 existing ignored doctest.
Capture: `/tmp/chaos-phase3-review-green.log`; red evidence:
`/tmp/chaos-phase3-review-red.log`. Independent acceptance remains pending.
The historical implementation snapshot and results below precede this correction.
The reviewed phase 3 changes were committed as `eaa3676` before phase 4 began.

Reviewed revision: `3512d54` plus the phase 1–2 corrections in
[review-phases-1-2.md](review-phases-1-2.md) and the phase 3 working-tree changes.
The user requested phase 3 continuation after the review, with the prior telemetry
work committed first. That commit exists; the new review fixes/phase 3 changes
have not been committed. Unrelated SpiceDB permission edits were preserved.

## Resulting behavior

`LOG_LEVEL` is the sole backend event control. Missing defaults to INFO; accepted
values are exactly INFO/WARN/ERROR after trimming. INFO intentionally maps to
TRACE verbosity. Invalid/blank settings still fail before telemetry startup.
RUST_LOG is not read by the production subscriber.

| Setting | Local JSON, remote LogRecords, and exported span events |
| --- | --- |
| INFO | TRACE, DEBUG, INFO, WARN, ERROR |
| WARN | WARN, ERROR |
| ERROR | ERROR |

`telemetry/logging.rs` builds independently filtered output layers. Every eligible
span, including dependency DEBUG/TRACE spans, remains enabled independently of the
event threshold. Metrics are unaffected. Exporter-internal/shared transport spans
remain excluded for recursion/privacy reasons; other dependency targets are
eligible without the old `server=info` restriction.

The official tracing-to-OpenTelemetry log bridge remains the single remote log
bridge. The existing tracing-subscriber initialization installs the single legacy
LogTracer bridge. Direct `tracing-log 0.2.0` access, already present transitively,
is now declared for event-time metadata normalization; no package version changed.
Normalization ensures legacy diagnostics cannot bypass target-based policy, and a
logger adapter restores original dependency targets in remote records. The SDK
still supplies severity and current OpenTelemetry trace/span correlation.

SDK/shared transport diagnostics stay local. Their arbitrary fields and message
payloads are replaced by a fixed message plus severity, target, and callsite;
internal span fields are not retained. This prevents endpoint credentials and
transport headers from entering local JSON at INFO's TRACE verbosity. Remote
feedback exclusions continue to apply, including to legacy log events.

## Operational output audit

All first-party runtime `println!` and legacy `log::` call sites found under
handlers, services, and models were converted:

| Location | Result |
| --- | --- |
| `handler/offer.rs` | Development email messages use tracing, with no recipient address; the acceptance message may record the offer ID as a string. |
| `models/organisation.rs` | Development invitation message omits both address and invite code; records organisation ID as a string. The existing return value still supplies the code. |
| `models/transaction.rs` | SpiceDB fallback is a structured WARN with a stable error category. |
| `service/reconcile.rs` | Status/count/error events use tracing; operational ChaosError payloads are replaced by stable categories. The misleading claim that a failed sweep deleted nothing was removed, since deletion can fail partway through chunks. |
| `models/error.rs` | `ChaosError::kind()` supplies stable categories. Request/internal error logs no longer echo arbitrary detailed messages. HTTP response handling and error Display behavior are unchanged. |

`rg` over `server/src`, excluding generated code, finds legacy `log::` usage only
inside the logging-bridge test. No first-party runtime console-output bypass was
deliberately retained. The standalone demo, compiler output, test harness, and SDK
stdout span/metric exporters are separate outputs. They are not backend event logs.

## Red → green evidence

Commands from `backend/server`; SQLx compilation and native certificate tests
were given the same local access as the baseline. No secrets/environment contents
were copied into evidence.

| Check | Exit | Observed result |
| --- | --- | --- |
| Red `cargo test --locked --offline --lib telemetry::logging::tests` after extracting the old production subscriber | 101 | Both new tests failed; the old shared filter failed span retention, and diagnostic/application-target expectations failed. |
| Privacy red `cargo test --locked --offline --lib telemetry::logging::tests::operational_errors_omit_private_messages` | 101 | Detailed error messages containing synthetic private values appeared in log destinations. |
| Legacy diagnostic red `cargo test --locked --offline --lib telemetry::logging::tests::legacy_bridge_and_rust_log_cannot_override_log_level` | 101 | Legacy transport/SDK payloads bypassed redaction. |
| Green `cargo test --locked --offline --lib telemetry::logging::tests` | 0 | All four logging tests passed, including the full matrix and isolated legacy subprocesses. |
| Final `cargo test --locked --offline` | 0 | Both unit targets: 38 passed each (76 executions). Doctests: 1 passed, 1 existing ignored, 0 failed. |
| `cargo build --locked --offline` | 0 | Production binary builds; existing unrelated warnings remain. |
| `cargo fmt --all -- --check` | 0 | Formatting passed. |
| `git diff --check` | 0 | No whitespace errors. |
| `cargo tree --locked --offline -e features -i tracing` | 0 | No max-level/release-max-level feature suppresses DEBUG/TRACE. The test also asserts STATIC_MAX_LEVEL is TRACE. |

The full suite's former 40 doctest failures were fixed without globally disabling
doctests. Three generated files received documentation-only language annotations.
The actual OAuth Rust example now imports the function and uses `no_run` because
its setup requires deployment environment. It remains compile-tested.

## Assertions and practical limits

- The severity test uses the actual Axum request middleware and production
  subscriber builder, isolated JSON/in-memory SDK exporters, and explicit INFO,
  WARN, and ERROR settings. Both application and representative `sqlx::query`
  target events exercise all five severities. Synthetic target events verify
  policy, not actual SQLx instrumentation; the latter remains phase 4.
- At each setting, local JSON level/target, LogRecord severity text/number,
  original target, and span-event level are asserted. Every enabled event occurs
  once per log destination, with its separate span-event representation.
- INFO/DEBUG/TRACE request/dependency spans remain exported at all settings;
  child-parent IDs, the incoming W3C trace ID, request count, and duration samples
  survive. The fixture explicitly uses AlwaysOn sampling to isolate eligibility
  from sampling policy; production sampling configuration is unchanged.
- Request LogRecords match the request trace/span IDs. Background logs export
  without a request trace context. Request body, query, cookie, authorization
  data, and arbitrary detailed error messages are absent from asserted outputs.
- Isolated children set LOG_LEVEL with conflicting RUST_LOG (`off` versus `trace`)
  and emit all five legacy log severities. Local and remote counts match the
  LOG_LEVEL matrix without duplicates. Original legacy targets survive, and
  legacy SDK/transport diagnostics are sanitized locally and excluded remotely.
- Subscribers/providers/writers are isolated. Global logger installation and
  environment settings are exercised only in bounded child processes, never by
  mutating the shared runner environment.

These tests inspect actual SDK LogRecords and span exports in memory. They do not
establish receiver-backed gRPC receipt or production TLS handshakes. Optimized
release execution was not run; feature inspection and the static-level assertion
cover compile-time eligibility. Actual dependency source/target instrumentation,
outage/recovery behavior, and the workflow matrix remain phases 4–5. Independent
phase acceptance remains pending, with no independent PASS claimed.

Final source SHA-256:

```text
b875ff1d8bcb6fcd5b18ac303992185ccd6df18de0b945d60d05b6245c478d0f  telemetry/config.rs
45ab70c4ca5650541b4cfc39e42eb087ce3878bb77dde0b2c6366d1f3ef94bf4  telemetry/providers.rs
e754a62d560e7c79d2915fb4f27d9835febe00583bccca35e65fd151ef9d06d5  telemetry/logging.rs
2891e86ab239aac4c7e8ea9269e771737298e9d67e0d4fae09d983ca523b158f  telemetry/logging/tests.rs
```

Session captures: `/tmp/chaos-phase3-red.log`,
`/tmp/chaos-phase3-privacy-red.log`, `/tmp/chaos-phase3-legacy-red.log`,
`/tmp/chaos-phase3-legacy-green.log`, `/tmp/chaos-phase3-complete-tests.log`,
`/tmp/chaos-phase3-complete-build.log`, and
`/tmp/chaos-phase3-tracing-features.log`. This report records the sanitized durable
evidence; temporary captures are not deliverables.
