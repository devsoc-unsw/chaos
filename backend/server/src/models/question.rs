use crate::models::error::ChaosError;
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
///     "options": [
///         {
///             "id": 7233828375387640938,
///             "display_order": 1,
///             "text": "Rust"
///         },
///         {
///             "id": 7233828375387640954,
///             "display_order": 2,
///             "text": "Java"
///         },
///         {
///             "id": 7233828375387640374,
///             "display_order": 3,
///             "text": "TypeScript"
///         }
///     ]
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
    Ranking(MultiOptionData),
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
    display_order: i32,
    text: String,
}

impl QuestionData {
    pub async fn validate(self) -> Result<(), ChaosError> {
        match self {
            Self::ShortAnswer => Ok(()),
            Self::MultiChoice(data)
            | Self::MultiSelect(data)
            | Self::DropDown(data)
            | Self::Ranking(data) => {
                if data.options.len() > 0 {
                    return Ok(());
                };

                Err(ChaosError::BadRequest)
            }
        }
    }

    pub async fn insert_into_db(self, question_id: i64, pool: &Pool<Postgres>, mut snowflake_generator: SnowflakeIdGenerator) -> Result<(), ChaosError> {
        match self {
            Self::ShortAnswer => Ok(()),
            Self::MultiChoice(data)
            | Self::MultiSelect(data)
            | Self::DropDown(data)
            | Self::Ranking(data) => {
                let mut query_builder =
                    QueryBuilder::new("INSERT INTO multi_option_question_options (id, text, question_id, display_order)");

                query_builder.push_values(data.options, |mut b, option| {
                    let id = snowflake_generator.real_time_generate();
                    b.push_bind(id).push_bind(option.text).push_bind(question_id).push_bind(option.display_order);
                });

                let query = query_builder.build();
                let result = query.execute(pool).await?;

                Ok(())
            }
        }
    }
}
