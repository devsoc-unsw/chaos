pub struct Invite {
    pub id: i64,
    pub code: String,
    pub organisation_id: i64,
    pub email: String,
    pub expires_at: DateTime<Utc>,
    pub used_at: Option<DateTime<Utc>>,
    pub used_by: Option<i64>,
    pub created_at: DateTime<Utc>,
}

impl Invite {

    pub async fn create(
        id: i64,
        organisation_id: i64,
        code: String,
        email: String,
        expires_at: DateTime<Utc>,
        created_at: DateTime<Utc>,
    ) -> Result<Invite, ChaosError> {
        Ok(Invite {
            id,
            code,
            organisation_id,
            email,
            expires_at,
            used_at: None,
            used_by: None,
            created_at,
        })
    }

    pub async fn get(
        code: &str,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Invite, ChaosError> {
        let invite = sqlx::query_as!(
            Invite,
            "SELECT * FROM invites WHERE code = $1",
            code
        )
        .fetch_one(transaction.deref_mut())
        .await?;
        Ok(invite)
    }

    pub async fn delete(
        code: &str,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            "DELETE FROM invites WHERE code = $1",
            code
        )
        .execute(transaction.deref_mut())
        .await?;
        Ok(())
    }

    pub async fn save_used_by_person(
        self,
        user_id: i64,
        invite: &mut Invite,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        invite.used_at = Some(Utc::now());
        invite.used_by = Some(user_id);
        invite.save(transaction).await?;
        Ok(())
    }


}