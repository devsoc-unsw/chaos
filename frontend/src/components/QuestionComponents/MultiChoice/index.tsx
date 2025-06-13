import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Option {
  id: string | number;
  label: string;
}

interface MultiChoiceProps {
  id: number;
  question: string;
  description?: string;
  options: Option[];
  required?: boolean;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  onSubmit?: (questionId: number, value: string | number) => void;
  disabled?: boolean;
}

const MultiChoice: React.FC<MultiChoiceProps> = ({
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
  const [selectedOption, setSelectedOption] = useState<string | number | undefined>(defaultValue);

  const handleChange = (value: string) => {
    const optionId = isNaN(Number(value)) ? value : Number(value);
    setSelectedOption(optionId);

    if (onChange) onChange(optionId);
    if (onSubmit) onSubmit(id, optionId);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <Label className="text-lg font-medium">{question}</Label>
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>

      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}

      <RadioGroup
        value={selectedOption?.toString()}
        onValueChange={handleChange}
        disabled={disabled}
        className="space-y-3"
      >
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.id.toString()}
              id={`option-${id}-${option.id}`}
            />
            <Label
              htmlFor={`option-${id}-${option.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default MultiChoice;