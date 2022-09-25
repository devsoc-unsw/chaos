import {
  useState,
  useContext,
  Dispatch,
  SetStateAction,
  MouseEvent,
} from "react";
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

import { OrgContext } from "../OrgContext";
import AdminCampaignContent from "./AdminCampaignContent";
import AdminMembersContent from "./AdminMembersContent";
import { doDeleteOrg } from "../../../api";
import { Campaign, Member, Organisation } from "../types";

type Props = {
  org: Organisation;
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  members: Member[];
  setMembers: Dispatch<SetStateAction<Member[]>>;
};

const AdminContent = ({
  org,
  campaigns,
  setCampaigns,
  members,
  setMembers,
}: Props) => {
  let id: number;
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
    useContext(OrgContext);

  const handleDeletion = async () => {
    try {
      await doDeleteOrg(id);
    } catch (e) {
      // FIXME: should popup and say failed to delete
      return;
    }
    // FIXME: when array is empty we die???
    setOrgList(orgList.filter((_, index) => index !== orgSelected));
    setOrgSelected(
      orgSelected === orgList.length - 1 ? orgList.length - 2 : orgSelected
    );
  };

  const handleWindowChange = (
    _: MouseEvent<HTMLElement>,
    newWindow: string
  ) => {
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
          <AdminMembersContent
            orgId={id}
            members={members}
            setMembers={setMembers}
          />
        )}
      </ContentBody>
    </AdminContentContainer>
  );
};

export default AdminContent;
