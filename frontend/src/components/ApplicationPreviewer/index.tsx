import { Container, Typography } from "@mui/material";
import { ApplicationWithQuestions } from "types/admin";
import { Answer, NoAnswer, Question } from "./applicationPreviewer.styled";

type Props = {
  application: ApplicationWithQuestions;
};

const ApplicationPreviewer = ({ application }: Props) => (
  <Container>
    <Typography variant="h5" gutterBottom>
      {application.zId}
    </Typography>

    {application.questions.map((question) => (
      <>
        <Question>{question.question}</Question>

        {question.answer ? (
          <Answer>{question.answer}</Answer>
        ) : (
          <NoAnswer>No answer provided.</NoAnswer>
        )}
      </>
    ))}
  </Container>
);

export default ApplicationPreviewer;
