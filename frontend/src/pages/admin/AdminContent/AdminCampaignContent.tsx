import { DeleteForeverRounded } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { Divider, IconButton, ListItemIcon, ListItemText } from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteCampaign } from "api";
import { FetchError } from "api/api";
import { CampaignCard, Modal } from "components";
import Button from "components/Button";
import { MessagePopupContext } from "contexts/MessagePopupContext";
import { dateToDateString } from "utils";

import {
  AdminContentList,
  AdminDivider,
  AdminListItemButton,
  CampaignListItem,
  CampaignListItemImage,
  ContentListHeader,
  DummyDivForAlignment,
  DummyIconForAlignment,
} from "./adminContent.styled";

import type { Campaign } from "../types";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  orgId: number;
  orgLogo: string;
};

const AdminCampaignContent = ({
  campaigns,
  setCampaigns,
  orgId,
  orgLogo,
}: Props) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>({
    id: -1,
    image: "",
    title: "",
    startDate: "",
    endDate: "",
  });
  const pushMessage = useContext(MessagePopupContext);

  const handleDelete = async () => {
    try {
      await deleteCampaign(selectedCampaign.id);
    } catch (e) {
      let message = `Deleting campaign '${selectedCampaign.title}' failed: `;
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
    setCampaigns(campaigns.filter((c) => c.id !== selectedCampaign.id));
    setShowDeleteDialog(false);
  };

  return (
    <div tw="flex flex-wrap gap-4">
      {campaigns.map((c) => (
        <CampaignCard
          campaignId={c.id}
          organisationLogo={orgLogo}
          title={c.title}
          appliedFor={[]}
          positions={[]}
          startDate={c.startDate}
          endDate={c.endDate}
        />
      ))}
    </div>
  );

  return (
    <AdminContentList>
      <ContentListHeader>
        <DummyDivForAlignment />
        <ListItemText sx={{ textAlign: "center" }}>Title</ListItemText>
        <ListItemText sx={{ textAlign: "center" }}>Dates</ListItemText>
        <ListItemIcon>
          <DummyIconForAlignment />
        </ListItemIcon>
        <ListItemIcon>
          <IconButton>
            <AddIcon onClick={() => navigate(`/campaign/create/${orgId}`)} />
          </IconButton>
        </ListItemIcon>
      </ContentListHeader>
      <AdminDivider />
      {campaigns.map((c) => (
        <div>
          <CampaignListItem>
            <AdminListItemButton onClick={(_) => navigate(`review/${c.id}`)}>
              <CampaignListItemImage src={c.image} />
              <ListItemText sx={{ textAlign: "center" }}>
                {c.title}
              </ListItemText>
              <ListItemText sx={{ textAlign: "center" }}>
                {dateToDateString(c.startDate)} - {dateToDateString(c.endDate)}
              </ListItemText>
              <ListItemIcon>
                <IconButton>
                  <EditIcon />
                </IconButton>
              </ListItemIcon>
              <ListItemIcon>
                <IconButton
                  value={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCampaign(c);
                    setShowDeleteDialog(true);
                  }}
                >
                  <DeleteForeverRounded />
                </IconButton>
              </ListItemIcon>
            </AdminListItemButton>
          </CampaignListItem>
          <Divider />
        </div>
      ))}

      <Modal
        open={showDeleteDialog}
        closeModal={() => setShowDeleteDialog(false)}
        title="Delete Campaign"
        description={selectedCampaign.title}
      >
        <p>
          Are you sure you want to delete this campaign?{" "}
          <strong>This action is permanent and irreversible.</strong>
        </p>
        <Button color="danger" onClick={() => void handleDelete()}>
          Yes, delete this campaign
        </Button>
      </Modal>
    </AdminContentList>
  );
};

export default AdminCampaignContent;
