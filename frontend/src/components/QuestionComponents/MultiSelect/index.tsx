import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Option {
  id: string | number;
  label: string;
}

interface MultiSelectProps {
  id: string;
  question: string;
  description?: string;
  options: Option[];
  required?: boolean;
  defaultValue?: Array<string | number>;
  onChange?: (value: Array<string | number>) => void;
  onSubmit?: (questionId: string, value: Array<string | number>) => void;
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

  const handleChange = (optionId: string | number, checked: boolean) => {
    let newSelectedOptions: Array<string | number> = [];

    if (checked) {
      newSelectedOptions = [...selectedOptions, optionId];
    } else {
      newSelectedOptions = selectedOptions.filter(id => id !== optionId);
    }

    setSelectedOptions(newSelectedOptions);

    if (onChange) onChange(newSelectedOptions);
    if (onSubmit) onSubmit(id, newSelectedOptions);
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

      <div className="space-y-3">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={`option-${id}-${option.id}`}
              checked={selectedOptions.includes(option.id)}
              onCheckedChange={(checked) => handleChange(option.id, !!checked)}
              disabled={disabled}
            />
            <Label
              htmlFor={`option-${id}-${option.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiSelect;