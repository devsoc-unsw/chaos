import React from "react";
import { ListItemText, Divider, ListItemIcon, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PropTypes from "prop-types";
import {
  AdminContentList,
  DummyIconForAlignment,
  ContentListHeader,
  AdminDivider,
  MemberListItem,
  AdminListItemButton,
} from "./adminContent.styled";

const AdminMembersContent = ({ members, setMembers }) => {
  const onDelete = (memberId) => {
    // FIXME: CHAOS-55, integrate with backend to actually delete
    setMembers(members.filter((m) => m.id !== parseInt(memberId, 10)));
  };
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
      {members.map((m) => (
        <div>
          <MemberListItem>
            <AdminListItemButton>
              <ListItemText align="center">{m.name}</ListItemText>
              <ListItemText align="center">{m.role}</ListItemText>
              <ListItemIcon>
                <IconButton>
                  <EditIcon />
                </IconButton>
              </ListItemIcon>
              <ListItemIcon>
                <IconButton
                  value={m.id}
                  onClick={(e) => onDelete(e.currentTarget.value)}
                >
                  <ClearIcon />
                </IconButton>
              </ListItemIcon>
            </AdminListItemButton>
          </MemberListItem>
          <Divider />
        </div>
      ))}
    </AdminContentList>
  );
};

AdminMembersContent.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      role: PropTypes.number,
    })
  ).isRequired,
  setMembers: PropTypes.func.isRequired,
};

export default AdminMembersContent;
