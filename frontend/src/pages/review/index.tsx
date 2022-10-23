import { useContext, useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import "twin.macro";

import { getCampaign, getCampaignRoles } from "api";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import RolesSidebar from "pages/marking/RolesSidebar";

import type { Role } from "types/api";

const Review = () => {
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { name: campaignName } = await getCampaign(campaignId);
      setNavBarTitle(`Review Candidates for ${campaignName}`);
      const { roles } = await getCampaignRoles(campaignId);
      setRoles(roles);
    };

    void fetchData();
  }, []);

  return (
    <div tw="flex-1">
      <RolesSidebar roles={roles} />

      <div tw="pl-80">
        <Outlet />
      </div>
    </div>
  );
};

export default Review;
