import moment from "moment";
import { useState } from "react";
import { Link } from "react-router-dom";
import "twin.macro";

import Modal from "components/Modal";

import CampaignStatus from "./CampaignStatus";

import type { VariantProps } from "@stitches/react";
import type { MouseEvent } from "react";
import type { CampaignWithRoles } from "types/api";

const dateToString = (date: Date) => moment(date).format("D MMM YYYY");

type Props = {
  campaignId?: number;
  organisationLogo: string;
  title: string;
  appliedFor: CampaignWithRoles["applied_for"];
  positions: { id: number | string; name: string; number: number }[];
  startDate: Date;
  endDate: Date;
  img: string;
};

const CampaignCard = ({
  campaignId,
  organisationLogo,
  title,
  appliedFor,
  positions,
  startDate,
  endDate,
  img,
}: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const positionsMap = Object.fromEntries(
    positions.map(({ id, ...position }) => [id, position])
  );
  const positionStatuses = Object.fromEntries(
    appliedFor.map(([id, status]) => [
      id,
      { position: positionsMap[id].name, status },
    ])
  );

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

  const openModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const content = (
    <div tw="w-96 bg-white text-sm rounded shadow-md overflow-hidden transition hover:(-translate-y-1 shadow-lg)">
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
        <CampaignStatus status={status} onClick={openModal}>
          {status.toUpperCase()}
        </CampaignStatus>
      </header>
      <div
        tw="grid place-items-center bg-[#edeeef]"
        css={{ aspectRatio: "16/9" }}
      >
        <img
          tw="w-full max-h-full object-contain"
          src={img}
          alt="Campaign Cover"
        />
      </div>
    </div>
  );

  const popup = (
    <Modal
      title="Campaign Roles"
      description="Roles available for this campaign"
      open={isModalOpen}
      closeModal={() => setIsModalOpen(false)}
    >
      {positions.map((pos) => (
        <p key={pos.id}>
          {pos.name} - {positionStatuses[pos.id]?.status}
        </p>
      ))}
    </Modal>
  );

  if (campaignId === undefined) {
    return (
      <>
        {content}
        {popup}
      </>
    );
  }

  return (
    <>
      <Link to={`/application/${campaignId}`}>{content}</Link>
      {popup}
    </>
  );
};

export default CampaignCard;
