import { Button } from "@mui/material";
import React, { useContext, useEffect } from "react";
import { Box } from "@mui/system";
import { useNavigate } from "react-router-dom";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { BackgroundWrapper, ParticleWallpaper } from "../../components";
import { BoldTitle, Subtitle } from "./landing.styled";
import { getStore } from "../../utils";

const OAUTH_CALLBACK_URL =
  getStore("AUTH_TOKEN") || import.meta.env.VITE_OAUTH_CALLBACK_URL;

const Landing = () => {
  // eslint-disable-next-line no-unused-vars
  const [loggedIn, setLoggedIn] = React.useState(false);
  const navigate = useNavigate();

  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("");
  }, []);

  return (
    <BackgroundWrapper>
      <ParticleWallpaper />
      <BoldTitle variant="h1">Project Chaos</BoldTitle>
      <Subtitle variant="subtitle">
        Recruitment Drives, without the fuss.
      </Subtitle>
      <Box>
        {getStore("AUTH_TOKEN") ? (
          <Button onClick={() => navigate("/dashboard")}>Your Dashboard</Button>
        ) : (
          <Button href={OAUTH_CALLBACK_URL}> Get Started </Button>
        )}
      </Box>
    </BackgroundWrapper>
  );
};

export default Landing;
