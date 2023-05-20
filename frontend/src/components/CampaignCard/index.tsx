import { useState } from "react";
import { Link } from "react-router-dom";
import "twin.macro";

import Content from "./Content";
import Popup from "./Popup";

import type { Position } from "./types";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import type { Campaign, CampaignWithRoles } from "types/api";

type Props = {
  campaignId?: number;
  organisationLogo?: string;
  title: string;
  appliedFor: CampaignWithRoles["applied_for"];
  positions: Position[];
  startDate: Date;
  endDate: Date;
  img: string;
  c: Campaign;
  setSelectedCampaign: Dispatch<SetStateAction<Campaign>>;
  setShowDeleteDialog: Dispatch<SetStateAction<boolean>>;
  setShowEditDialog: Dispatch<SetStateAction<boolean>>;
  isAdmin: boolean;
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
  c,
  setSelectedCampaign,
  setShowDeleteDialog,
  setShowEditDialog,
  isAdmin,
}: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const content = (
    <Content
      organisationLogo={organisationLogo}
      title={title}
      appliedFor={appliedFor}
      startDate={startDate}
      endDate={endDate}
      img={img}
      openModal={openModal}
      c={c}
      setSelectedCampaign={setSelectedCampaign}
      setShowDeleteDialog={setShowDeleteDialog}
      setShowEditDialog={setShowEditDialog}
      isAdmin={isAdmin}
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
