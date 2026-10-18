# Live telemetry for the Chaos backend

For a function-by-function explanation and the OTLP gRPC data flow, see
[TELEMETRY_IMPLEMENTATION.md](TELEMETRY_IMPLEMENTATION.md).

Telemetry is integrated into `backend/server`, not just the standalone example.
It runs continuously for the lifetime of the real server.

## Run the backend and frontend yourself

Open each terminal at the repository root (`chaos`). Keep the backend and frontend
terminals running while testing. These instructions run the real Rust server and
Next.js app; you do not need to run `backend/telemetry-example`.

Prerequisites: Docker Desktop running, Rust/Cargo, Bun, and the SQLx CLI for
migrations. Keep your existing credentials in the ignored environment files.

### 1. Check local configuration

For native development, confirm these values in `backend/.env`:

```dotenv
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
COOKIE_DOMAIN=localhost
DEV_ENV=dev
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/callback/google
SPICEDB_GRPC_ENDPOINT=http://localhost:50051
TELEMETRY_INTERVAL_SECS=1
RUST_LOG=server=info
```

`DATABASE_URL` must connect to the local `chaos` database at `localhost:5432` using
credentials matching `docker-compose.local.yml`. `SPICEDB_KEY` must match that
file's `SPICEDB_GRPC_PRESHARED_KEY`. Keep `JWT_SECRET`, Google client credentials,
`CHAOS_SUPER_USER_EMAIL`, `SEQUIN_WEBHOOK_SECRET`, SMTP settings, and S3 settings
configured too: the server initializes these even when you only test telemetry.
The Google OAuth client must allow the exact callback URI above for local login.

Use `localhost` consistently in the browser and configuration; mixing it with
`127.0.0.1` can prevent cookies from being sent. The frontend command below sets
both its browser API URL and server-side API URL, overriding any Docker-oriented
URLs in the existing frontend environment files.

For terminal span/metric output, leave `OTEL_EXPORTER_OTLP_ENDPOINT` unset. If it
is set in your shell or environment file, remove it for this manual test; otherwise
spans/metrics are exported to that collector instead of stdout. JSON logs still
appear in either mode.

### 2. Start the database and SpiceDB — terminal A

```sh
docker compose -f docker-compose.local.yml up -d db spicedb
docker compose -f docker-compose.local.yml ps
```

Compose also starts the SpiceDB database and migration dependency. PostgreSQL
should become healthy and SpiceDB should be running. This minimal setup does not
start Sequin; direct backend relationship writes still operate. CDC/reconciliation
needs the separate Sequin services and webhook configuration.

Apply database migrations **before compiling**, because SQLx validates queries
against the database at build time:

```sh
cd "$(git rev-parse --show-toplevel)/backend"
sqlx migrate run
```

### 3. Run the backend with clean log files — terminal B

Before launching, check whether a backend is already listening:

```sh
lsof -nP -iTCP:8080 -sTCP:LISTEN
curl -i http://localhost:8080/
```

If a process is listed and curl returns HTTP 200, the backend is already running.
Use it and skip the startup command, or stop that backend in its original terminal
with Ctrl+C before restarting. A second backend fails with `Address already in use`.
Do not run two instances with the same redirected log filenames: `>` truncates
those files even if the new instance later fails to bind.

Starting from the repository root:

```sh
cd "$(git rev-parse --show-toplevel)/backend/server"
cargo build
RUST_LOG=server=info TELEMETRY_INTERVAL_SECS=1 ./target/debug/server \
  > /tmp/chaos-telemetry.log 2> /tmp/chaos-server.jsonl
```

This command stays running. A quiet terminal is expected because both streams
are redirected. `HTTP server listening` appears in the JSON log after successful
startup. The backend listens at **http://localhost:8080**.

For all output directly in the backend terminal instead, use:

```sh
cd "$(git rev-parse --show-toplevel)/backend/server"
RUST_LOG=server=info TELEMETRY_INTERVAL_SECS=1 cargo run
```

