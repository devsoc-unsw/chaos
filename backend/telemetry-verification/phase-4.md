# Phase 4 — Dependency instrumentation and request coverage

Date: 18 October 2026. Implementer/self-reviewer: Codex `/root`.
Status: implementation and self-checks complete; independent acceptance pending.
Base: phase 3 reviewed, corrected, and committed as `eaa3676` before this work.
Unrelated SpiceDB schema and permission-test changes were preserved.

## Follow-up review before phase 5

Self-review reproduced an export privacy defect when SDK event attribute limits
remove the target or SQL statement discriminator. The remaining event name could
contain raw dependency payloads. `truncated_dependency_events_remain_private`
failed at attribute limit zero before the fix (capture:
`/tmp/chaos-phase4-review-red.log`). The exporter now removes payloads from every
truncated event, retaining only target/severity metadata where present and a fixed
message. Regression coverage checks limits zero and two. This deliberately favors
privacy when a partial event can no longer be classified reliably.
After the fix, `cargo test --locked --offline` passes 42 tests in each unit
target (84 executions), plus 1 passing/1 existing ignored doctest. Production
build and formatting pass. Captures: `/tmp/chaos-phase4-review-tests.log` and
`/tmp/chaos-phase4-review-build.log`. Independent acceptance remains pending.

## Actual instrumentation inspected

Locked source and `cargo tree --locked --offline -e features -p server` establish:

| Dependency | Source and behavior | Coverage added |
| --- | --- | --- |
| Axum 0.7.9 / axum-core 0.4.5 | Axum default `tracing` feature enabled. `axum-core/src/macros.rs` rejection macro emits TRACE `axum::rejection`; real callsite is `axum-0.7.9/src/extract/rejection.rs`. Rejection body text can include input values. | Real malformed JSON extraction through a routed request; retain status, replace payload with fixed message. |
| SQLx-core 0.9.0 | `src/logger.rs::QueryLogger::finish` emits DEBUG `sqlx::query` (WARN for slow statements), including full SQL, summary, rows and elapsed time. It does not supply the query client span used here. | Real parameterized PostgreSQL SELECT; application-owned query span plus actual driver event. Keep numeric rows/timing, omit SQL and summary. |
| Tower 0.5.2 / tonic 0.14.6 | Tower util/make and tonic transport/channel/server are enabled; Tower tracing is enabled transitively. Transport diagnostics are already excluded from remote export to prevent feedback. These do not provide bounded application-method RPC coverage. | Application-owned SpiceDB RPC spans plus actual generated tonic client/server transport fixture. No synthetic event is claimed as tonic instrumentation. |

Tonic also brings Axum 0.8.9 / axum-core 0.5.6 transitively; the HTTP rejection
assertion checks the application's 0.7.9 source callsite specifically. Feature
capture: `/tmp/chaos-phase4-features.txt`; source versions come from Cargo.lock and
the locally cached dependency source, rather than current online documentation.

## Implementation

The existing outer `http.request` middleware remains the single server span.
Its response status now records an explicit i64, fixing a real integration-test
failure where tracing's u16 value became text in exported span attributes.
Red capture: `/tmp/chaos-phase4-framework-green.log` (despite its filename, that
initial run failed); the subsequent integration run passed.

`telemetry/operations.rs` supplies application-owned PostgreSQL and SpiceDB client
spans. Submission's two queries and transaction begin/commit use static operation
labels without SQL, binds, or connection information. All existing SpiceDB check,
write, read and delete call sites time the RPC future and record gRPC status,
without changing request data, return values, or permission/commit ordering.
ReadRelationships measures initial response setup, not the entire streamed read.
Outgoing gRPC trace metadata is not injected; the fixture asserts its absence.

`telemetry/dependencies.rs` bounds real SQLx and Axum event payloads for local JSON,
SDK LogRecords, and span exports. The span-exporter adapter wraps both local and
OTLP exporters. Only fixed messages, dependency metadata and allowed numeric
measurements survive; raw SQL, summaries, rejection bodies and arbitrary formatted
fields do not. This complements the existing exporter-diagnostic recursion policy.
Other dependency events retain the existing eligibility policy.

## Verification

Commands run from `backend/server`, with the configured local Postgres available:

```sh
cargo test --locked --offline --lib telemetry::logging::tests::integration
cargo test --locked --offline
cargo build --locked --offline
cargo fmt --all -- --check
```

The integration tests exercise all three levels with isolated subscribers,
in-memory trace/log/metric exporters, and the actual HTTP middleware:

- Malformed JSON (422), method rejection (405), unmatched path (404), and invalid
  JWT (401) retain one server root, incoming W3C trace ID, route template and
  numeric response status. The real Axum event is correlated and filtered.
- Read-only parameterized SQL plus real tonic CheckPermission and
  WriteRelationships calls cover grant (200), denial (403), and gRPC Unavailable
  (500 / gRPC 14). Expected query/RPC spans belong to the request ancestry,
  including the existing permission business span.
- SQLx callsite, bounded message, LogRecord correlation and single event counts
  are asserted. Both actual dependency events occur once per enabled destination
  at INFO and disappear at WARN/ERROR, while child spans and counters remain.
- Sentinel body, SQL literal, bind, bearer key, query token, internal gRPC error
  and ZedToken do not occur in captured JSON, LogRecords or exported spans.

The PostgreSQL fixture reads DATABASE_URL from the environment or `backend/.env`
without modifying the test process environment or printing credentials. Its SQL
is read-only. The tonic fixture binds an ephemeral loopback port, accepts only
fixture requests and shuts down with a bounded wait; no deployed SpiceDB is used.

`cargo test --locked --offline` exited 0: 41 tests passed in each unit target
(82 executions), plus 1 passing and 1 existing ignored doctest. Capture:
`/tmp/chaos-phase4-full-tests.log`. Existing unused-import/attribute warnings are
outside this change. The first broader run exposed an overly strict test
assumption that RPC spans directly parent the HTTP span; the corrected assertion
walks through existing business-span ancestry and verifies it reaches that root.

`cargo build --locked --offline`, `cargo fmt --all -- --check`, and
`git diff --check` exited 0. Build capture: `/tmp/chaos-phase4-build.log`.
Temporary captures are session evidence;
this report is the durable sanitized record.

## Limits

This is a self-review, not independent acceptance. Query spans cover the agreed
submission/transaction sites, rather than every query in the repository. The
permission fixture verifies real transport and application wrappers, rather than
the production SpiceDB policy engine. Streaming read/delete RPCs are instrumented
and compile-checked but are not exercised by the transport fixture. Receiver-backed
OTLP receipt, outage/recovery, hardware export over gRPC, and complete workflow/
Sequin synchronization scenarios remain phase 5. No receiver PASS is claimed.
