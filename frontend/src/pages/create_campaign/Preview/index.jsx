import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Grid } from "@mui/material";
import {
  CreateDraftButton,
  InfoTextBox,
  InfoText,
  PublishButton,
  SubmitWrapper,
  CampaignCardGrid,
} from "./reviewTab.styled";
import ApplicationForm from "../../../components/ApplicationForm";
import CampaignCard from "../../../components/CampaignCard";
import { dateToStringForBackend } from "../../../utils";

const ReviewTab = ({ campaign, onSubmit }) => {
  const {
    questions,
    answers,
    setAnswers,
    roles,
    campaignName,
    cover,
    description,
    startDate,
    endDate,
  } = campaign;
  const [rolesSelected, setRolesSelected] = useState([]);
  const [displayForm, setDisplayForm] = useState(false);
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
      <InfoTextBox>
        <InfoText>
          Please review both the application card and form before publishing.
          This is how your campaign will appear to applicants.
        </InfoText>
        <InfoText>
          Click &quot;apply&quot; to view/hide the application form.
        </InfoText>
      </InfoTextBox>
      <CampaignCardGrid container spacing={2} columns={4}>
        <Grid item xs={1.5} />
        <Grid item key={campaignName} xs={1}>
          <CampaignCard
            title={campaignName}
            appliedFor={[]}
            positions={roles.map((r) => ({
              number: r.quantity,
              name: r.title,
            }))}
            startDate={dateToStringForBackend(startDate)}
            endDate={dateToStringForBackend(endDate)}
            img={cover}
            applyClick={() => setDisplayForm(!displayForm)}
          />
        </Grid>
      </CampaignCardGrid>
      {displayForm && (
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
      )}
      <SubmitWrapper>
        <CreateDraftButton onClick={() => onSubmit(true)} variant="outlined">
          Create Draft
        </CreateDraftButton>
        <PublishButton onClick={() => onSubmit(false)} variant="contained">
          Publish
        </PublishButton>
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
    startDate: PropTypes.instanceOf(Date).isRequired,
    endDate: PropTypes.instanceOf(Date).isRequired,
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ReviewTab;
