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
