import { EnvelopeIcon } from "@heroicons/react/20/solid";
import moment from "moment";
import "twin.macro";

import { bytesToImage } from "utils";

import type { CampaignWithRoles, Organisation } from "types/api";

const dateToString = (date: string) =>
  moment(new Date(date)).format("D MMM YYYY");

interface Props {
  campaignName: string;
  headerImage: string;
  organisation: Organisation;
  campaign: CampaignWithRoles;
  description: string;
  userInfo: {
    name: string;
    zid: string;
    email: string;
    degree: string;
  };
}
const CampaignDetails = ({
  campaignName,
  headerImage,
  organisation,
  campaign,
  description,
  userInfo,
}: Props) => (
  <header tw="flex flex-col items-center gap-6 rounded bg-white p-6 shadow md:(flex-row items-start)">
    <article tw="flex flex-col gap-2">
      <div tw="flex items-center gap-2">
        <img
          tw="h-20 rounded shadow"
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          src={bytesToImage(organisation.logo!)}
          alt={organisation.name}
        />
        <div tw="flex flex-col justify-center gap-2">
          <h1 tw="text-3xl">{campaign.campaign.name}</h1>
          <p>
            {dateToString(campaign.campaign.starts_at)} -{" "}
            {dateToString(campaign.campaign.ends_at)}
          </p>
        </div>
      </div>
      <p tw="flex items-center leading-relaxed">{description}</p>

      <div>
        <h3 tw="text-xl leading-loose">You&apos;re applying as:</h3>
        <p tw="flex gap-1.5">
          <span>{userInfo.name}</span>
          <span tw="font-light italic">({userInfo.zid})</span>
          <span>·</span>
          <span>{userInfo.degree}</span>
        </p>
        <p tw="flex items-center gap-1 text-gray-800 text-sm">
          <EnvelopeIcon tw="h-4 w-4" /> {userInfo.email}
        </p>
      </div>
    </article>

    <aside
      tw="m-auto mr-0 flex max-w-xl flex-shrink-0 items-center justify-center overflow-hidden rounded shadow bg-[#edeeef] md:w-1/2"
      css={{ aspectRatio: "16/9" }}
    >
      <img
        tw="max-h-full w-full object-contain"
        src={headerImage}
        alt={campaignName}
      />
    </aside>
  </header>
);

export default CampaignDetails;
