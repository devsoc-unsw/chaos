import { Container, Typography } from "@mui/material";
import { Fragment } from "react";

import { Answer, NoAnswer, Question } from "./applicationPreviewer.styled";

import type { ApplicationWithQuestions } from "pages/admin/types";

type Props = {
  application: ApplicationWithQuestions;
};

const ApplicationPreviewer = ({ application }: Props) => (
  <Container>
    <Typography variant="h5" gutterBottom>
      {application.zId}
    </Typography>

    {application.questions.map((question, idx) => (
      // eslint-disable-next-line react/no-array-index-key
      <Fragment key={idx}>
        <Question>{question.question}</Question>

        {question.answer ? (
          <Answer>{question.answer}</Answer>
        ) : (
          <NoAnswer>No answer provided.</NoAnswer>
        )}
      </Fragment>
    ))}
  </Container>
);

export default ApplicationPreviewer;
