import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { SubmitButton, SubmitWrapper } from "./reviewTab.styled";
import ApplicationForm from "../../../components/ApplicationForm";

// FIXME: CHAOS-65, add campaign card to preview tab
const ReviewTab = ({ campaign, onSubmit }) => {
  const {
    questions,
    answers,
    setAnswers,
    roles,
    campaignName,
    cover,
    description,
  } = campaign;
  const [rolesSelected, setRolesSelected] = useState([]);
  useEffect(() => {
    const newAnswers = questions.map((q) => {
      const tmp = {};
      if (!(q.id in answers)) {
        tmp[q.id] = "";
      } else {
        tmp[q.id] = answers[q.id];
      }
      return tmp;
    });
    setAnswers(newAnswers);
  }, [questions]);

  const dummyUserInfo = {
    name: "First Last",
    zid: "z1234567",
    email: "firstlast@gmail.com",
    degree: "Bachelor of Science (Computer Science)",
  };
  return (
    <>
      <ApplicationForm
        questions={questions}
        roles={roles}
        rolesSelected={rolesSelected}
        setRolesSelected={setRolesSelected}
        answers={answers}
        setAnswers={setAnswers}
        campaignName={campaignName}
        headerImage={cover}
        description={description}
        userInfo={dummyUserInfo}
      />
      <SubmitWrapper>
        <SubmitButton onClick={() => onSubmit(true)} variant="outlined">
          Create Draft
        </SubmitButton>
        <SubmitButton onClick={() => onSubmit(false)} variant="contained">
          Publish
        </SubmitButton>
      </SubmitWrapper>
    </>
  );
};

ReviewTab.propTypes = {
  campaign: PropTypes.shape({
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        roles: PropTypes.objectOf(PropTypes.string).isRequired,
      })
    ).isRequired,
    answers: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string).isRequired)
      .isRequired,
    setAnswers: PropTypes.func.isRequired,
    roles: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
      })
    ).isRequired,
    campaignName: PropTypes.string.isRequired,
    cover: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ReviewTab;
