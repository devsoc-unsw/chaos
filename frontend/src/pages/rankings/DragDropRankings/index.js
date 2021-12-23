import React from "react";
import PropTypes from "prop-types";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

import FinalRatingCandidateCard from "../../../components/FinalRatingCandidateCard";

const DragDropRankings = (props) => {
  const { rankings, setRankings, selectedPosition } = props;

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newRankings = Array.from(rankings[selectedPosition]);
    newRankings.splice(source.index, 1);
    newRankings.splice(
      destination.index,
      0,
      rankings[selectedPosition].filter(
        (candidate) => candidate.name === draggableId
      )[0]
    );
    setRankings({ ...rankings, [selectedPosition]: newRankings });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="rankings">
        {(droppableProvided) => (
          <div
            ref={droppableProvided.innerRef}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...droppableProvided.droppableProps}
          >
            {rankings[selectedPosition]?.map((candidate, index) => (
              <Draggable
                key={candidate.name}
                draggableId={candidate.name}
                index={index}
              >
                {(draggableProvided) => (
                  <div
                    ref={draggableProvided.innerRef}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...draggableProvided.draggableProps}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...draggableProvided.dragHandleProps}
                  >
                    <FinalRatingCandidateCard
                      name={candidate.name}
                      position={selectedPosition}
                      ratings={candidate.ratings}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

DragDropRankings.propTypes = {
  rankings: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        ratings: PropTypes.shape({
          rater: PropTypes.string.isRequired,
          rating: PropTypes.number.isRequired,
        }),
      })
    )
  ).isRequired,
  setRankings: PropTypes.func.isRequired,
  selectedPosition: PropTypes.string.isRequired,
};

export default DragDropRankings;
