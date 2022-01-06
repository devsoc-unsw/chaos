import { styled } from "@mui/material/styles";
import { Divider } from "@mui/material";
import { grey } from "@mui/material/colors";

// export const PassBarDivider = styled(Divider)

export const PassBarDivider = styled(Divider)(({ theme }) => ({
  color: `${grey[400]}`,
  transition: theme.transitions.create("color", {
    duration: theme.transitions.duration.standard,
  }),
  "&:hover": {
    color: `${grey[600]}`,
    transition: theme.transitions.create("color", {
      duration: theme.transitions.duration.standard,
    }),
  },
}));
