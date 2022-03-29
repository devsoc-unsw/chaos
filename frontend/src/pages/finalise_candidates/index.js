import React, { useState } from "react";
import { Box, Container, Grid, Tab, Typography } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { FinalisedEntry } from "./finaliseCandidates.styled";

const dummyCandidates = [
  {
    role: "Student Experience Subcommittee Member",
    name: "Hayes Choy",
    finalised: true,
  },
  { role: "Media Subcommittee Member", name: "Shrey Somaiya", finalised: true },
  {
    role: "Creative Subcommittee Member",
    name: "Giuliana De Bellis",
    finalised: true,
  },
  { role: "Marketing Subcommittee Member", name: "Colin Hou", finalised: true },
  {
    role: "Competitions Subcommittee Member",
    name: "Lachlan Ting",
    finalised: true,
  },
  {
    role: "Socials Experience Subcommittee Member",
    finalised: false,
  },
];

const FinaliseCandidates = () => {
  const finalised = dummyCandidates.filter((candidate) => candidate.finalised);
  const notFinalised = dummyCandidates.filter(
    (candidate) => !candidate.finalised
  );
  // TODO: CHAOS-71 generate tabs and emails for each finalised member
  const [tab, setTab] = useState("0");
  return (
    <Container>
      <Grid container spacing={2} p={2}>
        <Grid item xs={6}>
          <Typography variant="h2">Finalised</Typography>
          <ul>
            {finalised.map((candidate) => (
              <FinalisedEntry key={candidate.role}>
                {candidate.role} -{" "}
                <span className="name">{candidate.name}</span>
              </FinalisedEntry>
            ))}
          </ul>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h2">Not Finalised</Typography>
          <ul>
            {notFinalised.map((candidate) => (
              <li key={candidate.role}>{candidate.role}</li>
            ))}
          </ul>
        </Grid>
      </Grid>
      <TabContext value={tab}>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={(_, t) => setTab(t)}>
              <Tab label="Hayes Choy" value="0" />
              <Tab label="Shrey Somaiya" value="1" />
            </TabList>
          </Box>
          <TabPanel value="0">email</TabPanel>
          <TabPanel value="1">poggers</TabPanel>
        </Box>
      </TabContext>
    </Container>
  );
};

export default FinaliseCandidates;
