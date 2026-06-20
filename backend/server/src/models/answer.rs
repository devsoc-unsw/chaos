//! Answer management module for the Chaos application.
//!
//! This module provides functionality for managing answers to application questions,
//! including creation, retrieval, updating, and deletion of answers. It supports
//! various question types such as short answer, multiple choice, and ranking questions.

use crate::models::error::ChaosError;
use crate::models::question::QuestionType;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use snowflake::SnowflakeIdGenerator;
use sqlx::{types::Json, Postgres, Transaction};
use std::ops::DerefMut;

/// Represents an answer in the system.
///
/// An answer is a response to a question in an application. The answer data is
/// stored in a type-specific format based on the question type.
///
/// With the chosen `serde` representation and the use of `#[serde(flatten)]`, the JSON for a
/// `Answer` will look like this:
/// ```json
/// {
///   "id": 7233828375289773948,
///   "question_id": 7233828375289139200,
///   "answer_type": "MultiChoice",
///   "data": 7233828393325384908,
///   "created_at": "2024-06-28T16:29:04.644008111Z",
///   "updated_at": "2024-06-30T12:14:12.458390190Z"
/// }
/// ```
#[derive(Deserialize, Serialize)]
pub struct Answer {
    /// Unique identifier for the answer
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    id: i64,
    /// ID of the question this answer is for
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    question_id: i64,

    /// The actual answer data, flattened in serialization
    #[serde(flatten)]
    data: AnswerData,

    /// When the answer was created
    created_at: DateTime<Utc>,
    /// When the answer was last updated
    updated_at: DateTime<Utc>,
}

/// Data structure representing an answer being created / updated.
///
/// Contains the question ID and the answer data.
#[derive(Deserialize, Serialize)]
pub struct NewAnswer {
    /// ID of the question this answer is for
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub question_id: i64,

    /// The actual answer data, flattened in serialization
    #[serde(flatten)]
    pub data: NewAnswerData,
}

/// A raw answer from the database.
///
/// Contains all fields needed to construct an Answer structure,
/// including the question type and various answer formats.
#[derive(Deserialize, sqlx::FromRow)]
pub struct RawAnswer {
    /// Unique identifier for the answer
    id: i64,
    /// ID of the question this answer is for
    question_id: i64,
    /// Type of the question
    question_type: QuestionType,
    /// Text answer for short answer questions
    short_answer_answer: Option<String>,
    /// Selected options for multiple choice/select questions
    multi_option_answers: Option<Json<Vec<MultiChoiceAnswer>>>,
    /// Ranked options for ranking questions
    ranking_answers: Option<Vec<i64>>,
    /// When the answer was created
    created_at: DateTime<Utc>,
    /// When the answer was last updated
    updated_at: DateTime<Utc>,
}

/// Data structure for identifying an answer by type and application.
#[derive(Deserialize)]
pub struct AnswerTypeApplicationId {
    /// Type of the question
    question_type: QuestionType,
    /// ID of the application this answer belongs to
    application_id: i64,
}

