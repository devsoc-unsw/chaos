import { styled } from "@mui/material/styles";
import { Card, Chip } from "@mui/material";
import { red, green } from "@mui/material/colors";

export const CandidateCard = styled(Card)(({ reject }) => ({
  margin: "0.5rem 0",
  backgroundColor: reject ? red[50] : green[50],
  borderLeft: `5px solid ${reject ? red[500] : green[500]}`,
  cursor: "pointer",
}));

export const RatingChip = styled(Chip)`
  margin: 0 0.2rem;
`;

export const AvgChip = styled(Chip)`
  margin-right: 1rem;
`;
