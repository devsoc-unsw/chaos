import React, { useContext, useEffect, useState } from "react";
import { Container } from "@mui/material";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import CampaignGrid from "./CampaignGrid";

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
      const data = await res.json();
      const current = data.current_campaigns;
      setMyCampaigns(current.filter((c) => c.applied_for.length));
      setCurrentCampaigns(current.filter((c) => !c.applied_for.length));
      setPastCampaigns(data.past_campaigns);
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
