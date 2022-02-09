import React from "react";
import PropTypes from "prop-types";
import { ListItemText, ListItemIcon, IconButton, Divider } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import {
  RoleListItemContent as ListItemContent,
  RoleListItemButton as ListItemButton,
  RoleQuantity,
} from "./rolesTab.styled";

const RoleListItem = ({
  role,
  roleSelected,
  setRoleSelected,
  onRoleDelete,
}) => (
  <>
    <ListItemContent selected={role.id === roleSelected}>
      <ListItemButton onClick={() => setRoleSelected(role.id)}>
        <RoleQuantity>{role.quantity}</RoleQuantity>
        <ListItemText>{role.title}</ListItemText>
        <ListItemIcon>
          <IconButton>
            <EditIcon fontSize="small" />
          </IconButton>
        </ListItemIcon>
        <ListItemIcon>
          <IconButton value={role.id} onClick={onRoleDelete}>
            <ClearIcon />
          </IconButton>
        </ListItemIcon>
      </ListItemButton>
    </ListItemContent>
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
