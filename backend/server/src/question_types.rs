use diesel::PgConnection;
use serde::{Deserialize, Serialize};

use crate::database::{schema::QuestionTypes, Database, models::Question};
/**
 * In this file, add new question types that we need to implement
 * e.g.
 * MultiSelect
 */


#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub enum QuestionDataEnum {
    ShortAnswer,
    MultiSelect(MultiSelect),
}

impl QuestionDataEnum {
    /**
     * Insert the inner struct into its corresponding table according to the type given by question_type
     */
    async fn insert_question_data(
        self,
        conn: &mut PgConnection,
        question: &mut Question,
        db: Database
    ) -> Option<Self> {
        db.run(move |conn| {
            match self {
                QuestionDataEnum::ShortAnswer => {
                    // do nothing, currently by default a question is of ShortAnswer Type
                },
                QuestionDataEnum::MultiSelect(multi_select_data) => {
                    // Insert Multi Select Data into table
                },
            }

            None
        })
        .await
    }

    async fn get_from_question_id(conn: &PgConnection, question_id: i32) -> Option<Self> {

        let question: Question;

        match Question::get_from_id(conn, question_id) {
            Some(q) => {
                question = q;
            }
            None => {
                return None
            }
        }

        match question.question_type {
            QuestionTypes::ShortAnswer => {None},
            QuestionTypes::MultiSelect => todo!(),
        }

    }
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct MultiSelect {

}
