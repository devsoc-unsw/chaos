use crate::models::error::ChaosError;
use anyhow::{bail, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres, QueryBuilder, Row};

#[derive(Deserialize, Serialize)]
pub struct Question {
    id: i64,
    title: String,
    description: Option<String>,
    required: bool,

    #[serde(flatten)]
    question_type: QuestionType,

    campaign_id: i64,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

/// An enum that represents all the data types of question data that CHAOS can handle.
/// This stores all the data for each question type.
///
/// \
/// Some question types are stored in memory and JSON using the same struct, and only differ
/// in their implementation when inserting to the database and in their restrictions
/// (e.g. max 1 answer allowed in multi-choice vs. many in multi-select)
///
/// \
/// With the chosen serde representation and the use of `#[serde(flatten)]`, the JSON for a
/// `Question` will look like this:
/// ```json
/// {
///   "title": "What is your favourite language?",
///   "required": true,
///   "question_type": "MultiChoice",
///   "data": [
///     "Rust",
///     "Java",
///     "TypeScript"
///   ]
/// }
/// ```
#[derive(Deserialize, Serialize)]
#[serde(tag = "question_type", content = "data")]
pub enum QuestionType {
    ShortAnswer,
    MultiChoice(MultiOptionData),
    MultiSelect(MultiOptionData),
    DropDown(MultiOptionData),
}

pub trait QuestionData {
    async fn insert_into_db(self, question_id: i64, pool: &Pool<Postgres>) -> Result<i64>;
    async fn get_from_db(self, question_id: i64, pool: &Pool<Postgres>) -> Result<QuestionType>;
}

#[derive(Deserialize, Serialize)]
pub struct MultiOptionData {
    options: Vec<String>,
}

impl QuestionData for MultiOptionData {
    async fn insert_into_db(self, question_id: i64, pool: &Pool<Postgres>) -> Result<i64> {
        let mut query_builder =
            QueryBuilder::new("INSERT INTO multi_option_question_options (text, question_id) ");

        query_builder.push_values(self.options, |mut b, option| {
            b.push_bind(option).push_bind(question_id);
        });

        query_builder.push("RETURNING id");

        let query = query_builder.build();
        let result = query.fetch_one(pool).await?;

        Ok(result.get("id"))
    }

    async fn get_from_db(self, question_id: i64, pool: &Pool<Postgres>) -> Result<QuestionType> {
        let result = sqlx::query!(
            "SELECT text FROM multi_option_question_options
             WHERE question_id = $1",
            question_id
        )
        .fetch_all(pool)
        .await?;

        let options = result.into_iter().map(|r| r.text).collect();

        Ok(QuestionType::MultiChoice(MultiOptionData { options }))
    }
}

/// Each of these structs represent a row in the `multi_option_question_options`
/// table. For a `MultiChoice` question like "What is your favourite programming
/// language?", there would be rows for "Rust", "Java" and "TypeScript".
#[derive(Deserialize, Serialize)]
pub struct MultiOptionQuestionOption {
    id: i32,
    text: String,
    question_id: i64,
}

impl QuestionType {
    pub async fn validate(self) -> Result<()> {
        match self {
            Self::ShortAnswer => Ok(()),
            Self::MultiChoice(data)
            | Self::MultiSelect(data)
            | Self::DropDown(data) => {
                if data.options.len() > 0 {
                    return Ok(());
                };

                bail!("Invalid number of options.")
            }
        }
    }
    pub async fn insert_into_db(self, question_id: i64, pool: &Pool<Postgres>) -> Result<i64> {
        match self {
            Self::ShortAnswer => Ok(question_id),
            Self::MultiChoice(data)
            | Self::MultiSelect(data)
            | Self::DropDown(data) => {
                data.insert_into_db(question_id, pool).await
            }
        }
    }
}
