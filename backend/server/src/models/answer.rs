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
    data: AnswerData,

    /// When the answer was created
    created_at: DateTime<Utc>,
    /// When the answer was last updated
    updated_at: DateTime<Utc>,
}

/// A view type which collects an answer in the system along with it's
/// associated role.
#[derive(Deserialize, Serialize)]
pub struct AnswerWithRole {
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    id: i64,
    /// ID of the question this answer is for
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    question_id: i64,

    /// The actual answer data, flattened in serialization
    #[serde(flatten)]
    data: AnswerData,

    // role ID
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    role_id: i64,
}
/// Data structure for creating a new answer.
///
/// Contains the question ID and the answer data.
#[derive(Deserialize, Serialize)]
pub struct NewAnswer {
    /// ID of the question this answer is for
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub question_id: i64,

    /// The actual answer data, flattened in serialization
    #[serde(flatten)]
    pub data: AnswerData,
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
        data: AnswerData,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        data.validate()?;

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

        data.insert_into_db(id, transaction).await?;

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
                    COALESCE(saa.text, '') AS short_answer_answer,
                    array_remove(array_agg(
                        moao.option_id
                    ), NULL) AS multi_option_answers,
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
            data: answer_data,
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
                    COALESCE(saa.text, '') AS short_answer_answer,
                    array_remove(array_agg(
                        moao.option_id
                    ), NULL) AS multi_option_answers,
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
                    data: answer_data,
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
                    COALESCE(saa.text, '') AS short_answer_answer,
                    array_remove(array_agg(
                        moao.option_id
                    ), NULL) AS multi_option_answers,
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
                    data: answer_data,
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
        data: AnswerData,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        if !data.is_empty() {
            data.validate()?;
        }

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

        if !data.is_empty() {
            data.insert_into_db(id, transaction).await?;
        }

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

/// Represents the different types of answer data.
///
/// Each variant corresponds to a different question type and contains
/// the appropriate data format for that type.
#[derive(Deserialize, Serialize)]
#[serde(tag = "answer_type", content = "answer_data")]
pub enum AnswerData {
    /// Text answer for short answer questions
    ShortAnswer(String),
    /// Single selected option for multiple choice questions
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    MultiChoice(i64),
    /// Multiple selected options for multi-select questions
    #[serde(serialize_with = "crate::models::serde_string::serialize_vec")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_vec")]
    MultiSelect(Vec<i64>),
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