Choose one backend command, not both. The direct `cargo run` version does not create
the two log files used below. Building first and running the executable keeps
Cargo's compiler messages out of the JSON Lines file.

### 4. Run the frontend — terminal C

Check port 3000 first:

```sh
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

If the frontend is already running, use it or stop it in its original terminal
before restarting. Then run:

```sh
cd "$(git rev-parse --show-toplevel)/frontend-nextjs"
bun install --frozen-lockfile
NEXT_PUBLIC_APP_URL=http://localhost:3000 \
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 \
NEXT_API_BASE_URL=http://localhost:8080 \
bun run dev --port 3000
```

Open **http://localhost:3000**. Keep Next.js on port 3000 so it matches the backend's
CORS/cookie configuration. The frontend itself does not contain a telemetry
dashboard; watch the backend output in the following terminals.

### 5. Observe updates — terminals D and E

Watch structured JSON logs:

```sh
tail -n 20 -f /tmp/chaos-server.jsonl
```

Watch detailed OpenTelemetry span and metric exports:

```sh
tail -n 100 -f /tmp/chaos-telemetry.log
```

If `jq` is installed, use this optional filtered live view instead of terminal D's
command:

```sh
tail -n 0 -f /tmp/chaos-server.jsonl | jq --unbuffered -c \
  'select(.fields.message == "Performance sample recorded" or .fields.message == "HTTP request completed")'
```

JSON logs go to stderr. Span/metric stdout dumps are human-readable text, not JSON.
Both are actual live output, not the example's saved `SAMPLE_OUTPUT.txt`. After CPU
warm-up, performance summaries continue even when you are not clicking anything.
Metric exports use their own timer, so allow a few seconds for the first populated
metric block. Request spans appear when each request completes.

## Manual test checklist

With the frontend/backend running, use the browser and a spare terminal:

| Action | Expected application result | Expected telemetry |
| --- | --- | --- |
| `curl -i http://localhost:8080/` | HTTP 200 and the DevSoc message | `HTTP request completed`, status 200, trace ID, request span |
| `curl -i http://localhost:8080/api/v1/user` without a cookie | HTTP 401 | Request span/status 401; this is an expected authentication rejection |
| `curl -i http://localhost:8080/does-not-exist` | HTTP 404 | Route label `unmatched`; no metric label for the arbitrary URL |
| Sign in through the frontend's Google login | Local authenticated session, assuming OAuth is configured | Auth/request spans, followed by authenticated API requests |
| Open the dashboard and browse accessible organisations/campaigns | Data loads for resources you can access | Request durations and nested SpiceDB permission-check spans |
| Submit an open application with valid role preferences, if one is available | Submission succeeds when validation and permission checks pass | `application.submit`, `application.persist_submission`, and transaction commit spans |
| Leave the app idle for 10 seconds | Server stays running | CPU/RAM/process memory, disk/network, and available temperature metrics keep being exported |
| Navigate/refresh while watching logs | New API calls complete | New trace IDs and request durations; hardware readings continue independently |

Your local account `qizahdahza@gmail.com` was granted the database `SuperUser` role.
After signing in as that account, open
**http://localhost:8080/api/v1/user/is_superuser** in the same browser; the expected
response contains `"is_superuser": true`. A plain curl command does not carry your
browser's cookie. This checks the local role; specific resource permissions still
follow the SpiceDB schema.

In the detailed metric stream, look for:

| Name | Interpretation |
| --- | --- |
| `chaos.host.cpu.usage` | Average/per-core CPU percentage |
| `chaos.host.memory` | Used/available/total host RAM in bytes |
| `chaos.process.memory` | Resident/virtual memory of the Rust server, not Next.js |
| `chaos.host.disk.space` | Available/total capacity per mount |
| `chaos.host.network.bytes_since_previous_sample` | Received/transmitted bytes per interface during the previous sample interval |
| `chaos.host.sensor.temperature` | Celsius values for readable component sensors |
| `chaos.host.temperature.available` | 1 when any valid sensor is readable; otherwise 0 |
| `http.server.request.count` / `http.server.request.duration` | Request totals and duration histograms by method, route template, and status |

