import { styled } from "@mui/material/styles";
import { Card, Chip, Grid } from "@mui/material";
import { red, green } from "@mui/material/colors";

export const CandidateCard = styled(Card)(({ reject }) => ({
  margin: "0.5rem 0",
  // backgroundColor: reject ? red[50] : green[50],
  borderLeft: `5px solid ${reject ? red[500] : green[500]}`,
  cursor: "pointer",
}));

export const GridCandidateName = styled(Grid)`
  flex-grow: 1;
  margin-left: 1rem;
`;

export const RatingChip = styled(Chip)`
  margin: 0 0.2rem;
  font-size: 14px;
  background-color: white;
`;

export const BullSpan = styled("span")`
  margin: 0 0.5rem;
`;
