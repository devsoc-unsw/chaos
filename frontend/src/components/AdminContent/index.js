/* eslint-disable react/prop-types */
import React, { useState, useContext } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import {
  AdminContentContainer,
  ContentHeader,
  ToggleButtonContainer,
  OrgInfo,
  OrgInfoImage,
  OrgInfoName,
  ContentBody,
} from "./adminContent.styled";
import DirectorDummy from "../../pages/dashboard/director.jpg";
import ProjectLeadDummy from "../../pages/dashboard/project-lead.jpg";
import ProjectTeamDummy from "../../pages/dashboard/project-team.png";

import { orgContext } from "../../pages/admin";
import AdminCampaignContent from "./AdminCampaignContent";
import AdminMembersContent from "./AdminMembersContent";

// FIXME: should request from backend. Have this function defined here instead of utils
//        cause I don"t think it will be used again??
const getCampaigns = (/* orgID, token */) => [
  {
    id: 0,
    image: DirectorDummy,
    title: "Director Recruitment",
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
  },
  {
    id: 1,
    image: ProjectLeadDummy,
    title: "Project Lead Recruitment",
    startDate: "1 Feb 2022",
    endDate: "1 Mar 2022",
  },
  {
    id: 2,
    image: ProjectTeamDummy,
    title: "Project Team Recruitment",
    startDate: "1 Mar 2022",
    endDate: "1 Apr 2022",
  },
];
// FIXME: should request from backend. Have this function defined here instead of utils
//        cause I don"t think it will be used again??
const getMembers = (/* orgID, token */) => [
  {
    id: 0,
    name: "John Smith",
    role: "Director",
  },
  {
    id: 1,
    name: "Jane Doe",
    role: "Director",
  },
  {
    id: 2,
    name: "John Smith",
    role: "Admin",
  },
  {
    id: 3,
    name: "Jane Doe",
    role: "Admin",
  },
  {
    id: 4,
    name: "John Smith",
    role: "Director",
  },
  {
    id: 5,
    name: "Jane Doe",
    role: "Director",
  },
  {
    id: 6,
    name: "John Smith",
    role: "Admin",
  },
  {
    id: 7,
    name: "Jane Doe",
    role: "Admin",
  },
  {
    id: 8,
    name: "John Smith",
    role: "Director",
  },
  {
    id: 9,
    name: "Jane Doe",
    role: "Director",
  },
  {
    id: 10,
    name: "John Smith",
    role: "Admin",
  },
  {
    id: 11,
    name: "Jane Doe",
    role: "Admin",
  },
  {
    id: 12,
    name: "John Smith",
    role: "Director",
  },
  {
    id: 13,
    name: "Jane Doe",
    role: "Director",
  },
  {
    id: 14,
    name: "John Smith",
    role: "Admin",
  },
  {
    id: 15,
    name: "Jane Doe",
    role: "Admin",
  },
];

// FIXME: content not aligned with sidebar, need to change sidebar :(
const AdminContent = ({ id, icon, orgName }) => {
  const [windowSelected, setWindowSelected] = useState("campaigns");
  const { orgSelected, setOrgSelected, orgList, setOrgList } =
    useContext(orgContext);
  const [campaigns, setCampaigns] = useState(getCampaigns(id));
  const [members, setMembers] = useState(getMembers(id));

  const handleDeletion = () => {
    if (orgSelected === id) {
      // FIXME: doesn"t handle no remaining orgs, also assumes that
      //        an org exists with id == 0, and that the user is a member
      //        of this org. Will be fixed when itegrated with backend.
      setOrgSelected(0);
    }
    setOrgList(orgList.filter((org) => org.id !== id));
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
          />
        )}
        {windowSelected === "members" && (
          <AdminMembersContent members={members} setMembers={setMembers} />
        )}
      </ContentBody>
    </AdminContentContainer>
  );
};

export default AdminContent;
