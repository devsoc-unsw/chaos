import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tw from "twin.macro";

import { getAllCampaigns, getOrganisation } from "api";
import { FetchError } from "api/api";
import Container from "components/Container";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { removeStore, isLoggedIn } from "utils";

import CampaignGrid from "./CampaignGrid";

import type { Campaign, Organisation } from "types/api";

const Heading = tw.h2`my-3 text-2xl font-semibold`;

const Dashboard = () => {
  const navigate = useNavigate();
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [currentCampaigns, setCurrentCampaigns] = useState<Campaign[]>(
    []
  );
  const [pastCampaigns, setPastCampaigns] = useState<Campaign[]>([]);
  const [organisations, setOrganisations] = useState<{
    [orgId: string]: Organisation;
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setNavBarTitle("Your Dashboard");

    const getCampaigns = async () => {
      // Check if user is authenticated first
      const authenticated = await isLoggedIn();
      if (!authenticated) {
        window.location.href = "http://localhost:8080/auth/google";
        return;
      }
      let campaigns;
      try {
        campaigns = await getAllCampaigns();
        
        // Check if campaigns is defined
        if (!campaigns || !Array.isArray(campaigns)) {
          console.error("Invalid campaigns response:", campaigns);
          navigate("/");
          return;
        }
        
        // Separate campaigns into current and past based on end date
        const now = new Date();
        const current_campaigns = campaigns.filter(campaign => new Date(campaign.ends_at) > now);
        const past_campaigns = campaigns.filter(campaign => new Date(campaign.ends_at) <= now);
        
        // Create the expected structure
        campaigns = {
          current_campaigns,
          past_campaigns
        };
      } catch (e) {
        if (e instanceof FetchError) {
          // JWT errors => 400
          // AccountNoLongerExists => 500
          // Redirect responses => 307, 302 (user not authenticated)
          if ([400, 500, 307, 302].includes(e.status)) {
            // User is not authenticated, redirect to OAuth
            window.location.href = "http://localhost:8080/auth/google";
            return;
          } else if (e.status === 0) {
            // Network error or request aborted
            console.error("Network error while fetching campaigns");
            navigate("/");
            return;
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

      // Only proceed with organisation requests if we successfully got campaigns
      try {
                     // Try to fetch organizations, but handle failures gracefully
             const organisationPromises = [...campaigns.current_campaigns, ...campaigns.past_campaigns].map(async (c) => {
               try {
                 return await getOrganisation(c.organisation_id);
               } catch (error) {
                 console.warn(`Failed to fetch organisation ${c.organisation_id}:`, error);
                 // Return a placeholder organization
                 return {
                   id: c.organisation_id,
                   slug: 'unknown',
                   name: 'Unknown Organization',
                   logo: undefined,
                   created_at: new Date().toISOString()
                 };
               }
             });
        
        const organisations = await Promise.all(organisationPromises);
        setOrganisations(
          Object.fromEntries(organisations.map((org) => [org.id, org]))
        );

        const current = campaigns.current_campaigns;
        // For now, show all current campaigns as available (no applied_for data available)
        setMyCampaigns([]); // No applied campaigns since we don't have that data
        setCurrentCampaigns(current);
        setPastCampaigns(campaigns.past_campaigns);
        setIsLoading(false);
      } catch (orgError) {
        // If organisation requests fail, still show campaigns but without org data
        console.error("Failed to fetch organisation data:", orgError);
        const current = campaigns.current_campaigns;
        setMyCampaigns([]); // No applied campaigns since we don't have that data
        setCurrentCampaigns(current);
        setPastCampaigns(campaigns.past_campaigns);
        setIsLoading(false);
      }
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
