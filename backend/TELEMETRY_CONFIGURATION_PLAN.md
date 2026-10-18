# Telemetry configuration implementation plan

Status: phases 1–2 reviewed and corrected; phase 3 implemented. Regression, full
Rust suite, formatting, and build checks pass. Independent acceptance remains
pending; phases 4–6 have not been accepted. See the verification records below.
Branch: `open-telemetry`.
Plan reviewed against the working tree: 17 October 2026.

## Goal

Make remote OpenTelemetry ingestion optional, configure logging through
`LOG_LEVEL`, and retain structured tracing across the backend and instrumented
dependencies. Each phase follows red → green → refactor, with a separate
verification agent reviewing the evidence before the phase is accepted.

This document assigns future agent responsibilities. It does not mean those
agents have been launched or the proposed checks have passed.

This handoff is for implementing the configuration changes, not rebuilding the
existing telemetry subsystem. Implementation changes and evidence are recorded
under `telemetry-verification/`.
Defaults and edge-case policies below are proposed implementation decisions;
the requested requirements are optional ingestion, the three logging levels,
and tracing integration with instrumented dependencies.

User-confirmed scope: export logs, traces, and metrics; INFO includes DEBUG and
TRACE; WARN/ERROR retain request tracing and metrics; keep local output for
testing; cover framework, database, and outbound SpiceDB operations; automate
endpoint-based workflow and synchronization verification. Invalid-setting startup
behavior is confirmed: stop startup for invalid settings; keep serving when a
validly configured collector is temporarily unavailable.

## Current implementation (updated through phase 3)

- `server/src/telemetry/config.rs` validates the main endpoint and LOG_LEVEL before
  providers/workers start. Missing/blank endpoints select local output; nonblank
  endpoints are trimmed and malformed settings fail with sanitized errors.
- `server/src/telemetry/providers.rs` constructs OTLP gRPC exporters for logs,
  traces, and metrics only when the parsed main endpoint is configured. Local mode
  retains stdout traces/metrics and JSON stderr logs, with no remote logger provider.
- Logging uses validated `LOG_LEVEL`; `RUST_LOG` is ignored. Per-layer event
  filtering preserves eligible request/dependency spans and metrics at WARN/ERROR.
  INFO includes DEBUG/TRACE. JSON and LogRecord tests assert severity and trace IDs.
- `tracing`, `tracing-subscriber`, `tracing-opentelemetry`, and
  `opentelemetry-otlp` are already dependencies.
- HTTP middleware and selected business operations already have spans. Hardware
  metrics are collected independently. JSON logs go to stderr.
- The compatible tracing-to-logs bridge and SDK logger provider are configured.
  Provider construction, cleanup, and in-memory delivery are tested; actual gRPC
  ingestion remains unverified until the phase 5 receiver checks.
- Exporter/transport diagnostics stay local to avoid feedback loops. Providers
  flush/shut down all three signals and clean up partial startup failures.
- `main.rs` loads dotenv before telemetry initialization and already owns shutdown.
- `performance/recording.rs` records observable metrics; endpoint parsing and
  logging configuration belong in telemetry initialization, not gauge callbacks.
- First-party operational `log`/`println!` bypasses have been converted to tracing.
  Development logs omit emails/invite codes, error logs use stable categories, and
  SDK/transport diagnostics are sanitized locally and excluded from remote export.
  Legacy targets are normalized without installing a second logger bridge.

## Baseline checkpoint — before phase 1

The development agent must read repository instructions and inspect `git status`
and the existing diff before editing. This working tree already contains telemetry
and unrelated application/SpiceDB changes. Preserve them; do not reset, overwrite,
or include unrelated edits as part of this work.

Record the starting revision, relevant existing changes, dependency versions from
Cargo.lock, and baseline build/test results. Compilation may need local Postgres
for SQLx; runtime checks also need the application's configured services. Record
missing prerequisites as BLOCKED, with the exact command and error, rather than
as a telemetry regression or a passing check. Never copy `.env` contents into
verification evidence. Record evidence under `backend/telemetry-verification/`
using sanitized Markdown reports, adding that directory during implementation.

**Gate:** baseline recorded and relevant existing failures separated from new
failures. This planning pass has inspected source but has not run Rust tests.

## Proposed configuration contract

Reuse the standard endpoint name rather than introduce a second variable.

