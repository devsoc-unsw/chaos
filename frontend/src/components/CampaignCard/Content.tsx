import moment from "moment";
import "twin.macro";

import Card from "components/Card";

import CampaignStatus from "./CampaignStatus";

import type { VariantProps } from "@stitches/react";
import type { MouseEventHandler } from "react";
import type { CampaignWithRoles } from "types/api";

const dateToString = (date: Date) => moment(date).format("D MMM YYYY");

type Props = {
  organisationLogo: string;
  title: string;
  appliedFor: CampaignWithRoles["applied_for"];
  startDate: Date;
  endDate: Date;
  img: string;
  openModal: MouseEventHandler<HTMLButtonElement>;
};

const Content = ({
  organisationLogo,
  title,
  appliedFor,
  startDate,
  endDate,
  img,
  openModal,
}: Props) => {
  const date = new Date();

  let status: VariantProps<typeof CampaignStatus>["status"];
  if (appliedFor.some(([_, status]) => status === "Success")) {
    status = "offered";
  } else if (appliedFor.some(([_, status]) => status === "Rejected")) {
    status = "rejected";
  } else if (date > endDate) {
    status = "closed";
  } else if (appliedFor.length) {
    status = "pending";
  } else {
    status = "open";
  }

  return (
    <Card tw="w-96 overflow-hidden p-0 text-sm" hoverable>
      <header tw="flex items-center gap-1.5 p-3">
        <img
          tw="h-10 w-10 rounded-sm"
          src={organisationLogo}
          alt="Organisation"
        />
        <div tw="flex flex-col">
          <p>{title}</p>
          <p tw="text-gray-500">
            {dateToString(startDate)} - {dateToString(endDate)}
          </p>
        </div>
        <CampaignStatus status={status} onClick={openModal}>
          {status.toUpperCase()}
        </CampaignStatus>
      </header>
      <div tw="flex items-center justify-center overflow-hidden bg-[#edeeef] aspect-ratio[16/9]">
        <img
          tw="max-h-full w-full object-contain"
          src={img}
          alt="Campaign Cover"
        />
      </div>
    </Card>
  );
};

export default Content;
