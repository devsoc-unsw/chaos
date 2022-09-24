import { IconButton, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import type { ChangeEvent, MouseEventHandler } from "react";
import {
  QuestionTitle as Title,
  QuestionContent as Content,
} from "./rolesTab.styled";
import type { Question as IQuestion } from "../types";

type Props = {
  questionNumber: number;
  question: IQuestion;
  handleQuestionInput: (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    qId: number
  ) => void;
  onQuestionDelete: MouseEventHandler<HTMLButtonElement>;
};

const Question = ({
  questionNumber,
  question,
  handleQuestionInput,
  onQuestionDelete,
}: Props) => (
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

export default Question;
