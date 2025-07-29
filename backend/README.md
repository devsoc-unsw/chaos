<<<<<<< Updated upstream
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

### Handler
The handler module takes care of request handling. It implements the framework or library we are using, invokes the
service functions and responds via HTTP  with their return values.

### Middleware
The middleware module contains middlewares, functions that run before or after the function handlers. A common use case
is authorization, where middleware is used to find the userId from the user's token.

### Models
Models are Rust structs that represent the data. There must be a struct for each table in the database, as well as a
struct to describe the fully joined data. E.g. A campaign struct with a array of questions, even though questions are
stored as rows in a separate table. These models implement all functions that conduct business logic on the respective
entity, and also interact with the database. This separation from request handling makes it easy to swap out any new
form of requests, but reuse the same logic functions.

### Service
The service module contains all helper functions. For example, functions for determining a user's authorization to
mutate an object are defined here.

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
=======
<<<<<<< Updated upstream
# Setup guide

* Install the latest (stable) Rust toolchain with [rustup](https://rustup.rs/)
* Install postgres with associated dev tools, eg. `sudo apt install postgresql-all` (something like `brew install postgresql` for osx)
* Download and save the backend `.env` file from vault to the root of the backend folder.
* Setup postgres accordingly
   * Make sure the user is named `postgres` and the password is the same as the one in vault `.env` file
   * the password is in the `DATABSE_URL` field, which will look very similar to `postgres://postgres:<password>@localhost/chaos`
* Install diesel-cli with `cargo install diesel_cli --no-default-features --features postgres`
* Run `diesel setup && diesel migration run`
  * If you get a server connection error, check out [this stackoverflow thread](https://stackoverflow.com/questions/32439167/psql-could-not-connect-to-server-connection-refused-error-when-connecting-to)
  * this might delete code in the backend, make sure to restore any deletions.
* Run the server with `cargo run --bin server`
  * If you want to run the server and get it to restart upon changes, you can install `cargo watch` with `cargo install cargo-watch`
  * Then, run `cargo watch -x 'run --bin server'` instead
  * It will watch files and continually re-compile upon changes
* If there are errrors, ask on discord.


# Scripts

Scripts should be run from the `chaos/backend` directory:
 * `scripts/become_super_user`-  will prompt for the email address to turn into a GLOBAL super user
 * `scripts/seed.sh` - will wipe your database and add some dummy data
   * If you are getting a `bad variable nameread answer` error, ensure the file has LF-style newlines
=======
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
>>>>>>> Stashed changes
>>>>>>> Stashed changes
