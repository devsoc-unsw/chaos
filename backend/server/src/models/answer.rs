//! Answer management module for the Chaos application.
//! 
//! This module provides functionality for managing answers to application questions,
//! including creation, retrieval, updating, and deletion of answers. It supports
//! various question types such as short answer, multiple choice, and ranking questions.

use crate::models::error::ChaosError;
use crate::models::question::QuestionType;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Postgres, Transaction};
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
    answer_data: AnswerData,

    /// When the answer was created
    created_at: DateTime<Utc>,
    /// When the answer was last updated
    updated_at: DateTime<Utc>,
}

/// Data structure for creating a new answer.
/// 
/// Contains the question ID and the answer data.
#[derive(Deserialize)]
pub struct NewAnswer {
    /// ID of the question this answer is for
    pub question_id: i64,

    /// The actual answer data, flattened in serialization
    #[serde(flatten)]
    pub answer_data: AnswerData,
}

/// Raw answer data from the database.
/// 
/// Contains all fields needed to construct an Answer structure,
/// including the question type and various answer formats.
#[derive(Deserialize, sqlx::FromRow)]
pub struct AnswerRawData {
    /// Unique identifier for the answer
    id: i64,
    /// ID of the question this answer is for
    question_id: i64,
    /// Type of the question
    question_type: QuestionType,
    /// Text answer for short answer questions
    short_answer_answer: Option<String>,
    /// Selected options for multiple choice/select questions
    multi_option_answers: Option<Vec<i64>>,
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
    /// Creates a new answer.
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
        answer_data: AnswerData,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        answer_data.validate()?;

        let id = snowflake_generator.real_time_generate();

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

        answer_data.insert_into_db(id, transaction).await?;

