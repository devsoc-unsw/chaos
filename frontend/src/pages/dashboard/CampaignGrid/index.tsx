import "twin.macro";
import { Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";

import CampaignCard from "components/CampaignCard";
import { bytesToImage, dateToStringForCampaignGrid } from "utils";

import CampaignLoading from "./CampaignLoading";

import type { ComponentProps } from "react";
import type { CampaignWithRoles } from "types/api";

type Props = {
  campaigns: CampaignWithRoles[];
  loading: boolean;
  loadingNumCampaigns: number;
  animationDelay?: number;
  defaultText: string;
  status?: ComponentProps<typeof CampaignLoading>["status"];
};
const CampaignGrid = ({
  campaigns,
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
          .map((_) => (
            <CampaignLoading status={status} animationDelay={animationDelay} />
          ))}
      </div>
    );
  }

  if (!campaigns.length) {
    return <div tw="text-gray-700">{defaultText}</div>;
  }

  return (
    <Grid container spacing={2} columns={4}>
      {campaigns.map((campaign) => (
        <Grid item key={campaign.campaign.id} xs={1}>
          <CampaignCard
            title={campaign.campaign.name}
            appliedFor={campaign.applied_for}
            positions={campaign.roles.map((role) => ({
              id: role.id,
              name: role.name,
              number: role.max_available,
            }))}
            startDate={dateToStringForCampaignGrid(
              new Date(campaign.campaign.starts_at)
            )}
            endDate={dateToStringForCampaignGrid(
              new Date(campaign.campaign.ends_at)
            )}
            img={bytesToImage(campaign.campaign.cover_image)}
            applyClick={() =>
              navigate(`/application/${campaign.campaign.id}`, {
                state: campaign,
              })
            }
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default CampaignGrid;
