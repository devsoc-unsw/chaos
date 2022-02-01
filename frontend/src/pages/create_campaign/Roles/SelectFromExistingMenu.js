import React from "react";
import PropTypes from "prop-types";
import { Menu, MenuItem } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SelectFromExistingButton } from "./rolesTab.styled";

const SelectFromExistingMenu = ({
  filteredQuestions,
  selectFromExisting,
  open,
  handleSelectFromExistingClick,
  handleCloseSelectFromExisting,
  anchorEl,
}) => (
  <>
    <SelectFromExistingButton
      variant="outlined"
      aria-controls={open ? "basic-menu" : undefined}
      aria-haspopup="true"
      aria-expanded={open ? "true" : undefined}
      onClick={handleSelectFromExistingClick}
    >
      Select From Existing
      <ExpandMoreIcon fontSize="small" />
    </SelectFromExistingButton>
    <Menu
      id="basic-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={handleCloseSelectFromExisting}
    >
      {filteredQuestions.length > 0 ? (
        filteredQuestions.map((q) => (
          <MenuItem
            onClick={() => {
              selectFromExisting(q.id);
            }}
          >
            {q.text}
          </MenuItem>
        ))
      ) : (
        <MenuItem onClick={handleCloseSelectFromExisting}>
          No existing questions to select from
        </MenuItem>
      )}
    </Menu>
  </>
);

SelectFromExistingMenu.propTypes = {
  filteredQuestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      roles: PropTypes.objectOf(PropTypes.string).isRequired,
    })
  ).isRequired,
  selectFromExisting: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  handleSelectFromExistingClick: PropTypes.func.isRequired,
  handleCloseSelectFromExisting: PropTypes.func.isRequired,
  anchorEl: PropTypes.element.isRequired,
};

export default SelectFromExistingMenu;
