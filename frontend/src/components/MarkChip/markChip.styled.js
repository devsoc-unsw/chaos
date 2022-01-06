import { styled } from "@mui/material/styles";
import { Chip } from "@mui/material";
import { red, yellow, lightGreen, green } from "@mui/material/colors";

const chipColor = (mark) => {
  if (mark <= 1) return red[900];
  if (mark < 2) return red[500];
  if (mark < 3) return yellow[800];
  if (mark < 4) return lightGreen[500];
  if (mark < 5) return green[500];
  return green[700];
};

export const ColoredChip = styled(Chip)(({ mark }) => ({
  backgroundColor: chipColor(mark),
  fontWeight: "bold",
}));

ColoredChip.defaultProps = {
  color: "primary", // white text
};
