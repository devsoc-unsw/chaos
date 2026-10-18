# Phase 1 configuration review

Date: 17 October 2026. Current status: **reviewed finding FIXED**, regression and
startup checks pass; independent phase acceptance remains pending. The original
review below recorded **FAIL** before the follow-up fix.
Implementer and reviewer: Codex `/root`, in separate implementation/review turns.
This is a self-review, not the independent verification required by the plan.
Independent verification remains pending. No production source was changed during
the original review. The subsequent user-authorized fix changes `config.rs` as
recorded below.

## Follow-up fix — 17 October 2026

Bracketed hosts now pass through `std::net::Ipv6Addr` parsing after URI parsing.
Malformed address literals return the existing sanitized `InvalidEndpoint` error
before providers/workers are created. This adds no dependency, DNS resolution,
network connection, or environment mutation to the parser.

A new table-driven regression test covers invalid bracket contents, bracketed
IPv4, invalid IPv6 hexadecimal digits, and repeated compression. Accepted-endpoint
coverage now includes IPv6 without a port, a documentation IPv6 address, and
IPv4-mapped IPv6. Existing endpoint trimming and logging-level behavior is retained.

Fix snapshot (same revision plus working tree):

```text
e14ef2e7f93d9f4641dc77e7c03baa0e3088ff6a876020b6aa2e3f05aab52e58  config.rs
250c2f9aa5334c1875bc3a350f78f95320e6012d0e6c5b8656871dd20d999159  mod.rs
```

Commands from `backend/server`; fresh SQLx compilation used local Postgres access:

| Check | Exit | Observed result |
| --- | --- | --- |
| Red: `cargo test --locked --offline --lib telemetry::config::tests::invalid_bracketed_hosts_are_rejected` | 101 | Runtime assertion failed: `invalid bracketed host was accepted: http://[not-an-ip]:4317`. |
| Green: `cargo test --locked --offline --lib --bins` | 0 | 24 tests pass in each target, 48 executions total (eight parser tests plus 16 existing telemetry tests per target). |
| `cargo build --locked --offline` | 0 | Rebuilt production binary passes. |
| `cargo fmt --all -- --check` | 0 | Formatting passes. |
| `git diff --check` | 0 | No whitespace errors in tracked changes. |
| Production startup: malformed literal, also with synthetic credentials | 1 each | Correct sanitized endpoint error, empty stdout, no synthetic secrets, no interval/provider initialization. |
| Production startup: invalid LOG_LEVEL | 1 | Correct allowed-value error, empty stdout, no interval/provider initialization. |

Startup probes used isolated subprocess environments and a five-second timeout.
`TELEMETRY_INTERVAL_SECS=0` was set deliberately; each expected configuration error
appeared before interval validation. In particular, the original reproduction now
returns `Error: OTEL_EXPORTER_OTLP_ENDPOINT must be a valid HTTP/HTTPS receiver URI`.

Session-local fix evidence: `/tmp/chaos-phase1-fix-red.log`,
`/tmp/chaos-phase1-fix-tests.log`, and `/tmp/chaos-phase1-fix-build.log`.
The full doctest suite was not rerun for this narrow fix; its previously measured
40 generated-code failures remain unresolved. No independent reviewer has accepted
the phase, and no dependent phase was advanced.

## Reviewed snapshot

Revision: `b85c360d67ee4f3e80ea1551a5337bbd364e3500` plus uncommitted phase 1 work:

- `backend/server/src/telemetry/config.rs`: typed parser, seven table-driven tests,
  environment reader, sanitized errors, event-threshold mapping.
- `backend/server/src/telemetry/mod.rs`: validation before provider/worker creation,
  optional endpoint selection and explicit trimmed endpoints for existing exporters.

SHA-256 at review:

```text
ba2de66ac88fcde35ddb6e80a296303af3da5b40355767f3ae25ffc17dec74d9  config.rs
250c2f9aa5334c1875bc3a350f78f95320e6012d0e6c5b8656871dd20d999159  mod.rs
```

See [baseline.md](baseline.md) for pre-existing changes and checks. Unrelated
application/SpiceDB changes and existing dependencies were preserved.

## Finding

**P2 — Validate bracketed hosts as IP literals before accepting the endpoint.**
`config.rs:60–75` uses `http::Uri` and checks scheme, host presence, port, and
fragment, but the URI parser does not fully validate the contents of brackets.
`TelemetryConfig::parse(Some("http://[not-an-ip]:4317"), None)` succeeds. This is
not a valid HTTP receiver URI and must fail with the sanitized endpoint error
before any provider or worker starts. The current malformed-endpoint test lacks
invalid bracketed literals, so the suite passes despite this gap.

Add host-literal validation (or a compatible stricter URL validation step), keeping
valid IPv6 endpoints and no-port endpoints accepted, and add regression cases for
invalid bracket contents. Do not resolve DNS or connect from the parser.

