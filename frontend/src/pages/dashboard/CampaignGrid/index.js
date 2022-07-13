import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Grid } from "@mui/material";

import CampaignCard from "components/CampaignCard";
import { bytesToImage, dateToStringForCampaignGrid, tuple } from "utils";

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

CampaignGrid.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      campaign: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        starts_at: PropTypes.string.isRequired,
        ends_at: PropTypes.string.isRequired,
        cover_image: PropTypes.arrayOf(PropTypes.number).isRequired,
      }).isRequired,
      applied_for: PropTypes.arrayOf(tuple(PropTypes.number, PropTypes.string))
        .isRequired,
      roles: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          max_available: PropTypes.number.isRequired,
        })
      ).isRequired,
    }).isRequired
  ).isRequired,
};

export default CampaignGrid;
