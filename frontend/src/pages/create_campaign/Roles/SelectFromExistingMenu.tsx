import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Menu, MenuItem } from "@mui/material";

import { SelectFromExistingButton as Button } from "./rolesTab.styled";

import type { Question } from "../types";
import type { MouseEventHandler } from "react";

type Props = {
  filteredQuestions: Question[];
  selectFromExisting: (id: string) => void;
  open: boolean;
  handleSelectFromExistingClick: MouseEventHandler<HTMLButtonElement>;
  handleCloseSelectFromExisting: MouseEventHandler<HTMLElement>;
  anchorEl: HTMLElement | null;
};

const SelectFromExistingMenu = ({
  filteredQuestions,
  selectFromExisting,
  open,
  handleSelectFromExistingClick,
  handleCloseSelectFromExisting,
  anchorEl,
}: Props) => (
  <>
    <Button
      variant="outlined"
      aria-controls={open ? "basic-menu" : undefined}
      aria-haspopup="true"
      aria-expanded={open ? "true" : undefined}
      onClick={handleSelectFromExistingClick}
    >
      Select From Existing
      <ExpandMoreIcon fontSize="small" />
    </Button>
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

export default SelectFromExistingMenu;
