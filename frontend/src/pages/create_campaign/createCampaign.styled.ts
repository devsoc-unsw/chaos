import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

export const NextWrapper = styled("div")`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 50px;
  margin-right: 100px;
`;

export const NextButton = styled(Button)`
  font-size: 20px;
`;

export const ArrowIcon = styled(ArrowForwardIosIcon)`
  font-size: 1rem;
  margin-left: 8px;
`;
