import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

import FinalRatingCandidateCard from "../FinalRatingCandidateCard";
import PassBar from "../PassBar";

import type { Applications, Rankings } from "../types";
import type { DragDropContextProps } from "@hello-pangea/dnd";

type Props = {
  rankings: Rankings;
  setRankings: (rankings: Rankings) => void;
  selectedPosition: string;
  passIndex: number;
  setPassIndex: (passIndex: number) => void;
  applications: Applications;
};

const DragDropRankings = ({
  rankings,
  setRankings,
  selectedPosition,
  passIndex,
  setPassIndex,
  applications,
}: Props) => {
  const onDragEnd: DragDropContextProps["onDragEnd"] = (result) => {
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
      const srcIdx = source.index - Number(source.index > passIndex);
      const destIdx =
        destination.index -
        Number(destination.index > passIndex) -
        Number(destination.index === passIndex && source.index < passIndex);

      newRankings.splice(srcIdx, 1);
      newRankings.splice(
        destIdx,
        0,
        rankings[selectedPosition].filter(
          (candidate: { name: string }) => candidate.name === draggableId
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
                          applications[selectedPosition]?.[candidate.id]
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

export default DragDropRankings;
