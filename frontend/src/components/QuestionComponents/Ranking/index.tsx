// Ranking/index.tsx
import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

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

  const moveOption = (optionId: string | number, direction: 'up' | 'down') => {
    if (disabled) return;

    const currentIndex = rankedOptions.findIndex(opt => opt.id === optionId);
    if (currentIndex === -1) return;

    const newRankedOptions = [...rankedOptions];

    if (direction === 'up' && currentIndex > 0) {
      // Swap with previous item
      [newRankedOptions[currentIndex - 1], newRankedOptions[currentIndex]] =
      [newRankedOptions[currentIndex], newRankedOptions[currentIndex - 1]];
    } else if (direction === 'down' && currentIndex < rankedOptions.length - 1) {
      // Swap with next item
      [newRankedOptions[currentIndex], newRankedOptions[currentIndex + 1]] =
      [newRankedOptions[currentIndex + 1], newRankedOptions[currentIndex]];
    } else {
      return; // Can't move further in this direction
    }

    // Update ranks
    const updatedOptions = newRankedOptions.map((opt, idx) => ({
      ...opt,
      rank: idx + 1
    }));

    setRankedOptions(updatedOptions);

    const orderedIds = updatedOptions.map(opt => opt.id);
    if (onChange) onChange(orderedIds);
    if (onSubmit) onSubmit(id, orderedIds);
  };

  return (
    <div tw="mb-6">
      <div tw="flex items-center mb-1">
        <label tw="text-lg font-medium text-gray-900">{question}</label>
        {required && <span tw="ml-1 text-red-500">*</span>}
      </div>

      {description && (
        <p tw="mb-2 text-sm text-gray-600">{description}</p>
      )}

      <div tw="border border-gray-300 rounded-md overflow-hidden">
        {rankedOptions.sort((a, b) => a.rank - b.rank).map((option, index) => (
          <div
            key={option.id}
            css={[
              tw`flex items-center justify-between p-3 bg-white`,
              index !== rankedOptions.length - 1 && tw`border-b border-gray-300`,
              disabled && tw`bg-gray-50`,
            ]}
          >
            <div tw="flex items-center">
              <span tw="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold mr-3">
                {option.rank}
              </span>
              <span tw="text-gray-800">{option.label}</span>
            </div>

            {!disabled && (
              <div tw="flex space-x-1">
                <button
                  type="button"
                  onClick={() => moveOption(option.id, 'up')}
                  disabled={index === 0}
                  css={[
                    tw`p-1 rounded hover:bg-gray-100`,
                    index === 0 && tw`opacity-50 cursor-not-allowed`,
                  ]}
                >
                  <ChevronUpIcon tw="h-5 w-5 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOption(option.id, 'down')}
                  disabled={index === rankedOptions.length - 1}
                  css={[
                    tw`p-1 rounded hover:bg-gray-100`,
                    index === rankedOptions.length - 1 && tw`opacity-50 cursor-not-allowed`,
                  ]}
                >
                  <ChevronDownIcon tw="h-5 w-5 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ranking;