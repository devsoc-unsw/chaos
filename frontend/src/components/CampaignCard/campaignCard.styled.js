import { styled } from "@mui/material/styles";
import { IconButton } from "@mui/material/";

export const ExpandIconButton = styled(IconButton)(({ theme, expanded }) => ({
  transform: !expanded ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));
