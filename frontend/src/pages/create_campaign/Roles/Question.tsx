import ClearIcon from "@mui/icons-material/Clear";
import { IconButton, TextField } from "@mui/material";

import {
  QuestionContent as Content,
  QuestionTitle as Title,
} from "./rolesTab.styled";

import type { Question as IQuestion } from "../types";
import type { ChangeEvent, MouseEventHandler } from "react";

type Props = {
  questionNumber: number;
  question: IQuestion;
  handleQuestionInput: (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    qId: number,
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
