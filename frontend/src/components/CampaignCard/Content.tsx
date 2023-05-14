import moment from "moment";
import "twin.macro";

import Card from "components/Card";
import Dropdown from "components/Dropdown";
import DropdownOption from "components/Dropdown/DropdownOption";

import CampaignStatus from "./CampaignStatus";

import type { VariantProps } from "@stitches/react";
import type { MouseEventHandler } from "react";
import type { CampaignWithRoles } from "types/api";

import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/outline";

const dateToString = (date: Date) => moment(date).format("D MMM YYYY");

type Props = {
  organisationLogo?: string;
  title: string;
  appliedFor: CampaignWithRoles["applied_for"];
  startDate: Date;
  endDate: Date;
  img: string;
  openModal: MouseEventHandler<HTMLButtonElement>;
  isAdmin: boolean;
};

const Content = ({
  organisationLogo,
  title,
  appliedFor,
  startDate,
  endDate,
  img,
  openModal,
  isAdmin,
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
    <Card tw="p-0 overflow-hidden text-sm w-96" hoverable>
      <header tw="flex items-center gap-1.5 p-3">
        <img
          tw="w-10 h-10 rounded-sm"
          src={organisationLogo}
          alt="Organisation"
        />
        <div tw="flex flex-col">
          <p>{title}</p>
          <p tw="text-gray-500">
            {dateToString(startDate)} - {dateToString(endDate)}
          </p>
        </div>
        {isAdmin ? (
          <Dropdown>
            <DropdownOption
              name="edit"
              icon={<PencilSquareIcon tw="h-5 w-5 inline mr-2" />}
              onClick={null}
            />
            <DropdownOption
              name="delete"
              icon={<TrashIcon tw="h-5 w-5 inline mr-2" />}
              onClick={null}
            />
          </Dropdown>
        ) : (
          <CampaignStatus status={status} onClick={openModal}>
            {status.toUpperCase()}
          </CampaignStatus>
        )}
      </header>
      <div tw="flex items-center justify-center overflow-hidden bg-[#edeeef] aspect-w-16 aspect-h-9">
        <img
          tw="object-contain w-full max-h-full"
          src={img}
          alt="Campaign Cover"
        />
      </div>
    </Card>
  );
};

export default Content;
