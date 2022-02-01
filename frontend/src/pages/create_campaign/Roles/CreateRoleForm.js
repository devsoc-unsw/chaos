import React from "react";
import PropTypes from "prop-types";
import { IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  CreateRoleFormControl,
  CreateRoleFormGroup,
  CreateRoleQuantity,
  CreateRoleName,
} from "./rolesTab.styled";

const CreateRoleForm = ({
  newRoleQty,
  setNewRoleQty,
  newRoleName,
  setNewRoleName,
  addRole,
}) => (
  <CreateRoleFormControl>
    <CreateRoleFormGroup row>
      <CreateRoleQuantity
        type="number"
        value={newRoleQty}
        onChange={(e) => setNewRoleQty(e.target.value)}
        min={1}
      />
      <CreateRoleName
        type="text"
        value={newRoleName}
        onChange={(e) => setNewRoleName(e.currentTarget.value)}
      />
      <IconButton onClick={addRole}>
        <AddIcon />
      </IconButton>
    </CreateRoleFormGroup>
  </CreateRoleFormControl>
);

CreateRoleForm.propTypes = {
  newRoleQty: PropTypes.number.isRequired,
  setNewRoleQty: PropTypes.func.isRequired,
  newRoleName: PropTypes.string.isRequired,
  setNewRoleName: PropTypes.func.isRequired,
  addRole: PropTypes.func.isRequired,
};

export default CreateRoleForm;
