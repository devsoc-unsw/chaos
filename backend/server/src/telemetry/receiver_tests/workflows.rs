//! Opt-in real business routes and synchronization checks against disposable stores.

use super::*;
use crate::{models::app::AppState, spicedb::authzed::api::v1::relationship_update::Operation};
use anyhow::{ensure, Context as _};
use serde_json::{json, Value as Json};

/// Real HTTP client plus sanitized request expectations for receiver assertions.
struct Session {
    /// Test backend URL; never an externally configured application URL.
    base: String,
    /// Bounded loopback HTTP transport.
    client: reqwest::Client,
    /// Deterministic unique incoming trace ID sequence.
    sequence: u128,
    /// Expected status, method, path and incoming trace ID for each real request.
    calls: Vec<Json>,
}
impl Session {
    /// Sends a real routed request and checks its business result without logging credentials.
    async fn call(
        &mut self,
        method: &str,
        path: &str,
        token: Option<&str>,
        body: Option<Json>,
        status: u16,
    ) -> anyhow::Result<Json> {
        self.sequence += 1;
        let trace_id = format!("{:032x}", self.sequence);
        let mut request = self
            .client
            .request(method.parse()?, format!("{}{path}", self.base))
            .header("traceparent", format!("00-{trace_id}-1234567890123456-01"));
        if let Some(token) = token {
            request = request.header("cookie", format!("auth_token={token}"));
        }
        if let Some(body) = body {
            request = request.json(&body);
        }
        let response = request
            .send()
            .await
            .context("fixture HTTP request failed")?;
        ensure!(
            response.status().as_u16() == status,
            "{method} {path}: expected {status}, got {}",
            response.status().as_u16()
        );
        self.calls
            .push(json!({"method": method, "path": path, "status": status, "trace_id": trace_id}));
        Ok(response.json().await.unwrap_or(Json::Null))
    }

    /// Sends a fixture CDC webhook with controlled authentication and W3C context.
    async fn webhook(
        &mut self,
        state: &AppState,
        body: Json,
        authorized: bool,
        status: u16,
    ) -> anyhow::Result<()> {
        self.sequence += 1;
        let trace_id = format!("{:032x}", self.sequence);
        let response = self
            .client
            .post(format!("{}/api/v1/sequin/spicedb", self.base))
            .bearer_auth(if authorized {
                &state.sequin_webhook_secret
            } else {
                "invalid-fixture-key"
            })
            .header("traceparent", format!("00-{trace_id}-1234567890123456-01"))
            .json(&body)
            .send()
            .await?;
        ensure!(
            response.status().as_u16() == status,
            "CDC webhook: expected {status}, got {}",
            response.status()
        );
        self.calls.push(json!({"method":"POST", "path":"/api/v1/sequin/spicedb", "status":status, "trace_id": trace_id}));
        Ok(())
    }
}

