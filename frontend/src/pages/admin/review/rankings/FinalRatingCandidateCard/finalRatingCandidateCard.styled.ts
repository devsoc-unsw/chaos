import { Card, Chip, Grid } from "@mui/material";
import { green, red } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

export const CandidateCard = styled(Card, { shouldForwardProp: prop => prop !== 'reject' })<{ reject: boolean }>(
  ({ reject }) => ({
    margin: "0.5rem 0",
    // backgroundColor: reject ? red[50] : green[50],
    borderLeft: `5px solid ${reject ? red[500] : green[500]}`,
    cursor: "pointer",
  })
);

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
