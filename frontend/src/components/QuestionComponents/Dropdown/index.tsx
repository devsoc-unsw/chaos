import React, { useState } from 'react';
import tw from 'twin.macro';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/solid';

interface DropdownOption {
  id: string | number;
  label: string;
}

interface DropdownProps {
  id: number;
  question: string;
  description?: string;
  options: DropdownOption[];
  required?: boolean;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  onSubmit?: (questionId: number, value: string | number) => void;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  id,
  question,
  description,
  options,
  required = false,
  defaultValue,
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const [value, setValue] = useState<string | number | undefined>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (optionId: string | number) => {
    setValue(optionId);
    setIsOpen(false);

    if (onChange) onChange(optionId);
    if (onSubmit) onSubmit(id, optionId);
  };

  const selectedOption = options.find(option => option.id === value);

  return (
    <div tw="mb-6 max-w-4xl w-full">
      <div tw="flex items-center mb-1">
        <label tw="text-lg font-medium text-gray-900">{question}</label>
        {required && <span tw="ml-1 text-red-500">*</span>}
      </div>

      {description && (
        <p tw="mb-2 text-sm text-gray-600">{description}</p>
      )}

      <div tw="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          tw="w-full py-1 px-4 text-left rounded-md border-2 border-gray-400 shadow-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
        >
          <div tw="flex items-center justify-between">
            <span>{selectedOption ? selectedOption.label : 'Select an option'}</span>
            <ChevronDownIcon tw="h-3 w-5 text-gray-400" />
          </div>
        </button>

        {isOpen && (
          <div tw="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 max-h-60 overflow-auto border-2 border-gray-300">
            {options.map((option) => {
              // Check if this option is selected
              const isSelected = option.id === value;

              return (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  // Basic styling for all options
                  tw="px-4 py-1 cursor-pointer hover:bg-blue-50 text-sm flex items-center justify-between"
                  // Apply conditional styling based on selection state
                  css={isSelected ? tw`bg-blue-50 font-medium` : undefined}
                >
                  <span>{option.label}</span>
                  {/* Show checkmark for selected option */}
                  {isSelected && (
                    <CheckIcon tw="h-4 w-4 text-blue-500 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropdown;