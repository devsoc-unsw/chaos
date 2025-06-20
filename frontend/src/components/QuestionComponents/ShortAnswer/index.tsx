import React, { useState, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  placeholder?: string;
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
  rows = 3,
  placeholder = "Your answer",
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const handleBlur = () => {
    if (onSubmit && value.trim() !== '') {
      onSubmit(id, value);
    }
  };

  return (
    <div className="mb-6 max-w-4xl w-full">
      <div className="flex items-center mb-2">
        <Label className="text-lg font-medium">{question}</Label>
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>

      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}

      <Textarea
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className="w-full resize-y transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
      />
    </div>
  );
};

export default ShortAnswer;