Reproduced against the compiled production library with this standalone probe:

```sh
# From repository root, after cargo build in backend/server.
cat > /tmp/chaos-phase1-review-literal.rs <<'RS'
fn main() {
    let result = server::telemetry::config::TelemetryConfig::parse(
        Some("http://[not-an-ip]:4317"), None,
    );
    println!("accepted={}", result.is_ok());
}
RS
rustc --edition=2021 /tmp/chaos-phase1-review-literal.rs \
  --extern server=backend/server/target/debug/libserver.rlib \
  -L dependency=backend/server/target/debug/deps \
  -o /tmp/chaos-phase1-review-literal
/tmp/chaos-phase1-review-literal
```

Observed: `accepted=true` (exit 0); expected: `accepted=false`.
Additional probes: `http://[::1]` and `http://collector:4317` accepted;
malformed percent escapes, a backslash in a host, and an empty host rejected.

## Checks and results

Commands run from `backend/server` unless stated otherwise:

| Check | Exit | Expected versus observed |
| --- | --- | --- |
| Red: `cargo test --locked --offline --lib telemetry::config::tests` | 101 | Before implementation, new tests failed to compile with undeclared `TelemetryConfig` / `LogLevel`. Required local Postgres access to get past unrelated SQLx compilation. This is compile-red evidence, not a failing runtime assertion. |
| Review: `cargo test --locked --offline --lib --bins` | 0 | Seven parser tests and 16 existing telemetry tests passed in each target: 46 executions. |
| Review: `cargo fmt --all -- --check` | 0 | Formatting passed. |
| Review: `cargo build --locked --offline` | 0 | Production build passed using cached compilation; fresh build with Postgres access passed during implementation. |
| Review: `cargo test --locked --offline` (sandbox) | 1 | Unit targets pass; rustdoc compilation BLOCKED by SQLx database access: `Operation not permitted (os error 1)`. |
| Review: `cargo test --locked --offline` (with local Postgres access) | 101 | Unit targets pass; generated SpiceDB/Google/gRPC doctests: 40 failed, 1 ignored. Reproduces the implementation-turn result. Failures are outside phase 1 source; no measured pre-edit full-suite baseline exists. |
| Production process: invalid `LOG_LEVEL=DEBUG` | 1 | Expected allowed-value error observed; stdout empty. |
| Production process: malformed endpoint with synthetic credentials | 1 | Expected setting-specific error observed; no synthetic secrets in output; stdout empty. |
| Production process: invalid bracketed host with interval zero | 1 | FAIL: reached interval validation rather than returning the endpoint error. |

The process checks captured output without printing it. Reproduction for the host
validation ordering check:

```sh
OTEL_EXPORTER_OTLP_ENDPOINT='http://[not-an-ip]:4317' \
  LOG_LEVEL=INFO TELEMETRY_INTERVAL_SECS=0 target/debug/server
```

Observed: `Error: TELEMETRY_INTERVAL_SECS must be positive`. Expected: sanitized
`OTEL_EXPORTER_OTLP_ENDPOINT` validation error. Interval zero ensures this probe
does not start providers, application services, or background workers.

The passing tests directly cover missing/blank endpoints, endpoint trimming,
representative malformed URIs, missing-level INFO default, exact uppercase
INFO/WARN/ERROR acceptance, whitespace, rejection of DEBUG/TRACE/lowercase/empty/
arbitrary levels, the TRACE/WARN/ERROR event mapping, and sanitized Display/Debug
errors. Inputs are explicit; tests do not mutate the environment. Source inspection
confirms that parsing constructs no providers and starts no network or workers.

## Outstanding gates and scope (updated after fix)

- The malformed-literal finding is fixed; parser, startup, and regression checks pass.
- Obtain independent review before accepting phase 1 or advancing phase 2.
- The full suite is not green; generated-code doctest failures remain separate
  from the parser finding and have no captured pre-edit full-suite comparison.
- LOG_LEVEL is validated and mapped, but active logging still uses RUST_LOG.
  Applying the policy belongs to phase 3 and is not a phase 1 defect.
- OTLP logs, provider cleanup, receiver-backed export, dependency coverage, and
  workflow/synchronization checks remain phases 2–5; no such capability is claimed.

Session-local captures: `/tmp/chaos-phase1-red-unrestricted.log`,
`/tmp/chaos-phase1-green.log`, `/tmp/chaos-phase1-review-tests.log`,
`/tmp/chaos-phase1-review-build.log`, and
`/tmp/chaos-phase1-review-full-tests.log`, and
`/tmp/chaos-phase1-review-full-tests-unrestricted.log`. Sanitized durable evidence is recorded
above; temporary logs are not repository deliverables.
