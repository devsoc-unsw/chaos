import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import tw from 'twin.macro';

interface DropdownOption {
  id: string | number;
  label: string;
}

interface DropdownProps {
  id: string;
  question: string;
  description?: string;
  options: DropdownOption[];
  required?: boolean;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  onSubmit?: (questionId: string, value: string | number) => void;
  disabled?: boolean;
  placeholder?: string;
  width?: string;
  height?: string;
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
  width = "max-w-4xl",
  height = "",
  placeholder = "Select an option",
}) => {
  const [value, setValue] = useState<string | number | undefined>(defaultValue);

  const handleSelect = (selectedValue: string) => {
    // Convert back to number if the original option id was a number
    const originalOption = options.find(opt => opt.id.toString() === selectedValue);
    const optionId = originalOption ? originalOption.id : selectedValue;

    setValue(optionId);

    if (onChange) onChange(optionId);
    if (onSubmit) onSubmit(id, optionId);
  };

  return (
    <div tw="mb-6 w-full" css={width ? tw`${width}` : undefined}>
      <div className="flex items-center mb-2">
        <Label className="text-lg font-medium">{question}</Label>
        {required && <span className="ml-1 text-red-500">*</span>}
      </div>

      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}

      <Select
        value={value?.toString()}
        onValueChange={handleSelect}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.id}
              value={option.id.toString()}
              style={{
                '--hover-bg': 'rgb(239 246 255)',
                '--hover-text': 'rgb(30 58 138)',
              } as React.CSSProperties}
              className="hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)] data-[highlighted]:bg-[var(--hover-bg)] data-[highlighted]:text-[var(--hover-text)]"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default Dropdown;