/// Makes an actual permission decision with bounded polling for publication/cache freshness.
async fn permission(
    state: &AppState,
    user: i64,
    kind: &str,
    id: i64,
    name: &str,
    allowed: bool,
) -> anyhow::Result<()> {
    let deadline = Instant::now() + Duration::from_secs(20);
    loop {
        let result = tokio::time::timeout(
            Duration::from_secs(3),
            state.check_permission(user, kind, id, name),
        )
        .await?;
        if result.is_ok() == allowed
            && (allowed
                || matches!(
                    result,
                    Err(crate::models::error::ChaosError::ForbiddenOperation)
                ))
        {
            return Ok(());
        }
        ensure!(
            Instant::now() < deadline,
            "permission {kind}:{id}#{name} for user {user} did not converge to {allowed}"
        );
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
}

/// Creates an exact relationship update without logging request objects or bearer metadata.
fn update(
    operation: Operation,
    resource: &str,
    id: i64,
    relation: &str,
    subject: &str,
    user: i64,
) -> crate::spicedb::authzed::api::v1::RelationshipUpdate {
    crate::spicedb::new_relationship_update(operation, resource, id, relation, subject, user)
}

/// Applies a fixture write using production token publication, then checks via real permission reads.
async fn write(
    state: &AppState,
    updates: Vec<crate::spicedb::authzed::api::v1::RelationshipUpdate>,
) -> anyhow::Result<()> {
    let token =
        crate::spicedb::write_relationships(&state.spicedb, &state.spicedb_key, updates).await?;
    crate::service::sequin::publish_token(state, token);
    Ok(())
}

/// Builds a real Sequin message shape, explicitly distinguished from actual CDC delivery.
fn message(table: &str, action: &str, record: Json, changes: Json) -> Json {
    json!({"record": record, "action":action, "changes":changes, "metadata":{"table_schema":"public", "table_name":table}})
}

/// Requests a fixture transport outage/recovery and waits for the runner to acknowledge it.
async fn spicedb_available(available: bool) -> anyhow::Result<()> {
    std::fs::write(
        std::env::var("CHAOS_PHASE5_FAULT_FILE")?,
        serde_json::to_vec(&json!({"available":available}))?,
    )?;
    let deadline = Instant::now() + Duration::from_secs(10);
    loop {
        let ack = std::fs::read(std::env::var("CHAOS_PHASE5_FAULT_ACK_FILE")?)
            .ok()
            .and_then(|data| serde_json::from_slice::<Json>(&data).ok());
        if ack.as_ref().and_then(|ack| ack["available"].as_bool()) == Some(available) {
            return Ok(());
        }
        ensure!(
            Instant::now() < deadline,
            "fixture proxy did not acknowledge availability change"
        );
        tokio::time::sleep(Duration::from_millis(20)).await;
    }
}

/// Graceful HTTP shutdown drains a real PostgreSQL query before its final telemetry flush.
async fn shutdown_inflight(state: &AppState, session: &mut Session) -> anyhow::Result<()> {
    let started = Arc::new(tokio::sync::Notify::new());
    let observed = started.clone();
    let pool = state.db.clone();
    let router = axum::Router::new()
        .route(
            "/api/v1/phase5/inflight",
            axum::routing::get(move || {
                let started = started.clone();
                let pool = pool.clone();
                async move {
                    started.notify_one();
                    sqlx::query("SELECT pg_sleep(0.2)")
                        .execute(&pool)
                        .instrument(crate::telemetry::database_span("phase5.inflight"))
                        .await?;
                    Ok::<_, crate::models::error::ChaosError>("ok")
                }
            }),
        )
        .layer(axum::middleware::from_fn_with_state(
            RequestMetrics::new(),
            trace_request,
        ));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let address = listener.local_addr()?;
    let (stop, stopped) = tokio::sync::oneshot::channel();
    let server = tokio::spawn(async move {
        axum::serve(listener, router)
            .with_graceful_shutdown(async {
                let _ = stopped.await;
            })
            .await
    });
    session.sequence += 1;
    let trace_id = format!("{:032x}", session.sequence);
    let client = session.client.clone();
    let header = format!("00-{trace_id}-1234567890123456-01");
    let request = tokio::spawn(async move {
        client
            .get(format!("http://{address}/api/v1/phase5/inflight"))
            .header("traceparent", header)
            .send()
            .await
    });
    tokio::time::timeout(Duration::from_secs(3), observed.notified()).await?;
    let _ = stop.send(());
    ensure!(
        request.await??.status().is_success(),
        "in-flight database request must complete during drain"
    );
    tokio::time::timeout(Duration::from_secs(3), server).await???;
    let _rebound = tokio::net::TcpListener::bind(address).await?;
    session.calls.push(
        json!({"method":"GET","path":"/api/v1/phase5/inflight","status":200,"trace_id":trace_id}),
    );
    Ok(())
}

/// Exercises production handlers/state/schema, keeping every side effect in disposable fixtures.
pub(super) async fn exercise(telemetry: &Telemetry) -> anyhow::Result<()> {
    ensure!(
        std::env::var("CHAOS_PHASE5_ISOLATED")?.starts_with("chaos-telemetry-"),
        "run through the disposable fixture runner"
    );
    let url = std::env::var("DATABASE_URL")?;
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await?;
    ensure!(
        sqlx::query_scalar::<_, String>("SELECT current_database()")
            .fetch_one(&pool)
            .await?
            == "telemetry_fixture",
        "refuse non-fixture database"
    );
    sqlx::migrate!("../migrations").run(&pool).await?;
    let deadline = Instant::now() + Duration::from_secs(20);
    while crate::spicedb::migrate_schema().await.is_err() {
        ensure!(
            Instant::now() < deadline,
            "fixture SpiceDB did not become ready"
        );
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    let (app, state, tokens) = crate::models::app::app().await?;
    let webhook_failures = Arc::new(AtomicUsize::new(0));
    let failures = webhook_failures.clone();
    let app = app.layer(axum::middleware::from_fn(
        move |request: axum::extract::Request, next: axum::middleware::Next| {
            let failures = failures.clone();
            let webhook = request.uri().path() == "/api/v1/sequin/spicedb";
            async move {
                let response = next.run(request).await;
                if webhook && response.status().is_server_error() {
                    failures.fetch_add(1, Ordering::SeqCst);
                }
                response
            }
        },
    ));
    let token_task = tokio::spawn(crate::spicedb::apply_zedtokens(
        state.spicedb_zedtoken.clone(),
        tokens,
    ));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:0").await?;
    let port = listener.local_addr()?.port();
    let (stop, stopped) = tokio::sync::oneshot::channel();
    let server = tokio::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(async {
                let _ = stopped.await;
            })
            .await
    });
    let mut session = Session {
        base: format!("http://127.0.0.1:{port}"),
        client: reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()?,
        sequence: 0xface0000,
        calls: Vec::new(),
    };
    let result = scenarios(&state, &mut session, port, &webhook_failures).await;
    let _ = stop.send(());
    tokio::time::timeout(Duration::from_secs(8), server).await???;
    token_task.abort();
    state.db.close().await;
    pool.close().await;
    result?;
    ensure!(
        flush(telemetry).await == (true, true, true),
        "workflow exports must reach all ingestion services"
    );
    Ok(())
}

