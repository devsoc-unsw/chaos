import { Typography } from "@mui/material";
import React from "react";
import { useTheme, Box } from "@mui/system";
import Particles from "react-tsparticles";
import BackgroundWrapper from "../../components/BackgroundWrapper";
import ParticleWallpaper from "../../components/ParticleWallpaper";

const Landing = () => {
  // eslint-disable-next-line no-unused-vars
  const [loggedIn, setLoggedIn] = React.useState(false);
  const theme = useTheme();
  return (
    <BackgroundWrapper>
      <ParticleWallpaper />
      <Typography
        sx={{
          fontWeight: 600,
          color: theme.palette.secondary.light,
        }}
        variant="h1"
      >
        Project Chaos
      </Typography>

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
