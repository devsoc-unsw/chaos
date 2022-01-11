import React from "react";
import PropTypes from "prop-types";
import { AppBar, Button, Toolbar } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate } from "react-router-dom";
import { CampaignName, LogoButton } from "./navBar.styled";

const NavBar = (props) => {
  const { campaign } = props;
  const navigate = useNavigate();

  return (
    <AppBar position="static">
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
        <Button variant="secondary">Login</Button>
      </Toolbar>
    </AppBar>
  );
};

NavBar.propTypes = {
  campaign: PropTypes.string.isRequired,
};

export default NavBar;