| Variable | Accepted input | Default / behavior |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Nonempty valid HTTP/HTTPS URI for a gRPC OTLP receiver | Missing, empty, or whitespace-only: no remote export. Trim surrounding whitespace. Reject malformed nonempty values with a clear startup error. |
| `LOG_LEVEL` | Exactly `INFO`, `WARN`, or `ERROR`, allowing surrounding whitespace | Missing: `INFO`. Empty or any other value: clear startup error listing allowed values. |
| `RUST_LOG` | Existing legacy variable | Stop using it to control backend logging. `LOG_LEVEL` is the single authority; document the migration. |
| `TELEMETRY_INTERVAL_SECS` | Existing positive integer | Keep current hardware/metric interval behavior. |
| `OTEL_SERVICE_NAME` | Existing service name | Keep current resource behavior. |

| `LOG_LEVEL` | INFO events | WARN events | ERROR events | DEBUG / TRACE events |
| --- | --- | --- | --- | --- |
| `INFO` | Show | Show | Show | Show |
| `WARN` | Hide | Show | Show | Hide |
| `ERROR` | Hide | Hide | Show | Hide |

“INFO logs everything” includes DEBUG and TRACE events, as confirmed by the user.
Map the external INFO setting to tracing’s TRACE event threshold; preserve each
event’s original severity in local and OTLP records. WARN and ERROR keep their
normal thresholds. DEBUG/TRACE are still invalid values for the external LOG_LEVEL
setting. Apply the policy across enabled application and dependency targets;
remove the `server=info` restriction. Do not compile out DEBUG/TRACE instrumentation
in the supported development/production builds. Everything refers to emitted
diagnostic events, not logging secrets or instrumenting every dependency function.

Keep HTTP/business spans and metrics usable at WARN/ERROR: log verbosity and
trace collection are different controls. A whole-subscriber level filter must
not accidentally discard INFO request spans. Use per-layer filtering and test
span retention alongside event suppression. Apply the event threshold to JSON
logging, the OTLP logs bridge, and events forwarded by the tracing/OpenTelemetry
span bridge. Keep emitted spans eligible independently of LOG_LEVEL, including
dependency spans at DEBUG/TRACE; verify actual sampling behavior separately.

Retain existing stdout trace/metric fallback when the endpoint is disabled.
Keep JSON logs on stderr in both modes; without an endpoint do not create a
remote logger provider/exporter. Avoid adding a second local copy of every log.
`LOG_LEVEL` filters log events, not metric records or standalone stdout span
exports. Document this distinction so users do not mistake readable metric output
for an INFO log. Remote export must remain disabled even if signal-specific OTLP
endpoint variables happen to exist without the main endpoint variable.

## Confirmed policy — invalid configuration versus collector outage

User selected stopping startup for invalid settings:

| Situation | Confirmed behavior | Reason |
| --- | --- | --- |
| Main endpoint missing/blank | Start with local telemetry only | Ingestion is optional. |
| LOG_LEVEL missing | Start with INFO (all event severities) | Explicit default. |
| LOG_LEVEL=INF0, DEBUG, or another invalid value | Stop before serving; name the setting and allowed values | Avoid silently choosing unexpected verbosity. |
| Malformed nonempty endpoint, such as `not-a-url` | Stop before serving with a sanitized configuration error | Make a broken deployment setting visible immediately. |
| Valid endpoint but collector offline/refusing connections | Keep serving; bounded export timeouts/retries and bounded queues | A telemetry outage must not take the application down. |

Do not silently fall back for invalid settings. The configuration contract and
phase 1 assertions below implement the confirmed fail-fast policy.
Exporter construction failures should clean up partial providers and report a
clear error; collector connectivity failures must not become a startup health gate.

## Agent responsibilities

| Role | Responsibility |
| --- | --- |
| Implementation agent | Writes failing tests first, makes the smallest implementation change, then refactors. |
| Verification agent | Independently checks requirements, test assertions, before/after evidence, and regressions; reports PASS or FAIL per phase. |
| Integration verification agent | Owns receiver-backed export checks and dependency instrumentation verification in phases 4–5. |
| Documentation verification agent | Checks commands, links, examples, and consistency with actual implementation in phase 6. |

The implementation agent must not mark its own work independently verified.
Verification agents may be reused between phases, but review must be separate
from implementation. If no separate agent is available, mark the gate pending
rather than claim independent verification. Record concrete evidence, not only
“looks good.” Do not advance a dependent phase while its prerequisite gate fails.

## Phase 1 — Configuration parser and explicit defaults

**Owner:** implementation agent. **Reviewer:** verification agent.

Scope:

