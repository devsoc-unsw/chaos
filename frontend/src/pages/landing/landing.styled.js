import { styled } from "@mui/material/styles";
import { Typography } from "@mui/material/";

export const BoldTitle = styled(Typography)`
  font-weight: 600;
  color: red !important;
  color: ${(props) => props.theme.palette.secondary.light};
`;
