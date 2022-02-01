import React from "react";
import PropTypes from "prop-types";
import { IconButton, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { QuestionTitle, QuestionContent } from "./rolesTab.styled";

const Question = ({ idx, question, handleQuestionInput, onQuestionDelete }) => (
  <>
    <QuestionTitle>Question {idx + 1}</QuestionTitle>
    <QuestionContent>
      <TextField
        fullWidth
        multiline
        required
        value={question.text}
        onChange={(e) => {
          handleQuestionInput(e, question.id);
        }}
      />
      <IconButton
        value={question.id}
        onClick={(e) => {
          onQuestionDelete(e);
        }}
      >
        <ClearIcon />
      </IconButton>
    </QuestionContent>
  </>
);

Question.propTypes = {
  idx: PropTypes.number.isRequired,
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    roles: PropTypes.objectOf(PropTypes.string).isRequired,
  }).isRequired,
  handleQuestionInput: PropTypes.func.isRequired,
  onQuestionDelete: PropTypes.func.isRequired,
};

export default Question;
