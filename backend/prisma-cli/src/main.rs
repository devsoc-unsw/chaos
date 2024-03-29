fn main() {
    dotenvy::dotenv().unwrap();
    prisma_client_rust_cli::run();
}
