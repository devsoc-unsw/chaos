import React, { useState } from "react";
import {
  Container,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  Grid,
  Select,
  InputLabel,
  MenuItem,
  Button,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";

import FinalRatingCandidateCard from "../../components/FinalRatingCandidateCard";

// TODO: CHAOS-12 retrieve data from BE instead of using dummy data
const dummyPositions = [
  "Creative Director",
  "Marketing Director",
  "Media Director",
  "Socials Director",
  "Student Experience Director",
];

const dummyApplicants = [
  {
    name: "Hayes Choy",
    position: "Student Experience Director",
    ratings: [
      { rater: "Shrey Somaiya", rating: 5 },
      { rater: "Michael Gribben", rating: 5 },
      { rater: "Haley Gu", rating: 5 },
    ],
  },
  {
    name: "Giuliana De Bellis",
    position: "Student Experience Director",
    ratings: [
      { rater: "Shrey Somaiya", rating: 4 },
      { rater: "Michael Gribben", rating: 4 },
      { rater: "Haley Gu", rating: 3 },
    ],
  },
  {
    name: "Colin Hon",
    position: "Student Experience Director",
    ratings: [
      { rater: "Shrey Somaiya", rating: 2 },
      { rater: "Michael Gribben", rating: 2 },
      { rater: "Haley Gu", rating: 2 },
    ],
  },
  {
    name: "Lachlan Ting",
    position: "Student Experience Director",
    ratings: [
      { rater: "Shrey Somaiya", rating: 1 },
      { rater: "Michael Gribben", rating: 2 },
      { rater: "Haley Gu", rating: 1 },
    ],
  },
  {
    name: "Evan Lee",
    position: "Student Experience Director",
    ratings: [
      { rater: "Shrey Somaiya", rating: 0 },
      { rater: "Michael Gribben", rating: 0 },
      { rater: "Haley Gu", rating: 1 },
    ],
  },
];

const FinalRating = () => {
  const [selectedPosition, setSelectedPosition] = useState("");

  const handleChange = (event) => {
    setSelectedPosition(event.target.value);
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

      <Grid container alignItems="center" spacing={4}>
        <Grid item xs>
          <FormControl fullWidth>
            <InputLabel id="candidate-position-select-label">
              Position
            </InputLabel>
            <Select
              labelId="candidate-position-select-label"
              id="candidate-position-select"
              value={selectedPosition}
              label="Position"
              onChange={handleChange}
            >
              {dummyPositions.map((position) => (
                <MenuItem key={position} value={position}>
                  {position}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          {/* TODO: CHAOS-11 sort candidates when button is pressed */}
          <Button size="large" startIcon={<SortIcon />}>
            Sort candidates
          </Button>
        </Grid>
      </Grid>

      {dummyApplicants
        .filter((applicant) => applicant.position === selectedPosition)
        .map((applicant) => (
          <FinalRatingCandidateCard
            name={applicant.name}
            position={applicant.position}
            ratings={applicant.ratings}
          />
        ))}
    </Container>
  );
};

export default FinalRating;
