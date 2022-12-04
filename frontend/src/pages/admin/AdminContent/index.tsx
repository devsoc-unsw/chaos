import { DeleteForeverRounded } from "@mui/icons-material";
import { Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useContext, useState } from "react";
import "twin.macro";

import { FetchError } from "api/api";
import { Modal } from "components";
import TwButton from "components/Button";
import { MessagePopupContext } from "contexts/MessagePopupContext";

import { doDeleteOrg } from "../../../api";
import { OrgContext } from "../OrgContext";

import AdminCampaignContent from "./AdminCampaignContent";
import AdminMembersContent from "./AdminMembersContent";
import {
  AdminContentContainer,
  ContentBody,
  ContentHeader,
  OrgInfo,
  OrgInfoImage,
  OrgInfoName,
  ToggleButtonContainer,
} from "./adminContent.styled";

import type { Campaign, Member, Organisation } from "../types";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { fileToUrl } from "utils";

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
  let orgName: string;
  if (org) {
    ({ id, icon, orgName } = org);
  } else {
    id = 0;
    icon = "";
    orgName = "...";
  }

  const [windowSelected, setWindowSelected] = useState("campaigns");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { orgSelected, setOrgSelected, orgList, setOrgList } =
    useContext(OrgContext);
  const pushMessage = useContext(MessagePopupContext);

  const handleDeletion = async () => {
    try {
      await doDeleteOrg(id);
    } catch (e) {
      let message = `Deleting organisation '${orgName}' failed: `;
      if (e instanceof FetchError) {
        if (e.data !== undefined) {
          message += JSON.stringify(message);
        } else {
          message += "unknown server error";
        }
      } else {
        message += "unknown error";
      }

      pushMessage({
        type: "error",
        message,
      });

      throw e;
    }
    // FIXME: when array is empty we die???
    setOrgList(orgList.filter((_, index) => index !== orgSelected));
    setOrgSelected(
      orgSelected === orgList.length - 1 ? orgList.length - 2 : orgSelected
    );
    setShowDeleteDialog(false);
  };

  const handleWindowChange = (
    _: MouseEvent<HTMLElement>,
    newWindow: string
  ) => {
    if (newWindow) {
      setWindowSelected(newWindow);
    }
  };

  return (
    <AdminContentContainer>
      <ContentHeader>
        <OrgInfo>
          <OrgInfoImage src={fileToUrl(icon)} />
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
            <Button
              variant="contained"
              color="error"
              disableElevation
              onClick={() => setShowDeleteDialog(true)}
            >
              <DeleteForeverRounded />
            </Button>
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

      <Modal
        open={showDeleteDialog}
        closeModal={() => setShowDeleteDialog(false)}
        title="Delete Organisation"
        description={org?.orgName}
      >
        <p>
          Are you sure you want to delete this organisation?{" "}
          <strong>This action is permanent and irreversible.</strong>
        </p>
        <TwButton color="danger" onClick={() => void handleDeletion()}>
          Yes, delete this organisation
        </TwButton>
      </Modal>
    </AdminContentContainer>
  );
};

export default AdminContent;