    pub fn is_empty(&self) -> bool {
        match self {
            AnswerData::ShortAnswer(text) => text.is_empty(),
            AnswerData::MultiSelect(options) | AnswerData::Ranking(options) => options.is_empty(),
            AnswerData::MultiChoice(_option_id) => false,
            AnswerData::DropDown(option_id) => *option_id == 0,
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

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
    // =========================================================================
    //
    // Functions under test
    //   · AnswerData::validate(&self) -> Result<(), ChaosError>
    //   · AnswerData::is_empty(&self) -> bool
    //   · AnswerData::from_question_type(&QuestionType) -> AnswerData
    //   · AnswerData::from_answer_raw_data(QuestionType, Option<String>,
    //                 Option<Vec<i64>>, Option<Vec<i64>>) -> AnswerData
    //   · AnswerData (serde) – tag = "answer_type", content = "answer_data",
    //                 i64 (de)serialised as string via serde_string
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    // validate – the five variants split into "validated" and "always-Ok" classes
    //
    //  ID    Input                       Class               Expected            Test
    //  EP01  ShortAnswer("text")         non-empty text      Ok(())              short_answer_with_text_is_valid
    //  EP02  ShortAnswer("")             empty text          Err(BadRequest)     returns_bad_request_for_empty_short_answer
    //  EP03  MultiSelect([1,2])          non-empty options   Ok(())              multi_select_with_options_is_valid
    //  EP04  MultiSelect([])             empty options       Err(BadRequest)     returns_bad_request_for_empty_multi_select
    //  EP05  Ranking([1,2])              non-empty options   Ok(())              ranking_with_options_is_valid
    //  EP06  Ranking([])                 empty options       Err(BadRequest)     returns_bad_request_for_empty_ranking
    //  EP07  MultiChoice(0)              always-Ok class     Ok(())              multi_choice_is_always_valid
    //  EP08  DropDown(0)                 always-Ok class     Ok(())              drop_down_is_always_valid
    //
    // is_empty – emptiness predicate per variant
    //
    //  ID    Input                       Expected   Test
    //  EP09  ShortAnswer("")             true       short_answer_emptiness_tracks_text
    //  EP10  ShortAnswer("x")            false      short_answer_emptiness_tracks_text
    //  EP11  MultiSelect([]) / Ranking([]) true     vec_variants_empty_when_no_options
    //  EP12  MultiSelect([1]) / Ranking([1]) false  vec_variants_non_empty_with_options
    //  EP13  MultiChoice(0)              false      multi_choice_is_never_empty
    //  EP14  DropDown(0)                 true       drop_down_emptiness_tracks_zero_sentinel
    //  EP15  DropDown(5)                 false      drop_down_emptiness_tracks_zero_sentinel
    //
    // from_question_type – exhaustive mapping QuestionType -> default AnswerData
    //
    //  ID    Input                       Expected default      Test
    //  EP16  ShortAnswer                 ShortAnswer("")       from_question_type_builds_each_default
    //  EP17  MultiChoice                 MultiChoice(0)        from_question_type_builds_each_default
    //  EP18  MultiSelect                 MultiSelect([])       from_question_type_builds_each_default
    //  EP19  DropDown                    DropDown(0)           from_question_type_builds_each_default
    //  EP20  Ranking                     Ranking([])           from_question_type_builds_each_default
    //
    // from_answer_raw_data – reconstruction from DB columns
    //
    //  ID    (type, short, multi, ranking)                Expected           Test
    //  EP21  (ShortAnswer, Some("hi"), -, -)              ShortAnswer("hi")  from_raw_builds_short_answer
    //  EP22  (MultiChoice, -, Some([7,8]), -)             MultiChoice(7)     from_raw_takes_first_option_for_single_select
    //  EP23  (DropDown,    -, Some([9]),  -)              DropDown(9)        from_raw_takes_first_option_for_single_select
    //  EP24  (MultiSelect, -, Some([1,2]),-)              MultiSelect([1,2]) from_raw_keeps_all_options_for_multi_select
    //  EP25  (Ranking,     -, -, Some([3,1,2]))           Ranking([3,1,2])   from_raw_preserves_ranking_order
    //  EP26  (ShortAnswer, None, -, -)                    panic              panics_when_short_answer_column_missing
    //  EP27  (MultiChoice, -, None, -)                    panic              panics_when_multi_option_column_missing
    //  EP28  (Ranking,     -, -, None)                    panic              panics_when_ranking_column_missing
    //
    // serde – round-trip of the externally-tagged representation
    //
    //  ID    Variant            JSON                                              Test
    //  EP29  MultiChoice(7)     {"answer_type":"MultiChoice","answer_data":"7"}   serialises_id_as_string
    //  EP30  MultiSelect([1,2]) {..,"answer_data":["1","2"]}                      serialises_vec_as_string_array
    //  EP31  ShortAnswer("hi")  {..,"answer_data":"hi"}                           short_answer_round_trips
    //  EP32  numeric id input   {"answer_data":7}                                 deserialises_numeric_id
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    // collection length (Vec<i64> / String) – boundary between empty and non-empty
    // is what validate() and is_empty() pivot on.
    //
    //  ID    Value                  Function    Expected            Test                          Status
    //  BV01  ShortAnswer len 0      validate    Err(BadRequest)     returns_bad_request_for_empty_short_answer   OK
    //  BV02  ShortAnswer len 1      validate    Ok(())              short_answer_with_text_is_valid              OK
    //  BV03  MultiSelect len 0      validate    Err(BadRequest)     returns_bad_request_for_empty_multi_select   OK
    //  BV04  MultiSelect len 1      validate    Ok(())              multi_select_with_options_is_valid           OK
    //  BV05  Ranking len 0          validate    Err(BadRequest)     returns_bad_request_for_empty_ranking        OK
    //  BV06  Ranking len 1          validate    Ok(())              ranking_with_options_is_valid                OK
    //
    // DropDown option_id (i64) – 0 is the "unset" sentinel for is_empty().
    //
    //  ID    Value    Expected   Test                                        Status
    //  BV07  0        true       drop_down_emptiness_tracks_zero_sentinel    OK
    //  BV08  1        false      drop_down_emptiness_tracks_zero_sentinel    OK
    //
    // multi_option vec length in from_answer_raw_data – the single-select
    // variants index `options[0]`, so an empty vec is an out-of-bounds boundary.
    //
    //  ID    Value                          Expected   Test                                     Status
    //  BV09  (MultiChoice, Some([]))        panic      panics_when_single_select_column_empty   OK
    //  BV10  (MultiChoice, Some([7]))       MultiChoice(7) from_raw_takes_first_option_for_single_select OK
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · The async DB methods (create, get, get_all_common_by_application,
    //    get_all_by_application_and_role, update, delete) are untested here.
    //    They require a Postgres pool and a deep seed graph (organisation →
    //    campaign → application → question → options) to exercise, so they belong
    //    in an integration suite using `#[sqlx::test]`. Until added, the SQL JOINs,
    //    the DELETE-then-INSERT replace semantics in create(), and the
    //    application `updated_at` bump in update() are unverified, so a regression
    //    in any of those queries would ship undetected.
    //
    //  · validate() and is_empty() disagree on MultiChoice and DropDown:
    //    MultiChoice(0) is never empty yet always valid, while DropDown(0) IS
    //    empty yet still validates Ok. The 0 sentinel is never rejected by
    //    validate(), so a single-select answer pointing at the non-existent
    //    option 0 passes validation and is only caught (if at all) by a DB
    //    foreign-key. This asymmetry is asserted but its product-level
    //    correctness is out of scope here.
    //
    //  · from_answer_raw_data has an unreachable `_ => ShortAnswer("")` arm inside
    //    the single-select match. It cannot be hit given the outer match guard, so
    //    it is left uncovered by design.
    // =========================================================================

    use super::*;

    // ── AnswerData::validate ──────────────────────────────────────────────────

    /// White-box: a ShortAnswer with non-empty text skips the empty-text guard.
    #[test]
    fn short_answer_with_text_is_valid() {
        let result = AnswerData::ShortAnswer("an answer".to_string()).validate();
        assert!(matches!(result, Ok(())), "non-empty text should validate");
    }

    /// White-box: an empty ShortAnswer string trips the `text.is_empty()` guard.
    #[test]
    fn returns_bad_request_for_empty_short_answer() {
        let result = AnswerData::ShortAnswer(String::new()).validate();
        assert!(matches!(result, Err(ChaosError::BadRequest)));
    }

    /// White-box: a MultiSelect with at least one option passes the empty-vec guard.
    #[test]
    fn multi_select_with_options_is_valid() {
        let result = AnswerData::MultiSelect(vec![1]).validate();
        assert!(matches!(result, Ok(())));
    }

    /// White-box: an empty MultiSelect vec trips the `data.is_empty()` guard.
    #[test]
    fn returns_bad_request_for_empty_multi_select() {
        let result = AnswerData::MultiSelect(Vec::new()).validate();
        assert!(matches!(result, Err(ChaosError::BadRequest)));
    }

    /// White-box: a Ranking with at least one option passes the empty-vec guard.
    #[test]
    fn ranking_with_options_is_valid() {
        let result = AnswerData::Ranking(vec![1]).validate();
        assert!(matches!(result, Ok(())));
    }

    /// White-box: an empty Ranking vec trips the shared `data.is_empty()` guard.
    #[test]
    fn returns_bad_request_for_empty_ranking() {
        let result = AnswerData::Ranking(Vec::new()).validate();
        assert!(matches!(result, Err(ChaosError::BadRequest)));
    }

    /// White-box: MultiChoice falls into the `_ => {}` arm and is never rejected.
    #[test]
    fn multi_choice_is_always_valid() {
        assert!(matches!(AnswerData::MultiChoice(0).validate(), Ok(())));
        assert!(matches!(AnswerData::MultiChoice(42).validate(), Ok(())));
    }

    /// White-box: DropDown falls into the `_ => {}` arm and is never rejected.
    #[test]
    fn drop_down_is_always_valid() {
        assert!(matches!(AnswerData::DropDown(0).validate(), Ok(())));
        assert!(matches!(AnswerData::DropDown(42).validate(), Ok(())));
    }

    // ── AnswerData::is_empty ──────────────────────────────────────────────────

    /// White-box: ShortAnswer emptiness mirrors the inner string's emptiness.
    #[test]
    fn short_answer_emptiness_tracks_text() {
        assert!(AnswerData::ShortAnswer(String::new()).is_empty());
        assert!(!AnswerData::ShortAnswer("x".to_string()).is_empty());
    }

    /// White-box: MultiSelect and Ranking report empty when their vecs are empty.
    #[test]
    fn vec_variants_empty_when_no_options() {
        assert!(AnswerData::MultiSelect(Vec::new()).is_empty());
        assert!(AnswerData::Ranking(Vec::new()).is_empty());
    }

    /// White-box: MultiSelect and Ranking report non-empty with one or more options.
    #[test]
    fn vec_variants_non_empty_with_options() {
        assert!(!AnswerData::MultiSelect(vec![1]).is_empty());
        assert!(!AnswerData::Ranking(vec![1]).is_empty());
    }

    /// White-box: MultiChoice hardcodes `false` regardless of the option id (even 0).
    #[test]
    fn multi_choice_is_never_empty() {
        assert!(!AnswerData::MultiChoice(0).is_empty());
        assert!(!AnswerData::MultiChoice(99).is_empty());
    }

    /// White-box: DropDown treats option id 0 as the "unset" sentinel for emptiness.
    #[test]
    fn drop_down_emptiness_tracks_zero_sentinel() {
        assert!(
            AnswerData::DropDown(0).is_empty(),
            "0 is the unset sentinel and must read as empty"
        );
        assert!(!AnswerData::DropDown(5).is_empty());
    }

    // ── AnswerData::from_question_type ────────────────────────────────────────

    /// White-box: each QuestionType maps to its zero-value AnswerData default.
    #[test]
    fn from_question_type_builds_each_default() {
        match AnswerData::from_question_type(&QuestionType::ShortAnswer) {
            AnswerData::ShortAnswer(s) => assert_eq!(s, ""),
            _ => panic!("ShortAnswer should map to AnswerData::ShortAnswer"),
        }
        match AnswerData::from_question_type(&QuestionType::MultiChoice) {
            AnswerData::MultiChoice(id) => assert_eq!(id, 0),
            _ => panic!("MultiChoice should map to AnswerData::MultiChoice"),
        }
        match AnswerData::from_question_type(&QuestionType::MultiSelect) {
            AnswerData::MultiSelect(v) => assert!(v.is_empty()),
            _ => panic!("MultiSelect should map to AnswerData::MultiSelect"),
        }
        match AnswerData::from_question_type(&QuestionType::DropDown) {
            AnswerData::DropDown(id) => assert_eq!(id, 0),
            _ => panic!("DropDown should map to AnswerData::DropDown"),
        }
        match AnswerData::from_question_type(&QuestionType::Ranking) {
            AnswerData::Ranking(v) => assert!(v.is_empty()),
            _ => panic!("Ranking should map to AnswerData::Ranking"),
        }
    }

    // ── AnswerData::from_answer_raw_data ──────────────────────────────────────

    /// White-box: ShortAnswer reconstruction unwraps the short_answer column.
    #[test]
    fn from_raw_builds_short_answer() {
        let data = AnswerData::from_answer_raw_data(
            QuestionType::ShortAnswer,
            Some("hello".to_string()),
            None,
            None,
        );
        match data {
            AnswerData::ShortAnswer(s) => assert_eq!(s, "hello"),
            _ => panic!("expected ShortAnswer variant"),
        }
    }

    /// White-box: single-select variants keep only `options[0]` from the vec.
    #[test]
    fn from_raw_takes_first_option_for_single_select() {
        let multi_choice = AnswerData::from_answer_raw_data(
            QuestionType::MultiChoice,
            None,
            Some(vec![7, 8]),
            None,
        );
        match multi_choice {
            AnswerData::MultiChoice(id) => {
                assert_eq!(id, 7, "MultiChoice keeps only the first option")
            }
            _ => panic!("expected MultiChoice variant"),
        }

        let drop_down =
            AnswerData::from_answer_raw_data(QuestionType::DropDown, None, Some(vec![9]), None);
        match drop_down {
            AnswerData::DropDown(id) => assert_eq!(id, 9),
            _ => panic!("expected DropDown variant"),
        }
    }

    /// White-box: MultiSelect reconstruction retains every option in order.
    #[test]
    fn from_raw_keeps_all_options_for_multi_select() {
        let data = AnswerData::from_answer_raw_data(
            QuestionType::MultiSelect,
            None,
            Some(vec![1, 2, 3]),
            None,
        );
        match data {
            AnswerData::MultiSelect(v) => assert_eq!(v, vec![1, 2, 3]),
            _ => panic!("expected MultiSelect variant"),
        }
    }

    /// White-box: Ranking reconstruction preserves the order of the ranking column.
    #[test]
    fn from_raw_preserves_ranking_order() {
        let data =
            AnswerData::from_answer_raw_data(QuestionType::Ranking, None, None, Some(vec![3, 1, 2]));
        match data {
            AnswerData::Ranking(v) => {
                assert_eq!(v, vec![3, 1, 2], "ranking order must be preserved as stored")
            }
            _ => panic!("expected Ranking variant"),
        }
    }

    /// White-box: a missing short_answer column makes the `.expect()` panic.
    #[test]
    #[should_panic(expected = "Data should exist for ShortAnswer variant")]
    fn panics_when_short_answer_column_missing() {
        AnswerData::from_answer_raw_data(QuestionType::ShortAnswer, None, None, None);
    }

    /// White-box: a missing multi_option column makes the `.expect()` panic.
    #[test]
    #[should_panic(expected = "Data should exist for MultiOptionData variants")]
    fn panics_when_multi_option_column_missing() {
        AnswerData::from_answer_raw_data(QuestionType::MultiChoice, None, None, None);
    }

    /// White-box: a missing ranking column makes the `.expect()` panic.
    #[test]
    #[should_panic(expected = "Data should exist for Ranking variant")]
    fn panics_when_ranking_column_missing() {
        AnswerData::from_answer_raw_data(QuestionType::Ranking, None, None, None);
    }

    /// White-box: an empty single-select vec is an out-of-bounds `options[0]` access.
    #[test]
    #[should_panic]
    fn panics_when_single_select_column_empty() {
        AnswerData::from_answer_raw_data(QuestionType::MultiChoice, None, Some(Vec::new()), None);
    }

    // ── AnswerData serde ──────────────────────────────────────────────────────

    /// White-box: a single i64 id serialises as a JSON string under answer_data.
    #[test]
    fn serialises_id_as_string() {
        let json = serde_json::to_value(AnswerData::MultiChoice(7)).unwrap();
        assert_eq!(
            json,
            serde_json::json!({ "answer_type": "MultiChoice", "answer_data": "7" })
        );
    }

    /// White-box: a Vec<i64> serialises as an array of JSON strings.
    #[test]
    fn serialises_vec_as_string_array() {
        let json = serde_json::to_value(AnswerData::MultiSelect(vec![1, 2])).unwrap();
        assert_eq!(
            json,
            serde_json::json!({ "answer_type": "MultiSelect", "answer_data": ["1", "2"] })
        );
    }

    /// White-box: a ShortAnswer survives a serialize → deserialize round-trip.
    #[test]
    fn short_answer_round_trips() {
        let json = serde_json::to_value(AnswerData::ShortAnswer("hi".to_string())).unwrap();
        assert_eq!(
            json,
            serde_json::json!({ "answer_type": "ShortAnswer", "answer_data": "hi" })
        );

        let back: AnswerData = serde_json::from_value(json).unwrap();
        match back {
            AnswerData::ShortAnswer(s) => assert_eq!(s, "hi"),
            _ => panic!("expected ShortAnswer after round-trip"),
        }
    }

    /// White-box: serde_string::deserialize also accepts a bare JSON number for ids.
    #[test]
    fn deserialises_numeric_id() {
        let back: AnswerData =
            serde_json::from_value(serde_json::json!({ "answer_type": "DropDown", "answer_data": 7 }))
                .unwrap();
        match back {
            AnswerData::DropDown(id) => assert_eq!(id, 7),
            _ => panic!("expected DropDown variant"),
        }
    }
}

#[cfg(test)]
mod db_tests {
    // =========================================================================
    // TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
    // =========================================================================
    //
    // Functions under test
    //   · Answer::create(app_id, q_id, AnswerData, &mut gen, &mut tx) -> Result<i64, ChaosError>
    //   · Answer::get(id, &mut tx) -> Result<Answer, ChaosError>
    //   · Answer::get_all_common_by_application(app_id, &mut tx) -> Result<Vec<Answer>, ChaosError>
    //   · Answer::get_all_by_application_and_role(app_id, role_id, &mut tx) -> Result<Vec<Answer>, ChaosError>
    //   · Answer::update(id, AnswerData, &mut tx) -> Result<(), ChaosError>
    //   · Answer::delete(id, &mut tx) -> Result<(), ChaosError>
    //
    // The seed graph (org 1 → campaign 1 → role 1 → application 1) is shared by
    // every test. Questions: q100 ShortAnswer common, q200 MultiChoice role-only,
    // q300 Ranking common. Options 201/202 belong to q200, 301/302 to q300.
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    // create – validity & replace semantics
    //
    //  ID    Input                                   Expected                         Test
    //  EP01  valid ShortAnswer, fresh app/question   Ok(id) + row in child table      create_inserts_short_answer
    //  EP02  valid MultiChoice for a new answer      Ok(id) + option row              create_inserts_multi_choice_option
    //  EP03  second create for same app+question     Ok(id) + exactly one answer left create_replaces_existing_answer
    //  EP04  invalid (empty ShortAnswer)             Err(BadRequest) + nothing written returns_bad_request_for_invalid_create
    //
    // get – key existence
    //
    //  ID    Input                       Expected                              Test
    //  EP05  question with one answer    Ok(Answer) carrying that answer data  get_returns_created_answer
    //  EP06  question id with no answer  Err(DatabaseError(RowNotFound))       returns_error_for_missing_answer
    //
    // get_all_common_by_application – common flag partition
    //
    //  ID    Setup                                   Expected                  Test
    //  EP07  answers on common + non-common qs       only common answers back  get_all_common_returns_only_common
    //
    // get_all_by_application_and_role – role + non-common partition
    //
    //  ID    Setup                                   Expected                  Test
    //  EP08  answer on a role-scoped non-common q    that answer back, no common ones  get_all_by_role_returns_role_answers
    //
    // update – non-empty vs empty replacement
    //
    //  ID    Input                       Expected                                  Test
    //  EP09  non-empty new ShortAnswer   child row replaced, app updated_at bumped update_replaces_answer_data
    //  EP10  empty ShortAnswer           child row cleared, no new row inserted     update_with_empty_data_clears_answer
    //
    // delete – key existence
    //
    //  ID    Input              Expected                          Test
    //  EP11  existing answer    Ok(()) + answer row removed       delete_removes_answer
    //  EP12  missing answer id  Err(DatabaseError(RowNotFound))   returns_error_for_missing_delete
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    // answer count per (application, question) – create() runs DELETE-then-INSERT,
    // so the boundary is "at most one answer survives" no matter how many creates.
    //
    //  ID    Sequence                       Expected answer count   Test                          Status
    //  BV01  one create                     1                       create_inserts_short_answer   OK
    //  BV02  two creates, same app+question 1                       create_replaces_existing_answer OK
    //
    // child-table rows after update with empty data – boundary between "data
    // present" and "data cleared".
    //
    //  ID    Input                Child rows   Test                              Status
    //  BV03  update non-empty     1            update_replaces_answer_data       OK
    //  BV04  update empty         0            update_with_empty_data_clears_answer OK
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · Answer::get filters on `q.id = $1`, i.e. it is keyed by QUESTION id, not
    //    answer id, and sets the returned Answer.id to that same input. With more
    //    than one application answering the same question its `fetch_one` would
    //    error on multiple rows. These tests only ever seed a single application,
    //    so the single-application happy path is covered but the multi-application
    //    fan-out (and the id-vs-question-id confusion) is left as a documented gap.
    //
    //  · The deferred foreign keys from the answer child tables to
    //    multi_option_question_options are only enforced at COMMIT. Because
    //    `#[sqlx::test]` rolls its transaction back, an answer pointing at a
    //    non-existent option id would NOT be rejected here. Referential integrity
    //    of option ids is therefore not exercised by this suite.
    //
    //  · Concurrency, the `submitted`/`status` application columns, and the
    //    cross-table cascade on delete are out of scope.
    // =========================================================================

    use super::*;
    use sqlx::PgPool;

    // ── helpers ──────────────────────────────────────────────────────────────

    /// Builds org 1 → campaign 1 → role 1 → application 1, plus questions q100
    /// (ShortAnswer, common), q200 (MultiChoice, role-scoped) and q300 (Ranking,
    /// common) with their options. Deterministic: fixed ids, no clock input.
    async fn seed(pool: &PgPool) {
        sqlx::query("INSERT INTO users (id, email, name) VALUES (1, 'applicant@test.com', 'Applicant')")
            .execute(pool)
            .await
            .unwrap();

        sqlx::query(
            "INSERT INTO organisations (id, slug, name, contact_email)
             VALUES (1, 'org', 'Org', 'contact@test.com')",
        )
        .execute(pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO campaigns (id, organisation_id, slug, name, starts_at, ends_at, published)
             VALUES (1, 1, 'camp', 'Camp', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', true)",
        )
        .execute(pool)
        .await
        .unwrap();

        sqlx::query(
            "INSERT INTO campaign_roles (id, campaign_id, name, min_available, max_available, finalised)
             VALUES (1, 1, 'Role', 1, 5, false)",
        )
        .execute(pool)
        .await
        .unwrap();

        sqlx::query("INSERT INTO applications (id, campaign_id, user_id) VALUES (1, 1, 1)")
            .execute(pool)
            .await
            .unwrap();

        // questions: (id, title, common, required, question_type)
        for (id, title, common, qtype) in [
            (100_i64, "Short", true, "ShortAnswer"),
            (200_i64, "Choice", false, "MultiChoice"),
            (300_i64, "Rank", true, "Ranking"),
        ] {
            sqlx::query(
                "INSERT INTO questions (id, title, common, required, question_type, campaign_id)
                 VALUES ($1, $2, $3, true, $4::question_type, 1)",
            )
            .bind(id)
            .bind(title)
            .bind(common)
            .bind(qtype)
            .execute(pool)
            .await
            .unwrap();
        }

        // options for the multi-option questions
        for (id, text, question_id, order) in [
            (201_i64, "A", 200_i64, 0_i32),
            (202_i64, "B", 200_i64, 1_i32),
            (301_i64, "X", 300_i64, 0_i32),
            (302_i64, "Y", 300_i64, 1_i32),
        ] {
            sqlx::query(
                "INSERT INTO multi_option_question_options (id, text, question_id, display_order)
                 VALUES ($1, $2, $3, $4)",
            )
            .bind(id)
            .bind(text)
            .bind(question_id)
            .bind(order)
            .execute(pool)
            .await
            .unwrap();
        }

        // q200 is scoped to role 1
        sqlx::query("INSERT INTO question_roles (question_id, role_id) VALUES (200, 1)")
            .execute(pool)
            .await
            .unwrap();
    }

    /// Number of answer rows for a given (application, question) pair.
    async fn answer_count(tx: &mut Transaction<'_, Postgres>, app_id: i64, q_id: i64) -> i64 {
        sqlx::query_scalar(
            "SELECT COUNT(*) FROM answers WHERE application_id = $1 AND question_id = $2",
        )
        .bind(app_id)
        .bind(q_id)
        .fetch_one(&mut **tx)
        .await
        .unwrap()
    }

    /// The (answer_type, answer_data) pair of an Answer, read via its serde form.
    fn typed_data(answer: &Answer) -> (String, serde_json::Value) {
        let json = serde_json::to_value(answer).unwrap();
        (
            json["answer_type"].as_str().unwrap().to_string(),
            json["answer_data"].clone(),
        )
    }

    /// The question_id strings carried by a serialised list of answers.
    fn question_ids(answers: &[Answer]) -> Vec<String> {
        serde_json::to_value(answers)
            .unwrap()
            .as_array()
            .unwrap()
            .iter()
            .map(|a| a["question_id"].as_str().unwrap().to_string())
            .collect()
    }

    // ── Answer::create ────────────────────────────────────────────────────────

    /// White-box: create writes the answer row and its ShortAnswer child row.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_inserts_short_answer(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);

        let id = Answer::create(
            1,
            100,
            AnswerData::ShortAnswer("hello".to_string()),
            &mut gen,
            &mut tx,
        )
        .await
        .unwrap();

        assert_eq!(answer_count(&mut tx, 1, 100).await, 1);
        let text: String =
            sqlx::query_scalar("SELECT text FROM short_answer_answers WHERE answer_id = $1")
                .bind(id)
                .fetch_one(&mut *tx)
                .await
                .unwrap();
        assert_eq!(text, "hello");
    }

    /// White-box: a MultiChoice create lands a single row in the option table.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_inserts_multi_choice_option(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);

        let id = Answer::create(1, 200, AnswerData::MultiChoice(201), &mut gen, &mut tx)
            .await
            .unwrap();

        let option: i64 =
            sqlx::query_scalar("SELECT option_id FROM multi_option_answer_options WHERE answer_id = $1")
                .bind(id)
                .fetch_one(&mut *tx)
                .await
                .unwrap();
        assert_eq!(option, 201);
    }

    /// White-box: create's DELETE-then-INSERT leaves only the newest answer.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_replaces_existing_answer(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);

        Answer::create(
            1,
            100,
            AnswerData::ShortAnswer("first".to_string()),
            &mut gen,
            &mut tx,
        )
        .await
        .unwrap();
        Answer::create(
            1,
            100,
            AnswerData::ShortAnswer("second".to_string()),
            &mut gen,
            &mut tx,
        )
        .await
        .unwrap();

        assert_eq!(
            answer_count(&mut tx, 1, 100).await,
            1,
            "the second create must replace, not append"
        );
        let text: String =
            sqlx::query_scalar("SELECT text FROM short_answer_answers WHERE answer_id = (SELECT id FROM answers WHERE application_id = 1 AND question_id = 100)")
                .fetch_one(&mut *tx)
                .await
                .unwrap();
        assert_eq!(text, "second");
    }

    /// White-box: invalid data fails validate() before any row is written.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_bad_request_for_invalid_create(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);

        let result = Answer::create(
            1,
            100,
            AnswerData::ShortAnswer(String::new()),
            &mut gen,
            &mut tx,
        )
        .await;

        assert!(matches!(result, Err(ChaosError::BadRequest)));
        assert_eq!(
            answer_count(&mut tx, 1, 100).await,
            0,
            "a rejected create must not write an answer row"
        );
    }

