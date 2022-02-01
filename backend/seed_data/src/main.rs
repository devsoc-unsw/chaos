mod seed;

use dotenv;

fn main() {
    dotenv::dotenv().ok();
    seed::seed();
}
