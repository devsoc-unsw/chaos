use crate::models::error::ChaosError;
use crate::models::question::{
    MultiOptionData, MultiOptionQuestionOption, QuestionData, QuestionType, QuestionTypeParent,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Pool, Postgres, Transaction};
use std::ops::DerefMut;

/// The `Answer` type that will be sent in API responses.
///
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
    id: i64,
    question_id: i64,

    #[serde(flatten)]
    answer_data: AnswerData,

    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct NewAnswer {
    pub application_id: i64,
    pub question_id: i64,

    #[serde(flatten)]
    pub answer_data: AnswerData,
}

#[derive(Deserialize, sqlx::FromRow)]
pub struct AnswerRawData {
    id: i64,
    question_id: i64,
    question_type: QuestionType,
    short_answer_answer: Option<String>,
    multi_option_answers: Option<Vec<i64>>,
    ranking_answers: Option<Vec<i64>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct AnswerTypeApplicationId {
    question_type: QuestionType,
    application_id: i64,
}

impl Answer {
    pub async fn create(
        user_id: i64,
        application_id: i64,
        question_id: i64,
        answer_data: AnswerData,
        mut snowflake_generator: SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        answer_data.validate()?;

        let id = snowflake_generator.generate();

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

    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Answer, ChaosError> {
        let answer_raw_data: AnswerRawData = sqlx::query_as(
            "
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS \"question_type: QuestionType\",
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
                    a.id
            ",
        )
        .bind(id)
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

    pub async fn get_all_common_by_application(
        application_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Answer>, ChaosError> {
        let answer_raw_data: Vec<AnswerRawData> = sqlx::query_as(
            "
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS \"question_type: QuestionType\",
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
                    a.id
            ",
        )
        .bind(application_id)
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

    pub async fn get_all_by_application_and_role(
        application_id: i64,
        role_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Answer>, ChaosError> {
        let answer_raw_data: Vec<AnswerRawData> = sqlx::query_as(
            "
                SELECT
                    a.id,
                    a.question_id,
                    q.question_type AS \"question_type: QuestionType\",
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
                    a.id
            ",
        )
        .bind(application_id)
        .bind(role_id)
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

    pub async fn update(
        id: i64,
        answer_data: AnswerData,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        answer_data.validate()?;

        let answer = sqlx::query_as!(
            AnswerTypeApplicationId,
            "
                SELECT a.application_id, q.question_type AS \"question_type: QuestionType\"
                    FROM answers a
                    JOIN questions q ON a.question_id = q.id
                    WHERE a.id = $1
            ",
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

#[derive(Deserialize, Serialize)]
#[serde(tag = "answer_type", content = "data")]
pub enum AnswerData {
    ShortAnswer(String),
    MultiChoice(i64),
    MultiSelect(Vec<i64>),
    DropDown(i64),
    Ranking(Vec<i64>),
}

impl AnswerData {
    fn from_question_type(question_type: &QuestionType) -> Self {
        match question_type {
            QuestionType::ShortAnswer => AnswerData::ShortAnswer("".to_string()),
            QuestionType::MultiChoice => AnswerData::MultiChoice(0),
            QuestionType::MultiSelect => AnswerData::MultiSelect(Vec::<i64>::new()),
            QuestionType::DropDown => AnswerData::DropDown(0),
            QuestionType::Ranking => AnswerData::Ranking(Vec::<i64>::new()),
        }
    }

    fn from_answer_raw_data(
        question_type: QuestionType,
        short_answer_answer: Option<String>,
        multi_option_answers: Option<Vec<i64>>,
        ranking_answers: Option<Vec<i64>>,
    ) -> Self {
        return if question_type == QuestionType::ShortAnswer {
            let answer = short_answer_answer.expect("Data should exist for ShortAnswer variant");
            AnswerData::ShortAnswer(answer)
        } else if question_type == QuestionType::MultiChoice
            || question_type == QuestionType::MultiSelect
            || question_type == QuestionType::DropDown
        {
            let options =
                multi_option_answers.expect("Data should exist for MultiOptionData variants");

            match question_type {
                QuestionType::MultiChoice => AnswerData::MultiChoice(options[0]),
                QuestionType::MultiSelect => AnswerData::MultiSelect(options),
                QuestionType::DropDown => AnswerData::DropDown(options[0]),
                _ => AnswerData::ShortAnswer("".to_string()), // Should never be reached, hence return ShortAnswer
            }
        } else if question_type == QuestionType::Ranking {
            let options = ranking_answers.expect("Data should exist for Ranking variant");
            AnswerData::Ranking(options)
        } else {
            AnswerData::ShortAnswer("".to_string()) // Should never be reached, hence return ShortAnswer
        };
    }

    pub fn validate(&self) -> Result<(), ChaosError> {
        match self {
            Self::ShortAnswer(text) => {
                if text.len() == 0 {
                    return Err(ChaosError::BadRequest);
                }
            }
            Self::MultiSelect(data) | Self::Ranking(data) => {
                if data.len() == 0 {
                    return Err(ChaosError::BadRequest);
                }
            }
            _ => {}
        }

        Ok(())
    }

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
