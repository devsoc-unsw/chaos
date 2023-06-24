use diesel::{PgConnection, RunQueryDsl};
use rocket::http::Status;
use serde::{Deserialize, Serialize};

use crate::database::{models::{Question, Answer}};
use crate::database::models::{MultiSelectOption, NewMultiSelectOption, NewQuestion};
use crate::database::schema::multi_select_options::dsl::multi_select_options;
use crate::database::schema::QuestionType;
use crate::error::JsonErr;
//  QUESTION TYPES
//  In this file, add new question types that we need to implement
//  e.g.
//  MultiSelect
//  ShortAnswer
//

/// An enum that represents all the types of questions that CHAOS can handle.
/// This stores all the data for each question type.
///
/// \
/// Some question types are stored in-memory and JSON using the same struct, and only differ
/// in their implementation when inserting to the database and in their restrictions
/// (e.g. max answers allowed in single multi-choice)
#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub enum QuestionData {
    ShortAnswer,
    MultiSelect(MultiSelectQuestion),   // Vector of option text
    MultiChoice(MultiSelectQuestion),
    DropDown(MultiSelectQuestion),
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub enum QuestionDataInput {
    ShortAnswer,
    MultiSelect(MultiSelectQuestionInput),   // Vector of option text
    MultiChoice(MultiSelectQuestionInput),
    DropDown(MultiSelectQuestionInput),
}

/// An enum that represents all the types of questions answers that CHAOS can handle.
/// This stores all the data for each answer type.
///
/// \
/// Some answers types are stored in-memory and JSON using the same struct, and only differ
/// in their implementation when inserting to the database and in their restrictions
/// (e.g. max answers allowed in single multi-choice)
#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub enum AnswerData {
    ShortAnswer(String),
    MultiSelect(MultiSelectAnswer),
    MultiChoice(MultiSelectAnswer), // TODO: Is there a better way to name these, without duplicating the structs? Traits?
    DropDown(MultiSelectAnswer),
}

impl QuestionDataInput {
    /**
     * Insert the inner struct into its corresponding table according to the type given by question_type
     */
    pub fn insert_question_data(
        self,
        conn: &PgConnection,
        question: &NewQuestion,
        question_id: i32,
    ) -> Option<Self> {

        match self {
            QuestionDataInput::ShortAnswer => {
                // No need for any question data insertion, as short-answer
                // questions only need a title (contained in parent table)
            },
            QuestionDataInput::MultiSelect(multi_select_data) => {
                // Insert Multi Select Data into table
                let new_data= multi_select_data.map(|x| {
                    NewMultiSelectOption {
                        text: x,
                        question_id,
                    }
                }).collect();

                for option in new_data {
                    option.insert(conn).ok_or_else(|| {
                        eprintln!("Failed to create question data for some reason");
                        JsonErr(todo!(), Status::InternalServerError);
                    })?;
                }
            },
            QuestionDataInput::MultiChoice(multi_choice_data) => {
                let new_data = multi_select_data.map(|x| {
                    NewMultiSelectOption {
                        text: x,
                        question_id,
                    }
                }).collect();

                for option in new_data {
                    option.insert(conn).ok_or_else(|| {
                        eprintln!("Failed to create question data for some reason");
                        JsonErr(todo!(), Status::InternalServerError);
                    })?;
                }
            },
            QuestionDataInput::DropDown(drop_down_data) => {
                let new_data = multi_select_data.map(|x| {
                    NewMultiSelectOption {
                        text: x,
                        question_id,
                    }
                }).collect();

                for option in new_data {
                    option.insert(conn).ok_or_else(|| {
                        eprintln!("Failed to create question data for some reason");
                        JsonErr(todo!(), Status::InternalServerError);
                    })?;
                }
            },
        }

        None

    }
}

impl QuestionData {

    pub fn get_from_question_id(conn: &PgConnection, q_id: i32) -> Option<Self> {

        let question: Question;

        match Question::get_from_id(conn, q_id) {
            Some(q) => {
                question = q;
            }
            None => {
                return None
            }
        }

        match question.question_type {
            QuestionType::ShortAnswer => {Some(AnswerData::ShortAnswer);},
            QuestionType::MultiSelect => {
                use crate::database::schema::multi_select_options::dsl::*;
                return multi_select_options.filter(question_id.eq(q_id)).first(conn).ok();
            },
            QuestionType::MultiChoice => {
                use crate::database::schema::multi_select_options::dsl::*;
                return multi_select_options.filter(question_id.eq(q_id)).first(conn).ok();
            },
            QuestionType::DropDown => {
                use crate::database::schema::multi_select_options::dsl::*;
                return multi_select_options.filter(question_id.eq(q_id)).first(conn).ok();
            },
        }

        None
    }

    pub fn get_from_question(conn: &PgConnection, question: &Question) -> Option<Self> {
        let question_id = question.id;

        match question.question_type {
            QuestionType::ShortAnswer => { Some(AnswerData::ShortAnswer); },
            QuestionType::MultiSelect => {
                use crate::database::schema::multi_select_options::dsl::*;
                return multi_select_options.filter(question_id.eq(question.id)).first(conn).ok();
            },
            QuestionType::MultiChoice => {
                use crate::database::schema::multi_select_options::dsl::*;
                return multi_select_options.filter(question_id.eq(question.id)).first(conn).ok();
            },
            QuestionType::DropDown => {
                use crate::database::schema::multi_select_options::dsl::*;
                return multi_select_options.filter(question_id.eq(question.id)).first(conn).ok();
            },
        }

        None
    }
}


impl AnswerData {
    pub fn insert_answer_data(
        self,
        conn: &mut PgConnection,
        answer: &Answer,
    ) -> Option<Self> {
        
        match self {
            AnswerData::ShortAnswer(short_answer_data) => {
                // do nothing, currently by default a question is of ShortAnswer Type
            },
            AnswerData::MultiSelect(multi_select_data) => {
                // TODO: Insert Multi Select Data into table
            },
            AnswerData::MultiChoice(multi_choice_data) => {
                // Insert Multi Choice Data into table
            },
            AnswerData::DropDown(drop_down_data) => {
                // Insert Drop Down Data into table
            }
        }

        None
    }

    pub fn get_from_answer(conn: &PgConnection, answer: &Answer) -> Option<Self> {
        let answer_id = answer.id;

        match answer.answer_type {
            QuestionType::ShortAnswer => {Some(AnswerData::ShortAnswer);},
            QuestionType::MultiSelect => todo!(),
            QuestionType::MultiChoice => todo!(),
            QuestionType::DropDown => todo!(),
        }

        None
    }
}


#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct MultiSelectQuestion {
    options: Vec<MultiSelectOption>
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct MultiSelectQuestionInput {
    options: Vec<MultiSelectOption>
}


#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct NewMultiSelectAnswer {
    options_selected: Vec<i32>,
}