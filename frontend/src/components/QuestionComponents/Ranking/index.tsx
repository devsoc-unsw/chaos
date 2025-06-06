import React, { useState, useEffect } from 'react';
import tw, {css} from 'twin.macro';
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
  defaultValue?: Array<string | number>;
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
      const initialRanked = defaultValue.map((optionId, index) => {
        const option = options.find(opt => opt.id === optionId);
        return option ? { ...option, rank: index + 1 } : null;
      }).filter(Boolean) as RankedOption[];

      const rankedIds = initialRanked.map(o => o.id);
      const unrankedOptions = options
        .filter(opt => !rankedIds.includes(opt.id))
        .map((opt, i) => ({ ...opt, rank: initialRanked.length + i + 1 }));

      setRankedOptions([...initialRanked, ...unrankedOptions]);
    } else {
      setRankedOptions(options.map((opt, i) => ({ ...opt, rank: i + 1 })));
    }
  }, [options, defaultValue]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const newRankedOptions = Array.from(rankedOptions);
    const [removed] = newRankedOptions.splice(result.source.index, 1);
    newRankedOptions.splice(result.destination.index, 0, removed);

    const updatedOptions = newRankedOptions.map((opt, idx) => ({
      ...opt,
      rank: idx + 1
    }));

    setRankedOptions(updatedOptions);

    const orderedIds = updatedOptions.map(opt => opt.id);
    if (onChange) onChange(orderedIds);
    if (onSubmit) onSubmit(id, orderedIds);
  };

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
              tw="space-y-3"
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
                      {...provided.dragHandleProps}
                      tw="flex items-center p-3 bg-white border-2 border-gray-300 rounded-lg cursor-grab hover:border-blue-500 transition-colors duration-150"
                    >
                      <span tw="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3 text-sm">
                        {option.rank}
                      </span>
                      <span tw="text-gray-800 flex-1">{option.label}</span>
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
};

export default Ranking;