import React from "react";
import { useNavigate } from "react-router-dom";
import { Grid } from "@mui/material";

import CampaignCard from "../../../components/CampaignCard";
import { bytesToImage, dateToString } from "../../../utils";

const CampaignGrid = ({ campaigns }) => {
  const navigate = useNavigate();
  return (
    <Grid container spacing={2} columns={4}>
      {campaigns.map((campaign) => (
        <Grid item key={campaign.campaign.id} xs={1}>
          <CampaignCard
            title={campaign.campaign.name}
            appliedFor={campaign.applied_for}
            positions={campaign.roles.map((role) => ({
              name: role.name,
              number: role.max_available,
            }))}
            startDate={dateToString(new Date(campaign.campaign.starts_at))}
            endDate={dateToString(new Date(campaign.campaign.ends_at))}
            img={bytesToImage(campaign.campaign.cover_image)}
            applyClick={() => navigate("/application")}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default CampaignGrid;
