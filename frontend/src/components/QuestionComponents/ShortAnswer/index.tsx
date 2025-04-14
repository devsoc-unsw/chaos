// ShortAnswer/index.tsx
import React, { useState, ChangeEvent } from 'react';
import tw from 'twin.macro';

interface ShortAnswerProps {
  id: number;
  question: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (questionId: number, value: string) => void;
  disabled?: boolean;
}

const ShortAnswer: React.FC<ShortAnswerProps> = ({
  id,
  question,
  description,
  required = false,
  defaultValue = '',
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const handleBlur = () => {
    if (onSubmit && value.trim() !== '') {
      onSubmit(id, value);
    }
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

      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        css={[
          tw`form-input w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500`,
          disabled && tw`bg-gray-100 cursor-not-allowed`,
        ]}
        placeholder="Your answer"
        required={required}
      />
    </div>
  );
};

export default ShortAnswer;