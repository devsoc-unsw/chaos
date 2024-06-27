use crate::models::error::ChaosError;
use anyhow::{bail, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres, QueryBuilder, Row};

#[derive(Deserialize, Serialize)]
pub struct Answer {
    id: i64,
    application_id: i64,
    question_id: i64,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize)]
pub enum AnswerType {
    ShortAnswerData(ShortAnswerData),
    MultiOptionAnswerData(MultiOptionAnswerData),
}

#[derive(Deserialize, Serialize)]
pub struct ShortAnswerData {
    text: String,
}

#[derive(Deserialize, Serialize)]
pub struct MultiOptionAnswerData {
    options: Vec<i64>,
}

pub trait AnswerData {
    async fn insert_into_db(self, answer_id: i64, pool: &Pool<Postgres>) -> Result<i64>;
    async fn get_from_db(answer_id: i64, pool: &Pool<Postgres>) -> Result<Self>
    where
        Self: Sized;
}

impl AnswerData for ShortAnswerData {
    async fn insert_into_db(self, answer_id: i64, pool: &Pool<Postgres>) -> Result<i64> {
        let result = sqlx::query!(
            "INSERT INTO short_answer_answers (text, answer_id) VALUES ($1, $2) RETURNING id",
            self.text,
            answer_id
        )
        .fetch_one(pool)
        .await?;

        Ok(result.get("id"))
    }

    async fn get_from_db(answer_id: i64, pool: &Pool<Postgres>) -> Result<ShortAnswerData> {
        let result = sqlx::query!(
            "SELECT text FROM short_answer_answers WHERE answer_id = $1",
            answer_id
        )
        .fetch_one(pool)
        .await?;

        Ok(ShortAnswerData { text: result.get("text") })
    }
}

impl AnswerData for MultiOptionAnswerData {
    async fn insert_into_db(self, answer_id: i64, pool: &Pool<Postgres>) -> Result<i64> {
        let mut query_builder = sqlx::QueryBuilder::new("INSERT INTO multi_option_answer_options (option_id, answer_id) ");

        query_builder.push_values(&self.options, |mut b, option_id| {
            b.push_bind(option_id).push_bind(answer_id);
        });

        query_builder.push(" RETURNING id");

        let query = query_builder.build();
        let result = query.fetch_one(pool).await?;

        Ok(result.get("id"))
    }

    async fn get_from_db(answer_id: i64, pool: &Pool<Postgres>) -> Result<MultiOptionAnswerData> {
        let result = sqlx::query!(
            "SELECT option_id FROM multi_option_answer_options WHERE answer_id = $1",
            answer_id
        )
        .fetch_all(pool)
        .await?;

        let options = result.into_iter().map(|r| r.get("option_id")).collect();

        Ok(MultiOptionAnswerData { options })
    }
}