- Add a small typed configuration parser, likely `server/src/telemetry/config.rs`.
- Represent the endpoint as an `Option` and logging level as a restricted enum or
  validated tracing level.
- Pass inputs explicitly to parser tests; avoid mutating process environment in
  parallel tests. Read actual environment once at the startup boundary.
- Validate values before creating providers or starting workers. Errors must name
  the invalid setting without echoing endpoint credentials or secret headers.

Red tests:

- Missing endpoint gives `None`; empty/whitespace endpoint also gives `None`.
- A valid endpoint is retained after trimming; malformed nonempty input fails.
- Missing `LOG_LEVEL` defaults to INFO.
- INFO/WARN/ERROR map correctly; DEBUG, TRACE, lowercase values, empty values,
  and arbitrary strings fail. Surrounding whitespace is accepted.

Green/refactor: implement parsing, remove duplicated parsing logic, retain useful
Rust documentation comments.

**Acceptance gate:** parser cases pass; no network/provider construction in the
parser; verification agent confirms accepted values match the contract.

## Phase 2 — Optional remote export

**Owner:** implementation agent. **Reviewer:** verification agent.
**Depends on:** phase 1.

Scope:

- Make `Telemetry::init()` use the parsed optional endpoint for logs, traces,
  and metrics. Preserve local output and graceful shutdown.
- Build `with_tonic()` exporters only for a configured endpoint. Supply the
  validated endpoint explicitly to all three builders rather than relying solely on
  ambient environment configuration.
- Keep resource metadata and sampling behavior intact.
- Add a compatible `opentelemetry-appender-tracing` bridge, SDK logger provider,
  and OTLP log exporter; enable logs features in the existing SDK/exporter family.
  Verify compatibility from the dependency graph rather than assuming bridge
  crate version numbers match the SDK. Store and flush/shut down the logger
  provider with traces and metrics, including partial-initialization failure paths.
- Keep exporter-internal diagnostics from recursively re-entering OTLP log export;
  route those diagnostics locally and verify no feedback loop during outages.

Red tests:

- Disabled endpoint chooses the local export path for all three signals.
- Disabled endpoint creates no remote exporters; signal-specific endpoint
  settings cannot silently enable them.
- Configured endpoint chooses OTLP for all three signals and reaches the exporter
  builders with the expected URI.
- Startup failure before sampler creation leaves no worker running.

Green/refactor: extract provider construction only where needed for meaningful
isolation; avoid tests that merely repeat implementation branches.

**Acceptance gate:** provider-selection tests and existing hardware/shutdown tests
pass. Receiver-backed evidence of actual network behavior remains mandatory in
phase 5; configuration assertions alone are insufficient.

## Phase 3 — LOG_LEVEL and structured events

**Owner:** implementation agent. **Reviewer:** verification agent.
**Depends on:** phases 1–2.

Scope:

- Replace `RUST_LOG`-based application filtering with validated `LOG_LEVEL`.
- Use per-layer filters so the event threshold does not remove request spans.
- Ensure logs from dependency targets are eligible at the selected level.
- Use `tracing::info!`, `tracing::warn!`, and `tracing::error!` for structured
  messages. For a dynamically chosen level, use `tracing::event!(level, ...)`
  where supported by the macro's static callsite requirements, or dispatch to
  the appropriate static-level macro.
- Clarification: `tracing::log!()` is not a standard tracing macro. `log::log!()`
  belongs to the separate `log` crate. If a dependency uses `log`, inspect existing
  bridging first; use a single compatible `LogTracer` bridge if necessary,
  avoiding duplicate global logger installation or recursion.
- Replace telemetry-related println/debug output where needed; do not broadly
  rewrite unrelated application behavior.

Red tests:

- Capture JSON logs for each of the three levels and assert the exact matrix
  above, including representative dependency-target events.
- Conflicting `RUST_LOG` does not override `LOG_LEVEL`.
- WARN/ERROR suppress INFO events while preserving request spans and request
  metrics. Check local JSON output, OTLP LogRecords, and exported span events.
- INFO includes all five severities in local and remote logs, with original
  severity preserved and no DEBUG/TRACE records removed by build features.
- Request-scoped remote logs contain the corresponding trace/span IDs; background
  logs export successfully without a request span. One event produces one
  LogRecord per destination; its additional span-event representation is not a
  duplicate LogRecord.
- No duplicate messages from a log-to-tracing bridge.
- Existing request payload/credential exclusion tests continue to pass.

