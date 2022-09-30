import { IconButton } from "@mui/material/";
import { styled } from "@mui/material/styles";

export const ExpandIconButton = styled(IconButton)<{ expanded: boolean }>(
  ({ theme, expanded }) => ({
    transform: !expanded ? "rotate(0deg)" : "rotate(180deg)",
    marginLeft: "auto",
    transition: theme.transitions.create("transform", {
      duration: theme.transitions.duration.shortest,
    }),
  })
);
