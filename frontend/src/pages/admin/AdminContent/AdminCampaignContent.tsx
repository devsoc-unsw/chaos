import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import { Divider, IconButton, ListItemIcon, ListItemText } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { deleteCampaign } from "api";
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
import type { Dispatch, MouseEvent, SetStateAction } from "react";

type Props = {
  campaigns: Campaign[];
  setCampaigns: Dispatch<SetStateAction<Campaign[]>>;
  orgId: number;
};

const AdminCampaignContent = ({ campaigns, setCampaigns, orgId }: Props) => {
  const navigate = useNavigate();

  const onDelete = async (e: MouseEvent<HTMLButtonElement>) => {
    // FIXME: CHAOS-55, integrate with backend to actually delete
    e.stopPropagation();
    const campaignId = Number(e.currentTarget.value);
    await deleteCampaign(campaignId);
    setCampaigns(campaigns.filter((c) => c.id !== campaignId));
  };

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
            <AdminListItemButton onClick={(_) => navigate(`/review/${c.id}`)}>
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
                <IconButton value={c.id} onClick={(e) => void onDelete(e)}>
                  <ClearIcon />
                </IconButton>
              </ListItemIcon>
            </AdminListItemButton>
          </CampaignListItem>
          <Divider />
        </div>
      ))}
    </AdminContentList>
  );
};

export default AdminCampaignContent;
