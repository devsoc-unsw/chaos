// Ranking/index.tsx
import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Option {
  id: string | number;
  label: string;
}

interface RankedOption extends Option {
  rank: number;
}

interface RankingProps {
  id: number;
  question: string;
  description?: string;
  options: Option[];
  required?: boolean;
  defaultValue?: Array<string | number>; // Array of option IDs in ranked order
  onChange?: (value: Array<string | number>) => void;
  onSubmit?: (questionId: number, value: Array<string | number>) => void;
  disabled?: boolean;
}

const Ranking: React.FC<RankingProps> = ({
  id,
  question,
  description,
  options,
  required = false,
  defaultValue = [],
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const [rankedOptions, setRankedOptions] = useState<RankedOption[]>([]);

  // Initialize ranked options on mount or when options change
  useEffect(() => {
    if (defaultValue.length > 0) {
      // If there's a default value, use it for initial ranking
      const initialRanked = defaultValue.map((optionId, index) => {
        const option = options.find(opt => opt.id === optionId);
        return option ? { ...option, rank: index + 1 } : null;
      }).filter(Boolean) as RankedOption[];

      // Add any remaining unranked options
      const rankedIds = initialRanked.map(o => o.id);
      const unrankedOptions = options
        .filter(opt => !rankedIds.includes(opt.id))
        .map((opt, i) => ({ ...opt, rank: initialRanked.length + i + 1 }));

      setRankedOptions([...initialRanked, ...unrankedOptions]);
    } else {
      // Otherwise, just assign ranks based on original order
      setRankedOptions(options.map((opt, i) => ({ ...opt, rank: i + 1 })));
    }
  }, [options, defaultValue]);

  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    // If the item was dropped in the same position, do nothing
    if (result.destination.index === result.source.index) {
      return;
    }

    // Create a new array from the current rankedOptions
    const newRankedOptions = Array.from(rankedOptions);

    // Remove the dragged item from its original position
    const [removed] = newRankedOptions.splice(result.source.index, 1);

    // Insert the dragged item at its new position
    newRankedOptions.splice(result.destination.index, 0, removed);

    // Update ranks
    const updatedOptions = newRankedOptions.map((opt, idx) => ({
      ...opt,
      rank: idx + 1
    }));

    setRankedOptions(updatedOptions);

    // Notify parent components
    const orderedIds = updatedOptions.map(opt => opt.id);
    if (onChange) onChange(orderedIds);
    if (onSubmit) onSubmit(id, orderedIds);
  };

  // Sort options by rank for display
  const sortedOptions = [...rankedOptions].sort((a, b) => a.rank - b.rank);

  return (
    <div tw="mb-6 max-w-3xl w-full">
      <div tw="flex items-center mb-1">
        <label tw="text-lg font-medium text-gray-900">{question}</label>
        {required && <span tw="ml-1 text-red-500">*</span>}
      </div>

      {description && (
        <p tw="mb-2 text-sm text-gray-600">{description}</p>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="ranking-list" isDropDisabled={disabled}>
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              css={[
                tw`border-2 border-gray-300 rounded-md overflow-hidden`,
                snapshot.isDraggingOver && tw`bg-blue-50 border-blue-300`,
              ]}
            >
              {sortedOptions.map((option, index) => (
                <Draggable
                  key={option.id.toString()}
                  draggableId={option.id.toString()}
                  index={index}
                  isDragDisabled={disabled}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      css={[
                        tw`flex items-center p-3 bg-white`,
                        index !== sortedOptions.length - 1 && tw`border-b border-gray-200`,
                        snapshot.isDragging && tw`bg-blue-100 shadow-md`,
                        disabled && tw`bg-gray-50 cursor-not-allowed`,
                      ]}
                    >
                      <div
                        {...provided.dragHandleProps}
                        tw="mr-3 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z" />
                        </svg>
                      </div>

                      <div tw="flex items-center flex-1">
                        <span tw="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold mr-3">
                          {option.rank}
                        </span>
                        <span tw="text-gray-800">{option.label}</span>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {!disabled && (
        <p tw="mt-2 text-sm text-gray-500 italic">
          Drag and drop items to reorder them
        </p>
      )}
    </div>
  );
};

export default Ranking;