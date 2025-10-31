import { useEffect, useState } from "react";

import CampaignCard from "components/CampaignCard";
import { getCampaign, getCampaignRoles, publishCampaign } from "api";
import { pushToast } from "utils";
import type { Campaign as CampaignType, Role } from "types/api";

import {
  ActionButton,
  CampaignCardLayout,
  InfoText,
  InfoTextBox,
  SubmitWrapper,
} from "./reviewTab.styled";

type Props = {
  campaignId: string;
};

const ReviewTab = ({ campaignId }: Props) => {
  const [campaign, setCampaign] = useState<CampaignType | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [campaignData, rolesData] = await Promise.all([
          getCampaign(campaignId),
          getCampaignRoles(campaignId),
        ]);
        setCampaign(campaignData);
        setRoles(rolesData);
      } catch (error) {
        pushToast("Error", "Failed to load campaign data", "error");
      }
    };
    void loadData();
  }, [campaignId]);

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await publishCampaign(campaignId);
      pushToast("Success", "Campaign published successfully", "success");
    } catch (error) {
      pushToast("Error", "Failed to publish campaign", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!campaign) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <InfoTextBox>
        <InfoText>
          Please review the campaign card before publishing.
          This is how your campaign will appear to applicants.
        </InfoText>
      </InfoTextBox>
      <CampaignCardLayout>
        <CampaignCard
          title={campaign.name}
          appliedFor={[]}
          positions={roles.map((r) => ({
            id: r.id,
            number: r.max_available,
            name: r.name,
          }))}
          startDate={new Date(campaign.starts_at)}
          endDate={new Date(campaign.ends_at)}
          organisationLogo={undefined}
          campaigns={[]}
          setCampaigns={() => {}}
          img=""
        />
      </CampaignCardLayout>
      <SubmitWrapper>
        <ActionButton onClick={() => void handlePublish()} color="primary" disabled={isLoading}>
          {isLoading ? "Publishing..." : "Publish Campaign"}
        </ActionButton>
      </SubmitWrapper>
    </>
  );
};

export default ReviewTab;

