import "twin.macro";
import { useNavigate } from "react-router-dom";

import CampaignCard from "components/CampaignCard";
import { bytesToImage } from "utils";

import CampaignLoading from "./CampaignLoading";

import type { ComponentProps } from "react";
import type { CampaignWithRoles, Organisation } from "types/api";

type Props = {
  campaigns: CampaignWithRoles[];
  organisations: { [orgId: number]: Organisation };
  loading: boolean;
  loadingNumCampaigns: number;
  animationDelay?: number;
  defaultText: string;
  status?: ComponentProps<typeof CampaignLoading>["status"];
};
const CampaignGrid = ({
  campaigns,
  organisations,
  loading,
  loadingNumCampaigns,
  animationDelay = 0,
  defaultText,
  status,
}: Props) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div tw="flex gap-4">
        {Array(loadingNumCampaigns)
          .fill(null)
          .map((_, i) => (
            <CampaignLoading
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              status={status}
              animationDelay={animationDelay}
            />
          ))}
      </div>
    );
  }

  if (!campaigns.length) {
    return <div tw="text-gray-700">{defaultText}</div>;
  }

  console.log(organisations, campaigns);

  return (
    <div tw="flex flex-wrap justify-around gap-4 lg:justify-start">
      {campaigns.map((campaign) => (
        <div key={campaign.campaign.id}>
          <CampaignCard
            title={campaign.campaign.name}
            appliedFor={campaign.applied_for}
            positions={campaign.roles.map((role) => ({
              id: role.id,
              name: role.name,
              number: role.max_available,
            }))}
            startDate={new Date(campaign.campaign.starts_at)}
            endDate={new Date(campaign.campaign.ends_at)}
            img={bytesToImage(campaign.campaign.cover_image)}
            organisationLogo={bytesToImage(
              organisations[campaign.campaign.organisation_id].logo!
            )}
            applyClick={() =>
              navigate(`/application/${campaign.campaign.id}`, {
                state: campaign,
              })
            }
          />
        </div>
      ))}
    </div>
  );
};

export default CampaignGrid;