Hardware values need not change every second. Repeated readings with new timestamps
show that polling is active; changing values depend on actual system activity.
Disk/network values and individual temperatures are in metric blocks; the compact
JSON performance summary contains host CPU, used host RAM, and sensor count.

## Troubleshooting and stopping

- **Port 8080 or 3000 is occupied:** identify the listener with `lsof`, stop the
  intended process, and restart. Do not let Next.js switch ports without updating
  `FRONTEND_URL` and `ALLOWED_ORIGINS` to match.
- **Database errors during `cargo build`:** confirm PostgreSQL is healthy, check
  `DATABASE_URL`, and run `sqlx migrate run` from `backend`.
- **Backend exits immediately:** inspect `/tmp/chaos-server.jsonl`; missing server,
  OAuth, SMTP, or S3 settings can prevent startup before HTTP is available.
- **Frontend requests target `backend:8080`:** use the terminal C command with
  `NEXT_API_BASE_URL` and restart the frontend.
- **Turbopack says `Failed to check database invalidation and cleanup` or
  `Directory not empty`:** stop all frontend dev instances first. Move the generated
  cache aside, preserving it for diagnosis, then restart terminal C's command:

  ```sh
  cd "$(git rev-parse --show-toplevel)/frontend-nextjs"
  mv .next/dev/cache/turbopack ".turbopack-cache-backup-$(date +%s)"
  ```

  If the error persists, use `bun run dev --webpack --port 3000` with the same
  three API/app environment settings from terminal C. Webpack bypasses the
  Turbopack cache. Only run one frontend dev server at a time.
- **CORS or login-cookie errors:** use `localhost` everywhere and check the origin,
  frontend URL, cookie domain, and OAuth callback configuration.
- **No performance samples:** check for `Performance sampling stopped`, confirm
  `TELEMETRY_INTERVAL_SECS` is positive, and use `RUST_LOG=server=info`.
- **No stdout metric blocks:** check whether an OTLP endpoint is configured; in
  that mode, use the collector's output/dashboard instead.
- **No temperatures:** sensor access depends on OS/hardware/permissions. An
  availability value of 0 is supported behavior; no temperature is fabricated.

Ctrl+C in terminal B stops the backend, drains requests, stops sampling/workers,
and flushes exporters. Ctrl+C in terminal C stops the frontend. Ctrl+C in D/E stops
only the log viewer. To stop just the local database/authorization services:

```sh
docker compose -f docker-compose.local.yml stop db spicedb spicedb-db
```

This preserves local database volumes. Log files persist until overwritten or
removed. The backend also handles SIGTERM for graceful shutdown.

## What is recorded

- HTTP server spans cover routing, authentication extractors, and handler work.
  Logs include the trace ID, response status, and time to produce the response.
  Incoming W3C `traceparent`/`tracestate` context is extracted. Request bodies,
  cookies, authorization headers, and query strings are not recorded.
- Request count and duration are labelled by method, route template, and status.
  Unmatched URLs share the `unmatched` label rather than generating a metric
  series for each requested URL. Streaming body transfer time is not measured.
- Shared SpiceDB permission checks record resource/user IDs, permission, and
  allowed/denied outcome. Transaction commits and application submission have
  nested spans. Add `#[tracing::instrument(skip_all, fields(...))]` to further
  business operations as needed; arbitrary functions are not traced automatically.
- Continuous performance metrics cover average/per-core CPU usage, available CPU
  frequency, RAM, swap, load average, this server process's CPU and memory,
  filesystem capacity, interface traffic, and readable component temperatures.
  They use custom `chaos.*` metric names and units `%`, `By`, `MHz`, and `Cel`.
