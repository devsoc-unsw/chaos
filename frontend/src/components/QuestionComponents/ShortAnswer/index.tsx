import React, { useState, ChangeEvent } from 'react';
import tw from 'twin.macro';
import Textarea from 'components/Textarea';

interface ShortAnswerProps {
  id: number;
  question: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (questionId: number, value: string) => void;
  disabled?: boolean;
  rows?: number;
  columns?: number;
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
  rows = 3, // Fix: expand to 3 rows
  columns = 77,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  // Changed to handle textarea instead of input
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const handleBlur = () => {
    if (onSubmit && value.trim() !== '') {
      onSubmit(id, value);
    }
  };
  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div tw="mb-6 max-w-4xl w-full">
      <div tw="flex items-center mb-1">
        <label tw="text-lg font-medium text-gray-900">{question}</label>
        {required && <span tw="ml-1 text-red-500">*</span>}
      </div>

      {description && (
        <p tw="mb-2 text-sm text-gray-600">{description}</p>
      )}
    <Textarea
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        rows={rows}
        cols={columns}
        size="md"
        placeholder="Your answer"
        required={required}
        style={{
          caretColor: isFocused ? '#3b82f6' : 'auto',
          transition: 'all 0.2s ease-in-out',
        }}
      />
    </div>
  );
};

export default ShortAnswer;