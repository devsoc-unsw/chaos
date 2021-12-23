import React, { useState } from "react";
import {
  Container,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
} from "@mui/material";

import RankingsToolbar from "./RankingsToolbar";
import DragDropRankings from "./DragDropRankings";

// TODO: CHAOS-12 retrieve data from BE instead of using dummy data
const dummyRankings = {
  "Student Experience Director": [
    {
      name: "Hayes Choy",
      ratings: [
        { rater: "Shrey Somaiya", rating: 5 },
        { rater: "Michael Gribben", rating: 5 },
        { rater: "Haley Gu", rating: 5 },
      ],
    },
    {
      name: "Giuliana De Bellis",
      ratings: [
        { rater: "Shrey Somaiya", rating: 4 },
        { rater: "Michael Gribben", rating: 4 },
        { rater: "Haley Gu", rating: 3 },
      ],
    },
    {
      name: "Colin Hon",
      ratings: [
        { rater: "Shrey Somaiya", rating: 2 },
        { rater: "Michael Gribben", rating: 2 },
        { rater: "Haley Gu", rating: 2 },
      ],
    },
    {
      name: "Lachlan Ting",
      ratings: [
        { rater: "Shrey Somaiya", rating: 1 },
        { rater: "Michael Gribben", rating: 2 },
        { rater: "Haley Gu", rating: 1 },
      ],
    },
    {
      name: "Evan Lee",
      ratings: [
        { rater: "Shrey Somaiya", rating: 0 },
        { rater: "Michael Gribben", rating: 0 },
        { rater: "Haley Gu", rating: 1 },
      ],
    },
  ],
  "Socials Director": [
    {
      name: "Lachlan Ting",
      ratings: [
        { rater: "Shrey Somaiya", rating: 5 },
        { rater: "Michael Gribben", rating: 3 },
        { rater: "Haley Gu", rating: 1 },
      ],
    },
    {
      name: "Evan Lee",
      ratings: [
        { rater: "Shrey Somaiya", rating: 5 },
        { rater: "Michael Gribben", rating: 5 },
        { rater: "Haley Gu", rating: 3 },
      ],
    },
  ],
};

const dummyPositions = Object.keys(dummyRankings);

const Rankings = () => {
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const [selectedPosition, setSelectedPosition] = useState("");
  const [rankings, setRankings] = useState(dummyRankings);

  const handleNext = () => {
    console.log(
      "Order:",
      rankings[selectedPosition].map((candidate) => candidate.name)
    );
  };

  return (
    <Container>
      {/* TODO: CHAOS-13 extract stepper out so that its used on all steps */}
      <Stepper alternativeLabel activeStep={1} sx={{ margin: "3rem 0" }}>
        <Step>
          <StepLabel>Mark candidates individually</StepLabel>
        </Step>
        <Step>
          <StepLabel>Choose candidates to progress to the next stage</StepLabel>
        </Step>
        <Step>
          <StepLabel>Notify candidates of their results</StepLabel>
        </Step>
      </Stepper>

      <RankingsToolbar
        positions={dummyPositions}
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
      />

      <DragDropRankings
        rankings={rankings}
        setRankings={setRankings}
        selectedPosition={selectedPosition}
      />

      <Grid container justifyContent="flex-end">
        {/* TODO CHAOS-16: progress to next page */}
        <Button onClick={handleNext}>Next (Console Log)</Button>
      </Grid>
    </Container>
  );
};

export default Rankings;