- Temperatures are per hardware sensor, not necessarily CPU sensors. If no sensor
  is readable, a warning and `chaos.host.temperature.available=0` are emitted;
  no zero-degree temperature is invented. Availability varies with OS/hardware
  permissions. Host sensors may be unavailable inside containers.

The sampler primes CPU readings before waiting for the first interval. It runs
on a separate worker so OS queries do not block request executor threads. The
sampling/export interval defaults to five seconds; `TELEMETRY_INTERVAL_SECS` must
be a positive integer. Sampling/export scheduling can shift the actual interval.
Metrics export independently of `RUST_LOG`; filtering a trace disables that span.

Process memory refers to this backend process. Resident memory is physical RAM;
virtual memory is address space. Process CPU can exceed 100% across cores. Load
averages are not percentages. Network gauges show bytes since the previous sample,
not cumulative totals or bytes/second. Disk mounts can share storage, so do not
sum their capacities. These metrics do not attribute CPU/RAM to individual spans.

## Export to a monitoring backend

Set a gRPC collector endpoint to replace stdout export with batched OTLP traces
and periodic OTLP metrics:

```sh
cd "$(git rev-parse --show-toplevel)/backend/server"
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
  OTEL_SERVICE_NAME=chaos-server \
  RUST_LOG=server=info TELEMETRY_INTERVAL_SECS=5 cargo run
```

The collector must have a gRPC OTLP receiver and trace/metric pipelines, connected
to your telemetry storage/dashboard. JSON logs remain on stderr; this change does
not export standalone OTLP logs or automatically start a dashboard. Outgoing HTTP
and gRPC trace context propagation needs instrumentation at those call sites.

For container deployment, host readings refer to the container/VM-visible system.
Use a host Collector agent for physical-host monitoring. Avoid also scraping the
same host metrics per replica; this in-process sampler is most useful for native
local development and the current process.

## Campaign permission tests

With local SpiceDB running, run from the repository root:

```sh
python3 backend/spicedb/test_campaign_permissions.py
```

These four integration tests create and remove isolated relationships. They verify
that global superusers and organisation admins can manage campaigns, while members
and unrelated users cannot. Campaign management includes the banner upload step
after campaign creation. A successful creation followed by a failed upload can
leave a campaign already saved; check the campaign list before retrying creation.

## HTTP telemetry tests

With the local database running and `backend/.env` configured, run:

```sh
cd "$(git rev-parse --show-toplevel)/backend/server"
cargo test --lib telemetry::tests
```

These six tests use the real middleware with isolated in-memory exporters. They
verify GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS; rejected requests; 5XX
error spans; unmatched routes; W3C trace propagation; request counters and duration
histograms; and exclusion of credentials, bodies, query strings, and raw IDs.
They exercise HTTP telemetry rather than each handler's business logic.

To run all backend library and binary tests, including hardware telemetry:

```sh
cargo test --lib --bins
```

An unrestricted `cargo test` also runs documentation examples. The current
repository has 40 failing documentation tests, mostly generated protobuf examples
that Rust interprets as code, plus an existing OAuth example. These are separate
from the passing library/binary telemetry tests; `--lib --bins` does not run them.

## Hardware telemetry tests

With the local database running and `backend/.env` configured, run:

```sh
cd "$(git rev-parse --show-toplevel)/backend/server"
cargo test --lib telemetry::performance::tests
```

The tests use isolated OpenTelemetry in-memory exporters and controlled hardware
snapshots, so expected values are repeatable even when CPU load, memory usage,
network devices, and sensor availability differ between machines. They verify
exported gauge values, byte/Celsius/percentage units, updated readings, removal of
unavailable sensors/interfaces, CPU warm-up, continuous polling, invalid intervals,
hardware-source errors, and shutdown. They do not require temperature sensors to
exist on the test machine.

The sampler uses observable gauges backed by the latest complete snapshot.
A disconnected sensor or network interface therefore disappears on the next metric
collection, rather than leaving its last value looking like a current reading.
`chaos.host.temperature.available` reports whether any finite reading exists.
