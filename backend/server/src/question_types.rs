use diesel::{PgConnection, RunQueryDsl};
use serde::{Deserialize, Serialize};

use crate::diesel::QueryDsl;
use diesel::expression_methods::ExpressionMethods;
use crate::database::models::{Question, Answer};
use crate::database::models::{MultiSelectAnswer, MultiSelectOption, MultiSelectOptionInput, NewMultiSelectAnswer, NewMultiSelectOption, NewShortAnswerAnswer, ShortAnswerAnswer};
use crate::database::schema::QuestionType;
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
    MultiSelect(Vec<String>),   // Vector of option text
    MultiChoice(Vec<String>),
    DropDown(Vec<String>),
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub enum QuestionDataInput {
    ShortAnswer,
    MultiSelect(Vec<String>),   // Vector of option text
    MultiChoice(Vec<String>),
    DropDown(Vec<String>),
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
    MultiSelect(Vec<i32>),
    MultiChoice(i32),
    DropDown(i32),
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub enum AnswerDataInput {
    ShortAnswer(String),
    MultiSelect(Vec<i32>),   // Vector of option text
    MultiChoice(i32),
    DropDown(i32),
}

impl QuestionDataInput {
    /**
     * Insert the inner struct into its corresponding table according to the type given by question_type
     */
    pub fn insert_question_data(
        self,
        conn: &PgConnection,
        question_id: i32,
    ) -> Option<Self> {

        match self {
            QuestionDataInput::ShortAnswer => {
                // No need for any question data insertion, as short-answer
                // questions only need a title (contained in parent table)
            },
            QuestionDataInput::MultiSelect(multi_select_data) => {
                // Insert Multi Select Data into table
                let new_data: Vec<NewMultiSelectOption> = multi_select_data.into_iter().map(|x| {
                    NewMultiSelectOption {
                        text: x,
                        question_id,
                    }
                }).collect();

                for option in new_data {
                    option.insert(conn).ok_or_else(|| {
                        eprintln!("Failed to create question data for some reason");
                    }).ok();
                }
            },
            QuestionDataInput::MultiChoice(multi_choice_data) => {
                let new_data: Vec<NewMultiSelectOption> = multi_choice_data.into_iter().map(|x| {
                    NewMultiSelectOption {
                        text: x,
                        question_id,
                    }
                }).collect();

                for option in new_data {
                    option.insert(conn).ok_or_else(|| {
                        eprintln!("Failed to create question data for some reason");
                    }).ok();
                }
            },
            QuestionDataInput::DropDown(drop_down_data) => {
                let new_data: Vec<NewMultiSelectOption> = drop_down_data.into_iter().map(|x| {
                    NewMultiSelectOption {
                        text: x,
                        question_id,
                    }
                }).collect();

                for option in new_data {
                    option.insert(conn).ok_or_else(|| {
                        eprintln!("Failed to create question data for some reason");
                    }).ok();
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

        return match question.question_type {
            QuestionType::ShortAnswer => { Some(QuestionData::ShortAnswer) },
            QuestionType::MultiSelect => {
                use crate::database::schema::multi_select_options::dsl::*;

                let data: Vec<MultiSelectOption> = multi_select_options
                    .filter(question_id.eq(q_id))
                    .load(conn)
                    .unwrap_or_else(|_| vec![]);

                Some(QuestionData::MultiSelect(data.into_iter().map(|x| {
                    x.text
                }).collect()))
            },
            QuestionType::MultiChoice => {
                use crate::database::schema::multi_select_options::dsl::*;

                let data: Vec<MultiSelectOption> = multi_select_options
                    .filter(question_id.eq(q_id))
                    .load(conn)
                    .unwrap_or_else(|_| vec![]);

                Some(QuestionData::MultiChoice(data.into_iter().map(|x| {
                    x.text
                }).collect()))
            },
            QuestionType::DropDown => {
                use crate::database::schema::multi_select_options::dsl::*;

                let data: Vec<MultiSelectOption> = multi_select_options
                    .filter(question_id.eq(q_id))
                    .load(conn)
                    .unwrap_or_else(|_| vec![]);

                Some(QuestionData::DropDown(data.into_iter().map(|x| {
                    x.text
                }).collect()))
            },
        };
    }

    pub fn get_from_question(conn: &PgConnection, question: &Question) -> Option<Self> {
        let q_id = question.id;

        return match question.question_type {
            QuestionType::ShortAnswer => { Some(QuestionData::ShortAnswer) },
            QuestionType::MultiSelect => {
                use crate::database::schema::multi_select_options::dsl::*;

                let data: Vec<MultiSelectOption> = multi_select_options
                    .filter(question_id.eq(q_id))
                    .load(conn)
                    .unwrap_or_else(|_| vec![]);

                Some(QuestionData::MultiSelect(data.into_iter().map(|x| {
                    x.text
                }).collect()))
            },
            QuestionType::MultiChoice => {
                use crate::database::schema::multi_select_options::dsl::*;

                let data: Vec<MultiSelectOption> = multi_select_options
                    .filter(question_id.eq(q_id))
                    .load(conn)
                    .unwrap_or_else(|_| vec![]);

                Some(QuestionData::MultiChoice(data.into_iter().map(|x| {
                    x.text
                }).collect()))
            },
            QuestionType::DropDown => {
                use crate::database::schema::multi_select_options::dsl::*;

                let data: Vec<MultiSelectOption> = multi_select_options
                    .filter(question_id.eq(q_id))
                    .load(conn)
                    .unwrap_or_else(|_| vec![]);

                Some(QuestionData::DropDown(data.into_iter().map(|x| {
                    x.text
                }).collect()))
            },
        };
    }
}

impl AnswerDataInput {
    pub fn insert_answer_data(
        self,
        conn: &mut PgConnection,
        answer: &Answer,
    ) -> Option<Self> {
        match self {
            AnswerDataInput::ShortAnswer(short_answer_data) => {
                let answer = NewShortAnswerAnswer {
                    text: short_answer_data,
                    answer_id: answer.id,
                };

                answer.insert(conn).ok_or_else(|| {
                    eprintln!("Failed to create answer data for some reason");
                }).ok();
            },
            AnswerDataInput::MultiSelect(multi_select_data) => {
                let new_answers: Vec<NewMultiSelectAnswer> = multi_select_data.into_iter().map(|x| {
                    NewMultiSelectAnswer {
                        option_id: x,
                        answer_id: answer.id,
                    }
                }).collect();

                for answer in new_answers {
                    answer.insert(conn).ok_or_else(|| {
                        eprintln!("Failed to create answer data for some reason");
                    }).ok();
                }
            },
            AnswerDataInput::MultiChoice(option_id) => {
                NewMultiSelectAnswer {
                    option_id,
                    answer_id: answer.id,
                }.insert(conn).ok_or_else(|| {
                    eprintln!("Failed to create answer data for some reason");
                }).ok();
            },
            AnswerDataInput::DropDown(option_id) => {
                NewMultiSelectAnswer {
                    option_id,
                    answer_id: answer.id,
                }.insert(conn).ok_or_else(|| {
                    eprintln!("Failed to create answer data for some reason");
                }).ok();
            }
        }

        None
    }
}

impl AnswerData {
    pub fn get_from_answer(conn: &PgConnection, answer: &Answer) -> Option<Self> {
        return match answer.answer_type {
            QuestionType::ShortAnswer => {
                use crate::database::schema::short_answer_answers::dsl::*;

                let answer_data: ShortAnswerAnswer = short_answer_answers.filter(
                    answer_id.eq(answer.id)
                ).first(conn).ok()?;

                Some(AnswerData::ShortAnswer(answer_data.text))
            },
            QuestionType::MultiSelect => {
                use crate::database::schema::multi_select_answers::dsl::*;

                let answers: Vec<MultiSelectAnswer> = multi_select_answers.filter(
                    answer_id.eq(answer.id)
                ).load(conn).unwrap_or_else(|_| vec![]);

                Some(AnswerData::MultiSelect(answers.into_iter().map(|x| {
                    x.option_id
                }).collect()))
            },
            QuestionType::MultiChoice => {
                use crate::database::schema::multi_select_answers::dsl::*;

                let answer_data: MultiSelectAnswer = multi_select_answers.filter(
                    answer_id.eq(answer.id)
                ).first(conn).ok().unwrap();

                Some(AnswerData::MultiChoice(answer_data.option_id))
            },
            QuestionType::DropDown => {
                use crate::database::schema::multi_select_answers::dsl::*;

                let answer_data: MultiSelectAnswer = multi_select_answers.filter(
                    answer_id.eq(answer.id)
                ).first(conn).ok().unwrap();

                Some(AnswerData::DropDown(answer_data.option_id))
            },
        };

        // None
    }
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct MultiSelectQuestion {
    options: Vec<MultiSelectOption>
}

#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct MultiSelectQuestionInput {
    options: Vec<MultiSelectOptionInput>
}


#[derive(Deserialize, Serialize, PartialEq, Debug, Clone)]
pub struct MultiSelectAnswerInput {
    options_selected: Vec<i32>,
}

