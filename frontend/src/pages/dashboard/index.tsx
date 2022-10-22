import { Container } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tw from "twin.macro";

import { getAllCampaigns } from "api";
import { FetchError } from "api/api";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { removeStore } from "utils";

import CampaignGrid from "./CampaignGrid";

import type { CampaignWithRoles } from "types/api";

const Heading = tw.h2`text-2xl font-bold my-4`;

const Dashboard = () => {
  const navigate = useNavigate();
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const [myCampaigns, setMyCampaigns] = useState<CampaignWithRoles[]>([]);
  const [currentCampaigns, setCurrentCampaigns] = useState<CampaignWithRoles[]>(
    []
  );
  const [pastCampaigns, setPastCampaigns] = useState<CampaignWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          // unreachable but necessary for typescript
          return;
        }
        throw e;
      }
      console.log(campaigns);
      const current = campaigns.current_campaigns;
      setMyCampaigns(current.filter((c) => c.applied_for.length));
      setCurrentCampaigns(current.filter((c) => !c.applied_for.length));
      setPastCampaigns(campaigns.past_campaigns);
      setIsLoading(false);
    };
    void getCampaigns();
  }, []);
  return (
    <div tw="px-6 w-full max-w-7xl mx-auto">
      <Heading>My Campaigns</Heading>
      <CampaignGrid
        loading={isLoading}
        loadingNumCampaigns={1}
        campaigns={myCampaigns}
        active
      />

      <Heading>Available Campaigns</Heading>
      <CampaignGrid
        loading={isLoading}
        loadingNumCampaigns={2}
        animationDelay={400}
        campaigns={currentCampaigns}
      />

      <Heading>Past Campaigns</Heading>
      <CampaignGrid
        loading={isLoading}
        loadingNumCampaigns={2}
        animationDelay={800}
        campaigns={pastCampaigns}
      />
    </div>
  );
};

export default Dashboard;
