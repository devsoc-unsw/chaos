import PropTypes from "prop-types";

import { Container, Typography } from "@mui/material";
import { Answer, NoAnswer, Question } from "./applicationPreviewer.styled";

const ApplicationPreviewer = (props) => {
  const { application } = props;

  return (
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
};

ApplicationPreviewer.propTypes = {
  application: PropTypes.shape({
    applicationId: PropTypes.string.isRequired,
    zId: PropTypes.string.isRequired,
    mark: PropTypes.number.isRequired,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        question: PropTypes.string.isRequired,
        answer: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
};

export default ApplicationPreviewer;
