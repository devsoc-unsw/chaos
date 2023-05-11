import { Chip } from "@mui/material";
import {
  deepOrange,
  green,
  grey,
  lightGreen,
  red,
  yellow,
} from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import { darken } from "@mui/system";

const chipColor = (mark: number) => {
  if (mark <= 1) return red[700];
  if (mark <= 2) return deepOrange[500];
  if (mark <= 3) return yellow[800];
  if (mark <= 4) return lightGreen[500];
  if (mark < 5) return green[500];
  return green[700];
};

export const ColoredChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "mark" && prop !== "colored",
})<{ mark: number; colored: boolean }>(({ mark, colored }) => ({
  backgroundColor: colored ? chipColor(mark) : grey[200],
  fontSize: "14px",
  fontWeight: colored ? "bold" : "normal",
  color: colored ? "white" : "black",
  "&:hover": {
    backgroundColor: colored ? darken(chipColor(mark), 0.1) : grey[300],
  },
}));
