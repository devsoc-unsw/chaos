use crate::models::error::ChaosError;
use anyhow::{bail, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres, QueryBuilder, Row};

/// The `Answer` type that will be sent in API responses.
///
///
/// With the chosen `serde` representation and the use of `#[serde(flatten)]`, the JSON for a
/// `Answer` will look like this:
/// ```json
/// {
///   "id": 7233828375289773948,
///   "application_id": 7233828375289125398,
///   "question_id": 7233828375289139200,
///   "answer_type": "MultiChoice",
///   "data": 7233828393325384908,
///   "created_at": "2024-06-28T16:29:04.644008111Z",
///   "updated_at": "2024-06-30T12:14:12.458390190Z"
/// }
/// ```
#[derive(Deserialize, Serialize)]
pub struct Answer {
    id: i64,
    application_id: i64,
    question_id: i64,

    #[serde(flatten)]
    answer_data: AnswerData,

    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize)]
#[serde( tag = "answer_type", content = "data")]
pub enum AnswerData {
    ShortAnswer(String),
    MultiChoice(i64),
    MultiSelect(Vec<i64>),
    DropDown(i64),
    Ranking(Vec<i64>)
}

impl AnswerData {
    pub async fn validate(self) -> Result<()> {
        match self {
            Self::ShortAnswer(text) => if text.len() == 0 { bail!("Empty answer") },
            Self::MultiSelect(data) => if data.len() == 0 { bail!("Empty answer") },
            _ => {},
        }

        Ok(())
    }

    pub async fn insert_into_db(self, answer_id: i64, pool: &Pool<Postgres>) -> Result<()> {
        match self {
            Self::ShortAnswer(text) => {
                let result = sqlx::query!(
                    "INSERT INTO short_answer_answers (text, answer_id) VALUES ($1, $2)",
                    text,
                    answer_id
                )
                .execute(pool)
                .await?;

                Ok(())
            },
            Self::MultiChoice(option_id)
            | Self::DropDown(option_id) => {
                let result = sqlx::query!(
                    "INSERT INTO multi_option_answer_options (option_id, answer_id) VALUES ($1, $2)",
                    option_id,
                    answer_id
                )
                    .execute(pool)
                    .await?;

                Ok(())
            },
            Self::MultiSelect(option_ids) => {
                let mut query_builder = sqlx::QueryBuilder::new("INSERT INTO multi_option_answer_options (option_id, answer_id)");

                query_builder.push_values(option_ids, |mut b, option_id| {
                    b.push_bind(option_id).push_bind(answer_id);
                });

                let query = query_builder.build();
                let result = query.execute(pool).await?;

                Ok(())
            },
            Self::Ranking(option_ids) => {
                let mut query_builder = sqlx::QueryBuilder::new("INSERT INTO ranking_answer_rankings (option_id, rank, answer_id)");

                let mut rank = 1;
                query_builder.push_values(option_ids, |mut b, option_id| {
                    b.push_bind(option_id).push_bind(rank).push_bind(answer_id);
                    rank += 1;
                });

                let query = query_builder.build();
                let result = query.execute(pool).await?;

                Ok(())
            }
        }
    }
}
