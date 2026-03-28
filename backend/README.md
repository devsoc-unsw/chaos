# CHAOS Backend

CHAOS' backend is implemented in Rust and for data persistence, we use PostgreSQL.

## Table of Contents

- [Dev Setup](#dev-setup)
- [Code Structure](#code-structure)
- [Tech Stack](#tech-stack)


## Dev Setup

### Backend Development
To run the backend in a dev/testing environment:
1. Install `docker-compose` (see [official installation guide](https://docs.docker.com/compose/install/)).
2. Navigate to the directory this file is in (`backend`) in your terminal (not `backend/server`).
3. Possibly terminate any running instances of postgres, as the dockerized postgres we will spawn uses the same default port, so the two might interefere with each other.
4. If you are using WSL/Linux, install the OpenSSL development package with `sudo apt install libssl-dev`.
5. Run `./setup-dev-env.sh` (you might have to make it executable before with `chmod +x setup-dev-env.sh`), which should drop you into a new shell that has the required tools installed. This will install the SQLx CLI (for managing database transactions) and start a Postgres container in Docker.
6. Now open a **new** terminal session to complete the following tasks, keeping the shell script from above running.
7. Seed the database with demo data by running `cargo run -- --email <YOUR_GMAIL>` in the `backend/database-seeding` folder.
8. Now, go back to the `backend/server` directory and you should be able to `cargo build` successfully.
9. Once you exit out of the newly created shell from step 5 (e.g. type `exit`, or kill the terminal), the dockerized postgres instance should automatically be torn down, so it's not unnecessarily running in the background all the time.
10. To resume development, open the Docker Desktop app and press the play button on the right of the "backend" group under the "Containers" tab. This will start the Postgres container. To shut down the container, press the stop button that has replaced the play button.

### Authentication
Some routes are only accessible by Users/Admins/SuperAdmins. To login your browser with a respective User/Admin/SuperAdmin cookie, seed your database as above (step 5), and then call one of the following routes in your browser:
- **Normal User:** `/api/v1/dev/user_login`
- **Organisation Admin User:** `/api/v1/dev/org_admin_login`
- **Super Admin User:** `/api/v1/dev/super_admin_login`

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