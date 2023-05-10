import { PencilIcon } from "@heroicons/react/24/solid";
import { DeleteForeverRounded } from "@mui/icons-material";
import { Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import "twin.macro";

import { FetchError } from "api/api";
import { Modal } from "components";
import TwButton from "components/Button";
import Dropzone from "components/Dropzone";
import { MessagePopupContext } from "contexts/MessagePopupContext";

import { doDeleteOrg, putOrgLogo } from "../../../api";
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [orgLogo, setOrgLogo] = useState<File>();
  const [imageSrc, setImageSrc] = useState<string>();
  const { orgSelected, setOrgSelected, orgList, setOrgList } =
    useContext(OrgContext);
  const pushMessage = useContext(MessagePopupContext);

  useEffect(() => {
    if (orgLogo === undefined) {
      // have to be consistent in returning a function to make eslint happy
      return () => {};
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
    });
    reader.readAsDataURL(orgLogo);

    return () => {
      reader.abort();
    };
  }, [orgLogo]);

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

  const uploadOrgLogo = async () => {
    if (orgLogo === undefined) {
      pushMessage({
        message: "No organisation logo given.",
        type: "error",
      });
      return;
    }

    let newOrgLogo;
    try {
      newOrgLogo = await putOrgLogo(id, orgLogo);
    } catch (err) {
      if (err instanceof FetchError) {
        try {
          const data = (await err.resp.json()) as string;

          pushMessage({
            message: `Internal Error: ${data}`,
            type: "error",
          });
        } catch {
          pushMessage({
            message: `Internal Error: Response Invalid`,
            type: "error",
          });
        }

        return;
      }

      console.error("Something went wrong");
      pushMessage({
        message: "Something went wrong on backend!",
        type: "error",
      });

      return;
    }

    const newOrgList = [...orgList];
    newOrgList[newOrgList.findIndex((org) => org.id === id)].icon = newOrgLogo;
    setOrgList(newOrgList);

    pushMessage({
      message: "Updated organisation logo",
      type: "success",
    });
  };

  return (
    <AdminContentContainer>
      <ContentHeader>
        <OrgInfo>
          <OrgInfoImage src={icon} />
          <OrgInfoName>{orgName}</OrgInfoName>
        </OrgInfo>
        <div tw="flex gap-4 items-center">
          <button
            tw="text-gray-500 hover:text-gray-800 transition-colors"
            type="button"
            onClick={() => setShowEditDialog(true)}
          >
            <PencilIcon tw="w-8 h-8" />
          </button>
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
        </div>
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
        open={showEditDialog}
        closeModal={() => setShowEditDialog(false)}
        title="Edit Organisation"
        description={org?.orgName}
        closeButton
      >
        <Dropzone onDrop={([file]) => setOrgLogo(file)}>
          {orgLogo === undefined ? (
            <p>
              Drag and drop your organisation logo image, or click to select an
              image
            </p>
          ) : (
            <img
              tw="max-w-full max-h-full"
              src={imageSrc}
              alt="campaign cover"
            />
          )}
        </Dropzone>
        <TwButton onClick={() => void uploadOrgLogo()} tw="ml-auto">
          Update organisation logo
        </TwButton>
      </Modal>

      <Modal
        open={showDeleteDialog}
        closeModal={() => setShowDeleteDialog(false)}
        title="Delete Organisation"
        description={org?.orgName}
        closeButton
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
