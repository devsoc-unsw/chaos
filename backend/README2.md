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

1.2. docker compose -f docker-compose.local.yml up -d
1.3. docker exec -it chaos-dev-container bash (this will enter your dev container)
1.4. Then you can run the project locally in here without the worry of not working on your machine (I 100% sure broo!)

2. Navigate to the directory this file is in (`backend`) in your terminal (not `backend/server`).

3. Possibly terminate any running instances of postgres, as the dockerized postgres we will spawn uses the same default port, so the two might interefere with each other.

4. If you are using WSL/Linux, install the OpenSSL development package with `sudo apt install libssl-dev`.

5. Run `./setup-dev-env.sh` (you might have to make it executable before with `chmod +x setup-dev-env.sh`), which should check if you have the correct docker setup and run the db-instance and do db setup and migrations. Then, it will also start your BE and FE container, so you could work on the project ASAP.

6 (DB Seeding IMPORTANT). To set up your first data for development, please get in `./setup-admin-db-dev.sh` and change GMAIL to your personal gmail. What it does is basically setup your personal email as a SUPERUSER ROLE, giving you access to all pages (no restriction).
After that, run `./setup-admin-db-dev.sh` (you might have to make it executable before with `chmod +x setup-admin-db-dev.sh`).

7. To run the FE and BE, you can either run it locally or using the docker:
    - Local:
        at `backend/server`: do `cargo run build` to run the backend server.
        at `frontend-nextjs`: do `bun run dev` to run the frontend.
    - Docker:
        at the root `chaos/` folder,
        do `docker compose -f docker-compose.local.yml up -d frontend backend`
        do `docker compose -f docker-compose.local.yml up -d` to run all 3 (db, FE and BE)
                    or 
        If you want to run those seperately:
        do `docker compose -f docker-compose.local.yml up -d backend`
        do `docker compose -f docker-compose.local.yml up -d frontend`

7 (Optional). If you want to clear the database, an empty database to restart maybe, run `./reset-db-dev.sh` (you might have to make it executable before with `chmod +x ./reset-db-dev.sh`).


### Authentication
Some routes are only accessible by Users/Admins/SuperAdmins. To login your browser with a respective User/Admin/SuperAdmin cookie, seed your database as above (step 6), and then call one of the following routes in your browser:
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