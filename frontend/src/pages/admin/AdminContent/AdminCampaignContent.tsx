import "twin.macro";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";

import type { Campaign } from "../types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  orgLogo: string;
  orgId: string;
};

const SimpleCampaignCard = ({ title, startDate, endDate, onClick, onEdit }: { title: string; startDate: string; endDate: string; onClick?: () => void; onEdit?: () => void }) => (
  <div tw="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300">
    <div tw="flex justify-between items-start">
      <div tw="flex-1 cursor-pointer" onClick={onClick}>
        <h3 tw="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
        <p tw="text-sm text-gray-600">
          {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}
        </p>
      </div>
      {/* Pencil Icon button to edit the campaign */}
      {onEdit && (<button tw="ml-4 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit campaign"
        >
          <span tw="text-gray-700">
            <Pencil size={16} />
          </span>
        </button>
      )}
    </div>
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
          <button tw="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors" onClick={() => navigate(`/admin/organisation/${orgId}/campaign/create`)}>
            NEW CAMPAIGN
          </button>
        </div>
        <div tw="flex flex-col gap-3">
          {active.length === 0 ? (
            <p tw="text-gray-600">No active campaigns.</p>
          ) : (
            active.map((c) => (
              <SimpleCampaignCard key={c.id} title={c.title} startDate={c.startDate} endDate={c.endDate} onClick={() => navigate(`/admin/review/${c.id}`)} onEdit={() => navigate(`/organisation/${orgId}/campaign/${c.id}/edit`)} />
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
              <SimpleCampaignCard key={c.id} title={c.title} startDate={c.startDate} endDate={c.endDate} onClick={() => navigate(`/admin/review/${c.id}`)} onEdit={() => navigate(`/organisation/${orgId}/campaign/${c.id}/edit`)} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminCampaignContent;
