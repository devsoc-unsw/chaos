import { Typography } from "@mui/material/";
import { styled } from "@mui/material/styles";

export const Question = styled(Typography)`
  font-weight: bold;
`;

export const Answer = styled(Typography)`
  margin-bottom: 1rem;
`;

export const NoAnswer = styled(Typography)`
  font-style: italic;
  margin-bottom: 1rem;
  color: ${(props) => props.theme.palette.grey[600]};
`;
