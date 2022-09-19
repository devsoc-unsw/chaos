import React from "react";
import PropTypes from "prop-types";
import { AppBar, Button, Toolbar } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate } from "react-router-dom";
import { CampaignName, LogoButton } from "./navBar.styled";
import BasicMenu from "./NavBarMenu";
import { isLoggedIn } from "../../utils";

const NavBar = (props) => {
  const { campaign } = props;
  const loggedIn = isLoggedIn();
  const navigate = useNavigate();

  return (
    <AppBar position="fixed">
      <Toolbar>
        <LogoButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="home"
          onClick={() => navigate("/")}
        >
          <HomeIcon />
        </LogoButton>
        <CampaignName>{campaign}</CampaignName>
        {loggedIn ? <BasicMenu /> : <Button variant="secondary">Login</Button>}
      </Toolbar>
    </AppBar>
  );
};

NavBar.propTypes = {
  campaign: PropTypes.string.isRequired,
};

export default NavBar;
