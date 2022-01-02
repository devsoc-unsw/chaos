import { styled } from "@mui/material/styles";
import { Card, Chip } from "@mui/material";
import { red, green } from "@mui/material/colors";

export const CandidateCard = styled(Card)(({ theme, pass }) => ({
  margin: "0.5rem 0",
  backgroundColor: pass ? green[50] : red[50],
}));

export const RatingChip = styled(Chip)`
  margin: 0 0.2rem;
`;

export const AvgChip = styled(Chip)`
  margin-right: 1rem;
`;
