"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { snowflakeGenerator } from "@/lib/id";

export type TimeRange = {
  id: string;
  start: string;
  end: string;
};

export type Day = {
  name: string;
  enabled: boolean;
  ranges: TimeRange[];
};

export function newTimeRange(): TimeRange {
  return {
    id: snowflakeGenerator.generate().toString(),
    start: "9:00am",
    end: "9:00am",
  };
}

type AvailabilityAdjusterProps = {
  day: Day;
  onChange: (day: Day) => void;
};

export function AvailabilityAdjuster({ day, onChange }: AvailabilityAdjusterProps) {
  function updateRange(id: string, field: "start" | "end", value: string) {
    onChange({
      ...day,
      ranges: day.ranges.map((range) =>
        range.id === id ? { ...range, [field]: value } : range
      ),
    });
  }

  function addRange() {
    onChange({ ...day, ranges: [...day.ranges, newTimeRange()] });
  }

  function removeRange(id: string) {
    onChange({ ...day, ranges: day.ranges.filter((range) => range.id !== id) });
  }

  return (
    <div className="flex items-start gap-5 py-3">
      <Label className="h-11 w-44 cursor-pointer gap-3 text-base font-normal">
        <Switch
          checked={day.enabled}
          onCheckedChange={(enabled) => onChange({ ...day, enabled })}
        />
        {day.name}
      </Label>

      <div className="flex flex-col gap-3">
        {day.ranges.map((range, index) => (
          <div key={range.id} className="flex items-center gap-5">
            <Input
              aria-label={`${day.name} start time`}
              value={range.start}
              onChange={(e) => updateRange(range.id, "start", e.target.value)}
              className="h-11 w-32 md:text-base"
            />
            <span>-</span>
            <Input
              aria-label={`${day.name} end time`}
              value={range.end}
              onChange={(e) => updateRange(range.id, "end", e.target.value)}
              className="h-11 w-32 md:text-base"
            />

            {index === 0 ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Add time range for ${day.name}`}
                onClick={addRange}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove time range for ${day.name}`}
                onClick={() => removeRange(range.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
