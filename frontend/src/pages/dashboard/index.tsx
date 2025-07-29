import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tw from "twin.macro";

import { getAllCampaigns, getOrganisation } from "api";
import { FetchError } from "api/api";
import Container from "components/Container";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { removeStore } from "utils";

import CampaignGrid from "./CampaignGrid";

import type { CampaignWithRoles, Organisation } from "types/api";

const Heading = tw.h2`my-3 text-2xl font-semibold`;

const Dashboard = () => {
  const navigate = useNavigate();
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const [myCampaigns, setMyCampaigns] = useState<CampaignWithRoles[]>([]);
  const [currentCampaigns, setCurrentCampaigns] = useState<CampaignWithRoles[]>(
    []
  );
  const [pastCampaigns, setPastCampaigns] = useState<CampaignWithRoles[]>([]);
  const [organisations, setOrganisations] = useState<{
    [orgId: number]: Organisation;
  }>([]);
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

      const now = new Date();
      const current = campaigns.filter(c => new Date(c.campaign.ends_at) >= now);
      const past = campaigns.filter(c => new Date(c.campaign.ends_at) < now);

      const organisations = await Promise.all(
        [...current, ...past].map((c) =>
          getOrganisation(c.campaign.organisation_id)
        )
      );
      setOrganisations(
        Object.fromEntries(organisations.map((org) => [org.id, org]))
      );

      setMyCampaigns(current.filter((c) => c.applied_for.length));
      setCurrentCampaigns(current.filter((c) => !c.applied_for.length));
      setPastCampaigns(past);
      setIsLoading(false);
    };

    void getCampaigns();
  }, []);

  return (
    <Container>
      <Heading>My Campaigns</Heading>
      <CampaignGrid
        loading={isLoading}
        loadingNumCampaigns={1}
        campaigns={myCampaigns}
        organisations={organisations}
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
        organisations={organisations}
        status="open"
      />

      <Heading>Past Campaigns</Heading>
      <CampaignGrid
        loading={isLoading}
        loadingNumCampaigns={2}
        animationDelay={800}
        defaultText="There aren't any campaigns that have already closed 😮 Apply to the ones currently open!"
        campaigns={pastCampaigns}
        organisations={organisations}
        status="closed"
      />
    </Container>
  );
};

export default Dashboard;
