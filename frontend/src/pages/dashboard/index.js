import React, { useContext, useEffect, useState } from "react";
import { Container } from "@mui/material";
import CampaignGrid from "./CampaignGrid";
import { SetNavBarTitleContext } from "../../App";

import { getAllCampaigns } from "../../api";

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
  return (
    <Container>
      <h2>My Campaigns</h2>
      <CampaignGrid campaigns={myCampaigns} />

      <h2>Available Campaigns</h2>
      <CampaignGrid campaigns={currentCampaigns} />

      <h2>Past Campaigns</h2>
      <CampaignGrid campaigns={pastCampaigns} />
    </Container>
  );
};

export default Dashboard;
