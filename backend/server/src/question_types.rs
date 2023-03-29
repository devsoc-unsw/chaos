use serde::{Deserialize, Serialize};
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
pub struct MultiSelect {

}
