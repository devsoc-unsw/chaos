/* eslint-disable react/prop-types */
import React from "react";
import { useNavigate } from "react-router-dom";
import { ListItemText, Divider, ListItemIcon, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { deleteCampaign } from "api";
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

const AdminCampaignContent = ({ campaigns, setCampaigns, orgId }) => {
  const navigate = useNavigate();

  const onDelete = async (e) => {
    // FIXME: CHAOS-55, integrate with backend to actually delete
    e.stopPropagation();
    const campaignId = e.currentTarget.value;
    const res = await deleteCampaign(campaignId);
    if (res.ok) {
      setCampaigns(campaigns.filter((c) => c.id !== parseInt(campaignId, 10)));
    }
  };

  const onCampaignClick = (e, id) => {
    if (e.currentTarget.value) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      navigate(`/marking/${id}`);
    }
  };

  return (
    <AdminContentList>
      <ContentListHeader>
        <DummyDivForAlignment />
        <ListItemText align="center">Title</ListItemText>
        <ListItemText align="center">Dates</ListItemText>
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
            <AdminListItemButton onClick={(e) => onCampaignClick(e, c.id)}>
              <CampaignListItemImage src={c.image} />
              <ListItemText align="center">{c.title}</ListItemText>
              <ListItemText align="center">
                {c.startDate} - {c.endDate}
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
