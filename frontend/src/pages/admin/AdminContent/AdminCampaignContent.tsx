/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { ListItemText, Divider, ListItemIcon, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { deleteCampaign } from "api";
import { dateToDateString } from "utils";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import {
  AdminContentList,
  ContentListHeader,
  DummyDivForAlignment,
  DummyIconForAlignment,
  AdminDivider,
  CampaignListItem,
  CampaignListItemImage,
  AdminListItemButton,
} from "./adminContent.styled";
import type { Campaign } from "../types";

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
            <AdminListItemButton onClick={(_) => navigate(`/marking/${c.id}`)}>
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
                <IconButton value={c.id} onClick={(e) => onDelete(e)}>
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
