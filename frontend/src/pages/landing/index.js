import { Typography } from "@mui/material";
import React from "react";
import { useTheme, Box} from "@mui/system";
import Particles from "react-tsparticles";
import BackgroundWrapper from "../../components/BackgroundWrapper";


const Landing = () => {
  // eslint-disable-next-line no-unused-vars
  const [loggedIn, setLoggedIn] = React.useState(false);
  const theme = useTheme();
  return (
    <BackgroundWrapper>
      <Box id="particles-js">
        {/* 
          adapted from 
          https://github.com/Tymotex/timz.dev/blob/dc70dd0d9b5a92cada5b153d1a1a5124407b1932/src/components/particles/ParticleWallpaper.js 
        */}
        <Particles
          id="tsparticles"
          options={{
            particles: {
              number: {
                value: 50,
                density: {
                  enable: true,
                  value_area: 1000,
                },
              },
              line_linked: {
                enable: true,
                opacity: 0.4,
              },
              move: {
                enable: true,
                speed: 0.5,
                direction: "none",
                random: false,
                straight: false,
                out_mode: "out",
                bounce: false,
                attract: {
                  enable: false,
                  rotateX: 600,
                  rotateY: 1200,
                },
              },
              size: {
                value: 3,
              },
              opacity: {
                anim: {
                  enable: true,
                  speed: 1.2,
                  opacity_min: 0.15,
                },
              },
            },
            interactivity: {
              detect_on: "window",
              events: {
                onhover: {
                  enable: true,
                  mode: "grab",
                },
                onclick: {
                  enable: true,
                  mode: "push",
                },
                resize: true,
              },
              modes: {
                grab: {
                  distance: 140,
                  line_linked: {
                    opacity: 1,
                  },
                },
                bubble: {
                  distance: 400,
                  size: 5,
                  duration: 2,
                  opacity: 8,
                  speed: 3,
                },
                repulse: {
                  distance: 200,
                  duration: 0.4,
                },
                push: {
                  particles_nb: 1,
                },
                remove: {
                  particles_nb: 2,
                },
              },
            },
            retina_detect: true,
          }}
        />
      </Box>

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
