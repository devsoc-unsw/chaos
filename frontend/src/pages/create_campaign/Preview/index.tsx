import { useState, useEffect } from "react";
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
import { Campaign } from "../types";

type Props = {
  campaign: Campaign;
  onSubmit: (isDraft: boolean) => any;
};
const ReviewTab = ({ campaign, onSubmit }: Props) => {
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
  const [rolesSelected, setRolesSelected] = useState<number[]>([]);
  const [displayForm, setDisplayForm] = useState(false);
  useEffect(() => {
    const newAnswers = Object.fromEntries(
      questions.map((q) => [q.id, answers[q.id] ?? ""])
    );
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
              id: r.id,
              number: r.quantity,
              name: r.title,
            }))}
            startDate={dateToStringForBackend(startDate)}
            endDate={dateToStringForBackend(endDate)}
            img={cover!}
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
          headerImage={cover!}
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

export default ReviewTab;
