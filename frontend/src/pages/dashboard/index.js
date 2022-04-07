import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Grid } from "@mui/material";
import CampaignCard from "../../components/CampaignCard";
import { SetNavBarTitleContext } from "../../App";

import DirectorDummy from "./director.jpg";
import ProjectLeadDummy from "./project-lead.jpg";
import ProjectTeamDummy from "./project-team.png";
import { getAllCampaigns } from "../../api";
import { bytesToImage, dateToString } from "../../utils";

const Dashboard = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [currentCampaigns, setCurrentCampaigns] = useState([]);
  const [pastCampaigns, setPastCampaigns] = useState([]);
  useEffect(() => {
    setNavBarTitle("Your Dashboard");

    const getCam = async () => {
      const res = await getAllCampaigns();
      const json = await res.json();
      setMyCampaigns(
        json.current_campaigns.filter((c) => c.applied_for.length)
      );
      setCurrentCampaigns(
        json.current_campaigns.filter((c) => !c.applied_for.length)
      );
      setPastCampaigns(json.past_campaigns);
      console.log(json);
    };
    getCam();
  }, []);
  const navigate = useNavigate();
  return (
    <Container>
      <h2>My Campaigns</h2>
      <Grid container spacing={2} columns={4}>
        {myCampaigns.map((campaign) => (
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

      <h2>Available Campaigns</h2>
      <Grid container spacing={2} columns={4}>
        {currentCampaigns.map((campaign) => (
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

      <h2>Past Campaigns</h2>
      <Grid container spacing={2} columns={4}>
        {pastCampaigns.map((campaign) => (
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
    </Container>
  );
};

export default Dashboard;
