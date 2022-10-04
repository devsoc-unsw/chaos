import AddIcon from "@mui/icons-material/Add";
import { IconButton } from "@mui/material";

import {
  CreateRoleFormControl as FormControl,
  CreateRoleFormGroup as FormGroup,
  Name,
  Quantity,
} from "./rolesTab.styled";

import type { Dispatch, SetStateAction } from "react";

type Props = {
  newRoleQty: number;
  setNewRoleQty: Dispatch<SetStateAction<number>>;
  newRoleName: string;
  setNewRoleName: Dispatch<SetStateAction<string>>;
  addRole: () => void;
};

const CreateRoleForm = ({
  newRoleQty,
  setNewRoleQty,
  newRoleName,
  setNewRoleName,
  addRole,
}: Props) => (
  <FormControl>
    <FormGroup row>
      <Quantity
        type="number"
        value={newRoleQty}
        onChange={(e) => setNewRoleQty(Number(e.target.value))}
        min={1}
      />
      <Name
        type="text"
        value={newRoleName}
        onChange={(e) => setNewRoleName(e.currentTarget.value)}
      />
      <IconButton onClick={addRole}>
        <AddIcon />
      </IconButton>
    </FormGroup>
  </FormControl>
);

export default CreateRoleForm;
