# Setup guide

* Install the latest (stable) Rust toolchain with [rustup](https://rustup.rs/)
* Install postgres with associated dev tools, eg. `sudo apt install postgresql-all`
* Download and save the backend `.env.development` file from vault to the root of the backend folder.
* Setup postgres accordingly
   * Make sure the user is named `postgres` and the password is the same as the one in vault `.env` file
   * the password is in the `DATABSE_URL` field, which will look very similar to `postgres://postgres:<password>@localhost/chaos`
* Install diesel-cli with `cargo install diesel_cli --no-default-features --features postgres`
* Run `diesel setup && diesel migration run`
  * this might delete code in the backend, make sure to restore any deletions.  
* Run the server with `cargo run`
  * If you want to run the server and get it to restart upon changes, you can install `cargo watch` with `cargo install cargo-watch`
  * Then, run `cargo watch -x run` instead
  * It will watch files and continually re-compile upon changes
* If there are errrors, ask on discord. 
