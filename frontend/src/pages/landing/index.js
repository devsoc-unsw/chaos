import { Typography } from "@mui/material";
import React from "react";
import { useTheme } from "@mui/system";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import ParticleWallpaper from "../../components/ParticleWallpaper";
import BoldTitle from "./landing.styled";

const Landing = () => {
  // eslint-disable-next-line no-unused-vars
  const [loggedIn, setLoggedIn] = React.useState(false);
  const theme = useTheme();
  return (
    <BackgroundWrapper>
      <ParticleWallpaper />
      <BoldTitle variant="h1">Project Chaos</BoldTitle>

      <Typography
        sx={{
          color: theme.palette.primary.light,
        }}
        variant="subtitle"
      >
        Recruitment Drives, without the fuss.
      </Typography>
    </BackgroundWrapper>
  );
};

export default Landing;
