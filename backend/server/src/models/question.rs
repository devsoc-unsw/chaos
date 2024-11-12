use std::ops::DerefMut;
use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder, Transaction};
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

#[derive(Deserialize)]
pub struct NewQuestion {
    title: String,
    description: Option<String>,
    common: bool,
    roles: Option<Vec<i64>>,
    required: bool,

    #[serde(flatten)]
    question_data: QuestionData,
}

#[derive(Deserialize, Serialize, sqlx::FromRow)]
pub struct QuestionRawData {
    id: i64,
    title: String,
    description: Option<String>,
    common: bool, // Common question are shown at the start
    required: bool,

    question_type: QuestionType,
    multi_option_data: Option<sqlx::types::Json<Vec<MultiOptionQuestionOption>>>,

    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl Question {
    pub async fn create(campaign_id: i64, title: String, description: Option<String>, common: bool, roles: Option<Vec<i64>>, required: bool, question_data: QuestionData, mut snowflake_generator: SnowflakeIdGenerator, transaction: &mut Transaction<'_, Postgres>) -> Result<i64, ChaosError> {
        question_data.validate()?;

        let id = snowflake_generator.generate();

        sqlx::query!(
            "
                INSERT INTO questions (
                    id, title, description, common,
                    required, question_type, campaign_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ",
            id, title, description, common, required, QuestionType::from_question_data(&question_data) as QuestionType, campaign_id
        )
            .execute(transaction.deref_mut())
            .await?;

        question_data.insert_into_db(id, transaction, snowflake_generator).await?;

        if !common {
            for role in roles.expect("Should be !None if !common") {
                sqlx::query!(
                    "
                        INSERT INTO question_roles (question_id, role_id) VALUES ($1, $2)
                    ",
                    id, role
                )
                    .execute(transaction.deref_mut())
                    .await?;
            }

        }

        Ok(id)
    }

    pub async fn get(id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<Question, ChaosError> {
        let question_raw_data: QuestionRawData = sqlx::query_as(
            "
                SELECT
                    q.id,
                    q.title,
                    q.description,
                    q.common,
                    q.required,
                    q.question_type AS \"question_type: QuestionType\",
                    q.created_at,
                    q.updated_at,
                    array_agg(
                        jsonb_build_object(
                                'id', mod.id,
                                'display_order', mod.display_order,
                                'text', mod.text
                        ) ORDER BY mod.display_order
                    ) FILTER (WHERE mod.id IS NOT NULL) AS \"multi_option_data: Option<sqlx::types::Json<Vec<MultiOptionQuestionOption>>>\"
                FROM
                    questions q
                        LEFT JOIN
                    multi_option_question_options mod ON q.id = mod.question_id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown', 'Ranking')
                WHERE q.id = $1
                GROUP BY
                    q.id
            "
        )
            .bind(id)
            .fetch_one(transaction.deref_mut())
            .await?;

        let question_data = QuestionData::from_question_raw_data(question_raw_data.question_type, question_raw_data.multi_option_data);

        Ok(
            Question {
                id,
                title: question_raw_data.title,
                description: question_raw_data.description,
                common: question_raw_data.common,
                required: question_raw_data.required,
                question_data,
                created_at: question_raw_data.created_at,
                updated_at: question_raw_data.updated_at,
            }
        )
    }

    pub async fn get_all_by_campaign(campaign_id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<Vec<Question>, ChaosError> {
        let question_raw_data: Vec<QuestionRawData> = sqlx::query_as(
            "
                SELECT
                    q.id,
                    q.title,
                    q.description,
                    q.common,
                    q.required,
                    q.question_type AS \"question_type: QuestionType\",
                    q.created_at,
                    q.updated_at,
                    array_agg(
                        jsonb_build_object(
                                'id', mod.id,
                                'display_order', mod.display_order,
                                'text', mod.text
                        ) ORDER BY mod.display_order
                    ) FILTER (WHERE mod.id IS NOT NULL) AS \"multi_option_data: Option<sqlx::types::Json<Vec<MultiOptionQuestionOption>>>\"
                FROM
                    questions q
                        LEFT JOIN
                    multi_option_question_options mod ON q.id = mod.question_id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown', 'Ranking')
                WHERE q.campaign_id = $1
                GROUP BY
                    q.id
            "
        )
            .bind(campaign_id)
            .fetch_all(transaction.deref_mut())
            .await?;

        let questions = question_raw_data.into_iter().map(|question_raw_data| {
            let question_data = QuestionData::from_question_raw_data(question_raw_data.question_type, question_raw_data.multi_option_data);

            Question {
                id: question_raw_data.id,
                title: question_raw_data.title,
                description: question_raw_data.description,
                common: question_raw_data.common,
                required: question_raw_data.required,
                question_data,
                created_at: question_raw_data.created_at,
                updated_at: question_raw_data.updated_at,
            }
        }).collect();

        Ok(questions)
    }

    pub async fn get_all_by_campaign_and_role(campaign_id: i64, role_id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<Vec<Question>, ChaosError> {
        let question_raw_data: Vec<QuestionRawData> = sqlx::query_as(
            "
                SELECT
                    q.id,
                    q.title,
                    q.description,
                    q.common,
                    q.required,
                    q.question_type AS \"question_type: QuestionType\",
                    q.created_at,
                    q.updated_at,
                    array_agg(
                        jsonb_build_object(
                                'id', mod.id,
                                'display_order', mod.display_order,
                                'text', mod.text
                        ) ORDER BY mod.display_order
                    ) FILTER (WHERE mod.id IS NOT NULL) AS \"multi_option_data: Option<sqlx::types::Json<Vec<MultiOptionQuestionOption>>>\"
                FROM
                    questions q
                        JOIN
                    question_roles qr ON q.id = qr.question_id
                        LEFT JOIN
                    multi_option_question_options mod ON q.id = mod.question_id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown', 'Ranking')
                WHERE q.campaign_id = $1 AND q.common = true AND qr.id = $2
                GROUP BY
                    q.id
            "
        )
            .bind(campaign_id)
            .bind(role_id)
            .fetch_all(transaction.deref_mut())
            .await?;

        let questions = question_raw_data.into_iter().map(|question_raw_data| {
            let question_data = QuestionData::from_question_raw_data(question_raw_data.question_type, question_raw_data.multi_option_data);

            Question {
                id: question_raw_data.id,
                title: question_raw_data.title,
                description: question_raw_data.description,
                common: question_raw_data.common,
                required: question_raw_data.required,
                question_data,
                created_at: question_raw_data.created_at,
                updated_at: question_raw_data.updated_at,
            }
        }).collect();

        Ok(questions)
    }

    pub async fn get_all_common_by_campaign(campaign_id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<Vec<Question>, ChaosError> {
        let question_raw_data: Vec<QuestionRawData> = sqlx::query_as(
            "
                SELECT
                    q.id,
                    q.title,
                    q.description,
                    q.common,
                    q.required,
                    q.question_type AS \"question_type: QuestionType\",
                    q.created_at,
                    q.updated_at,
                    array_agg(
                        jsonb_build_object(
                                'id', mod.id,
                                'display_order', mod.display_order,
                                'text', mod.text
                        ) ORDER BY mod.display_order
                    ) FILTER (WHERE mod.id IS NOT NULL) AS \"multi_option_data: Option<sqlx::types::Json<Vec<MultiOptionQuestionOption>>>\"
                FROM
                    questions q
                        LEFT JOIN
                    multi_option_question_options mod ON q.id = mod.question_id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown', 'Ranking')
                WHERE q.campaign_id = $1 AND q.common = true
                GROUP BY
                    q.id
            "
        )
            .bind(campaign_id)
            .fetch_all(transaction.deref_mut())
            .await?;

        let questions = question_raw_data.into_iter().map(|question_raw_data| {
            let question_data = QuestionData::from_question_raw_data(question_raw_data.question_type, question_raw_data.multi_option_data);

            Question {
                id: question_raw_data.id,
                title: question_raw_data.title,
                description: question_raw_data.description,
                common: question_raw_data.common,
                required: question_raw_data.required,
                question_data,
                created_at: question_raw_data.created_at,
                updated_at: question_raw_data.updated_at,
            }
        }).collect();

        Ok(questions)
    }

    pub async fn update(id: i64, title: String, description: Option<String>, common: bool, roles: Option<Vec<i64>>, required: bool, question_data: QuestionData, transaction: &mut Transaction<'_, Postgres>, snowflake_generator: SnowflakeIdGenerator) -> Result<(), ChaosError> {
        question_data.validate()?;

        let question_type_parent: QuestionTypeParent = sqlx::query_as!(
            QuestionTypeParent,
            "
                UPDATE questions SET
                    title = $2, description = $3, common = $4,
                    required = $5, question_type = $6, updated_at = $7
                WHERE id = $1
                RETURNING question_type AS \"question_type: QuestionType\"
            ",
            id, title, description, common, required,
            QuestionType::from_question_data(&question_data) as QuestionType, Utc::now()
        )
            .fetch_one(transaction.deref_mut())
            .await?;

        let old_data = QuestionData::from_question_type(&question_type_parent.question_type);
        old_data.delete_from_db(id, transaction).await?;

        question_data.insert_into_db(id, transaction, snowflake_generator).await?;

        sqlx::query!("DELETE FROM question_roles WHERE question_id = $1", id)
            .execute(transaction.deref_mut())
            .await?;
        if !common {
            for role in roles.expect("Should be !None if !common") {
                sqlx::query!(
                    "
                        INSERT INTO question_roles (question_id, role_id) VALUES ($1, $2)
                    ",
                    id, role
                )
                    .execute(transaction.deref_mut())
                    .await?;
            }

        }

        Ok(())
    }

    pub async fn delete(id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<(), ChaosError> {
        sqlx::query!("DELETE FROM questions WHERE id = $1 RETURNING id", id)
            .fetch_one(transaction.deref_mut())
            .await?;

        Ok(())
    }
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

/// An enum needed to track QuestionType in the database,
/// as DB enum does not contain the inner data.
#[derive(Deserialize, Serialize, PartialEq, sqlx::Type)]
#[sqlx(type_name = "question_type", rename_all = "PascalCase")]
pub enum QuestionType {
    ShortAnswer,
    MultiChoice,
    MultiSelect,
    DropDown,
    Ranking,
}

#[derive(Deserialize)]
pub struct QuestionTypeParent {
    question_type: QuestionType
}

impl QuestionType {
    fn from_question_data(question_data: &QuestionData) -> Self {
        match question_data {
            QuestionData::ShortAnswer => QuestionType::ShortAnswer,
            QuestionData::MultiChoice(_) => QuestionType::MultiChoice,
            QuestionData::MultiSelect(_) => QuestionType::MultiSelect,
            QuestionData::DropDown(_) => QuestionType::DropDown,
            QuestionData::Ranking(_) => QuestionType::Ranking,
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct MultiOptionData {
    options: Vec<MultiOptionQuestionOption>,
}

impl Default for MultiOptionData {
    fn default() -> Self {
        Self {
            // Return an empty vector to be replaced by real data later on.
            options: vec![],
        }
    }
}

/// Each of these structs represent a row in the `multi_option_question_options`
/// table. For a `MultiChoice` question like "What is your favourite programming
/// language?", there would be rows for "Rust", "Java" and "TypeScript".
#[derive(Deserialize, Serialize)]
pub struct MultiOptionQuestionOption {
    id: i64,
    display_order: i32,
    text: String,
}

impl QuestionData {
    fn from_question_type(question_type: &QuestionType) -> Self {
        match question_type {
            QuestionType::ShortAnswer => QuestionData::ShortAnswer,
            QuestionType::MultiChoice => QuestionData::MultiChoice(MultiOptionData::default()),
            QuestionType::MultiSelect => QuestionData::MultiSelect(MultiOptionData::default()),
            QuestionType::DropDown => QuestionData::DropDown(MultiOptionData::default()),
            QuestionType::Ranking => QuestionData::Ranking(MultiOptionData::default()),
        }
    }

    fn from_question_raw_data(question_type: QuestionType, multi_option_data: Option<sqlx::types::Json<Vec<MultiOptionQuestionOption>>>) -> Self {
        return if question_type == QuestionType::ShortAnswer {
            QuestionData::ShortAnswer
        } else if
            question_type == QuestionType::MultiChoice ||
            question_type == QuestionType::MultiSelect ||
            question_type == QuestionType::DropDown ||
            question_type == QuestionType::Ranking
         {
            let options = multi_option_data.expect("Data should exist for MultiOptionData variants").0;
            let data = MultiOptionData { options };

            match question_type {
                QuestionType::MultiChoice => QuestionData::MultiChoice(data),
                QuestionType::MultiSelect => QuestionData::MultiSelect(data),
                QuestionType::DropDown => QuestionData::DropDown(data),
                QuestionType::Ranking => QuestionData::Ranking(data),
                _ => QuestionData::ShortAnswer // Should never be reached, hence return ShortAnswer
            }
        } else {
            QuestionData::ShortAnswer // Should never be reached, hence return ShortAnswer
        }
    }

    pub fn validate(&self) -> Result<(), ChaosError> {
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

    pub async fn insert_into_db(self, question_id: i64, transaction: &mut Transaction<'_,Postgres>, mut snowflake_generator: SnowflakeIdGenerator) -> Result<(), ChaosError> {
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
                query.execute(transaction.deref_mut()).await?;

                Ok(())
            }
        }
    }

    pub async fn get_from_db(self, question_id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<Self, ChaosError> {
        match self {
            Self::ShortAnswer => Ok(Self::ShortAnswer),
            Self::MultiChoice(_) => {
                let data_vec = sqlx::query_as!(
                    MultiOptionQuestionOption,
                    "
                        SELECT id, display_order, text FROM multi_option_question_options
                        WHERE question_id = $1
                    ",
                    question_id
                )
                    .fetch_all(transaction.deref_mut())
                    .await?;

                let data = MultiOptionData {
                    options: data_vec
                };

                Ok(Self::MultiChoice(data))
            },
            Self::MultiSelect(_) => {
                let data_vec = sqlx::query_as!(
                    MultiOptionQuestionOption,
                    "
                        SELECT id, display_order, text FROM multi_option_question_options
                        WHERE question_id = $1
                    ",
                    question_id
                )
                    .fetch_all(transaction.deref_mut())
                    .await?;

                let data = MultiOptionData {
                    options: data_vec
                };

                Ok(Self::MultiSelect(data))
            }
            Self::DropDown(_) => {
                let data_vec = sqlx::query_as!(
                    MultiOptionQuestionOption,
                    "
                        SELECT id, display_order, text FROM multi_option_question_options
                        WHERE question_id = $1
                    ",
                    question_id
                )
                    .fetch_all(transaction.deref_mut())
                    .await?;

                let data = MultiOptionData {
                    options: data_vec
                };

                Ok(Self::DropDown(data))
            }
            Self::Ranking(_) => {
                let data_vec = sqlx::query_as!(
                    MultiOptionQuestionOption,
                    "
                        SELECT id, display_order, text FROM multi_option_question_options
                        WHERE question_id = $1
                    ",
                    question_id
                )
                    .fetch_all(transaction.deref_mut())
                    .await?;

                let data = MultiOptionData {
                    options: data_vec
                };

                Ok(Self::Ranking(data))
            }
        }
    }

    pub async fn delete_from_db(self, question_id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<(), ChaosError> {
        match self {
            Self::ShortAnswer => Ok(()),
            Self::MultiChoice(_)
            | Self::MultiSelect(_)
            | Self::DropDown(_)
            | Self::Ranking(_) => {
                sqlx::query!("DELETE FROM multi_option_question_options WHERE question_id = $1", question_id)
                    .execute(transaction.deref_mut())
                    .await?;

                Ok(())
            }
        }
    }
}
