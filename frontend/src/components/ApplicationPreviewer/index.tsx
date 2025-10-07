import { Fragment } from "react";
import { Typography } from "@mui/material";

import Container from "components/Container";

import { Answer, NoAnswer, Question, Zid } from "./applicationPreviewer.styled";

import type { ApplicationWithQuestions } from "pages/admin/types";

import "twin.macro";

type Props = {
  application: ApplicationWithQuestions;
};

const ApplicationPreviewer = ({ application }: Props) => {
  const commonQuestions = application.questions.filter(q => q.isCommon);
  const roleQuestions = application.questions.filter(q => !q.isCommon);

  return (
    <Container>
      <Zid>{application.applicationId}</Zid>

      {/* Common Questions Section */}
      {commonQuestions.length > 0 && (
        <>
          <Typography variant="h6" tw="mt-4 mb-2 text-blue-600 font-semibold">
            General Questions
          </Typography>
          {commonQuestions.map((question, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={`common-${idx}`}>
              <Question>{question.question}</Question>
              {question.answer ? (
                <Answer>{question.answer}</Answer>
              ) : (
                <NoAnswer>No answer provided.</NoAnswer>
              )}
            </Fragment>
          ))}
        </>
      )}

      {/* Role-Specific Questions Section */}
      {roleQuestions.length > 0 && (
        <>
          <Typography variant="h6" tw="mt-6 mb-2 text-green-600 font-semibold">
            Role-Specific Questions
          </Typography>
          {roleQuestions.map((question, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={`role-${idx}`}>
              <Question>{question.question}</Question>
              {question.answer ? (
                <Answer>{question.answer}</Answer>
              ) : (
                <NoAnswer>No answer provided.</NoAnswer>
              )}
            </Fragment>
          ))}
        </>
      )}
    </Container>
  );
};

export default ApplicationPreviewer;
