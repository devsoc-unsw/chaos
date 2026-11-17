"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type OverrideDatePickerProps = {
  value: Date | undefined;
  onChange: (date: Date) => void;
};

export function OverrideDatePicker({ value, onChange }: OverrideDatePickerProps) {
  const [open, setOpen] = useState(false);
  const label = value ? format(value, "d MMMM yyyy") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={label ? `Override date, ${label}` : "Choose override date"}
          className={cn("h-11 w-44 justify-between text-base font-normal", !value && "text-muted-foreground")}
        >
          {label ?? "dd mm yyyy"}
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          required
          selected={value}
          defaultMonth={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
