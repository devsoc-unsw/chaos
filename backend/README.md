# CHAOS Backend

CHAOS' backend is implemented in Rust and for data persistence, we use PostgreSQL.

## Table of Contents

- [Dev Setup](#dev-setup)
- [Code Structure](#code-structure)
- [Tech Stack](#tech-stack)


## Dev Setup

To run the backend in a dev/testing environment:
1. Install `docker-compose` (see [official installation guide](https://docs.docker.com/compose/install/)).
2. Navigate to the directory this file is in (`backend`) in your terminal (not `backend/server`).
3. Possibly terminate any running instances of postgres, as the dockerized postgres we will spawn uses the same default port, so the two might interefere with each other.
4. Run `./setup-dev-env.sh` (you might have to make it executable before with `chmod +x setup-dev-env.sh`), which should drop you into a new shell that has the required tools installed.
5. Now, you can `cd server` and should be able to `cargo build` successfully.
6. Once you exit out of the newly created shell (e.g. type `exit`, or kill the terminal), the dockerized postgres instance should automatically be torn down, so it's not unnecessarily running in the background all the time.


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
- [SQLx](https://github.com/launchbadge/sqlx) - Queries and Migrations
- PostgreSQL

### AuthN
- OAuth 2 (Google)

### AuthZ
- JWT

### Storage
- Object storage
