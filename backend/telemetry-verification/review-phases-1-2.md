# Follow-up review of phases 1–2

Date: 18 October 2026. Reviewer/implementer: Codex `/root`.
Technical result: **findings fixed; regression checks pass**.
This is a self-review; the plan's independent acceptance gates remain pending.

The user requested review/fixes followed by phase 3, then requested a commit
before further phase 3 work. Existing telemetry work was committed as
`3512d54` (`Implement telemetry configuration and optional OTLP export`).
The unrelated `backend/spicedb/schema.yaml` permission edit and
`backend/spicedb/test_campaign_permissions.py` were left outside that commit and
outside the review changes. The fixes described here are in the working tree on
top of `3512d54`.

## Findings and fixes

| Finding | Fix and evidence |
| --- | --- |
| P2: `http::Uri` accepted malformed percent escapes in paths/query strings, e.g. `http://collector:4317/invalid%zz`. | The pure parser now requires two hexadecimal digits after each `%`. Regression cases cover invalid/truncated escapes and valid encoded paths/query values. The existing malformed-endpoint test failed before the fix and passes afterward. |
| P2: case-sensitive `starts_with("https://")` skipped explicit trust-root setup for valid uppercase `HTTPS://` input. | TLS selection now compares the scheme prefix case-insensitively. Parser and real exporter-construction tests include uppercase HTTPS. Successful TLS handshakes still require phase 5 receiver evidence. |
| P2: broad SDK prefix matching also excluded application targets such as `opentelemetry_user`. | Diagnostic classification now matches reserved SDK/transport crate and module boundaries. A regression test observes the similarly named application target locally and remotely. |
| P2/phase 3 interaction: enabling TRACE verbosity could expose arbitrary SDK/transport messages/fields, including credentials. | The local JSON formatter emits only severity, target, and callsite for these diagnostic targets. Their spans are excluded so sensitive internal span fields cannot be inherited into ordinary local logs. Diagnostics remain excluded from remote logs/span events. |
| Bridge interaction: legacy `log` events have generic tracing metadata, allowing diagnostic payloads to bypass local redaction and losing the original remote target. | Event-time filtering and formatting normalize original metadata; a small logger adapter preserves original legacy targets while retaining the official OpenTelemetry bridge. Isolated child tests reproduce the leak before the fix and verify sanitized output, original targets, and exactly one application record afterward. |
| Previously recorded full-suite blocker: non-Rust generated documentation examples and a missing OAuth example import. | Generated examples are explicitly marked as text; the real OAuth example imports its function and remains compile-checked with `no_run`, because it requires deployment environment configuration. The complete suite now passes, including the OAuth doctest. |

The parser continues to perform no network/provider construction, reads explicit
test inputs, and reports errors without storing/echoing user values. Its previous
invalid-IP-literal regression remains covered. The three-signal provider selection,
partial construction cleanup, Drop cleanup with retained clones, pending-log
flush, failed shutdown cleanup, and startup/sampler lifecycle checks remain green.
No production sampling policy, metric interval, or resource metadata changed.

## Commands and observed results

From `backend/server`:

| Check | Exit | Result |
| --- | --- | --- |
| Baseline `cargo test --locked --offline --lib --bins` in the sandbox | 101 | 33 passed, 1 failed: HTTPS exporter construction could not access the system certificate store. |
| Same baseline with local Postgres/system certificate-store access | 0 | 34 tests per target passed, 68 executions. The sandbox failure is an environment prerequisite, not evidence of a code regression. |
| Red `cargo test --locked --offline --lib telemetry::config::tests::malformed_endpoints_are_rejected` | 101 | The new malformed-escape cases were incorrectly accepted. |
| Green `cargo test --locked --offline --lib --bins` after parser/TLS fixes | 0 | 34 tests per target passed. |
| Final `cargo test --locked --offline` with required local access | 0 | 38 tests per unit target, plus 1 passing and 1 pre-existing ignored doctest. See [phase-3.md](phase-3.md) for the final commands and source snapshot. |
| Production subprocess probes, each bounded to five seconds | 0 (probe script) | Invalid escaping, invalid bracketed host with synthetic credentials, invalid LOG_LEVEL, and blank endpoint/invalid interval each returned the expected sanitized startup error with no stdout. |

The generated-file changes were verified to affect documentation comments only:
removing `///` lines from original and modified versions yields identical source
in all three affected generated files. No generated Rust declarations changed.

Session evidence: `/tmp/chaos-phase3-baseline.log`,
`/tmp/chaos-phase3-baseline-unrestricted.log`, `/tmp/chaos-review12-red.log`,
`/tmp/chaos-review12-green.log`, `/tmp/chaos-phase3-legacy-red.log`, and
`/tmp/chaos-phase3-complete-tests.log`.

## Limits

No known finding from this review remains unfixed. Independent review, real
receiver-backed gRPC/TLS ingestion, collector outages/recovery, and the later
workflow/synchronization matrix remain pending. A construction test or in-memory
export is not proof of actual network ingestion. The user explicitly requested
continuation into phase 3; no independent PASS is claimed for the prerequisite
gates.
