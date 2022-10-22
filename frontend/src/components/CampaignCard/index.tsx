import { useState } from "react";
import { Link } from "react-router-dom";
import "twin.macro";

import Card from "./Card";
import Popup from "./Popup";

import type { MouseEvent } from "react";
import type { CampaignWithRoles } from "types/api";

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

  const openModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const content = (
    <Card
      organisationLogo={organisationLogo}
      title={title}
      appliedFor={appliedFor}
      startDate={startDate}
      endDate={endDate}
      img={img}
      openModal={openModal}
    />
  );

  const popup = (
    <Popup
      appliedFor={appliedFor}
      positions={positions}
      open={isModalOpen}
      closeModal={() => setIsModalOpen(false)}
    />
  );

  return (
    <>
      {campaignId === undefined ? (
        content
      ) : (
        <Link to={`/application/${campaignId}`}>{content}</Link>
      )}
      {popup}
    </>
  );
};

export default CampaignCard;
