// MultiSelect/index.tsx
import React, { useState } from 'react';
import tw from 'twin.macro';

interface Option {
  id: string | number;
  label: string;
}

interface MultiSelectProps {
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

const MultiSelect: React.FC<MultiSelectProps> = ({
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
  const [selectedOptions, setSelectedOptions] = useState<Array<string | number>>(defaultValue);

  const handleChange = (optionId: string | number) => {
    let newSelectedOptions: Array<string | number> = [];

    if (selectedOptions.includes(optionId)) {
      newSelectedOptions = selectedOptions.filter(id => id !== optionId);
    } else {
      newSelectedOptions = [...selectedOptions, optionId];
    }

    setSelectedOptions(newSelectedOptions);

    if (onChange) onChange(newSelectedOptions);
    if (onSubmit) onSubmit(id, newSelectedOptions);
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

      <div tw="space-y-2">
        {options.map((option) => (
          <div key={option.id} tw="flex items-center">
            <input
              type="checkbox"
              id={`option-${id}-${option.id}`}
              name={`question-${id}-${option.id}`}
              value={option.id.toString()}
              checked={selectedOptions.includes(option.id)}
              onChange={() => handleChange(option.id)}
              disabled={disabled}
              tw="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label
              htmlFor={`option-${id}-${option.id}`}
              tw="ml-3 block text-sm font-medium text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiSelect;