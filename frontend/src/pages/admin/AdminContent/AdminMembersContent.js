import React, { useState } from "react";
import {
  ListItemText,
  Divider,
  ListItemIcon,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PropTypes from "prop-types";
import InputPopup from "components/InputPopup";
import {
  AdminContentList,
  DummyIconForAlignment,
  ContentListHeader,
  AdminDivider,
  MemberListItem,
  AdminListItemButton,
} from "./adminContent.styled";

const AdminMembersContent = ({ members, setMembers }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const onDelete = (memberId) => {
    // FIXME: CHAOS-55, integrate with backend to actually delete
    setMembers(members.filter((m) => m.id !== parseInt(memberId, 10)));
  };
  const inviteUser = (email) => {
    // TODO: integrate with backend
    console.log(email);
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
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <AddIcon />
          </IconButton>
          <InputPopup
            title="Invite a user"
            label="Email"
            name="email"
            submitText="Invite"
            defaultState={{ adminLevel: 1 }}
            onSubmit={inviteUser}
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            setAnchorEl={setAnchorEl}
          >
            {({ formValues, handleInputChange }) => (
              <FormControl>
                <FormLabel id="admin-level">Admin Level</FormLabel>
                <RadioGroup
                  aria-labelledby="admin-level"
                  value={formValues.adminLevel}
                  onChange={handleInputChange}
                  name="adminLevel"
                  row
                >
                  {["Read Only", "Director", "Admin"].map((label, idx) => (
                    <FormControlLabel
                      value={idx + 1}
                      control={<Radio size="small" />}
                      label={label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          </InputPopup>
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
