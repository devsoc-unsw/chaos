import { Fragment } from "react";

import Container from "components/Container";

import { Answer, NoAnswer, Question, Zid } from "./applicationPreviewer.styled";

import type { ApplicationWithQuestions } from "pages/admin/types";

import "twin.macro";

type Props = {
  application: ApplicationWithQuestions;
};

const ApplicationPreviewer = ({ application }: Props) => (
  <Container>
    <Zid>{application.zId}</Zid>

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
