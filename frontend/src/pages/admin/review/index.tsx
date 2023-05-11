import { Suspense, useContext } from "react";
import { useQuery } from "react-query";
import {
  Outlet,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import "twin.macro";

import { getCampaign, getCampaignRoles } from "api";
import { LoadingIndicator } from "components";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import RolesSidebar from "./RolesSidebar";

import type { Role } from "types/api";

const Review = () => {
  const params = useParams();
  const campaignId = Number(params.campaignId);
  const navigate = useNavigate();

  const setNavBarTitle = useContext(SetNavBarTitleContext);

  useQuery(["campaign", campaignId], () => getCampaign(campaignId), {
    onSuccess: (campaign) => {
      setNavBarTitle(`Review Candidates for ${campaign.name}`);
    },
  });

  const { data: { roles = [] } = {} } = useQuery(
    ["campaignRols", campaignId],
    () => getCampaignRoles(campaignId),
    {
      onSuccess: ({ roles }) => {
        if (roles.length > 0 && params.roleId === undefined) {
          navigate(`${roles[0].id}/marking`);
        }
      },
    }
  );

  return (
    <div tw="flex-1">
      <RolesSidebar roles={roles} />

      <div tw="flex h-full pl-80">
        <Suspense fallback={<LoadingIndicator />}>
          <Outlet context={Object.fromEntries(roles.map((r) => [r.id, r]))} />
        </Suspense>
      </div>
    </div>
  );
};

export const useRoles = () => useOutletContext<{ [id: number]: Role }>();

export default Review;
