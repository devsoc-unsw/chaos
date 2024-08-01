struct Response200<const MSG: &'static str> {}

/*
impl OperationOutput for CreateRes {
    ....
}

impl IntoResponse for CreateRes {
    ....
}

*/

//Use const-generics?? I might be cooking

impl OrganisationHandler {
    pub async fn create(
        State(state): State<AppState>,
        _user: SuperUser,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewOrganisation>,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        Organisation::create(
            data.admin,
            data.name,
            state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Response200::<"Succesfully created organisation!"> {})
    }
}
