import React, { useState, useContext } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import PropTypes from "prop-types";
import {
  AdminContentContainer,
  ContentHeader,
  ToggleButtonContainer,
  OrgInfo,
  OrgInfoImage,
  OrgInfoName,
  ContentBody,
} from "./adminContent.styled";

import { orgContext } from "../../pages/admin";
import AdminCampaignContent from "./AdminCampaignContent";
import AdminMembersContent from "./AdminMembersContent";

const AdminContent = ({
  org,
  campaigns,
  setCampaigns,
  members,
  setMembers,
}) => {
  let id;
  let icon;
  let orgName;
  if (org) {
    ({ id, icon, orgName } = org);
  } else {
    id = 0;
    icon = "";
    orgName = "...";
  }

  const [windowSelected, setWindowSelected] = useState("campaigns");
  const { orgSelected, setOrgSelected, orgList, setOrgList } =
    useContext(orgContext);

  const handleDeletion = () => {
    if (orgSelected === id) {
      // FIXME: CHAOS-56, doesn"t handle no remaining orgs, also assumes that
      //        an org exists with id == 0, and that the user is a member
      //        of this org. Will be fixed when itegrated with backend.
      setOrgSelected(0);
    }
    setOrgList(orgList.filter((o) => o.id !== id));
  };

  const handleWindowChange = (e, newWindow) => {
    if (newWindow) {
      if (newWindow === "delete") {
        handleDeletion();
        setWindowSelected("campaigns");
      } else {
        setWindowSelected(newWindow);
      }
    }
  };

  return (
    <AdminContentContainer>
      <ContentHeader>
        <OrgInfo>
          <OrgInfoImage src={icon} />
          <OrgInfoName>{orgName}</OrgInfoName>
        </OrgInfo>
        <ToggleButtonContainer>
          <ToggleButtonGroup
            color="primary"
            value={windowSelected}
            size="large"
            exclusive
            onChange={handleWindowChange}
          >
            <ToggleButton value="campaigns">Campaigns</ToggleButton>
            <ToggleButton value="members">Members</ToggleButton>
            <ToggleButton value="delete">
              <ClearIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </ToggleButtonContainer>
      </ContentHeader>
      <ContentBody>
        {windowSelected === "campaigns" && (
          <AdminCampaignContent
            campaigns={campaigns}
            setCampaigns={setCampaigns}
            orgId={id}
          />
        )}
        {windowSelected === "members" && (
          <AdminMembersContent members={members} setMembers={setMembers} />
        )}
      </ContentBody>
    </AdminContentContainer>
  );
};

AdminContent.propTypes = {
  org: PropTypes.shape({
    id: PropTypes.number,
    icon: PropTypes.string,
    orgName: PropTypes.string,
  }).isRequired,
  campaigns: PropTypes.shape({
    id: PropTypes.number,
    startDate: PropTypes.number,
    endDate: PropTypes.number,
  }).isRequired,
  setCampaigns: PropTypes.func.isRequired,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      role: PropTypes.string,
    })
  ).isRequired,
  setMembers: PropTypes.func.isRequired,
};

export default AdminContent;
