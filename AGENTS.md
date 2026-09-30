# Agent Guidelines for Chaos Repository

## Build/Lint/Test Commands

### Frontend (Next.js/TypeScript)

- **Start dev server**: `cd frontend-nextjs && bun run dev`
- **Build**: `cd frontend-nextjs && bun run build`
- **Start production server**: `cd frontend-nextjs && bun run start`

### Backend (Rust)

- **Build**: `cd backend/server && cargo build`
- **Run**: `cd backend/server && cargo run`
- **Format**: `cd backend/server && cargo fmt`
- **Check**: `cd backend/server && cargo check`
- **Test**: `cd backend/server && cargo test`

### Database

- **Run migrations**: Run `sqlx migrate run` in `backend` directory
- **Create new migrations**: Run `sqlx migrate add <name>` e.g. `sqlx migrate add user_settings` in `backend` directory. This will create a file of the format `<time>_name.sql` in `backend/migrations` directory
- **Foreign keys on SpiceDB-owned tables**: a child table that references a parent which also exists in SpiceDB must use `ON DELETE CASCADE`. Sequin removes a deleted row's SpiceDB relationships explicitly, from that row's own delete message, so a child row that outlives its parent keeps a relationship pointing at a resource that no longer exists. CASCADE makes Postgres delete the child too, which delivers the child message that removes its relationship. `ON DELETE RESTRICT` is only correct when the child must block deletion of a still-referenced parent; `NO ACTION`/`SET NULL` leave a dangling relationship and need a deliberate manual delete.

## Architecture Overview

### Backend (Rust/Axum)

The backend follows a clean architecture pattern with three main layers:

**Handler Layer** (`backend/server/src/handler/`):

- Contains HTTP request handlers organized by domain (user, application, campaign, etc.)
- Each handler module contains structs with methods that process HTTP requests
- Handlers extract data from requests, call service layer methods, and return responses
- All handler functions must be documented with `///` comments explaining purpose, parameters, and return values
- Example: `UserHandler` has methods like `get()`, `update_name()`, `update_pronouns()`

**Service Layer** (`backend/server/src/service/`):

- Contains business logic and database operations
- Each service module handles the core functionality for its domain
- Services interact directly with the database using SQLx
- All service functions must be documented with `///` comments
- **Database Optimization**: Minimize DB queries per function to reduce round trips
- **Complex Queries**: Use large SQL queries with nested one-to-many objects as vectors of `sqlx::Json`
- Includes authentication (JWT, OAuth2), email handling, and file storage

**Model Layer** (`backend/server/src/models/`):

- Contains data structures and database interaction logic
- Each model represents a database entity with serialization/deserialization
- Models use SQLx traits like `FromRow` for database mapping
- All structs and their fields must be documented with `///` comments
- Includes error types, authentication structs, and utility types

**Key Patterns**:

- Database transactions are handled via `DBTransaction` wrapper
- **Authorization (SpiceDB)**: Authorization checks use SpiceDB, not custom Postgres checks:
  - Handlers authorize requests with the `SpiceDbAuth<P>` extractor (`backend/server/src/spicedb/mod.rs`), where `P` is a zero-sized policy type from `backend/server/src/spicedb/policies.rs` implementing `SpiceDbPolicy` (resource type, permission, path parameter). Add new policies there as plain impls.
  - For resources whose ID is not a path parameter, call `AppState::check_permission` directly in the handler.
  - Compound rules (e.g. "owner or reviewer") belong in the SpiceDB schema as a single permission, not in Rust code.