Green/refactor: consolidate filter construction and keep subscriber initialization
single-use. Isolate subscribers/writers/exporters in tests.

Audit first-party operational `log::` and `println!` call sites across handlers,
services, and models. Convert appropriate messages to tracing macros, keeping
existing behavior and avoiding request bodies, tokens, email addresses, invite
codes, and credentials in new fields. Retain the bridge for dependencies that
still use `log`. Any deliberately retained operational output must have its
reason recorded; do not claim a backend-wide level policy while bypasses remain.

**Acceptance gate:** verifier confirms the level matrix, dependency target
eligibility, span retention, and absence of duplicated/leaked messages.

## Phase 4 — Dependency instrumentation and request coverage

**Owner:** implementation agent. **Reviewer:** integration verification agent.
**Depends on:** phase 3.

Scope:

- Inspect actual Axum/Tower/tonic dependency versions, enabled features, and the
  spans/events they emit. A subscriber can collect existing instrumentation; it
  does not automatically instrument every function in every crate.
- Keep the existing outer HTTP middleware and avoid a second root request span.
- Check framework events emitted before/inside handler execution and relevant
  outbound client instrumentation. Add only missing instrumentation needed for
  the agreed request flow: framework processing, database queries, and outbound
  SpiceDB calls. Record real dependency instrumentation where available; add
  application-owned wrapper spans where a dependency does not emit it, labeling
  that distinction accurately. Capture bounded query metadata, not SQL parameters.
- Verify incoming W3C HTTP trace context remains attached. Do not imply outgoing
  gRPC propagation exists unless explicitly implemented and tested.

Red tests:

- A routed request has one intended server root span, correct route template and
  status, and the expected child events/spans.
- A dependency event emitted within request processing is associated with the
  request context and obeys LOG_LEVEL.
- Authentication failure, method rejection, and missing route are recorded.
- Requests at WARN/ERROR still contribute metrics and retain trace context.

**Acceptance gate:** verifier identifies the actual dependency source/target
observed, not just an application event with a dependency-looking target name.
A synthetic target test can validate filtering but does not prove real framework
instrumentation. Existing HTTP tests remain green.

## Phase 5 — Receiver-backed gRPC and regression verification

**Owner:** implementation agent. **Reviewer:** integration verification agent.
**Depends on:** phases 2–4.

Scope:

- Add a repeatable isolated OTLP gRPC test receiver or test collector with log,
  trace, and metric ingestion. Bind an ephemeral/test port; leave user services alone.
- Record receipt of actual protobuf export requests. Do not depend on a hosted
  telemetry account or production endpoint.
- Run endpoint-absent cases in isolated processes when SDK environment/global
  state makes in-process assertions unreliable.

Required checks:

1. No endpoint: server requests and hardware sampling work, local output remains
   available, and the test listener receives zero remote export attempts. Point
   signal-specific endpoint variables at that listener while the main variable
   is absent, then empty/whitespace-only; exercise requests, periodic export, and
   shutdown over a bounded window. A listener at an arbitrary unused address
   alone cannot prove that no remote exporter exists; pair this with phase 2's
   construction assertions.
2. Endpoint configured: receiver gets a completed HTTP trace, correlated
   LogRecords, and metric exports containing request count/duration and a
   hardware snapshot. Verify all three ingestion services, not just span events.
3. Span/resource IDs and route labels survive serialization through real gRPC.
4. INFO/WARN/ERROR match the agreed event matrix in local and remote logs while
   spans and metrics still arrive; include DEBUG/TRACE and background events.
5. Valid but unreachable receiver: application startup and requests remain
   functional; bound export timeouts, retries, queues, and shutdown. Test receiver
   outage and recovery, reporting dropped records honestly. Verify local exporter
   diagnostics do not recursively generate remote logs.
6. Graceful shutdown stops sampling and flushes pending exports; repeat startup
   and stop without orphan workers or occupied test ports.
7. Run existing Rust telemetry tests and local SpiceDB permission tests.

### Endpoint-driven workflows and synchronization

Use repeatable API scripts against isolated local/test data instead of requiring
manual UI clicks. Discover exact methods, paths, authentication, and payloads from
`backend/api.yaml` and the router; do not invent a generic sync endpoint. Treat
“syncing” provisionally as Postgres-to-SpiceDB synchronization through Sequin and
reconciliation; record any additional product workflow identified by the user.

Build a scenario matrix and record covered and untested cases explicitly; do not
claim exhaustive coverage of all possible schedules. Include:

