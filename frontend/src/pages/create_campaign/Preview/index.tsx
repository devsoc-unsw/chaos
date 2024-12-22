import { useEffect } from "react";

import CampaignCard from "../../../components/CampaignCard";

import {
  ActionButton,
  CampaignCardLayout,
  InfoText,
  InfoTextBox,
  SubmitWrapper,
} from "./reviewTab.styled";

import type { Campaign } from "../types";

type Props = {
  campaign: Campaign;
  onSubmit: (isDraft: boolean) => void;
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
  useEffect(() => {
    const newAnswers = Object.fromEntries(
      questions.map((q) => [q.id, answers[q.id] ?? ""])
    );
    setAnswers(newAnswers);
  }, [questions]);

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
      <CampaignCardLayout>
        <CampaignCard
          title={campaignName}
          appliedFor={[]}
          positions={roles.map((r) => ({
            id: r.id,
            number: r.quantity,
            name: r.title,
          }))}
          startDate={startDate}
          endDate={endDate}
          organisationLogo={undefined}
          campaigns={[]}
          setCampaigns={() => {}}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          img=""
        />
      </CampaignCardLayout>
      {/* TODO: display campaign description */}
      {/* TODO: allow admins to preview the application form */}
      <SubmitWrapper>
        <ActionButton onClick={() => onSubmit(true)} color="white">
          Create Draft
        </ActionButton>
        <ActionButton onClick={() => onSubmit(false)} color="primary">
          Publish
        </ActionButton>
      </SubmitWrapper>
    </>
  );
};

export default ReviewTab;
