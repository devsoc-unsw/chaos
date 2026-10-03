"use client";

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { snowflakeGenerator } from "@/lib/id";
import { OverrideDatePicker } from "./override-date-picker";

type Override = {
  id: string;
  date: Date;
  start: string;
  end: string;
};

type Draft = {
  date: Date | undefined;
  start: string;
  end: string;
};

const emptyDraft: Draft = { date: undefined, start: "9:00am", end: "9:00am" };

const initialOverrides: Override[] = [
  {
    id: snowflakeGenerator.generate().toString(),
    date: new Date(2026, 6, 31),
    start: "9:00am",
    end: "9:00am",
  },
];

type OverrideRowProps = {
  date: Date | undefined;
  start: string;
  end: string;
  onDateChange: (date: Date) => void;
  onStartChange: (start: string) => void;
  onEndChange: (end: string) => void;
  action: ReactNode;
};

function OverrideRow({
  date,
  start,
  end,
  onDateChange,
  onStartChange,
  onEndChange,
  action,
}: OverrideRowProps) {
  return (
    <div className="flex items-center gap-5 py-3">
      <OverrideDatePicker value={date} onChange={onDateChange} />
      <Input
        aria-label="Override start time"
        value={date ? start : ""}
        onChange={(e) => onStartChange(e.target.value)}
        placeholder="-:--"
        disabled={!date}
        className="h-11 w-32 md:text-base"
      />
      <span>-</span>
      <Input
        aria-label="Override end time"
        value={date ? end : ""}
        onChange={(e) => onEndChange(e.target.value)}
        placeholder="-:--"
        disabled={!date}
        className="h-11 w-32 md:text-base"
      />
      {action}
    </div>
  );
}

export function OverridesSection() {
  const [overrides, setOverrides] = useState<Override[]>(initialOverrides);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  function updateOverride(id: string, changes: Partial<Override>) {
    setOverrides((prev) =>
      prev.map((override) => (override.id === id ? { ...override, ...changes } : override))
    );
  }

  function removeOverride(id: string) {
    setOverrides((prev) => prev.filter((override) => override.id !== id));
  }

  function addOverride() {
    const { date, start, end } = draft;
    if (!date) return;

    setOverrides((prev) => [
      ...prev,
      { id: snowflakeGenerator.generate().toString(), date, start, end },
    ]);
    setDraft(emptyDraft);
  }

  return (
    <>
      <h2 className="text-2xl font-bold mt-8 mb-1">Overrides</h2>
      <p className="text-base text-muted-foreground mb-4">
        Remove a single time slot from your regular availability.
      </p>

      <Card className="max-w-4xl gap-0 py-3">
        <CardContent className="px-7">
          {overrides.map((override) => (
            <OverrideRow
              key={override.id}
              date={override.date}
              start={override.start}
              end={override.end}
              onDateChange={(date) => updateOverride(override.id, { date })}
              onStartChange={(start) => updateOverride(override.id, { start })}
              onEndChange={(end) => updateOverride(override.id, { end })}
              action={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove override"
                  onClick={() => removeOverride(override.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          ))}

          <OverrideRow
            date={draft.date}
            start={draft.start}
            end={draft.end}
            onDateChange={(date) => setDraft({ ...draft, date })}
            onStartChange={(start) => setDraft({ ...draft, start })}
            onEndChange={(end) => setDraft({ ...draft, end })}
            action={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Add override"
                disabled={!draft.date}
                onClick={addOverride}
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
