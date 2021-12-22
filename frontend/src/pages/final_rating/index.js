import { Container } from "@mui/material";
import React from "react";
import FinalRatingCandidateCard from "../../components/FinalRatingCandidateCard";

const FinalRating = () => (
  <Container>
    <h1>Choose candidates to progress to the next stage</h1>

    <FinalRatingCandidateCard
      name="Hayes Choy"
      position="Student Experience Director"
      ratings={[
        { rater: "Shrey Somaiya", rating: 5 },
        { rater: "Michael Gribben", rating: 5 },
        { rater: "Haley Gu", rating: 5 },
      ]}
    />
    <FinalRatingCandidateCard
      name="Giuliana De Bellis"
      position="Student Experience Director"
      ratings={[
        { rater: "Shrey Somaiya", rating: 4 },
        { rater: "Michael Gribben", rating: 4 },
        { rater: "Haley Gu", rating: 3 },
      ]}
    />
    <FinalRatingCandidateCard
      name="Colin Hon"
      position="Student Experience Director"
      ratings={[
        { rater: "Shrey Somaiya", rating: 2 },
        { rater: "Michael Gribben", rating: 2 },
        { rater: "Haley Gu", rating: 2 },
      ]}
    />
    <FinalRatingCandidateCard
      name="Lachlan Ting"
      position="Student Experience Director"
      ratings={[
        { rater: "Shrey Somaiya", rating: 1 },
        { rater: "Michael Gribben", rating: 2 },
        { rater: "Haley Gu", rating: 1 },
      ]}
    />
    <FinalRatingCandidateCard
      name="Evan Lee"
      position="Student Experience Director"
      ratings={[
        { rater: "Shrey Somaiya", rating: 0 },
        { rater: "Michael Gribben", rating: 0 },
        { rater: "Haley Gu", rating: 1 },
      ]}
    />
  </Container>
);

export default FinalRating;
