import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";

import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { removeStore } from "utils";
import { getAllCampaigns } from "api";
import tw from "twin.macro";
import { FetchError } from "api/api";
import type { CampaignWithRoles } from "types/api";
import CampaignGrid from "./CampaignGrid";

const Heading = tw.h2`text-2xl font-bold my-4`;

const Dashboard = () => {
  const navigate = useNavigate();
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const [myCampaigns, setMyCampaigns] = useState<CampaignWithRoles[]>([]);
  const [currentCampaigns, setCurrentCampaigns] = useState<CampaignWithRoles[]>(
    []
  );
  const [pastCampaigns, setPastCampaigns] = useState<CampaignWithRoles[]>([]);
  useEffect(() => {
    setNavBarTitle("Your Dashboard");

    const getCampaigns = async () => {
      let campaigns;
      try {
        campaigns = await getAllCampaigns();
      } catch (e) {
        if (e instanceof FetchError) {
          // JWT errors => 400
          // AccountNoLongerExists => 500
          if ([400, 500].includes(e.status)) {
            removeStore("AUTH_TOKEN");
          } else {
            console.error(
              `an error occurred while fetching campaigns (${e.status})`
            );
          }
          navigate("/");
        } else {
          throw e;
        }
        // unreachable but necessary for typescript
        return;
      }
      console.log(campaigns);
      const current = campaigns.current_campaigns;
      setMyCampaigns(current.filter((c) => c.applied_for.length));
      setCurrentCampaigns(current.filter((c) => !c.applied_for.length));
      setPastCampaigns(campaigns.past_campaigns);
    };
    getCampaigns();
  }, []);
  return (
    <Container>
      <Heading>My Campaigns</Heading>
      <CampaignGrid campaigns={myCampaigns} />

      <Heading>Available Campaigns</Heading>
      <CampaignGrid campaigns={currentCampaigns} />

      <Heading>Past Campaigns</Heading>
      <CampaignGrid campaigns={pastCampaigns} />
    </Container>
  );
};

export default Dashboard;
