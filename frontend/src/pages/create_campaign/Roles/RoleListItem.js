import React from "react";
import PropTypes from "prop-types";
import { ListItemText, ListItemIcon, IconButton, Divider } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import {
  RoleListItemContent,
  RoleListItemButton,
  RoleQuantity,
} from "./rolesTab.styled";

const RoleListItem = ({
  role,
  roleSelected,
  setRoleSelected,
  onRoleDelete,
}) => (
  <>
    <RoleListItemContent selected={role.id === roleSelected}>
      <RoleListItemButton onClick={() => setRoleSelected(role.id)}>
        <RoleQuantity>{role.quantity}</RoleQuantity>
        <ListItemText>{role.title}</ListItemText>
        <ListItemIcon>
          <IconButton>
            <EditIcon fontSize="small" />
          </IconButton>
        </ListItemIcon>
        <ListItemIcon>
          <IconButton
            value={role.id}
            onClick={(e) => {
              onRoleDelete(e);
            }}
          >
            <ClearIcon />
          </IconButton>
        </ListItemIcon>
      </RoleListItemButton>
    </RoleListItemContent>
    <Divider />
  </>
);

RoleListItem.propTypes = {
  role: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
  roleSelected: PropTypes.string.isRequired,
  setRoleSelected: PropTypes.func.isRequired,
  onRoleDelete: PropTypes.func.isRequired,
};

export default RoleListItem;
