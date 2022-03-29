import React from "react";
import { Container, Grid, Typography } from "@mui/material";
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
    name: "Haley Gu",
    finalised: false,
  },
];

const FinaliseCandidates = () => {
  const finalised = dummyCandidates.filter((candidate) => candidate.finalised);
  const notFinalised = dummyCandidates.filter(
    (candidate) => !candidate.finalised
  );
  return (
    <Container>
      <Grid container spacing={2} p={2}>
        <Grid item xs={6}>
          <Typography variant="h2">Finalised</Typography>
          <ul>
            {finalised.map((candidate) => (
              <FinalisedEntry>
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
              <li>
                {candidate.role} - {candidate.name}
              </li>
            ))}
          </ul>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FinaliseCandidates;
