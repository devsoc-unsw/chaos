import React from "react";
import PropTypes from "prop-types";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

import FinalRatingCandidateCard from "../FinalRatingCandidateCard";
import PassBar from "../PassBar";

const DragDropRankings = (props) => {
  const {
    rankings,
    setRankings,
    selectedPosition,
    passIndex,
    setPassIndex,
    applications,
  } = props;

  const onDragEnd = (result) => {
    // TODO: CHAOS-88 integrate with backend
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (draggableId === "pass-bar") {
      setPassIndex(destination.index);
    } else {
      // Dragged a candidate
      const newRankings = Array.from(rankings[selectedPosition]);
      const srcIdx = source.index - (source.index > passIndex);
      const destIdx =
        destination.index -
        (destination.index > passIndex) -
        (destination.index === passIndex && source.index < passIndex);

      newRankings.splice(srcIdx, 1);
      newRankings.splice(
        destIdx,
        0,
        rankings[selectedPosition].filter(
          (candidate) => candidate.name === draggableId
        )[0]
      );
      setRankings({ ...rankings, [selectedPosition]: newRankings });

      // If candidate was dragged to the other side of pass bar, update position of pass bar
      if (source.index > passIndex && destination.index <= passIndex) {
        setPassIndex(passIndex + 1);
      } else if (source.index < passIndex && destination.index >= passIndex) {
        setPassIndex(passIndex - 1);
      }
    }
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
            {rankings[selectedPosition]
              ?.slice(0, passIndex)
              .map((candidate, index) => (
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
                        application={
                          applications[selectedPosition][candidate.id]
                        }
                      />
                    </div>
                  )}
                </Draggable>
              ))}

            {selectedPosition in rankings && (
              <Draggable draggableId="pass-bar" index={passIndex}>
                {(draggableProvided) => (
                  <div
                    ref={draggableProvided.innerRef}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...draggableProvided.draggableProps}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...draggableProvided.dragHandleProps}
                  >
                    <PassBar />
                  </div>
                )}
              </Draggable>
            )}

            {rankings[selectedPosition]
              ?.slice(passIndex)
              .map((candidate, index) => (
                <Draggable
                  key={candidate.name}
                  draggableId={candidate.name}
                  index={index + passIndex + 1}
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
                        application={
                          applications[selectedPosition][candidate.id]
                        }
                        reject
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
        ratings: PropTypes.arrayOf(
          PropTypes.shape({
            rater: PropTypes.string.isRequired,
            rating: PropTypes.number.isRequired,
          })
        ).isRequired,
      })
    )
  ).isRequired,
  setRankings: PropTypes.func.isRequired,
  selectedPosition: PropTypes.string.isRequired,
  passIndex: PropTypes.number.isRequired,
  setPassIndex: PropTypes.func.isRequired,
  applications: PropTypes.objectOf(
    PropTypes.objectOf(
      PropTypes.shape({
        zId: PropTypes.string.isRequired,
        questions: PropTypes.arrayOf(
          PropTypes.shape({
            question: PropTypes.string.isRequired,
            answer: PropTypes.string,
          })
        ),
      })
    )
  ).isRequired,
};

export default DragDropRankings;
