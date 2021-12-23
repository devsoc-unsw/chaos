import React, { useState } from "react";
import { Container, Stepper, Step, StepLabel } from "@mui/material";
import { DragDropContext, Droppable } from "react-beautiful-dnd";

import FinalRatingCandidateCard from "../../components/FinalRatingCandidateCard";
import RankingToolbar from "./RankingToolbar";

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

  // const onDragEnd = (result) => {
  //   const { destination, source, draggableId } = result;

  //   if (!destination) return;
  //   if (
  //     destination.droppableId === source.droppableId &&
  //     destination.index === source.index
  //   )
  //     return;

  //   const newQuestionOrder = Array.from(quizData.questions);
  //   newQuestionOrder.splice(source.index, 1);
  //   newQuestionOrder.splice(
  //     destination.index,
  //     0,
  //     quizData.questions.filter(
  //       (questionData) => `${questionData.id}` === draggableId
  //     )[0]
  //   );
  //   updateQuizData({ ...quizData, questions: newQuestionOrder });
  // };

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

      <RankingToolbar
        positions={dummyPositions}
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
      />

      {/* <DragDropContext onDragEnd={onDragEnd}> */}
      {dummyApplicants
        .filter((applicant) => applicant.position === selectedPosition)
        .map((applicant) => (
          <FinalRatingCandidateCard
            key={applicant.name}
            name={applicant.name}
            position={applicant.position}
            ratings={applicant.ratings}
          />
        ))}
      {/* </DragDropContext> */}
    </Container>
  );
};

export default FinalRating;