    // ── Answer::get ───────────────────────────────────────────────────────────

    /// White-box: get reconstructs the AnswerData stored for the question.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_returns_created_answer(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);
        Answer::create(1, 200, AnswerData::MultiChoice(201), &mut gen, &mut tx)
            .await
            .unwrap();

        let answer = Answer::get(200, &mut tx).await.unwrap();

        let (answer_type, answer_data) = typed_data(&answer);
        assert_eq!(answer_type, "MultiChoice");
        assert_eq!(answer_data, serde_json::json!("201"));
    }

    /// White-box: a question with no answer yields fetch_one's RowNotFound.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_error_for_missing_answer(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();

        let result = Answer::get(100, &mut tx).await;

        assert!(matches!(
            result,
            Err(ChaosError::DatabaseError(sqlx::Error::RowNotFound))
        ));
    }

    // ── Answer::get_all_common_by_application ─────────────────────────────────

    /// White-box: only answers to common questions are returned, non-common excluded.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_all_common_returns_only_common(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);
        Answer::create(
            1,
            100,
            AnswerData::ShortAnswer("common".to_string()),
            &mut gen,
            &mut tx,
        )
        .await
        .unwrap();
        Answer::create(1, 200, AnswerData::MultiChoice(201), &mut gen, &mut tx)
            .await
            .unwrap();
        Answer::create(1, 300, AnswerData::Ranking(vec![301, 302]), &mut gen, &mut tx)
            .await
            .unwrap();

        let answers = Answer::get_all_common_by_application(1, &mut tx)
            .await
            .unwrap();

        let mut ids = question_ids(&answers);
        ids.sort();
        assert_eq!(
            ids,
            vec!["100".to_string(), "300".to_string()],
            "only the two common-question answers should be returned"
        );
    }

    // ── Answer::get_all_by_application_and_role ───────────────────────────────

    /// White-box: role-scoped non-common answers come back; common ones do not.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_all_by_role_returns_role_answers(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);
        Answer::create(
            1,
            100,
            AnswerData::ShortAnswer("common".to_string()),
            &mut gen,
            &mut tx,
        )
        .await
        .unwrap();
        Answer::create(1, 200, AnswerData::MultiChoice(201), &mut gen, &mut tx)
            .await
            .unwrap();

        let answers = Answer::get_all_by_application_and_role(1, 1, &mut tx)
            .await
            .unwrap();

        assert_eq!(
            question_ids(&answers),
            vec!["200".to_string()],
            "only the role-scoped non-common answer should be returned"
        );
    }

    // ── Answer::update ────────────────────────────────────────────────────────

    /// White-box: non-empty update swaps the child row and bumps app updated_at.
    #[sqlx::test(migrations = "../migrations")]
    async fn update_replaces_answer_data(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);
        let id = Answer::create(
            1,
            100,
            AnswerData::ShortAnswer("old".to_string()),
            &mut gen,
            &mut tx,
        )
        .await
        .unwrap();
        let before: DateTime<Utc> =
            sqlx::query_scalar("SELECT updated_at FROM applications WHERE id = 1")
                .fetch_one(&mut *tx)
                .await
                .unwrap();

        Answer::update(id, AnswerData::ShortAnswer("new".to_string()), &mut tx)
            .await
            .unwrap();

        let text: String =
            sqlx::query_scalar("SELECT text FROM short_answer_answers WHERE answer_id = $1")
                .bind(id)
                .fetch_one(&mut *tx)
                .await
                .unwrap();
        assert_eq!(text, "new");
        let rows: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM short_answer_answers WHERE answer_id = $1")
                .bind(id)
                .fetch_one(&mut *tx)
                .await
                .unwrap();
        assert_eq!(rows, 1, "the old child row must be replaced, not duplicated");
        let after: DateTime<Utc> =
            sqlx::query_scalar("SELECT updated_at FROM applications WHERE id = 1")
                .fetch_one(&mut *tx)
                .await
                .unwrap();
        assert!(after > before, "update must move the application's updated_at forward");
    }

    /// White-box: empty data skips validation, deletes the old row, inserts none.
    #[sqlx::test(migrations = "../migrations")]
    async fn update_with_empty_data_clears_answer(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);
        let id = Answer::create(
            1,
            100,
            AnswerData::ShortAnswer("old".to_string()),
            &mut gen,
            &mut tx,
        )
        .await
        .unwrap();

        Answer::update(id, AnswerData::ShortAnswer(String::new()), &mut tx)
            .await
            .unwrap();

        let rows: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM short_answer_answers WHERE answer_id = $1")
                .bind(id)
                .fetch_one(&mut *tx)
                .await
                .unwrap();
        assert_eq!(rows, 0, "empty update must clear the child row");
    }

    // ── Answer::delete ────────────────────────────────────────────────────────

    /// White-box: delete removes the answer row for an existing id.
    #[sqlx::test(migrations = "../migrations")]
    async fn delete_removes_answer(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let mut gen = SnowflakeIdGenerator::new(1, 1);
        let id = Answer::create(
            1,
            100,
            AnswerData::ShortAnswer("bye".to_string()),
            &mut gen,
            &mut tx,
        )
        .await
        .unwrap();

        Answer::delete(id, &mut tx).await.unwrap();

        assert_eq!(answer_count(&mut tx, 1, 100).await, 0);
    }

    /// White-box: deleting a non-existent id surfaces fetch_one's RowNotFound.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_error_for_missing_delete(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();

        let result = Answer::delete(999, &mut tx).await;

        assert!(matches!(
            result,
            Err(ChaosError::DatabaseError(sqlx::Error::RowNotFound))
        ));
    }
}
