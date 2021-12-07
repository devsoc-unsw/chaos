# Setup guide

* Install the latest (stable) Rust toolchain with [rustup](https://rustup.rs/)
* Install postgres with associated dev tools, eg. `sudo apt install postgresql-all`
* Setup postgres accordingly
* Install diesel-cli with `cargo install diesel_cli --no-default-features --features postgres`
* Run `diesel setup && diesel migration run`
* Run the server with `cargo run`
