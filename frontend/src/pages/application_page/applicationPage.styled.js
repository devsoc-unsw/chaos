import { styled } from "@mui/material/styles";
import { Container, Box, Card, CardMedia, Typography, ToggleButton, TextField, Button } from "@mui/material";
import { NavLink } from "react-router-dom";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export const CampaignImageCard = styled(Card)({
  width: "100%",
  borderRadius: "12px",
  marginTop: "50px",
  boxShadow: 20
});

export const CampaignDescription = styled(Box)({
  width: "100%",
  textAlign: "center",
  paddingTop: "50px",
  paddingBottom: "50px"
});

export const UserInfo = styled('div')({
  display: "flex"
});

export const UserInfoFields = styled('div')({
  width: "15%",
  float: "left"
});

export const UserInfoTypography = styled(Typography)({
  fontSize: "20px",
  padding:"10px"
});

export const Link = styled(NavLink)({
  textDecoration:"none"
});

export const FormContainer = styled(Container)`
  padding-left: 200px;
  padding-right: 200px;
`;

export const Section = styled("div")(({ isHidden }) => ({
  marginTop: "0px",
  marginBottom: "50px",
  display: isHidden ? "none" : ""
}));

export const SectionHeader = styled("h1")({
  marginLeft: "10px",
  marginTop: "0px"
});

export const RoleButton = styled(ToggleButton)({
  "&.Mui-selected, &.Mui-selected:hover": {
    color: "white",
    backgroundColor: "#084cec"
  },
  borderRadius: "20px",
  padding: "5px",
  paddingLeft: "10px",
  paddingRight: "10px",
  color: "#084cec",
  backgroundColor: "white",
  borderColor: "#084cec",
  margin: "5px"
});

export const Question = styled(Typography)`
  font-weight: bold;
  font-size: 20px;
`;

export const Answer = styled(TextField)({
  marginBottom: "1rem",
  width: "100%"
});

export const SubmitWrapper = styled('div')({
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "50px"
});

export const SubmitButton = styled(Button)({
  fontSize: "20px"
});

export const ArrowIcon = styled(ArrowForwardIosIcon)({
  fontSize:"1rem"
});