        Ok(id)
    }

    /// Retrieves an answer by its ID.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the answer to retrieve
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<Answer, ChaosError>` - Answer details or error
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Answer, ChaosError> {
        let answer_raw_data = sqlx::query_as!(
            AnswerRawData,
            r#"
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS "question_type: QuestionType",
                    a.created_at,
                    a.updated_at,
                    saa.text AS short_answer_answer,
                    array_agg(
                        moao.option_id
                    ) multi_option_answers,
                    array_agg(
                        rar.option_id ORDER BY rar.rank
                    ) ranking_answers
                FROM
                    answers a
                    JOIN questions q ON a.question_id = q.id
                        LEFT JOIN
                    multi_option_answer_options moao ON moao.answer_id = a.id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown')
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

        let answer_data = AnswerData::from_answer_raw_data(
            answer_raw_data.question_type,
            answer_raw_data.short_answer_answer,
            answer_raw_data.multi_option_answers,
            answer_raw_data.ranking_answers,
        );

        Ok(Answer {
            id,
            question_id: answer_raw_data.question_id,
            answer_data,
            created_at: answer_raw_data.created_at,
            updated_at: answer_raw_data.updated_at,
        })
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
        let answer_raw_data = sqlx::query_as!(
            AnswerRawData,
            r#"
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS "question_type: QuestionType",
                    a.created_at,
                    a.updated_at,
                    saa.text AS short_answer_answer,
                    array_agg(
                        moao.option_id
                    ) multi_option_answers,
                    array_agg(
                        rar.option_id ORDER BY rar.rank
                    ) ranking_answers
                FROM
                    answers a
                    JOIN questions q ON a.question_id = q.id
                        LEFT JOIN
                    multi_option_answer_options moao ON moao.answer_id = a.id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown')

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

        let answers = answer_raw_data
            .into_iter()
            .map(|answer_raw_data| {
                let answer_data = AnswerData::from_answer_raw_data(
                    answer_raw_data.question_type,
                    answer_raw_data.short_answer_answer,
                    answer_raw_data.multi_option_answers,
                    answer_raw_data.ranking_answers,
                );

                Answer {
                    id: answer_raw_data.id,
                    question_id: answer_raw_data.question_id,
                    answer_data,
                    created_at: answer_raw_data.created_at,
                    updated_at: answer_raw_data.updated_at,
                }
            })
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
        let answer_raw_data = sqlx::query_as!(
            AnswerRawData,
            r#"
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS "question_type: QuestionType",
                    a.created_at,
                    a.updated_at,
                    saa.text AS short_answer_answer,
                    array_agg(
                        moao.option_id
                    ) multi_option_answers,
                    array_agg(
                        rar.option_id ORDER BY rar.rank
                    ) ranking_answers
                FROM
                    answers a
                    JOIN questions q ON a.question_id = q.id
                    JOIN question_roles qr ON q.id = qr.question_id
                        LEFT JOIN
                    multi_option_answer_options moao ON moao.answer_id = a.id
                        AND q.question_type IN ('MultiChoice', 'MultiSelect', 'DropDown')

                        LEFT JOIN
                    short_answer_answers saa ON saa.answer_id = a.id
                        AND q.question_type = 'ShortAnswer'

                        LEFT JOIN
                    ranking_answer_rankings rar ON rar.answer_id = a.id
                        AND q.question_type = 'Ranking'
                WHERE a.application_id = $1 AND qr.role_id = $2 AND q.common = true
                GROUP BY
                    a.id, q.question_type, saa.text
            "#,
            application_id,
            role_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        let answers = answer_raw_data
            .into_iter()
            .map(|answer_raw_data| {
                let answer_data = AnswerData::from_answer_raw_data(
                    answer_raw_data.question_type,
                    answer_raw_data.short_answer_answer,
                    answer_raw_data.multi_option_answers,
                    answer_raw_data.ranking_answers,
                );

                Answer {
                    id: answer_raw_data.id,
                    question_id: answer_raw_data.question_id,
                    answer_data,
                    created_at: answer_raw_data.created_at,
                    updated_at: answer_raw_data.updated_at,
                }
            })
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
        answer_data: AnswerData,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        answer_data.validate()?;

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

        let old_data = AnswerData::from_question_type(&answer.question_type);
        old_data.delete_from_db(id, transaction).await?;

        answer_data.insert_into_db(id, transaction).await?;

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
        let _ = sqlx::query!("DELETE FROM answers WHERE id = $1 RETURNING id", id)
            .fetch_one(transaction.deref_mut())
            .await?;

        Ok(())
    }
}

/// Represents the different types of answer data.
/// 
/// Each variant corresponds to a different question type and contains
/// the appropriate data format for that type.
#[derive(Deserialize, Serialize)]
pub enum AnswerData {
    /// Text answer for short answer questions
    ShortAnswer(String),
    /// Single selected option for multiple choice questions
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    MultiChoice(i64),
    /// Multiple selected options for multi-select questions
    #[serde(serialize_with = "crate::models::serde_string::serialize_vec")]
    MultiSelect(Vec<i64>),
    /// Single selected option for dropdown questions
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    DropDown(i64),
    /// Ranked list of options for ranking questions
    #[serde(serialize_with = "crate::models::serde_string::serialize_vec")]
    Ranking(Vec<i64>),
}

impl AnswerData {
    /// Creates a new AnswerData instance based on a question type.
    /// 
    /// # Arguments
    /// 
    /// * `question_type` - Type of the question
    /// 
    /// # Returns
    /// 
    /// * `AnswerData` - New answer data instance
    fn from_question_type(question_type: &QuestionType) -> Self {
        match question_type {
            QuestionType::ShortAnswer => AnswerData::ShortAnswer("".to_string()),
            QuestionType::MultiChoice => AnswerData::MultiChoice(0),
            QuestionType::MultiSelect => AnswerData::MultiSelect(Vec::<i64>::new()),
            QuestionType::DropDown => AnswerData::DropDown(0),
            QuestionType::Ranking => AnswerData::Ranking(Vec::<i64>::new()),
        }
    }

    /// Creates an AnswerData instance from raw database data.
    /// 
    /// # Arguments
    /// 
    /// * `question_type` - Type of the question
    /// * `short_answer_answer` - Text answer for short answer questions
    /// * `multi_option_answers` - Selected options for multiple choice/select questions
    /// * `ranking_answers` - Ranked options for ranking questions
    /// 
    /// # Returns
    /// 
    /// * `AnswerData` - New answer data instance
    fn from_answer_raw_data(
        question_type: QuestionType,
        short_answer_answer: Option<String>,
        multi_option_answers: Option<Vec<i64>>,
        ranking_answers: Option<Vec<i64>>,
    ) -> Self {
        match question_type {
            QuestionType::ShortAnswer => {
                let answer =
                    short_answer_answer.expect("Data should exist for ShortAnswer variant");
                AnswerData::ShortAnswer(answer)
            }
            QuestionType::MultiChoice | QuestionType::MultiSelect | QuestionType::DropDown => {
                let options =
                    multi_option_answers.expect("Data should exist for MultiOptionData variants");

                match question_type {
                    QuestionType::MultiChoice => AnswerData::MultiChoice(options[0]),
                    QuestionType::MultiSelect => AnswerData::MultiSelect(options),
                    QuestionType::DropDown => AnswerData::DropDown(options[0]),
                    _ => AnswerData::ShortAnswer("".to_string()), // Should never be reached, hence return ShortAnswer
                }
            }
            QuestionType::Ranking => {
                let options = ranking_answers.expect("Data should exist for Ranking variant");
                AnswerData::Ranking(options)
            }
        }
    }

    /// Validates the answer data.
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success if valid, error if not
    pub fn validate(&self) -> Result<(), ChaosError> {
        match self {
            Self::ShortAnswer(text) => {
                if text.is_empty() {
                    return Err(ChaosError::BadRequest);
                }
            }
            Self::MultiSelect(data) | Self::Ranking(data) => {
                if data.is_empty() {
                    return Err(ChaosError::BadRequest);
                }
            }
            _ => {}
        }

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
            Self::MultiChoice(option_id) | Self::DropDown(option_id) => {
                sqlx::query!(
                    "INSERT INTO multi_option_answer_options (option_id, answer_id) VALUES ($1, $2)",
                    option_id,
                    answer_id
                )
                    .execute(transaction.deref_mut())
                    .await?;

                Ok(())
            }
            Self::MultiSelect(option_ids) => {
                let mut query_builder = sqlx::QueryBuilder::new(
                    "INSERT INTO multi_option_answer_options (option_id, answer_id)",
                );

                query_builder.push_values(option_ids, |mut b, option_id| {
                    b.push_bind(option_id).push_bind(answer_id);
                });

                let query = query_builder.build();
                query.execute(transaction.deref_mut()).await?;

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

    /// Deletes the answer data from the database.
    /// 
    /// # Arguments
    /// 
    /// * `answer_id` - ID of the answer to delete data for
    /// * `transaction` - Database transaction to use
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
