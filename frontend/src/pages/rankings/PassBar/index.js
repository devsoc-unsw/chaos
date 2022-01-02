import React from "react";
import { Tooltip, Divider } from "@mui/material";
import DragHandleIcon from "@mui/icons-material/DragHandle";

const PassBar = () => (
  <Divider>
    <Tooltip title="Drag the bar to set the pass cutoff">
      <DragHandleIcon />
    </Tooltip>
  </Divider>
);

export default PassBar;