impl Answer {
    /// Creates a new answer, overwriting any answer that may already exist.
    ///
    /// # Arguments
    ///
    /// * `application_id` - ID of the application this answer belongs to
    /// * `question_id` - ID of the question being answered
    /// * `answer_data` - The answer data
    /// * `snowflake_generator` - Generator for creating unique IDs
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<i64, ChaosError>` - ID of the created answer or error
    pub async fn create(
        application_id: i64,
        question_id: i64,
        data: NewAnswerData,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        // Validate answer data
        data.validate()?;

        // Delete any existing answer that may exist
        sqlx::query!(
            "
                DELETE FROM answers
                WHERE application_id = $1 AND question_id = $2
            ",
            application_id,
            question_id
        )
        .execute(transaction.deref_mut())
        .await?;
        let id = snowflake_generator.real_time_generate();

        // Insert new answer into database
        sqlx::query!(
            "
                INSERT INTO answers (id, application_id, question_id)
                VALUES ($1, $2, $3)
            ",
            id,
            application_id,
            question_id
        )
        .execute(transaction.deref_mut())
        .await?;

        // Insert question-type specific answer info into database
        data.insert_into_db(id, transaction).await?;

        // Return answer ID
        Ok(id)
    }

    /// Retrieve an answer using its ID.
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the answer to retrieve.
    /// * `transaction` - The database transaction to use.
    ///
    /// # Returns
    ///
    /// * `Result<Answer, ChaosError>` - Answer details or error
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Answer, ChaosError> {
        // Fetch raw answer from database
        let raw_answer = sqlx::query_as!(
            RawAnswer,
            r#"
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS "question_type: QuestionType",
                    a.created_at,
                    a.updated_at,
                    COALESCE(saa.text, '') AS short_answer_answer,
                    jsonb_agg(
                        jsonb_build_object(
                            'option_id', moao.option_id,
                            'value', COALESCE(moqo.text, moao.custom_value),
                            'is_custom', CASE WHEN moao.option_id IS NULL THEN true ELSE false END
                        )
                    ) FILTER ( WHERE moao.option_id IS NOT NULL OR moqo.text IS NOT NULL)
                        AS "multi_option_answers: Json<Vec<MultiChoiceAnswer>>",
                    array_remove(array_agg(
                        rar.option_id ORDER BY rar.rank
                    ), NULL) AS ranking_answers
                FROM
                    answers a
                    JOIN questions q ON a.question_id = q.id
                        LEFT JOIN
                    multi_option_answer_options moao ON moao.answer_id = a.id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown')
                        LEFT JOIN
                    multi_option_question_options moqo ON moqo.id = moao.option_id
                        LEFT JOIN
                    short_answer_answers saa ON saa.answer_id = a.id
                        AND q.question_type = 'ShortAnswer'
                        LEFT JOIN
                    ranking_answer_rankings rar ON rar.answer_id = a.id
                        AND q.question_type = 'Ranking'
                WHERE q.id = $1
                GROUP BY
                    a.id, q.question_type, saa.text
            "#,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        // Return full answer instance
        Ok(raw_answer.into())
    }

    /// Retrieves all common answers for an application.
    ///
    /// Common answers are those that apply to all roles in the application.
    ///
    /// # Arguments
    ///
    /// * `application_id` - ID of the application to get answers for
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<Vec<Answer>, ChaosError>` - List of answers or error
    pub async fn get_all_common_by_application(
        application_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Answer>, ChaosError> {
        // Fetch raw answers from database
        let raw_answers = sqlx::query_as!(
            RawAnswer,
            r#"
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS "question_type: QuestionType",
                    a.created_at,
                    a.updated_at,
                    COALESCE(saa.text, '') AS short_answer_answer,
                    jsonb_agg(
                        jsonb_build_object(
                            'option_id', moao.option_id,
                            'value', COALESCE(moqo.text, moao.custom_value),
                            'is_custom', CASE WHEN moao.option_id IS NULL THEN true ELSE false END
                        )
                    ) FILTER ( WHERE moao.option_id IS NOT NULL OR moqo.text IS NOT NULL)
                        AS "multi_option_answers: Json<Vec<MultiChoiceAnswer>>",
                    array_remove(array_agg(
                        rar.option_id ORDER BY rar.rank
                    ), NULL) AS ranking_answers
                FROM
                    answers a
                    JOIN questions q ON a.question_id = q.id
                        LEFT JOIN
                    multi_option_answer_options moao ON moao.answer_id = a.id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown')
                        LEFT JOIN
                    multi_option_question_options moqo ON moqo.id = moao.option_id
                        LEFT JOIN
                    short_answer_answers saa ON saa.answer_id = a.id
                        AND q.question_type = 'ShortAnswer'

                        LEFT JOIN
                    ranking_answer_rankings rar ON rar.answer_id = a.id
                        AND q.question_type = 'Ranking'
                WHERE a.application_id = $1 AND q.common = true
                GROUP BY
                    a.id, q.question_type, saa.text
            "#,
            application_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        // Convert raw answers into full answer instances
        let answers = raw_answers
            .into_iter()
            .map(|raw_answer| raw_answer.into())
            .collect();

        Ok(answers)
    }

    /// Retrieves all answers for an application and role.
    ///
    /// # Arguments
    ///
    /// * `application_id` - ID of the application to get answers for
    /// * `role_id` - ID of the role to get answers for
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<Vec<Answer>, ChaosError>` - List of answers or error
    pub async fn get_all_by_application_and_role(
        application_id: i64,
        role_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Answer>, ChaosError> {
        // Fetch raw answers from database
        let raw_answers = sqlx::query_as!(
            RawAnswer,
            r#"
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS "question_type: QuestionType",
                    a.created_at,
                    a.updated_at,
                    COALESCE(saa.text, '') AS short_answer_answer,
                    jsonb_agg(
                        jsonb_build_object(
                            'option_id', moao.option_id,
                            'value', COALESCE(moqo.text, moao.custom_value),
                            'is_custom', CASE WHEN moao.option_id IS NULL THEN true ELSE false END
                        )
                    ) FILTER ( WHERE moao.option_id IS NOT NULL OR moqo.text IS NOT NULL)
                        AS "multi_option_answers: Json<Vec<MultiChoiceAnswer>>",
                    array_remove(array_agg(
                        rar.option_id ORDER BY rar.rank
                    ), NULL) AS ranking_answers
                FROM
                    answers a
                    JOIN questions q ON a.question_id = q.id
                    JOIN question_roles qr ON q.id = qr.question_id
                        LEFT JOIN
                    multi_option_answer_options moao ON moao.answer_id = a.id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown')
                        LEFT JOIN
                    multi_option_question_options moqo ON moqo.id = moao.option_id
                        LEFT JOIN
                    short_answer_answers saa ON saa.answer_id = a.id
                        AND q.question_type = 'ShortAnswer'

                        LEFT JOIN
                    ranking_answer_rankings rar ON rar.answer_id = a.id
                        AND q.question_type = 'Ranking'
                WHERE a.application_id = $1 AND qr.role_id = $2 AND q.common = false
                GROUP BY
                    a.id, q.question_type, saa.text
            "#,
            application_id,
            role_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        // Convert raw answers into full answer instances
        let answers = raw_answers
            .into_iter()
            .map(|raw_answer| raw_answer.into())
            .collect();

        Ok(answers)
    }

    /// Updates an existing answer.
    ///
    /// # Arguments
    ///
    /// * `id` - ID of the answer to update
    /// * `answer_data` - New answer data
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn update(
        id: i64,
        data: NewAnswerData,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        data.validate()?;

        // Fetch current answer from the database
        let answer = sqlx::query_as!(
            AnswerTypeApplicationId,
            r#"
                SELECT a.application_id, q.question_type AS "question_type: QuestionType"
                    FROM answers a
                    JOIN questions q ON a.question_id = q.id
                    WHERE a.id = $1
            "#,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        // Remove any old answer data that may exist from the database
        let old_data = AnswerData::create_stub(&answer.question_type);
        old_data.delete_from_db(id, transaction).await?;

        // Insert new answer data into the database
        data.insert_into_db(id, transaction).await?;

        // Update application updated at time
        sqlx::query!(
            "UPDATE applications SET updated_at = $1 WHERE id = $2",
            Utc::now(),
            answer.application_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Deletes an answer.
    ///
    /// # Arguments
    ///
    /// * `id` - ID of the answer to delete
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn delete(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!("DELETE FROM answers WHERE id = $1 RETURNING id", id)
            .fetch_one(transaction.deref_mut())
            .await?;

        Ok(())
    }
}

impl From<RawAnswer> for Answer {
    fn from(value: RawAnswer) -> Self {
        Self {
            id: value.id,
            question_id: value.question_id,
            created_at: value.created_at,
            updated_at: value.updated_at,
            data: AnswerData::from_raw_answer(value),
        }
    }
}

/// Represents the different types of answer data (to be returned).
///
/// Each variant corresponds to a different question type and contains
/// the appropriate data format for that type.
#[derive(Deserialize, Serialize)]
#[serde(tag = "answer_type", content = "answer_data")]
pub enum AnswerData {
    /// Text answer for short answer questions
    ShortAnswer(String),
    /// Single selected option for multiple choice questions
    MultiChoice(MultiChoiceAnswer),
    /// Multiple selected options for multi-select questions
    MultiSelect(Vec<MultiChoiceAnswer>),
    /// Single selected option for dropdown questions
    DropDown(MultiChoiceAnswer),
    /// Ranked list of options for ranking questions
    #[serde(serialize_with = "crate::models::serde_string::serialize_vec")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_vec")]
    Ranking(Vec<i64>),
}

/// Represents the different types of answer data.
///
/// Each variant corresponds to a different question type and contains
/// the appropriate data format for that type.
///
/// This only accepts choice IDs for multi-choice questions, over the full format returned
/// by the API.
#[derive(Deserialize, Serialize)]
#[serde(tag = "answer_type", content = "answer_data")]
pub enum NewAnswerData {
    /// Text answer for short answer questions
    ShortAnswer(String),
    /// Single selected option for multiple choice questions
    MultiChoice(NewMultiChoiceAnswer),
    /// Multiple selected options for multi-select questions
    MultiSelect(Vec<NewMultiChoiceAnswer>),
    /// Single selected option for dropdown questions
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    DropDown(i64),
    /// Ranked list of options for ranking questions
    #[serde(serialize_with = "crate::models::serde_string::serialize_vec")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_vec")]
    Ranking(Vec<i64>),
}

impl AnswerData {
    /// Creates a new AnswerData stub instance for a given question type.
    ///
    /// # Arguments
    ///
    /// * `question_type` - The type of question to create a stub for.
    ///
    /// # Returns
    ///
    /// * `AnswerData` - The newly created stub answer data instance.
    fn create_stub(question_type: &QuestionType) -> Self {
        match question_type {
            QuestionType::ShortAnswer => AnswerData::ShortAnswer("".to_string()),
            QuestionType::MultiChoice => AnswerData::MultiChoice(MultiChoiceAnswer::from_id(0)),
            QuestionType::MultiSelect => AnswerData::MultiSelect(Vec::<MultiChoiceAnswer>::new()),
            QuestionType::DropDown => AnswerData::DropDown(MultiChoiceAnswer::from_id(0)),
            QuestionType::Ranking => AnswerData::Ranking(Vec::<i64>::new()),
        }
    }

    /// Create an AnswerData instance using a raw answer from the database.
    ///
    /// # Arguments
    ///
    /// * `raw_data` - The raw answer to turn into an answer data instance.
    ///
    /// # Returns
    ///
    /// * `AnswerData` - The newly created AnswerData instance.
    fn from_raw_answer(answer: RawAnswer) -> Self {
        match answer.question_type {
            QuestionType::ShortAnswer => AnswerData::ShortAnswer(
                answer
                    .short_answer_answer
                    .expect("Data should exist for ShortAnswer variant"),
            ),
            QuestionType::MultiChoice => AnswerData::MultiChoice(
                answer
                    .multi_option_answers
                    .expect("Data should exist for MultiChoice variant")
                    .0
                    .into_iter()
                    .next()
                    .unwrap(),
            ),
            QuestionType::MultiSelect => AnswerData::MultiSelect(
                answer
                    .multi_option_answers
                    .expect("Data should exist for MultiSelect variant")
                    .0,
            ),
            QuestionType::DropDown => AnswerData::DropDown(
                answer
                    .multi_option_answers
                    .expect("Data should exist for DropDown variant")
                    .0
                    .into_iter()
                    .next()
                    .unwrap(),
            ),
            QuestionType::Ranking => AnswerData::Ranking(
                answer
                    .ranking_answers
                    .expect("Data should exist for Ranking variant"),
            ),
        }
    }

    /// Deletes the answer data from the database, given the ID of the answer it is for.
    ///
    /// # Arguments
    ///
    /// * `answer_id` - The ID of the answer to delete data for.
    /// * `transaction` - The database transaction to use.
    ///
    /// # Returns
    ///
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn delete_from_db(
        self,
        answer_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        match self {
            Self::ShortAnswer(_) => {
                sqlx::query!(
                    "DELETE FROM short_answer_answers WHERE answer_id = $1",
                    answer_id
                )
                .execute(transaction.deref_mut())
                .await?;
            }
            Self::MultiChoice(_) | Self::MultiSelect(_) | Self::DropDown(_) => {
                sqlx::query!(
                    "DELETE FROM multi_option_answer_options WHERE answer_id = $1",
                    answer_id
                )
                .execute(transaction.deref_mut())
                .await?;
            }
            Self::Ranking(_) => {
                sqlx::query!(
                    "DELETE FROM ranking_answer_rankings WHERE answer_id = $1",
                    answer_id
                )
                .execute(transaction.deref_mut())
                .await?;
            }
        }

        Ok(())
    }
}

impl NewAnswerData {
    /// Return whether the new answer data is empty.
    ///
    /// # Returns
    ///
    /// * `boolean` - Whether the new answer data is empty.
    pub fn is_empty(&self) -> bool {
        match self {
            NewAnswerData::ShortAnswer(text) => text.is_empty(),
            NewAnswerData::MultiSelect(answers) => answers.is_empty(),
            NewAnswerData::MultiChoice(answer) => false,
            NewAnswerData::Ranking(options) => options.is_empty(),
            NewAnswerData::DropDown(answer) => *answer == 0,
        }
    }

    /// Validates the answer data.
    ///
    /// # Returns
    ///
    /// * `Result<(), ChaosError>` - Success if valid, error if not
    pub fn validate(&self) -> Result<(), ChaosError> {
        // Check if the answer is empty
        if self.is_empty() {
            return Err(ChaosError::BadRequest);
        }

        // Check if multi-choice answers are valid
        match self {
            Self::MultiChoice(new_answer) if !new_answer.is_valid() => {
                return Err(ChaosError::BadRequest)
            }
            Self::MultiSelect(new_answers)
                if new_answers.iter().any(|answer| !answer.is_valid()) =>
            {
                return Err(ChaosError::BadRequest)
            }
            _ => (),
        };

        Ok(())
    }

    /// Inserts the answer data into the database.
    ///
    /// # Arguments
    ///
    /// * `answer_id` - ID of the answer to insert data for
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn insert_into_db(
        self,
        answer_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        match self {
            Self::ShortAnswer(text) => {
                sqlx::query!(
                    "INSERT INTO short_answer_answers (text, answer_id) VALUES ($1, $2)",
                    text,
                    answer_id
                )
                .execute(transaction.deref_mut())
                .await?;

                Ok(())
            }
            Self::MultiChoice(new_answer) => {
                sqlx::query!(
                    "INSERT INTO multi_option_answer_options (option_id, answer_id, custom_value) VALUES ($1, $2, $3)",
                    new_answer.option_id,
                    answer_id,
                    new_answer.custom_value,
                )
                        .execute(transaction.deref_mut())
                        .await?;

                Ok(())
            }
            Self::MultiSelect(option_ids) => {
                let mut query_builder = sqlx::QueryBuilder::new(
                    "INSERT INTO multi_option_answer_options (option_id, answer_id, custom_value)",
                );

                query_builder.push_values(option_ids, |mut b, new_answer| {
                    b.push_bind(new_answer.option_id)
                        .push_bind(answer_id)
                        .push_bind(new_answer.custom_value);
                });

                let query = query_builder.build();
                query.execute(transaction.deref_mut()).await?;

                Ok(())
            }
            Self::DropDown(option_id) => {
                sqlx::query!(
                    "INSERT INTO multi_option_answer_options (option_id, answer_id) VALUES ($1, $2)",
                    option_id,
                    answer_id
                )
                    .execute(transaction.deref_mut())
                    .await?;

                Ok(())
            }
            Self::Ranking(option_ids) => {
                let mut query_builder = sqlx::QueryBuilder::new(
                    "INSERT INTO ranking_answer_rankings (option_id, rank, answer_id)",
                );

                let mut rank = 1;
                query_builder.push_values(option_ids, |mut b, option_id| {
                    b.push_bind(option_id).push_bind(rank).push_bind(answer_id);
                    rank += 1;
                });

                let query = query_builder.build();
                query.execute(transaction.deref_mut()).await?;

                Ok(())
            }
        }
    }
}

/// Represents a single multiple choice answer, for either the multichoice or multiselect question types.
#[derive(Deserialize, Serialize)]
#[serde_as]
pub struct MultiChoiceAnswer {
    /// The ID of the answer option, or null if this was a custom entry.
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub option_id: Option<i64>,

    /// The value of the answer.
    pub value: String,

    /// Whether the answer is a custom response.
    pub is_custom: bool,
}

/// Represents a single new multiple choice answer, for submitting an answer to either the multichoice or multiselect question types.
#[derive(Deserialize, Serialize)]
#[serde_as]
pub struct NewMultiChoiceAnswer {
    /// The ID of the answer option, or null if this is a custom entry.
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub option_id: Option<i64>,

    /// The custom value of the answer, if this is a custom entry.
    pub custom_value: Option<String>,
}

impl MultiChoiceAnswer {
    /// Create a new blank multiple choice answer with the provided ID.
    ///
    /// The text of this answer is empty, and `is_custom` is false.
    ///
    /// # Arguments
    ///
    /// * `option_id` - The option ID to use for this answer.
    ///
    /// # Returns
    ///
    /// * `MultiChoiceAnswer` - The new multiple choice answer.
    pub fn from_id(option_id: i64) -> MultiChoiceAnswer {
        MultiChoiceAnswer {
            option_id: Some(option_id),
            value: String::new(),
            is_custom: false,
        }
    }
}

impl NewMultiChoiceAnswer {
    /// Return whether this multiple choice answer is valid (either an option ID or custom value is provided).
    pub fn is_valid(&self) -> bool {
        if self.option_id.is_some() {
            self.custom_value.is_none()
        } else if let Some(custom_value) = &self.custom_value {
            !custom_value.is_empty()
        } else {
            false
        }
    }
}
