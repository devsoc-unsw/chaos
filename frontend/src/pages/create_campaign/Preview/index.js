import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { SubmitButton, SubmitWrapper } from "./campaignPreview.styled";
import ApplicationForm from "../../../components/ApplicationForm";

// FIXME: CHAOS-65, add campaign card to preview tab
const CampaignReview = (props) => {
  const {
    value,
    index,
    questions,
    roles,
    campaignName,
    headerImage,
    description,
    onSubmit,
  } = props;
  const [rolesSelected, setRolesSelected] = useState([]);
  const [answers, setAnswers] = useState({});
  useEffect(() => {
    questions.forEach((q) => {
      if (!(q.id in answers)) {
        answers[q.id] = "";
      }
    });
    setAnswers(answers);
  }, [questions]);

  const dummyUserInfo = {
    name: "First Last",
    zid: "z1234567",
    email: "firstlast@gmail.com",
    degree: "Bachelor of Science (Computer Science)",
  };

  return (
    value.tab === index && (
      <>
        <ApplicationForm
          questions={questions}
          roles={roles}
          rolesSelected={rolesSelected}
          setRolesSelected={setRolesSelected}
          answers={answers}
          setAnswers={setAnswers}
          campaignName={campaignName}
          headerImage={headerImage}
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
    )
  );
};

CampaignReview.propTypes = {
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      roles: PropTypes.objectOf(PropTypes.string).isRequired,
    })
  ).isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
  campaignName: PropTypes.string.isRequired,
  headerImage: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default CampaignReview;
