import { Container } from "@mui/material";
import React from "react";
import FinalRatingCandidateCard from "../../components/FinalRatingCandidateCard";

const dummyRatings = [
  { rater: "Shrey Somaiya", rating: 4 },
  { rater: "Michael Gribben", rating: 5 },
  { rater: "Haley Gu", rating: 5 },
];

const FinalRating = () => (
  <Container>
    <h1>Choose candidates to progress to the next stage</h1>

    <FinalRatingCandidateCard
      name="Hayes Choy"
      position="Student Experience Director"
      ratings={dummyRatings}
    />
    <FinalRatingCandidateCard
      name="Giuliana De Bellis"
      position="Student Experience Director"
      ratings={dummyRatings}
    />
    <FinalRatingCandidateCard
      name="Colin Hon"
      position="Student Experience Director"
      ratings={dummyRatings}
    />
  </Container>
);

export default FinalRating;
