use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

pub async fn user_is_answer_owner(
    user_id: i64,
    answer_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_owner = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT FROM answers ans
                     JOIN applications app ON ans.application_id = app.id
                     WHERE ans.id = $1 AND app.user_id = $2
                )
            )
        ",
        answer_id,
        user_id
    )
    .fetch_one(pool)
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_owner {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}
