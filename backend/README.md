# CHAOS Backend

CHAOS' backend is implemented in Rust and for data persistence, we use PostgreSQL.

## Code Structure
### Service
The service module contains all functions that conduct business logic, and also interact with the database. This
separation from the request handling makes it easy to swap out any new form of requests, but reuse the same business
logic.

### Handler
The handler module takes care of request handling. It implements the framework or library we are using, invokes the
service functions and responds via HTTP  with their return values.

### Middleware
The middleware module contains middlewares, functions that run before or after the function handlers. A common use case
is authorization, where middleware is used to find the userId from the user's token.

### Models
Models are Rust structs that represent the data. There must be a struct for each table in the database, as well as a
struct to describe the fully joined data. E.g. A campaign struct with a array of questions, even though questions are
stored as rows in a separate table. These models are used by the service functions when interacting with the database,
and also when conducting business logic.

#### Request Path
Request -> Middleware (optional) -> Handler -> Service -> Middleware (Optional) -> Response


## Tech Stack
### Web Server
- [Axum](https://github.com/tokio-rs/axum)

### Persistence
- [SQLx](https://github.com/launchbadge/sqlx) - Queries
- [Prisma](https://www.prisma.io/) - Migrations and Schema
- PostgreSQL

### AuthN
- OAuth 2 (Google)

### AuthZ
- JWT

### Storage
- Local file system
