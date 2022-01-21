import React from 'react'
import { useNavigate } from "react-router-dom";
import { 
  AdminContentList, 
  ContentListHeader, 
  DummyDivForAlignment, 
  DummyIconForAlignment, 
  AdminDivider, 
  CampaignListItem, 
  CampaignListItemImage,
  AdminListItemButton
} from "./adminContent.styled"
import { ListItemText, ListItemButton, Divider, ListItemIcon, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const AdminCampaignContent = ({ campaigns, setCampaigns }) => {
  const navigate = useNavigate();

  const onDelete = (e) => {
    // FIXME: integrate with backend to actually delete
    e.stopPropagation();
    const campaign_id = e.currentTarget.value;
    setCampaigns(campaigns.filter(c => c.id !== parseInt(campaign_id)));
  }

  const onCampaignClick = (e) => {
    if (e.currentTarget.value) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      navigate("/marking");
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
            <AddIcon onClick={() => navigate("/campaign/create")}/>
          </IconButton>
        </ListItemIcon>
      </ContentListHeader>
      <AdminDivider />
      {
        campaigns.map((c) => {
          return (
            <div>
              <CampaignListItem>
                <AdminListItemButton onClick={(e) => onCampaignClick(e) /*FIXME: should nav to marking/<c.id>*/}>
                  <CampaignListItemImage src={c.image} />
                  <ListItemText align="center">{c.title}</ListItemText>
                  <ListItemText align="center">{c.startDate} - {c.endDate}</ListItemText>
                  <ListItemIcon>
                    <IconButton>
                      <EditIcon></EditIcon>
                    </IconButton>
                  </ListItemIcon>
                  <ListItemIcon>
                    <IconButton value={c.id} onClick={(e) => onDelete(e)}>
                      <ClearIcon></ClearIcon>
                    </IconButton>
                  </ListItemIcon>
                </AdminListItemButton>
              </CampaignListItem>
              <Divider />
            </div>
          )
        })
      }
    </AdminContentList>
  )
}

export default AdminCampaignContent
