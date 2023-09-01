use backend::rocket::rocket;
use rocket::{local::blocking::Client, tokio};


#[test]
fn rocket_launch() {
    // Use tokio Runtime to block on roeckt() to avoid runtime within runtime error
    // see https://stackoverflow.com/questions/62536566/how-can-i-create-a-tokio-runtime-inside-another-tokio-runtime-without-getting-th/62536772#62536772
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();

    let test_rocket = rt.block_on(async { rocket().await });

    let client = Client::tracked(test_rocket).expect("valid rocket instance");
    assert_eq!(4, 4);
}