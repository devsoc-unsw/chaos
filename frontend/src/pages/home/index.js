import React, { useContext, useEffect } from "react";
import { Container } from "@mui/material";
import CampaignCard from "../../components/CampaignCard";
import { SetNavBarTitleContext } from "../../App";
import DirectorDummy from "./director.jpg";
import SubcomDummy from "./subcom.jpg";

const Home = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("Home");
  }, []);
  return (
    <Container>
      <h2>Your Campaigns</h2>
      <CampaignCard
        title="Subcom Recruitment"
        description="Join the fam"
        startDate="1 Jan 2022"
        endDate="1 Feb 2022"
        img={SubcomDummy}
      />

      <h2>Available Campaigns</h2>
      <CampaignCard
        title="Director Recruitment"
        description="Join the fam"
        startDate="1 Jan 2022"
        endDate="1 Feb 2022"
        img={DirectorDummy}
      />

      <h2>Past Campaigns</h2>
      <CampaignCard
        title="Subcom Recruitment"
        description="Join the fam"
        startDate="1 Jan 2022"
        endDate="1 Feb 2022"
        img={SubcomDummy}
      />
    </Container>
  );
};

export default Home;
