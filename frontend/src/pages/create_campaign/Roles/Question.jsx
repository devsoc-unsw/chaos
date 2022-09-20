import PropTypes from "prop-types";
import { IconButton, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import {
  QuestionTitle as Title,
  QuestionContent as Content,
} from "./rolesTab.styled";

const Question = ({
  questionNumber,
  question,
  handleQuestionInput,
  onQuestionDelete,
}) => (
  <>
    <Title>Question {questionNumber}</Title>
    <Content>
      <TextField
        fullWidth
        multiline
        required
        value={question.text}
        onChange={(e) => handleQuestionInput(e, question.id)}
      />
      <IconButton value={question.id} onClick={onQuestionDelete}>
        <ClearIcon />
      </IconButton>
    </Content>
  </>
);

Question.propTypes = {
  questionNumber: PropTypes.number.isRequired,
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    roles: PropTypes.objectOf(PropTypes.string).isRequired,
  }).isRequired,
  handleQuestionInput: PropTypes.func.isRequired,
  onQuestionDelete: PropTypes.func.isRequired,
};

export default Question;