/// Runs API lifecycle, webhook replay/failure and opt-in reconciliation scenarios in order.
async fn scenarios(
    state: &AppState,
    session: &mut Session,
    port: u16,
    webhook_failures: &AtomicUsize,
) -> anyhow::Result<()> {
    for id in [1001_i64, 1002, 1003] {
        sqlx::query("INSERT INTO users (id,email,name) VALUES ($1,$2,$3)")
            .bind(id)
            .bind(format!("fixture-{id}@example.invalid"))
            .bind("Fixture")
            .execute(&state.db)
            .await?;
    }
    sqlx::query("INSERT INTO organisations (id,slug,name,contact_email) VALUES (2001,'phase5','Phase5','fixture@example.invalid')").execute(&state.db).await?;
    sqlx::query("INSERT INTO organisation_members (organisation_id,user_id,role) VALUES (2001,1001,'Admin')").execute(&state.db).await?;
    write(
        state,
        vec![
            update(
                Operation::Touch,
                "chaos/organisation",
                2001,
                "platform",
                "chaos/platform",
                0,
            ),
            update(
                Operation::Touch,
                "chaos/organisation",
                2001,
                "admin",
                "chaos/user",
                1001,
            ),
            update(
                Operation::Touch,
                "chaos/platform",
                0,
                "user",
                "chaos/user",
                1001,
            ),
            update(
                Operation::Touch,
                "chaos/platform",
                0,
                "user",
                "chaos/user",
                1002,
            ),
            update(
                Operation::Touch,
                "chaos/platform",
                0,
                "user",
                "chaos/user",
                1003,
            ),
        ],
    )
    .await?;
    let token = |id| {
        crate::service::jwt::encode_auth_token(
            "Fixture".into(),
            id,
            &state.encoding_key,
            &state.jwt_header,
        )
    };
    let admin = token(1001);
    let applicant = token(1002);
    let outsider = token(1003);
    permission(state, 1001, "chaos/organisation", 2001, "manage", true).await?;
    let body = json!({"slug":"phase5-campaign","name":"Phase5 campaign","description":"Fixture", "starts_at":"2020-01-01T00:00:00Z", "ends_at":"2099-01-01T00:00:00Z"});
    session
        .call(
            "POST",
            "/api/v1/organisation/2001/campaign",
            None,
            Some(body.clone()),
            401,
        )
        .await?;
    session
        .call(
            "POST",
            "/api/v1/organisation/2001/campaign",
            Some(&outsider),
            Some(body.clone()),
            403,
        )
        .await?;
    session
        .call(
            "POST",
            "/api/v1/organisation/2001/campaign",
            Some(&admin),
            Some(json!({})),
            422,
        )
        .await?;
    session
        .call(
            "POST",
            "/api/v1/organisation/2001/campaign",
            Some(&admin),
            Some(body.clone()),
            200,
        )
        .await?;
    let campaign: i64 = sqlx::query_scalar("SELECT id FROM campaigns WHERE slug='phase5-campaign'")
        .fetch_one(&state.db)
        .await?;
    let path = format!("/api/v1/campaign/{campaign}");
    session.call("GET", &path, None, None, 200).await?;
    let mut edited = body.clone();
    edited["name"] = json!("Edited fixture");
    session
        .call("PUT", &path, Some(&admin), Some(edited.clone()), 200)
        .await?;
    ensure!(
        sqlx::query_scalar::<_, String>("SELECT name FROM campaigns WHERE id=$1")
            .bind(campaign)
            .fetch_one(&state.db)
            .await?
            == "Edited fixture",
        "campaign update persisted"
    );
    session.call("POST",&format!("{path}/role"),Some(&admin),Some(json!({"name":"Developer","description":"Fixture","min_available":0,"max_available":2,"finalised":true})),200).await?;
    let role: i64 = sqlx::query_scalar("SELECT id FROM campaign_roles WHERE campaign_id=$1")
        .bind(campaign)
        .fetch_one(&state.db)
        .await?;
    session
        .call("PATCH", &format!("{path}/publish"), Some(&admin), None, 200)
        .await?;
    let apply = format!("{path}/apply");
    let created = session
        .call("POST", &apply, Some(&applicant), None, 200)
        .await?;
    let application: i64 = created["application_id"]
        .as_str()
        .context("application ID must be a string")?
        .parse()?;
    let repeated = session
        .call("POST", &apply, Some(&applicant), None, 200)
        .await?;
    ensure!(
        created == repeated,
        "repeated apply must return the same application"
    );
    let app_path = format!("/api/v1/application/{application}");
    session
        .call(
            "GET",
            &format!("{app_path}/inprogress"),
            Some(&applicant),
            None,
            200,
        )
        .await?;
    session
        .call(
            "GET",
            &format!("{app_path}/inprogress"),
            Some(&outsider),
            None,
            403,
        )
        .await?;
    session
        .call(
            "POST",
            &format!("{app_path}/submit"),
            Some(&applicant),
            None,
            400,
        )
        .await?;
    session.call("PATCH",&format!("{app_path}/roles"),Some(&applicant),Some(json!({"roles":[{"campaign_role_id":role.to_string(),"preference_percentage":100}]})),200).await?;
    session
        .call(
            "POST",
            &format!("{app_path}/submit"),
            Some(&applicant),
            None,
            200,
        )
        .await?;
    ensure!(
        sqlx::query_scalar::<_, bool>("SELECT submitted FROM applications WHERE id=$1")
            .bind(application)
            .fetch_one(&state.db)
            .await?,
        "submission persisted"
    );

    // Fixture webhook messages exercise the real handler, not the Sequin CDC engine.
    let member = json!({"id":9001,"organisation_id":2001,"user_id":1003,"role":"Admin"});
    let grant =
        json!({"data":[message("organisation_members","insert",member.clone(),Json::Null)]});
    session.webhook(state, grant.clone(), false, 401).await?;
    session.webhook(state, grant.clone(), true, 200).await?;
    session.webhook(state, grant.clone(), true, 200).await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", true).await?;
    let revoke =
        json!({"data":[message("organisation_members","delete",member.clone(),Json::Null)]});
    session.webhook(state, revoke.clone(), true, 200).await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", false).await?;
    session.webhook(state,json!({"data":[message("organisation_members","insert",member.clone(),Json::Null), message("organisation_members","delete",member.clone(),Json::Null)]}),true,200).await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", false).await?;
    session.webhook(state,json!({"data":[message("organisation_members","update",member.clone(),json!({"role":"User"}))]}),true,200).await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", true).await?;
    session.webhook(state, revoke.clone(), true, 200).await?;

    // An isolated channel to a closed fixture port proves failure is not acknowledged.
    let reserved = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let failed_endpoint = format!("http://{}", reserved.local_addr()?);
    drop(reserved);
    let mut unavailable = state.clone();
    unavailable.spicedb =
        crate::spicedb::authzed::api::v1::permissions_service_client::PermissionsServiceClient::new(
            tonic::transport::Endpoint::from_shared(failed_endpoint)?
                .timeout(Duration::from_secs(1))
                .connect_lazy(),
        );
    let failed = axum::Router::new()
        .route(
            "/api/v1/sequin/spicedb",
            axum::routing::post(crate::handler::sequin::SequinHandler::spicedb_webhook),
        )
        .with_state(unavailable)
        .layer(axum::middleware::from_fn_with_state(
            RequestMetrics::new(),
            trace_request,
        ));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let failed_base = format!("http://{}", listener.local_addr()?);
    let task = tokio::spawn(async move { axum::serve(listener, failed).await });
    let original = std::mem::replace(&mut session.base, failed_base);
    session.webhook(state, grant.clone(), true, 500).await?;
    session.base = original;
    task.abort();
    let _ = task.await;
    session.webhook(state, grant.clone(), true, 200).await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", true).await?;
    session.webhook(state, revoke.clone(), true, 200).await?;

    // Direct application writes and webhook replay are independent writers. The
    // winner is observable, not prescribed; a subsequent replay must converge.
    let direct = write(
        state,
        vec![update(
            Operation::Touch,
            "chaos/organisation",
            2001,
            "admin",
            "chaos/user",
            1003,
        )],
    );
    let replay = session.webhook(state, revoke.clone(), true, 200);
    let (direct, replay) = tokio::join!(
        direct.instrument(tracing::info_span!("phase5.concurrent_direct_write")),
        replay
    );
    direct?;
    replay?;
    let concurrent_observed_manage = state
        .check_permission(1003, "chaos/campaign", campaign, "manage")
        .await
        .is_ok();
    session.webhook(state, revoke.clone(), true, 200).await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", false).await?;

    let orphan = update(
        Operation::Touch,
        "chaos/organisation",
        9999,
        "admin",
        "chaos/user",
        1003,
    );
    write(state, vec![orphan]).await?;
    let report = crate::service::reconcile::run_with_deletion(state, false).await?;
    ensure!(
        !report.deleted
            && report
                .orphans
                .iter()
                .any(|rel| rel.resource.as_ref().is_some_and(|r| r.object_id == "9999")),
        "report-only sweep must retain orphan"
    );
    permission(state, 1003, "chaos/organisation", 9999, "manage", true).await?;
    let report = crate::service::reconcile::run_with_deletion(state, true).await?;
    ensure!(report.deleted, "isolated sweep must delete orphans");
    permission(state, 1003, "chaos/organisation", 9999, "manage", false).await?;
    permission(state, 1001, "chaos/campaign", campaign, "manage", true).await?;

    let cdc = std::env::var("CHAOS_PHASE5_CDC").as_deref() == Ok("1");
    if cdc {
        real_cdc(state, session, port, campaign, webhook_failures).await?;
    }

    session
        .call("DELETE", &path, Some(&admin), None, 400)
        .await?;
    // Published campaigns cannot be deleted through the API. Exercise supported
    // draft deletion separately, then prove database cascades/CDC on the submitted one.
    let mut draft = body.clone();
    draft["slug"] = json!("phase5-draft");
    session
        .call(
            "POST",
            "/api/v1/organisation/2001/campaign",
            Some(&admin),
            Some(draft),
            200,
        )
        .await?;
    let draft_id: i64 = sqlx::query_scalar("SELECT id FROM campaigns WHERE slug='phase5-draft'")
        .fetch_one(&state.db)
        .await?;
    let draft_path = format!("/api/v1/campaign/{draft_id}");
    session.call("POST", &format!("{draft_path}/role"), Some(&admin), Some(json!({"name":"Draft role", "description":null, "min_available":0, "max_available":1, "finalised":false})), 200).await?;
    session
        .call("DELETE", &draft_path, Some(&admin), None, 200)
        .await?;
    permission(state, 1001, "chaos/campaign", draft_id, "manage", false).await?;
    ensure!(
        sqlx::query_scalar::<_, i64>("SELECT count(*) FROM campaign_roles WHERE campaign_id=$1")
            .bind(draft_id)
            .fetch_one(&state.db)
            .await?
            == 0,
        "draft role must cascade"
    );
    session
        .call("DELETE", &draft_path, Some(&admin), None, 403)
        .await?;
    sqlx::query("DELETE FROM campaigns WHERE id=$1")
        .bind(campaign)
        .execute(&state.db)
        .await?;
    if !cdc {
        session.webhook(state,json!({"data":[
            message("applications","delete",json!({"id":application,"campaign_id":campaign,"user_id":1002}),Json::Null),
            message("campaign_roles","delete",json!({"id":role,"campaign_id":campaign}),Json::Null),
            message("campaigns","delete",json!({"id":campaign,"organisation_id":2001}),Json::Null)
        ]}),true,200).await?;
    }
    ensure!(
        sqlx::query_scalar::<_, i64>("SELECT count(*) FROM applications WHERE id=$1")
            .bind(application)
            .fetch_one(&state.db)
            .await?
            == 0,
        "application must cascade with campaign deletion"
    );
    ensure!(
        sqlx::query_scalar::<_, i64>("SELECT count(*) FROM campaign_roles WHERE id=$1")
            .bind(role)
            .fetch_one(&state.db)
            .await?
            == 0,
        "role must cascade with campaign deletion"
    );
    permission(state, 1002, "chaos/application", application, "edit", false).await?;
    permission(state, 1001, "chaos/campaign", campaign, "manage", false).await?;
    session.call("GET", &path, None, None, 404).await?;
    session
        .call("DELETE", &path, Some(&admin), None, 403)
        .await?;
    shutdown_inflight(state, session).await?;
    let summary = json!({"calls":session.calls,"fixture_ids":{"admin":"1001","applicant":"1002","outsider":"1003","organisation":"2001","campaign":campaign.to_string(),"application":application.to_string(),"role":role.to_string()},"real_cdc":cdc,"real_cdc_failed_deliveries":webhook_failures.load(Ordering::SeqCst),"concurrent_observed_manage":concurrent_observed_manage,"converged_after_replay":true,"concurrent_write_race":"accepted; not disproved by this fixture"});
    std::fs::write(
        std::env::var("CHAOS_PHASE5_RESULT_FILE")?,
        serde_json::to_vec_pretty(&summary)?,
    )?;
    Ok(())
}

