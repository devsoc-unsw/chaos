import { styled } from "@mui/material/styles";
import {
  Container,
  Box,
  Card,
  Typography,
  ToggleButton,
  TextField,
} from "@mui/material";
import TableCell from "@mui/material/TableCell";
import { NavLink } from "react-router-dom";

export const CampaignImageCard = styled(Card)`
  width: 100%;
  border-radius: 12px;
  margin-top: 50px;
  box-shadow: 20;
`;

export const CampaignDescription = styled(Box)`
  width: 100%;
  text-align: center;
  padding-top: 50px;
  padding-bottom: 50px;
`;

export const UserInfoCell = styled(TableCell)`
  font-size: 20px;
  border-bottom: none;
  padding: 12px;
`;

export const UserInfo = styled("div")`
  display: "flex";
`;

export const UserInfoFields = styled("div")`
  width: 15%;
  float: left;
`;

export const UserInfoTypography = styled(Typography)`
  font-size: 20px;
  padding: 10px;
`;

export const AuthLink = styled(NavLink)`
  text-decoration: none;
`;

export const FormContainer = styled(Container)`
  padding-left: 200px;
  padding-right: 200px;
`;

export const Section = styled("div")(({ isHidden }) => ({
  marginTop: "0px",
  marginBottom: "50px",
  display: isHidden ? "none" : "",
}));

export const SectionHeader = styled("h1")`
  margin-left: 10px;
  margin-top: 0px;
`;

export const RoleButton = styled(ToggleButton)({
  "&.Mui-selected, &.Mui-selected:hover": {
    color: "white",
    backgroundColor: "#084cec",
  },
  borderRadius: "20px",
  padding: "5px",
  paddingLeft: "10px",
  paddingRight: "10px",
  color: "#084cec",
  backgroundColor: "white",
  borderColor: "#084cec",
  margin: "5px",
});

export const Question = styled(Typography)`
  font-weight: bold;
  font-size: 20px;
`;

export const Answer = styled(TextField)`
  margin-bottom: 1rem;
  width: 100%;
`;

export const SpaceRight = styled("span")`
  margin-right: 6px;
`;
