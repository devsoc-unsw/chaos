import React from "react";
import PropTypes from "prop-types";
import { IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  CreateRoleFormControl as FormControl,
  CreateRoleFormGroup as FormGroup,
  Quantity,
  Name,
} from "./rolesTab.styled";

const Form = ({
  newRoleQty,
  setNewRoleQty,
  newRoleName,
  setNewRoleName,
  addRole,
}) => (
  <FormControl>
    <FormGroup row>
      <Quantity
        type="number"
        value={newRoleQty}
        onChange={(e) => setNewRoleQty(e.target.value)}
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

Form.propTypes = {
  newRoleQty: PropTypes.number.isRequired,
  setNewRoleQty: PropTypes.func.isRequired,
  newRoleName: PropTypes.string.isRequired,
  setNewRoleName: PropTypes.func.isRequired,
  addRole: PropTypes.func.isRequired,
};

export default Form;
