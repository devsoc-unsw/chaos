import React, { useState, useEffect, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MultiOptionQuestionOption } from '@/models/question';

// Special value to represent "No Answer" selection
export const NO_ANSWER_VALUE = '__NO_ANSWER__';

export interface RankedOption {
    id: string,
    display_order: number,
    text: string
}

export default function Ranking({
  question,
  dict
}: {
    question: any;
    dict: any
}){
    const options: MultiOptionQuestionOption[] =
    (question as any).options ?? [];

    const [rankedOptions, setRankedOptions] = useState<RankedOption[]>(options);

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const updatedOptions = rankedOptions.map((opt, idx) => ({
      ...opt,
      rank: idx + 1
    }));

    setRankedOptions(updatedOptions);
    const orderedIds = updatedOptions.map(opt => opt.id);
    // if (onChange) onChange(orderedIds);
    // if (onSubmit) onSubmit(id, orderedIds);
  };
    return (
        <div className="mb-6 w-full">
            <div className="flex items-center mb-1">
                <label className="text-lg font-medium ">{question.text}</label>
                {question.required && <span tw="ml-1 text-red-500">*</span>}
            </div>

            {question.description && (
                <p className="mb-2 text-sm">{question.description}</p>
            )}


            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="ranking-list">
                {(provided, snapshot) => (
                    <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                    >
                    {rankedOptions.map((option, index) => (
                        <Draggable
                        key={option.id.toString()}
                        draggableId={option.id.toString()}
                        index={index}
                        >
                        {(provided, snapshot) => (
                            <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center p-3 bg-card border-1"
                            >
                            <span className="bg-primary-foreground text-foreground rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3 text-sm">
                                {option.display_order}
                            </span>
                            <span className="text-foreground flex-1">{option.text}</span>
                            </div>
                        )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                    </div>
                )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}