# Telemetry configuration baseline

Recorded 17 October 2026 from this session's pre-implementation command results.
Implementer: Codex `/root`. Independent baseline verification: pending.
Starting revision: `b85c360d67ee4f3e80ea1551a5337bbd364e3500`.

The checkpoint was inspected and executed before parser edits; this persistent
report was added during the subsequent user-requested review. No environment
contents or credentials are included.

## Starting working tree

Existing tracked changes: `backend/README.md`, server `Cargo.toml`, `Cargo.lock`,
`src/lib.rs`, `src/main.rs`, `src/handler/application.rs`, `src/models/app.rs`,
`src/models/application.rs`, `src/models/error.rs`, `src/models/transaction.rs`,
`src/spicedb/mod.rs`, and `backend/spicedb/schema.yaml`.

Existing untracked content: `backend/TELEMETRY.md`,
`backend/TELEMETRY_CONFIGURATION_PLAN.md`, `backend/TELEMETRY_IMPLEMENTATION.md`,
`backend/server/src/telemetry/`, `backend/telemetry-example/`, and
`backend/spicedb/test_campaign_permissions.py`.

The existing diff was read before editing. Phase 1 adds `telemetry/config.rs` and
changes `telemetry/mod.rs`; it does not change the pre-existing tracked diff or
dependency manifests/lockfile.

## Locked dependencies

| Crate | Version |
| --- | --- |
| axum (server) | 0.7.9 |
| http (Axum URI parser) | 1.4.0 |
| tonic | 0.14.6 |
| tracing | 0.1.43 |
| tracing-subscriber | 0.3.23 |
| tracing-opentelemetry | 0.33.0 |
| opentelemetry | 0.32.0 |
| opentelemetry_sdk | 0.32.1 |
| opentelemetry-otlp / opentelemetry-stdout | 0.32.0 |
| sysinfo | 0.38.4 |

## Pre-edit checks

Commands run from `backend/server`:

| Command | Exit | Observed result |
| --- | --- | --- |
| `cargo test --locked --offline --lib --bins` | 0 | 16 tests passed in each of lib and bin (32 executions). |
| `cargo build --locked --offline` (sandbox) | 101 | BLOCKED: SQLx compile-time database access returned `Operation not permitted (os error 1)`, followed by cascading compiler errors. |
| `cargo build --locked --offline` (with local Postgres access) | 0 | Production build passed; existing warnings remain. |
| `cargo fmt --all -- --check` | 0 | Formatting passed. |

The initial test command reused compiled artifacts; it does not establish that a
fresh SQLx build works without database access. The sandbox build failure was
resolved by granting local database access; it is not a telemetry regression.

The unrestricted test suite, including doctests, was not captured before edits.
Its post-edit failures are documented in [phase-1.md](phase-1.md); they must not be
presented as a measured pre-edit doctest baseline.

Original command captures remain in session-local `/tmp/chaos-phase1-baseline-*`
logs. This report preserves the sanitized results rather than raw compiler output.
