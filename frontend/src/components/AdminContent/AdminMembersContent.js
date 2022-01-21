import React from 'react'
import { useNavigate } from "react-router-dom";
import { 
  AdminContentList, 
  DummyIconForAlignment, 
  ContentListHeader, 
  AdminDivider, 
  MemberListItem, 
  AdminListItemButton 
} from "./adminContent.styled"
import { ListItem, ListItemText, ListItemButton, Divider, ListItemIcon, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

const AdminMembersContent = ({ members, setMembers }) => {
  const onDelete = (member_id) => {
    // FIXME: integrate with backend to actually delete
    setMembers(members.filter(m => m.id !== parseInt(member_id)));
  }
  return (
    <AdminContentList>
      <ContentListHeader>
        <ListItemText align="center">Name</ListItemText>
        <ListItemText align="center">Role</ListItemText>
        <ListItemIcon>
          <DummyIconForAlignment />
        </ListItemIcon>
        <ListItemIcon>
          <IconButton>
            <AddIcon />
          </IconButton>
        </ListItemIcon>
      </ContentListHeader>
      <AdminDivider />
      {
        members.map((m) => {
          return (
            <div>
              <MemberListItem>
                <AdminListItemButton>
                  <ListItemText align="center">{m.name}</ListItemText>
                  <ListItemText align="center">{m.role}</ListItemText>
                  <ListItemIcon>
                    <IconButton>
                      <EditIcon></EditIcon>
                    </IconButton>
                  </ListItemIcon>
                  <ListItemIcon>
                    <IconButton value={m.id} onClick={(e) => onDelete(e.currentTarget.value)}>
                      <ClearIcon></ClearIcon>
                    </IconButton>
                  </ListItemIcon>
                </AdminListItemButton>
              </MemberListItem>
              <Divider />
            </div>
          )
        })
      }
    </AdminContentList>
  )
}

export default AdminMembersContent
