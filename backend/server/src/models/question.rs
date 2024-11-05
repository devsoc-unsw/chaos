use crate::models::error::ChaosError;
use anyhow::{bail, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres, QueryBuilder, Row};
use snowflake::SnowflakeIdGenerator;

/// The `Question` type that will be sent in API responses.
///
///
/// With the chosen `serde` representation and the use of `#[serde(flatten)]`, the JSON for a
/// `Question` will look like this:
/// ```json
/// {
///   "id": 7233828375289139200,
///   "title": "What is your favourite language?",
///   "required": true,
///   "question_type": "MultiChoice",
///   "data": {
///     "options": ["Rust", "Java", "TypeScript"]
///   },
///   "created_at": "2024-06-28T16:29:04.644008111Z",
///   "updated_at": "2024-06-30T12:14:12.458390190Z"
/// }
/// ```
#[derive(Serialize)]
pub struct Question {
    id: i64,
    title: String,
    description: Option<String>,
    common: bool, // Common question are shown at the start
    required: bool,

    #[serde(flatten)]
    question_data: QuestionData,

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
#[derive(Deserialize, Serialize)]
#[serde(tag = "question_type", content = "data")]
pub enum QuestionData {
    ShortAnswer,
    MultiChoice(MultiOptionData),
    MultiSelect(MultiOptionData),
    DropDown(MultiOptionData),
}

#[derive(Deserialize, Serialize)]
pub struct MultiOptionData {
    options: Vec<MultiOptionQuestionOption>,
}

/// Each of these structs represent a row in the `multi_option_question_options`
/// table. For a `MultiChoice` question like "What is your favourite programming
/// language?", there would be rows for "Rust", "Java" and "TypeScript".
#[derive(Deserialize, Serialize)]
pub struct MultiOptionQuestionOption {
    id: i32,
    rank: i32,
    text: String,
}

impl QuestionData {
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

    pub async fn insert_into_db(self, question_id: i64, pool: &Pool<Postgres>, mut snowflake_generator: SnowflakeIdGenerator) -> Result<()> {
        match self {
            Self::ShortAnswer => Ok(()),
            Self::MultiChoice(data)
            | Self::MultiSelect(data)
            | Self::DropDown(data) => {
                let mut query_builder =
                    QueryBuilder::new("INSERT INTO multi_option_question_options (id, text, question_id, rank)");

                query_builder.push_values(data.options, |mut b, option| {
                    let id = snowflake_generator.real_time_generate();
                    b.push_bind(id).push_bind(option.text).push_bind(question_id).push_bind(option.rank);
                });

                let query = query_builder.build();
                let result = query.execute(pool).await?;

                Ok(())
            }
        }
    }
}
