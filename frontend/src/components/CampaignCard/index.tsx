import { useState } from "react";
import { Link } from "react-router-dom";

import "twin.macro";

import Content from "./Content";
import Popup from "./Popup";

import type { Position } from "./types";
import type { Campaign } from "pages/admin/types";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import type { CampaignWithRoles } from "types/api";

type AdminProps = {
  campaignId: number;
  isAdmin: true;
};

type NonAdminProps = {
  campaignId?: number;
  isAdmin?: false;
};

type BaseProps = {
  organisationLogo?: string;
  title: string;
  appliedFor: CampaignWithRoles["applied_for"];
  positions: Position[];
  startDate: Date;
  endDate: Date;
  img: string;
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
};

type Props = BaseProps & (AdminProps | NonAdminProps);

const CampaignCard = ({
  campaignId,
  organisationLogo,
  title,
  appliedFor,
  positions,
  startDate,
  endDate,
  img,
  isAdmin,
  campaigns,
  setCampaigns,
}: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const content = (
    <Content
      campaignId={campaignId!} // campaignId should always exist if isAdmin is true
      organisationLogo={organisationLogo}
      title={title}
      appliedFor={appliedFor}
      startDate={startDate}
      endDate={endDate}
      img={img}
      openModal={openModal}
      isAdmin={isAdmin}
      campaigns={campaigns}
      setCampaigns={setCampaigns}
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

  const linkComponent = isAdmin ? (
    <Link to={`/admin/review/${campaignId}`}>{content}</Link>
  ) : (
    <Link to={`/application/${campaignId}`}>{content}</Link>
  );

  return (
    <>
      {campaignId === undefined ? content : linkComponent}
      {popup}
    </>
  );
};

export default CampaignCard;
