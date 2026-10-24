//! Management API regressions run without Docker or shared environment mutation.

use super::*;
use axum::{
    http::{HeaderMap, StatusCode},
    routing::post,
    Json, Router,
};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};

/// A multi-table sink needs one authenticated table request and must stop on rejection.
#[tokio::test]
async fn backfills_specify_every_table_and_propagate_rejection() {
    let tables = Arc::new(Mutex::new(Vec::new()));
    let reject = Arc::new(AtomicBool::new(false));
    let seen = tables.clone();
    let rejected = reject.clone();
    let app = Router::new().route(
        "/backfills",
        post(move |headers: HeaderMap, Json(body): Json<Value>| {
            let seen = seen.clone();
            let rejected = rejected.clone();
            async move {
                assert_eq!(headers.get("authorization").unwrap(), "Bearer fixture");
                let table = body["table"]
                    .as_str()
                    .expect("multi-table API requires table")
                    .to_owned();
                seen.lock().unwrap().push(table.clone());
                if rejected.load(Ordering::SeqCst) && table == "public.organisation_members" {
                    StatusCode::BAD_REQUEST
                } else {
                    StatusCode::NO_CONTENT
                }
            }
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("http://{}/backfills", listener.local_addr().unwrap());
    let (stop, stopped) = tokio::sync::oneshot::channel();
    let server = tokio::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(async {
                let _ = stopped.await;
            })
            .await
            .unwrap();
    });
    let client = reqwest::Client::new();
    request_table_backfills(&client, &endpoint, "fixture")
        .await
        .unwrap();
    assert_eq!(
        *tables.lock().unwrap(),
        REPLICATED_TABLES
            .iter()
            .map(|table| format!("public.{table}"))
            .collect::<Vec<_>>()
    );
    tables.lock().unwrap().clear();
    reject.store(true, Ordering::SeqCst);
    assert!(request_table_backfills(&client, &endpoint, "fixture")
        .await
        .is_err());
    assert_eq!(
        *tables.lock().unwrap(),
        vec![
            "public.users",
            "public.organisations",
            "public.organisation_members"
        ]
    );
    let _ = stop.send(());
    tokio::time::timeout(Duration::from_secs(3), server)
        .await
        .unwrap()
        .unwrap();
}
