import "twin.macro";
import { useNavigate } from "react-router-dom";

import type { Campaign } from "../types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  orgLogo: string;
  orgId: string;
};

const SimpleCampaignCard = ({ title, startDate, endDate, onClick }: { title: string; startDate: string; endDate: string; onClick?: () => void }) => (
  <div tw="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:border-gray-300" onClick={onClick}>
    <h3 tw="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
    <p tw="text-sm text-gray-600">
      {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}
    </p>
  </div>
);

const AdminCampaignContent = ({ campaigns, setCampaigns: _setCampaigns, orgLogo: _orgLogo, orgId }: Props) => {
  const navigate = useNavigate();
  const now = new Date();
  const active = campaigns.filter((c) => new Date(c.endDate) >= now);
  const past = campaigns.filter((c) => new Date(c.endDate) < now);

  return (
    <div tw="mx-20 flex flex-col gap-8">
      <section>
        <div tw="flex justify-between items-center mb-4">
          <h2 tw="text-xl font-bold">Active Campaigns</h2>
          <button tw="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors" onClick={() => navigate(`/campaign/create/${orgId}`)}>
            NEW CAMPAIGN
          </button>
        </div>
        <div tw="flex flex-col gap-3">
          {active.length === 0 ? (
            <p tw="text-gray-600">No active campaigns.</p>
          ) : (
            active.map((c) => (
              <SimpleCampaignCard key={c.id} title={c.title} startDate={c.startDate} endDate={c.endDate} onClick={() => navigate(`/admin/review/${c.id}`)} />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 tw="mb-4 text-xl font-bold">Past Campaigns</h2>
        <div tw="flex flex-col gap-3">
          {past.length === 0 ? (
            <p tw="text-gray-600">No past campaigns.</p>
          ) : (
            past.map((c) => (
              <SimpleCampaignCard key={c.id} title={c.title} startDate={c.startDate} endDate={c.endDate} onClick={() => navigate(`/admin/review/${c.id}`)} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminCampaignContent;