- Authenticated application/campaign workflows: create, read, update, submit,
  and delete where supported; invalid input, unauthenticated/forbidden requests,
  missing resources, and repeated requests. Assert HTTP results and final state
  alongside correlated logs/traces and metrics.
- Relationship-owning mutations: grants, revocations, and parent deletion with
  child cascades. Assert persisted data and actual permission decisions after
  bounded polling for synchronization, not fixed sleeps.
- Real Sequin delivery to `POST /api/v1/sequin/spicedb`: valid and invalid webhook
  authentication, inserts/updates/deletes, duplicate delivery, conflicting updates
  in one batch, retry after unavailable SpiceDB, and eventual catch-up. Direct
  calls with fixture messages test the webhook; they do not prove real CDC works.
- Reconciliation: existing trigger/backfill mechanisms, missing-relationship
  repair, orphan reporting with deletion disabled, and orphan removal with deletion
  enabled only in the isolated fixture environment. Do not add a public admin
  endpoint solely to trigger tests. Assert live relationships survive the sweep.
- Sequential and concurrent grants/revocations. Keep the documented direct-write
  versus replay race visible as an accepted architectural limitation; report
  observations and convergence after a subsequent change/reconciliation rather
  than asserting the race cannot happen or expanding this task into a redesign.
- Dependency outage/recovery and shutdown during in-flight work. Correlate each
  HTTP request and background operation with telemetry; asynchronous Sequin work
  need not share the initiating request trace unless propagation is implemented.

Fixtures must use disposable accounts/resources and cleanup. Stub outbound email
and other external side effects. Record fixture IDs, expected permissions, polling
deadlines, exact script commands, and sanitized receiver evidence in the phase 5
report. Missing services or credentials are BLOCKED cases, not skipped successes.

Commands, with development environment configured:

```sh
# From repository root; local SpiceDB must be running.
python3 backend/spicedb/test_campaign_permissions.py
cd "$(git rev-parse --show-toplevel)/backend/server"
cargo fmt --all -- --check
cargo test --locked --lib --bins
cargo build --locked
```

Run the new receiver-backed test target using the command added with that target.
Record its exact command here during implementation. Also check `cargo test`
separately and record any documentation-test failures against the fresh baseline;
do not assume a previously documented failure count still applies. Do not call
the unrestricted suite green based on `--lib --bins`.

**Acceptance gate:** actual ingestion evidence for all three signals, zero-export
negative case, level matrix evidence, bounded shutdown, regression results, and
explicit remaining limitations approved by the integration verification agent.

## Phase 6 — Documentation and review handoff

**Owner:** implementation agent. **Reviewer:** documentation verification agent.
**Depends on:** phase 5.

Scope:

- Update `TELEMETRY.md`, `TELEMETRY_IMPLEMENTATION.md`, and relevant sample
  configuration to use LOG_LEVEL and explain optional ingestion.
- Replace stale RUST_LOG commands for the real backend. Keep demo configuration
  clearly identified if the older standalone demo remains unchanged.
- Explain endpoint absence, blank values, invalid levels, stdout fallback,
  container hostname differences, and restarting after environment changes.
- Explain OTLP gRPC receiver requirements for all three signals, event/span
  filtering, INFO’s intentional mapping to TRACE verbosity, and local JSON logs
  versus standalone exported OTLP LogRecords.
- Include test commands, sample expected outputs, and the review diff. Do not
  commit local `.env` values or credentials.

**Acceptance gate:** verifier runs documented commands where applicable, checks
relative links and example values, and confirms every claimed capability has
recorded test evidence. All previous phase gates must be PASS before marking the
implementation complete.

## Verification record

Fill this table during implementation; phases are currently unverified.

| Phase | Implementing agent | Verifying agent | Red evidence | Green evidence / commands | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 — Configuration | Codex `/root` | Codex `/root` self-review; independent reviewer pending | Invalid IP and percent-escape regressions failed before fixes; [review](telemetry-verification/review-phases-1-2.md) | Parser/startup regressions, full suite, fmt and build pass | Reviewed findings fixed; independent gate pending |
| 2 — Optional export | Codex `/root` | Codex `/root` self-review; independent reviewer pending | Initial compile-red and diagnostic regressions; [review](telemetry-verification/review-phases-1-2.md) | Provider/cleanup regressions, full suite, fmt and build pass | Reviewed findings fixed; independent gate pending; receiver evidence remains phase 5 |
| 3 — Logging levels | Codex `/root` | Self-review complete; independent reviewer pending | Matrix, privacy, legacy target and explicit-parent regressions; [report](telemetry-verification/phase-3.md) | 78 unit-test executions plus 1 passing doctest; 1 existing ignored; fmt/build pass | Reviewed correlation defect fixed; independent gate pending |
| 4 — Dependencies | Unassigned | Unassigned | Pending | Pending | Pending |
| 5 — gRPC integration | Unassigned | Unassigned | Pending | Pending | Pending |
| 6 — Documentation | Unassigned | Unassigned | N/A: documentation review | Pending | Pending |

