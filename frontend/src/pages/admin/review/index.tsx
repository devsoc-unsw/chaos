import { Suspense, useContext, useEffect, useState } from "react";
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
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { name: campaignName } = await getCampaign(campaignId);
      setNavBarTitle(`Review Candidates for ${campaignName}`);
      const { roles } = await getCampaignRoles(campaignId);
      setRoles(roles);
      if (roles.length > 0 && params.roleId === undefined) {
        navigate(`${roles[0].id}/marking`);
      }
    };

    void fetchData();
  }, []);

  return (
    <div tw="flex-1">
      <RolesSidebar roles={roles} />

      <div tw="h-full pl-80 flex">
        <Suspense fallback={<LoadingIndicator />}>
          <Outlet context={Object.fromEntries(roles.map((r) => [r.id, r]))} />
        </Suspense>
      </div>
    </div>
  );
};

export const useRoles = () => useOutletContext<{ [id: number]: Role }>();

export default Review;
