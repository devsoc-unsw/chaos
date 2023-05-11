import { useState } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import "twin.macro";

import { getOrganisation } from "api";

import Content from "./Content";
import Popup from "./Popup";

import type { MouseEvent } from "react";
import type { CampaignWithRoles } from "types/api";

type Props = {
  campaign: CampaignWithRoles;
};

const CampaignCard = ({
  campaign: { campaign, roles, applied_for: appliedFor },
}: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const campaignId = campaign.id;
  const organisationId = campaign.organisation_id;
  const { data: organisation } = useQuery(
    ["organisation", organisationId],
    () => getOrganisation(organisationId)
  );

  const openModal = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const content = (
    <Content
      organisationLogo={organisation?.logo}
      title={campaign.name}
      appliedFor={appliedFor}
      startDate={new Date(campaign.starts_at)}
      endDate={new Date(campaign.ends_at)}
      img={campaign.cover_image}
      openModal={openModal}
    />
  );

  const popup = (
    <Popup
      appliedFor={appliedFor}
      positions={roles.map((role) => ({
        id: role.id,
        name: role.name,
        number: role.max_available,
      }))}
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
