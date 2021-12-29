import { styled } from "@mui/material/styles";
import { Typography } from "@mui/material/";

export const BoldTitle = styled(Typography)`
  font-weight: 600;
  text-align: center;
  color: ${(props) => props.theme.palette.primary.contrastText};
`;

export const Subtitle = styled(Typography)`
  color: ${(props) => props.theme.palette.primary.contrastText};
`;
