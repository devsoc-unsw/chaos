import { ListItemText, ListItemIcon, IconButton, Divider } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import { MouseEventHandler } from "react";
import {
  RoleListItemContent as ListItemContent,
  RoleListItemButton as ListItemButton,
  RoleQuantity,
} from "./rolesTab.styled";
import { Campaign, Role } from "../types";

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
