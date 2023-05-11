import tw from "twin.macro";

import { CampaignCard, Transition } from "components";

import CampaignLoading from "./CampaignLoading";

import type { ComponentProps } from "react";
import type { CampaignWithRoles } from "types/api";

type Props = {
  campaigns: CampaignWithRoles[];
  loading: boolean;
  loadingNumCampaigns: number;
  animationDelay?: number;
  defaultText: string;
  status?: ComponentProps<typeof CampaignLoading>["status"];
};
const CampaignGrid = ({
  campaigns,
  loading,
  loadingNumCampaigns,
  animationDelay = 0,
  defaultText,
  status,
}: Props) => {
  if (loading) {
    return (
      <div tw="flex gap-4">
        {Array(loadingNumCampaigns)
          .fill(null)
          .map((_, i) => (
            <CampaignLoading
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              status={status}
              animationDelay={animationDelay}
            />
          ))}
      </div>
    );
  }

  if (!campaigns.length) {
    return <div tw="text-gray-700">{defaultText}</div>;
  }

  return (
    <div tw="flex flex-wrap justify-around gap-4 pb-4 lg:justify-start">
      {campaigns.map((campaign, i) => (
        <Transition
          appear
          show
          enter={{
            ...tw`transition duration-[750ms]`,
            transitionDelay: `${i * 150}ms`,
          }}
          enterFrom={tw`translate-y-4 opacity-0`}
        >
          <CampaignCard key={campaign.campaign.id} campaign={campaign} />
        </Transition>
      ))}
    </div>
  );
};

export default CampaignGrid;