- **SpiceDB relationship writes**: Queue relationship writes on `DBTransaction` with `create_spicedb_relationship`/`delete_spicedb_relationship` alongside the Postgres changes; `DBTransaction::commit()` applies them (Postgres first, then one atomic SpiceDB batch). Always call `transaction.commit()` instead of `transaction.tx.commit()` so queued writes flush.
- **SpiceDB catch-up (Sequin)**: Sequin streams Postgres changes to `POST /api/v1/sequin/spicedb`, which maps each changed row to the relationships it owns and applies a batch as one coalesced `WriteRelationships` call. The mapping lives in `backend/server/src/service/sequin.rs`; add a table there when a new table owns relationships. The sink is declared in `backend/sequin/sequin.yaml`, which Sequin applies on startup, so no console setup is needed. One `WriteRelationships` call rejects two updates to the same relationship, so changes must be coalesced per relationship before writing. Deletes are explicit per relationship rather than a filtered delete of everything touching a resource, which is only safe because cascades deliver a delete message for every child (see the foreign key note under **Database**).
- **ZedToken freshness**: The stored token in `AppState::spicedb_zedtoken` is written only by `spicedb::apply_zedtokens()`, the sole writer. Every SpiceDB write originates in this process, so each write path (`DBTransaction::commit`, `spicedb::delete_all_resource_relationships`, the Sequin webhook handler) publishes its returned token over `AppState::spicedb_token_tx`; there is no Watch stream, since a write made elsewhere cannot happen. Tokens are applied in publication order and never compared (ZedTokens are opaque and not reliably ordered), so a concurrent pair of writes can publish out of order and leave the boundary briefly stale. A stale token still reads correctly from its own revision, but `at_least_as_fresh` can then be served a snapshot older than a recent grant or revocation, so permission results may be briefly stale. Until the first write, the token is unset and checks use `MinimizeLatency`.
- Authentication uses JWT tokens with Google OAuth2 integration
- File storage uses S3-compatible services
- Email functionality via Lettre library
- ID generation using Snowflake algorithm
- **Database Query Optimization**: Minimize DB round trips by using complex queries with nested data:
  ```sql
  -- Example: Get campaign with all roles and questions in one query
  SELECT
    campaigns.*,
    COALESCE(json_agg(DISTINCT roles.*) FILTER (WHERE roles.id IS NOT NULL), '[]') as roles,
    COALESCE(json_agg(DISTINCT questions.*) FILTER (WHERE questions.id IS NOT NULL), '[]') as questions
  FROM campaigns
  LEFT JOIN roles ON roles.campaign_id = campaigns.id
  LEFT JOIN questions ON questions.campaign_id = campaigns.id
  WHERE campaigns.id = $1
  GROUP BY campaigns.id
  ```
- **i64 ID Serialization**: All i64 IDs must use `#[serde(serialize_with = "crate::models::serde_string::serialize")]` and `#[serde(deserialize_with = "crate::models::serde_string::deserialize")]` to convert between i64 and string representations for JavaScript compatibility
- **API Documentation**: All handler endpoints must be documented in `backend/api.yaml` with:
  - `operationId`: Unique identifier for the operation
  - `description`: Clear description of what the endpoint does
  - `tags`: Appropriate categorization (e.g., "User", "Auth", "Campaign")
  - Request/response schemas with examples
  - Error response definitions

## Code Style Guidelines

### Rust (Backend)

- **Formatting**: Standard rustfmt (enforced by pre-commit)
- **Naming**: Standard Rust conventions (snake_case for functions/variables, PascalCase for types)
- **Error handling**: Use `anyhow` and `thiserror` for consistent error types
- **Async**: Use `tokio` runtime with async/await patterns
- **Documentation**: All functions and structs must be documented with `///` comments
- **API Documentation**: All new handler functions must be documented in `backend/api.yaml` using OpenAPI 3.0.0 specification
- **Database Optimization**: Minimize DB queries per function to reduce round trips:
  - Use complex SQL queries with JOINs and aggregations
  - Return nested one-to-many relationships as `Vec<sqlx::Json<T>>`
  - Prefer single queries over multiple round trips when possible
- **i64 ID Handling**: All i64 IDs must be serialized as strings for JavaScript compatibility:

  ```rust
  #[serde(serialize_with = "crate::models::serde_string::serialize")]
  #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
  pub id: i64,
  ```

  - Use the existing `serde_string` module functions for serialization
  - Frontend TypeScript types must use `string` type for all ID fields
  - This prevents JavaScript Number precision issues with large integers

### General

- **Pre-commit**: Run `pre-commit install` to enable automatic formatting/linting
- **No unused vars**: Prefix with `_` to ignore, or remove if truly unused
- **Security**: Never commit secrets, use environment variables via `.env` files
