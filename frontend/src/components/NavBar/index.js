import React from "react";
import PropTypes from "prop-types";
import { AppBar, Button, Toolbar } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import { CampaignName, LogoButton } from "./navBar.styled";
import BasicMenu from "./NavBarMenu";
import { isLoggedIn } from "../../utils"

const NavBar = (props) => {
  const { campaign } = props;
  const loggedIn = isLoggedIn();

  return (
    <AppBar position="static">
      <Toolbar>
        <LogoButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="home"
          href="/"
        >
          <HomeIcon />
        </LogoButton>
        <CampaignName>{campaign}</CampaignName>
        {
          loggedIn ? 
          <BasicMenu /> :
          <Button variant="secondary">Login</Button>
        }
      </Toolbar>
    </AppBar>
  );
};

NavBar.propTypes = {
  campaign: PropTypes.string.isRequired,
};

export default NavBar;
