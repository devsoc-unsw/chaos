import { useContext, useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import tw from "twin.macro";

import { getAllCampaigns } from "api";
import { FetchError } from "api/api";
import Container from "components/Container";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { removeStore } from "utils";

import CampaignGrid from "./CampaignGrid";

const Heading = tw.h2`my-3 font-semibold text-2xl`;

const Dashboard = () => {
  const navigate = useNavigate();
  const setNavBarTitle = useContext(SetNavBarTitleContext);

  const {
    isLoading,
    data: {
      current_campaigns: allCurrentCampaigns = [],
      past_campaigns: pastCampaigns = [],
    } = {},
  } = useQuery("allCampaigns", getAllCampaigns, {
    onError: (e) => {
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
        console.error(e);
      }
    },
  });

  const myCampaigns = useMemo(
    () => allCurrentCampaigns.filter((c) => c.applied_for.length),
    [allCurrentCampaigns]
  );

  const currentCampaigns = useMemo(
    () => allCurrentCampaigns.filter((c) => !c.applied_for.length),
    [allCurrentCampaigns]
  );

  useEffect(() => {
    setNavBarTitle("Your Dashboard");
  }, []);

  return (
    <Container>
      <Heading>My Campaigns</Heading>
      <CampaignGrid
        loading={isLoading}
        loadingNumCampaigns={1}
        campaigns={myCampaigns}
        defaultText="You haven't applied to any campaigns 😦"
        status="pending"
      />

      <Heading>Available Campaigns</Heading>
      <CampaignGrid
        loading={isLoading}
        loadingNumCampaigns={2}
        animationDelay={400}
        defaultText="There aren't any campaigns currently available 😭"
        campaigns={currentCampaigns}
        status="open"
      />

      <Heading>Past Campaigns</Heading>
      <CampaignGrid
        loading={isLoading}
        loadingNumCampaigns={2}
        animationDelay={800}
        defaultText="There aren't any campaigns that have already closed 😮 Apply to the ones currently open!"
        campaigns={pastCampaigns}
        status="closed"
      />
    </Container>
  );
};

export default Dashboard;
