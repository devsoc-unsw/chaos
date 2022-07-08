import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";

import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { removeStore } from "utils";
import { getAllCampaigns } from "api";
import CampaignGrid from "./CampaignGrid";

const Dashboard = () => {
  const navigate = useNavigate();
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const [currentCampaigns, setCurrentCampaigns] = useState([]);
  const [pastCampaigns, setPastCampaigns] = useState([]);
  useEffect(() => {
    setNavBarTitle("Your Dashboard");

    const getCampaigns = async () => {
      const res = await getAllCampaigns();
      if (!res.ok) {
        // JWT errors => 400
        // AccountNoLongerExists => 500
        if ([400, 500].includes(res.status)) {
          removeStore("AUTH_TOKEN");
        } else {
          console.error(
            `an error occurred while fetching campaigns (${res.status})`
          );
        }
        navigate("/");
      }
      const data = await res.json();
      const current = data.current_campaigns;
      setMyCampaigns(current.filter((c) => c.applied_for.length));
      setCurrentCampaigns(current.filter((c) => !c.applied_for.length));
      setPastCampaigns(data.past_campaigns);
    };
    getCampaigns();
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
