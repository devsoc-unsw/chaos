# Chaos – Claude Code Guidelines

## Writing Tests

### Structure

Every test module must open with a TEST PLAN comment block before the `use`
statements. The block has four mandatory sections in this order:

```
// =========================================================================
// TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
// =========================================================================
//
// Functions under test
//   · <function_signature> -> <return_type>
//
// ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
//
// <function_name> – <input group label>
//
//  ID    Input    Class          Expected    Test
//  EP01  <input>  <description>  <outcome>   <test_fn_name>
//  ...
//
// ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
//
// <variable> (<type>)
// <one sentence describing the partition boundary>
//
//  ID    Value    Expected    Test              Status
//  BV01  <value>  <outcome>   <test_fn_name>    OK / not covered
//  ...
//
// ── KNOWN GAPS ────────────────────────────────────────────────────────────
//
//  · <ID range> — <2–4 sentences: what is untested, why it matters, what
//    risk it poses if left unaddressed>
// =========================================================================
```

### Helper functions

Group shared setup into private helper functions at the top of the test
module under a `// ── helpers ──` banner. Helpers must be deterministic and
free of side effects. Name them after what they produce, not what they do
(`test_keys()`, `default_validation()`, not `setup()` or `init()`).

### Test function names

Use plain snake_case that reads as a sentence describing the scenario:

- Happy path: `<thing>_<property>` — e.g. `payload_fields_match_internal_constants`
- Error path: `returns_<error>_for_<condition>` — e.g. `returns_none_for_expired_token`
- Property test: `<thing>_<property>` — e.g. `each_token_gets_unique_jti`

### Doc comment on each test

Every test function must have a one-line `///` doc comment that starts with
`White-box:` and states what internal behaviour or contract is being verified.

```rust
/// a token signed with a different secret must return None.
#[test]
fn returns_none_for_wrong_secret() { ... }
```

### Assertions

- Always assert the **contents** of a result, not just whether it succeeded.
  Prefer `assert_eq!(payload.sub, 42)` over `assert!(result.is_some())`.
- Include a human-readable message on assertions where the failure reason
  would not be obvious from the values alone.
- For non-deterministic values (timestamps, UUIDs), assert **properties**
  rather than exact values: bracket timestamps with `before`/`after`, assert
  UUIDs are non-nil and distinct across calls.

### Section banners

Separate logical groups of tests with a section banner comment:

```rust
// ── <Section name> ───────────────────────────────────────────────────────
```

Typical groups: helper functions, struct/field coverage, each public function
under test.

### Known gaps

If an EP or BVA case is identified but not yet covered, it must be listed in
the KNOWN GAPS section — never silently omitted. Each gap entry is 2–4
sentences: what is untested, why it matters, and what would happen if it is
not addressed.