## Agent handoff prompts

Use these prompts when launching development and verification agents later.
Agents are roles; one independent reviewer can cover all verification phases.
Run development and its review sequentially on the same phase snapshot so the
reviewed code is identifiable. Do not launch extra agents during plan preparation.

### Development agent

> Implement the first eligible incomplete phase in
> `backend/TELEMETRY_CONFIGURATION_PLAN.md`. Read AGENTS.md, preserve the current
> working tree, and complete the baseline checkpoint first. Follow the agreed
> configuration contract. Add meaningful failing tests for changed behavior,
> implement the phase, and run its checks. Update the verification table with
> your identity, exact commands, exit results, and sanitized evidence links.
> Mark implementation ready for review; leave independent verification pending.
> Report changed files, remaining risks, and prerequisites. Fix reviewer findings
> and request re-review before advancing a dependent phase.

### Verification agent

> Independently verify phase N of
> `backend/TELEMETRY_CONFIGURATION_PLAN.md` against the current source and diff.
> Identify the reviewed revision and relevant uncommitted changes. Inspect the
> assertions and rerun the phase checks; do not accept implementation-agent
> summaries alone. Check the configuration contract, negative cases, dependency
> capture, span retention, and applicable regressions. Write a sanitized report
> at `backend/telemetry-verification/phase-N.md` with commands, exit results,
> findings with file locations, and a verdict: PASS, FAIL, or BLOCKED. Update the
> verification table and leave unexecuted checks explicitly pending. A BLOCKED
> prerequisite is not PASS. Do not modify production code while reviewing it.

Each report must include the phase, implementer/reviewer identities, reviewed
revision plus working-tree scope, expected versus observed behavior, command
results, evidence paths, and unresolved findings. Re-review any affected gate
after subsequent changes invalidate its evidence. Runtime/export claims require
runtime evidence; source inspection cannot substitute for observed ingestion.

## Final acceptance checklist

- [ ] Baseline checkpoint and all six phase gates independently PASS.
- [ ] Missing/blank main endpoint disables remote logs, traces, and metrics, including
  when signal-specific endpoint settings exist.
- [ ] Configured endpoint receives correlated logs, traces, and metrics over OTLP gRPC.
- [ ] LOG_LEVEL defaults to INFO and enforces the INFO/WARN/ERROR event matrix
  for first-party and observed dependency events.
- [ ] WARN/ERROR retain HTTP trace context, request spans, and metrics.
- [ ] Real dependency instrumentation is observed; synthetic targets alone do
  not satisfy this requirement.
- [ ] Confirmed fail-fast policy for invalid settings matches tests/documentation.
- [ ] Startup errors, unreachable receivers, and shutdown have bounded behavior.
- [ ] Endpoint-driven workflow/synchronization matrix passes, including documented
  concurrency limitations and outage recovery; no UI clicking is required.
- [ ] Documentation matches implementation and all evidence is sanitized.
- [ ] Final reviewer records remaining limitations and the full test outcome.

## Primary API references

Use these with the locked dependency versions; inspect matching versioned docs
before choosing concrete APIs during implementation.

- [tracing events, spans, and macros](https://docs.rs/tracing/latest/tracing/):
  use `warn!`, `error!`, `info!`, and general `event!` macros.
- [tracing-subscriber layers and filtering](https://docs.rs/tracing-subscriber/latest/tracing_subscriber/layer/index.html):
  apply independent filters to output layers.
- [OpenTelemetry OTLP 0.32 exporter configuration](https://docs.rs/opentelemetry-otlp/0.32.0/opentelemetry_otlp/):
  configure gRPC exporters and explicit endpoints with the existing SDK family.

- [OpenTelemetry tracing-to-logs bridge](https://docs.rs/opentelemetry-appender-tracing/latest/opentelemetry_appender_tracing/):
  converts tracing events into standalone LogRecords; select a release compatible
  with the locked SDK and verify trace correlation in receiver-backed tests.
