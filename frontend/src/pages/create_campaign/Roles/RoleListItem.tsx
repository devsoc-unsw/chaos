import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import { Divider, IconButton, ListItemIcon, ListItemText } from "@mui/material";

import {
  RoleListItemButton as ListItemButton,
  RoleListItemContent as ListItemContent,
  RoleQuantity,
} from "./rolesTab.styled";

import type { Campaign, Role } from "../types";
import type { MouseEventHandler } from "react";

type Props = {
  role: Role;
  roleSelected: Campaign["roleSelected"];
  setRoleSelected: Campaign["setRoleSelected"];
  onRoleDelete: MouseEventHandler<HTMLButtonElement>;
};

const RoleListItem = ({
  role,
  roleSelected,
  setRoleSelected,
  onRoleDelete,
}: Props) => (
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

export default RoleListItem;
