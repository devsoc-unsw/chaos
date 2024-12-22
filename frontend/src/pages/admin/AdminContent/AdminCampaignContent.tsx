import { Link, useNavigate } from "react-router-dom";
import "twin.macro";

import { CampaignCard } from "components";

import type { Campaign } from "../types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  orgLogo: string;
};

const AdminCampaignContent = ({ campaigns, setCampaigns, orgLogo }: Props) => (
  <div tw="ml-20 flex flex-wrap gap-4">
    {campaigns.map((c) => (
      <CampaignCard
        key={c.id}
        campaignId={c.id}
        organisationLogo={orgLogo}
        title={c.title}
        appliedFor={[]}
        positions={[]}
        img={c.image}
        startDate={new Date(c.startDate)}
        endDate={new Date(c.endDate)}
        isAdmin
        campaigns={campaigns}
        setCampaigns={setCampaigns}
      />
    ))}
  </div>
);

export default AdminCampaignContent;
