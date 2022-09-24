import { Dispatch, SetStateAction, useState } from "react";
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
import InputPopup from "components/InputPopup";
import { inviteUserToOrg } from "api";
import { AdminLevel } from "types/api";
import {
  AdminContentList,
  DummyIconForAlignment,
  ContentListHeader,
  AdminDivider,
  MemberListItem,
  AdminListItemButton,
} from "./adminContent.styled";
import type { Member } from "../types";

type Props = {
  orgId: number;
  members: Member[];
  setMembers: Dispatch<SetStateAction<Member[]>>;
};

const AdminMembersContent = ({ orgId, members, setMembers }: Props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const onDelete = (memberId: string) => {
    // FIXME: CHAOS-55, integrate with backend to actually delete
    setMembers(members.filter((m) => m.id !== Number(memberId)));
  };
  const inviteUser = (formValues: {
    email: string;
    adminLevel: AdminLevel;
  }) => {
    inviteUserToOrg(formValues.email, orgId, formValues.adminLevel);
  };
  return (
    <AdminContentList>
      <ContentListHeader>
        <ListItemText sx={{ textAlign: "center" }}>Name</ListItemText>
        <ListItemText sx={{ textAlign: "center" }}>Role</ListItemText>
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
            defaultState={{ adminLevel: "ReadOnly" }}
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
                  {["Read Only", "Director", "Admin"].map((label) => (
                    <FormControlLabel
                      key={label}
                      value={label.replace(" ", "")}
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
        <div key={m.id}>
          <MemberListItem>
            <AdminListItemButton>
              <ListItemText sx={{ textAlign: "center" }}>{m.name}</ListItemText>
              <ListItemText sx={{ textAlign: "center" }}>{m.role}</ListItemText>
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

export default AdminMembersContent;
