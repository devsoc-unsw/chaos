import React, { useContext, useEffect } from "react";
import { Container, Grid } from "@mui/material";
import CampaignCard from "../../components/CampaignCard";
import { SetNavBarTitleContext } from "../../App";

import DirectorDummy from "./director.jpg";
import ProjectLeadDummy from "./project-lead.jpg";
import ProjectTeamDummy from "./project-team.png";

const dummyYourCampaigns = [
  {
    title: "Project Leads 1",
    appliedFor: ["Careers Director"],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: ProjectLeadDummy,
  },
  {
    title: "Project Leads 2",
    appliedFor: ["Socials Director", "Student Experience Director"],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: ProjectLeadDummy,
  },
];

const dummyAvailableCampaigns = [
  {
    title: "Projects Team 1",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: ProjectTeamDummy,
  },
  {
    title: "Projects Team 2",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: ProjectTeamDummy,
  },
  {
    title: "Projects Team 3",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: ProjectTeamDummy,
  },
];

const dummyPastCampaigns = [
  {
    title: "Director Recruitment Super Duper Long Long Title 1",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: DirectorDummy,
  },
  {
    title: "DR 2",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: DirectorDummy,
  },
  {
    title: "Director Recruitment 3",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: DirectorDummy,
  },
  {
    title: "Director Recruitment 4",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: DirectorDummy,
  },
  {
    title: "Director Recruitment 5",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: DirectorDummy,
  },
  {
    title: "Director Recruitment 6",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: DirectorDummy,
  },
  {
    title: "Director Recruitment 7",
    appliedFor: [],
    positions: [
      { name: "Careers Director", number: 4 },
      { name: "Media Director", number: 3 },
      { name: "Creative Director", number: 3 },
      { name: "Marketing Director", number: 2 },
      { name: "Education Director", number: 2 },
      { name: "Competitions Director", number: 2 },
      { name: "Technical Director", number: 1 },
      { name: "Projects Director", number: 2 },
      { name: "Socials Director", number: 3 },
      { name: "Student Experience Director", number: 2 },
    ],
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
    img: DirectorDummy,
  },
];

const Dashboard = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("Your Dashboard");
  }, []);
  return (
    <Container>
      <h2>My Campaigns</h2>
      <Grid container spacing={2} columns={4}>
        {dummyYourCampaigns.map((campaign) => (
          <Grid item key={campaign.title} xs={1}>
            <CampaignCard
              title={campaign.title}
              appliedFor={campaign.appliedFor}
              positions={campaign.positions}
              startDate={campaign.startDate}
              endDate={campaign.endDate}
              img={campaign.img}
            />
          </Grid>
        ))}
      </Grid>

      <h2>Available Campaigns</h2>
      <Grid container spacing={2} columns={4}>
        {dummyAvailableCampaigns.map((campaign) => (
          <Grid item key={campaign.title} xs={1}>
            <CampaignCard
              title={campaign.title}
              appliedFor={campaign.appliedFor}
              positions={campaign.positions}
              startDate={campaign.startDate}
              endDate={campaign.endDate}
              img={campaign.img}
            />
          </Grid>
        ))}
      </Grid>

      <h2>Past Campaigns</h2>
      <Grid container spacing={2} columns={4}>
        {dummyPastCampaigns.map((campaign) => (
          <Grid item key={campaign.title} xs={1}>
            <CampaignCard
              title={campaign.title}
              appliedFor={campaign.appliedFor}
              positions={campaign.positions}
              startDate={campaign.startDate}
              endDate={campaign.endDate}
              img={campaign.img}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;
