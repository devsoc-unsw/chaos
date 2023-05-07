use diesel::PgConnection;
use serde::{Deserialize, Serialize};

use crate::database::{schema::QuestionTypes, models::{Question, Answer}};
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

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub enum AnswerDataEnum {
    ShortAnswer,
    MultiSelect(MultiSelectAnswer),
}

impl QuestionDataEnum {
    /**
     * Insert the inner struct into its corresponding table according to the type given by question_type
     */
    pub fn insert_question_data(
        self,
        conn: &mut PgConnection,
        question: &Question,
    ) -> Option<Self> {
        
        match self {
            QuestionDataEnum::ShortAnswer => {
                // do nothing, currently by default a question is of ShortAnswer Type
            },
            QuestionDataEnum::MultiSelect(multi_select_data) => {
                // Insert Multi Select Data into table
            },
        }

        None

    }

    pub fn get_from_question_id(conn: &PgConnection, question_id: i32) -> Option<Self> {

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
            QuestionTypes::ShortAnswer => {Some(AnswerDataEnum::ShortAnswer);},
            QuestionTypes::MultiSelect => todo!(),
        }

        None
    }

    pub fn get_from_question(conn: &PgConnection, question: &Question) -> Option<Self> {
        let question_id = question.id;

        match question.question_type {
            QuestionTypes::ShortAnswer => {Some(QuestionDataEnum::ShortAnswer);},
            QuestionTypes::MultiSelect => todo!(),
        }

        None
    }
}


impl AnswerDataEnum {
    pub fn insert_answer_data(
        self,
        conn: &mut PgConnection,
        answer: &Answer,
    ) -> Option<Self> {
        
        match self {
            AnswerDataEnum::ShortAnswer => {
                // do nothing, currently by default a question is of ShortAnswer Type
            },
            AnswerDataEnum::MultiSelect(multi_select_data) => {
                // Insert Multi Select Data into table
            },
        }

        None
    }

    pub fn get_from_answer(conn: &PgConnection, answer: &Answer) -> Option<Self> {
        let answer_id = answer.id;

        match answer.answer_type {
            QuestionTypes::ShortAnswer => {Some(AnswerDataEnum::ShortAnswer);},
            QuestionTypes::MultiSelect => todo!(),
        }

        None
    }
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct MultiSelect {

}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct MultiSelectAnswer {

}