/// Verifies actual Postgres-to-Sequin-to-webhook convergence and management backfill repair.
async fn real_cdc(
    state: &AppState,
    session: &mut Session,
    port: u16,
    campaign: i64,
    webhook_failures: &AtomicUsize,
) -> anyhow::Result<()> {
    std::fs::write(
        std::env::var("CHAOS_PHASE5_READY_FILE")?,
        serde_json::to_vec(
            &json!({"webhook_url":format!("http://host.docker.internal:{port}/api/v1/sequin/spicedb")}),
        )?,
    )?;
    // A database-only mutation cannot reach SpiceDB through a direct application write.
    sqlx::query("INSERT INTO organisation_members (organisation_id,user_id,role) VALUES (2001,1003,'Admin')").execute(&state.db).await?;
    let deadline = Instant::now() + Duration::from_secs(120);
    loop {
        if state
            .check_permission(1003, "chaos/campaign", campaign, "manage")
            .await
            .is_ok()
        {
            break;
        }
        ensure!(
            Instant::now() < deadline,
            "real CDC insert did not converge within two minutes"
        );
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    sqlx::query(
        "UPDATE organisation_members SET role='User' WHERE organisation_id=2001 AND user_id=1003",
    )
    .execute(&state.db)
    .await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", false).await?;
    sqlx::query(
        "UPDATE organisation_members SET role='Admin' WHERE organisation_id=2001 AND user_id=1003",
    )
    .execute(&state.db)
    .await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", true).await?;
    // The sink is now live; this second insert must arrive through actual CDC.
    sqlx::query("INSERT INTO organisation_members (organisation_id,user_id,role) VALUES (2001,1002,'Admin')").execute(&state.db).await?;
    permission(state, 1002, "chaos/campaign", campaign, "manage", true).await?;
    sqlx::query("DELETE FROM organisation_members WHERE organisation_id=2001 AND user_id=1002")
        .execute(&state.db)
        .await?;
    permission(state, 1002, "chaos/campaign", campaign, "manage", false).await?;
    let initial_failures = webhook_failures.load(Ordering::SeqCst);
    spicedb_available(false).await?;
    sqlx::query(
        "UPDATE organisation_members SET role='User' WHERE organisation_id=2001 AND user_id=1003",
    )
    .execute(&state.db)
    .await?;
    session
        .call(
            "GET",
            &format!("/api/v1/campaign/{campaign}"),
            None,
            None,
            200,
        )
        .await?;
    let deadline = Instant::now() + Duration::from_secs(25);
    while webhook_failures.load(Ordering::SeqCst) == initial_failures {
        ensure!(
            Instant::now() < deadline,
            "Sequin must observe a 500 while SpiceDB is unavailable"
        );
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    spicedb_available(true).await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", false).await?;
    sqlx::query(
        "UPDATE organisation_members SET role='Admin' WHERE organisation_id=2001 AND user_id=1003",
    )
    .execute(&state.db)
    .await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", true).await?;
    write(
        state,
        vec![update(
            Operation::Delete,
            "chaos/organisation",
            2001,
            "admin",
            "chaos/user",
            1003,
        )],
    )
    .await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", false).await?;
    let missing = crate::service::reconcile::run_with_deletion(state, false).await?;
    ensure!(
        missing.missing > 0,
        "sweep must detect missing relationships"
    );
    crate::service::reconcile::request_backfill(state).await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", true).await?;
    sqlx::query("DELETE FROM organisation_members WHERE organisation_id=2001 AND user_id=1003")
        .execute(&state.db)
        .await?;
    permission(state, 1003, "chaos/campaign", campaign, "manage", false).await?;
    Ok(())
}

/// Route, method and status identify one HTTP metric series.
type RequestLabels = (String, String, i64);

/// Extracts the same required dimensions from server spans and metric points.
fn request_labels(fields: &[ProtoKeyValue]) -> RequestLabels {
    let status = fields
        .iter()
        .find_map(|field| {
            if field.key == "http.response.status_code" {
                match field.value.as_ref()?.value.as_ref()? {
                    Value::IntValue(value) => Some(*value),
                    _ => None,
                }
            } else {
                None
            }
        })
        .expect("HTTP status must be an integer");
    (
        text_attribute(fields, "http.route")
            .expect("HTTP route")
            .to_owned(),
        text_attribute(fields, "http.request.method")
            .expect("HTTP method")
            .to_owned(),
        status,
    )
}

/// Compares the latest cumulative point per series with every completed server request.
fn assert_request_metric_totals(
    expected: &std::collections::BTreeMap<RequestLabels, u64>,
    metrics: &[&opentelemetry_proto::tonic::metrics::v1::Metric],
) {
    use opentelemetry_proto::tonic::metrics::v1::{
        number_data_point::Value as NumberValue, AggregationTemporality,
    };
    let mut counts = std::collections::BTreeMap::new();
    let mut durations = std::collections::BTreeMap::new();
    for metric in metrics {
        let (points, destination) = match (metric.name.as_str(), &metric.data) {
            ("http.server.request.count", Some(Data::Sum(sum))) => {
                assert_eq!(
                    sum.aggregation_temporality,
                    AggregationTemporality::Cumulative as i32
                );
                assert!(sum.is_monotonic);
                let points = sum
                    .data_points
                    .iter()
                    .map(|point| {
                        let Some(NumberValue::AsInt(value)) = point.value else {
                            panic!("request counter must contain integers");
                        };
                        (
                            request_labels(&point.attributes),
                            point.time_unix_nano,
                            u64::try_from(value).expect("nonnegative request count"),
                        )
                    })
                    .collect::<Vec<_>>();
                (points, &mut counts)
            }
            ("http.server.request.duration", Some(Data::Histogram(histogram))) => {
                assert_eq!(
                    histogram.aggregation_temporality,
                    AggregationTemporality::Cumulative as i32
                );
                (
                    histogram
                        .data_points
                        .iter()
                        .map(|point| {
                            (
                                request_labels(&point.attributes),
                                point.time_unix_nano,
                                point.count,
                            )
                        })
                        .collect(),
                    &mut durations,
                )
            }
            _ => continue,
        };
        for (labels, timestamp, count) in points {
            let latest = destination.entry(labels).or_insert((timestamp, count));
            if timestamp >= latest.0 {
                *latest = (timestamp, count);
            }
        }
    }
    let totals = |points: std::collections::BTreeMap<RequestLabels, (u64, u64)>| {
        points
            .into_iter()
            .map(|(labels, (_, count))| (labels, count))
            .collect::<std::collections::BTreeMap<_, _>>()
    };
    assert_eq!(&totals(counts), expected, "request counter totals");
    assert_eq!(
        &totals(durations),
        expected,
        "request duration sample counts"
    );
}

/// Rejects missing/duplicate recordings even when their route labels are correct.
#[test]
fn request_metric_totals_reject_incorrect_counts() {
    use opentelemetry_proto::tonic::metrics::v1::{
        number_data_point::Value as NumberValue, AggregationTemporality, Histogram,
        HistogramDataPoint, Metric, NumberDataPoint, Sum,
    };
    let fields = vec![
        ProtoKeyValue {
            key: "http.route".into(),
            value: Some(opentelemetry_proto::tonic::common::v1::AnyValue {
                value: Some(Value::StringValue("/fixture/:id".into())),
            }),
            ..Default::default()
        },
        ProtoKeyValue {
            key: "http.request.method".into(),
            value: Some(opentelemetry_proto::tonic::common::v1::AnyValue {
                value: Some(Value::StringValue("GET".into())),
            }),
            ..Default::default()
        },
        ProtoKeyValue {
            key: "http.response.status_code".into(),
            value: Some(opentelemetry_proto::tonic::common::v1::AnyValue {
                value: Some(Value::IntValue(200)),
            }),
            ..Default::default()
        },
    ];
    let expected = std::collections::BTreeMap::from([(request_labels(&fields), 2)]);
    for (count, duration, valid) in [
        (2, 2, true),
        (0, 2, false),
        (1, 2, false),
        (2, 1, false),
        (3, 2, false),
        (2, 3, false),
    ] {
        // Include an older snapshot to ensure cumulative exports are not summed.
        let counter = |value, timestamp| Metric {
            name: "http.server.request.count".into(),
            data: Some(Data::Sum(Sum {
                aggregation_temporality: AggregationTemporality::Cumulative as i32,
                is_monotonic: true,
                data_points: vec![NumberDataPoint {
                    attributes: fields.clone(),
                    time_unix_nano: timestamp,
                    value: Some(NumberValue::AsInt(value)),
                    ..Default::default()
                }],
            })),
            ..Default::default()
        };
        let earlier = counter(1, 1);
        let latest = counter(count, 2);
        let histogram = Metric {
            name: "http.server.request.duration".into(),
            data: Some(Data::Histogram(Histogram {
                aggregation_temporality: AggregationTemporality::Cumulative as i32,
                data_points: vec![HistogramDataPoint {
                    attributes: fields.clone(),
                    time_unix_nano: 2,
                    count: duration,
                    ..Default::default()
                }],
            })),
            ..Default::default()
        };
        let result = std::panic::catch_unwind(|| {
            assert_request_metric_totals(&expected, &[&latest, &earlier, &histogram])
        });
        assert_eq!(
            result.is_ok(),
            valid,
            "counter={count}, duration={duration}"
        );
    }
}

/// Runs only through the orchestration script, with isolated database and SpiceDB guards.
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
#[ignore = "requires disposable stores; run python3 backend/tests/telemetry_workflows.py"]
async fn routed_workflows_reach_receiver() {
    assert!(std::env::var("CHAOS_PHASE5_ISOLATED")
        .unwrap_or_default()
        .starts_with("chaos-telemetry-"));
    let receiver = Receiver::start().await;
    let process = Process::start(
        Some(&receiver.endpoint),
        &receiver.endpoint,
        "INFO",
        "workflow",
    );
    let (_, stderr) = process.finish().await;
    let mut summary: Json = serde_json::from_slice(
        &std::fs::read(std::env::var("CHAOS_PHASE5_RESULT_FILE").unwrap()).unwrap(),
    )
    .unwrap();
    let spans = receiver.received.spans();
    let records = receiver.received.records();
    let batches = receiver.received.metrics.lock().unwrap().clone();
    let metrics: Vec<_> = batches
        .iter()
        .flat_map(|batch| &batch.resource_metrics)
        .flat_map(|resource| &resource.scope_metrics)
        .flat_map(|scope| &scope.metrics)
        .collect();
    for call in summary["calls"].as_array().unwrap() {
        let bytes: Vec<u8> = call["trace_id"]
            .as_str()
            .unwrap()
            .as_bytes()
            .chunks(2)
            .map(|pair| u8::from_str_radix(std::str::from_utf8(pair).unwrap(), 16).unwrap())
            .collect();
        let root = spans
            .iter()
            .find(|span| span.name == "http.request" && span.trace_id == bytes)
            .expect("real request must reach OTLP receiver");
        assert_eq!(
            spans
                .iter()
                .filter(|span| span.name == "http.request" && span.trace_id == bytes)
                .count(),
            1,
            "one server root per routed request"
        );
        assert!(root
            .attributes
            .iter()
            .any(|field| field.key == "http.response.status_code"
                && field.value.as_ref().and_then(|value| value.value.as_ref())
                    == Some(&Value::IntValue(call["status"].as_i64().unwrap()))));
        assert!(text_attribute(&root.attributes, "http.route")
            .is_some_and(|route| route.contains(':')
                || route == "/api/v1/sequin/spicedb"
                || route == "/api/v1/phase5/inflight"));
        assert!(records
            .iter()
            .any(|record| record.trace_id == bytes && record.span_id == root.span_id));
        assert_eq!(
            text_attribute(&root.attributes, "http.request.method"),
            call["method"].as_str()
        );
    }
    // Include real CDC requests, which share labels with the scripted webhooks.
    let mut expected = std::collections::BTreeMap::new();
    for span in spans.iter().filter(|span| span.name == "http.request") {
        *expected
            .entry(request_labels(&span.attributes))
            .or_insert(0) += 1;
    }
    assert_request_metric_totals(&expected, &metrics);
    assert!(spans
        .iter()
        .any(|span| span.name == "application.persist_submission"));
    assert!(spans.iter().any(|span| span.name == "db.postgres.query"));
    assert!(spans.iter().any(|span| span.name == "rpc.grpc.client"));
    assert!(!format!("{spans:?} {records:?} {stderr}").contains("auth_token="));
    assert!(!batches.is_empty());
    let backfills = std::env::var("CHAOS_PHASE5_CDC").as_deref() == Ok("1");
    if backfills {
        assert!(summary["real_cdc_failed_deliveries"].as_u64().unwrap() > 0);
        assert!(spans.iter().any(|span| span.name == "http.request"
            && text_attribute(&span.attributes, "http.route") == Some("/api/v1/sequin/spicedb")
            && span
                .attributes
                .iter()
                .any(|field| field.key == "http.response.status_code"
                    && field.value.as_ref().and_then(|value| value.value.as_ref())
                        == Some(&Value::IntValue(500)))));
    }
    summary["receiver"] = json!({"server_spans":spans.iter().filter(|span|span.name=="http.request").count(),"spans":spans.len(),"logs":records.len(),"metric_batches":batches.len(),"matched_http_calls":summary["calls"].as_array().unwrap().len(),"request_count_and_duration_labels_checked":true,"request_count_and_duration_totals_checked":true,"metric_request_total":expected.values().sum::<u64>()});
    std::fs::write(
        std::env::var("CHAOS_PHASE5_RESULT_FILE").unwrap(),
        serde_json::to_vec_pretty(&summary).unwrap(),
    )
    .unwrap();
    receiver.close().await;
}
