"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Check, ChevronLeft, ChevronRight, SquarePen, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function fromKey(key: string) {
  // Parse as local time to avoid timezone drift off the calendar grid.
  return new Date(`${key}T00:00:00`);
}

function InterviewCard({ date, name, location }: { date: Date, name: string, location: string }) {
  return (
    <div className="flex w-full items-stretch gap-3 bg-white">
      <div className="w-1.5 shrink-0 rounded-full bg-calendar-primary" />
      <div className="flex flex-col justify-center gap-1">
        <div className="text-xs font-medium text-gray-900">{format(date, "dd MMMM yyyy")}</div>
        <div className="text-xs text-gray-700">{name}</div>
        <div className="text-[11px] text-gray-500">{location}</div>
      </div>
    </div>
  );
}

export interface AvailabilityCalendarProps {
  /** Controlled set of days marked available. */
  value?: Date[];
  /** Uncontrolled initial set of days marked available. */
  defaultValue?: Date[];
  /** Called with the full set of marked days when the user saves an edit. */
  onSave?: (dates: Date[]) => void | Promise<void>;
  editLabel?: string;
  className?: string;
}

export default function AvailabilityCalendar({
  value,
  defaultValue,
  onSave,
  editLabel = "Edit Availability",
  className,
}: AvailabilityCalendarProps) {
  const isControlled = value !== undefined;

  const [internal, setInternal] = React.useState<Set<string>>(
    () => new Set((defaultValue ?? []).map(toKey)),
  );

  const committed = React.useMemo(
    () => (isControlled ? new Set(value.map(toKey)) : internal),
    [isControlled, value, internal],
  );

  const [month, setMonth] = React.useState<Date>(() => startOfMonth(new Date()));
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<Set<string>>(new Set());
  const [saving, setSaving] = React.useState(false);

  const active = editing ? draft : committed;

  const weeks = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [month]);

  const onCurrentMonth = isSameMonth(month, new Date());

  const startEdit = () => {
    setDraft(new Set(committed));
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const toggle = (day: Date) => {
    if (!editing || !isSameMonth(day, month)) return;
    const key = toKey(day);
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const dates = [...draft].sort().map(fromKey);
    try {
      await onSave?.(dates);
      if (!isControlled) setInternal(new Set(draft));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col rounded-xl border bg-card p-5 shadow-sm space-y-4",
        className,
      )}
    >
      {/* Calendar */}
      <section>
        {/* Header: month + jump to today, nav arrows */}
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {format(month, "MMMM yyyy")}
            </h3>
            <button
              type="button"
              onClick={() => setMonth(startOfMonth(new Date()))}
              aria-label="Jump to current month"
              title="Jump to current month"
              className={cn(
                "flex size-5 items-center justify-center rounded-md transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                onCurrentMonth
                  ? "pointer-events-none text-muted-foreground/40"
                  : "text-primary hover:bg-primary/10",
              )}
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
              className="flex size-6 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="flex size-6 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="pb-1 text-center text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div
          className="grid grid-cols-7"
          role={editing ? "group" : undefined}
          aria-label={editing ? "Toggle available days" : undefined}
        >
          {weeks.flat().map((day) => {
            const inMonth = isSameMonth(day, month);
            if (!inMonth) {
              return <div key={toKey(day)} aria-hidden className="aspect-square" />;
            }

            const marked = active.has(toKey(day));
            const today = isToday(day);
            const interactive = editing;

            return (
              <div key={toKey(day)} className="flex aspect-square items-center justify-center p-0.5">
                <button
                  type="button"
                  onClick={() => toggle(day)}
                  disabled={!interactive}
                  aria-pressed={editing ? marked : undefined}
                  aria-label={`${format(day, "EEEE, d MMMM yyyy")}${marked ? ", available" : ""}${today ? ", today" : ""}`}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-xs sm:text-md tabular-nums transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                    interactive ? "cursor-pointer" : "cursor-default",
                    marked
                      ? "bg-calendar-secondary font-semibold hover:bg-calendar-primary"
                      : cn(
                        "text-foreground",
                        interactive && "hover:bg-calendar-primary",
                      ),
                    today && !marked && "ring-2 ring-inset ring-primary/60",
                    today && marked && "ring-2 ring-inset ring-primary",
                  )}
                >
                  {format(day, "d")}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {editing ? (
            <>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                {draft.size} {draft.size === 1 ? "day" : "days"} marked
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="h-7 px-2 text-xs"
                >
                  <X className="size-3.5" /> Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={save}
                  disabled={saving}
                  className="h-7 px-2 text-xs"
                >
                  <Check className="size-3.5" /> {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startEdit}
                className="h-7 px-2 text-xs"
              >
                <SquarePen className="size-3.5" /> {editLabel}
              </Button>
              {committed.size > 0 && (
                <span className="text-xs text-muted-foreground">
                  {committed.size} available
                </span>
              )}
            </>
          )}
        </div>
      </section>

      {/* Upcoming interviews */}
      <section className="mt-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-900">3 Upcoming Interviews</h2>
        <div className="flex flex-col gap-4">
          <InterviewCard date={new Date()} name="Peter Nguyen" location="UNSW Library G041" />
          <InterviewCard date={new Date(Date.now() + 86400000)} name="Young Liam" location="UNSW Library G041" />
          <InterviewCard date={new Date(Date.now() + 172800000)} name="Mitsuki Koga" location="UNSW Library G041" />
        </div>
      </section>
    </div>
  );
}