import { addDays, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";

import availableTime from "./availableTimeSlots.json";

import type React from "react";

/**
 * Represents a single time slot available for booking.
 */
interface Slot {
  date: string;
  time: string;
}

/**
 * Props accepted by the BookingCalendar component.
 * - onDateTimeSelect: Callback when a date and time are selected.
 */
interface BookingCalendarProps {
  onDateTimeSelect: (date: string, time: string) => void;
}

/**
 * Formats a JavaScript Date object into a "YYYY-MM-DD" string.
 */
const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Given a start date, returns an array of 7 dates representing the week.
 */
const getWeekDates = (startDate: Date): Date[] =>
  Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

/**
 * BookingCalendar displays a calendar UI and available time slots,
 * with different behavior on desktop vs mobile.
 */
const BookingCalendar: React.FC<BookingCalendarProps> = ({
  onDateTimeSelect,
}) => {
  const slotData: Slot[] = availableTime;

  // State to track currently selected date and time
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDate(new Date())
  );
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Starting date of the visible week (Monday by default)
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Generate an array of 7 dates for the current week
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  /**
   * Group time slots by date for easy lookup when rendering the grid.
   * Example: { "2025-05-07": ["10:00", "11:00"], ... }
   */
  const groupedSlots = useMemo(() => {
    const map: Record<string, string[]> = {};
    slotData.forEach((slot) => {
      if (!map[slot.date]) {
        map[slot.date] = [];
      }
      map[slot.date].push(slot.time);
    });
    return map;
  }, [slotData]);

  /**
   * Set of all available dates to use for highlighting and disabling.
   */
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    slotData.forEach((slot) => dates.add(slot.date));
    return dates;
  }, [slotData]);

  // Calendar modifier to highlight available dates
  const modifiers = {
    available: (date: Date) => availableDates.has(formatDate(date)),
  };

  // Custom class for available dates and selected dates in the calendar
  const modifiersClassNames = {
    available:
      "bg-purple-100 text-purple-700 font-semibold border border-purple-400",
    selected: "bg-purple-500 text-white font-bold border border-purple-700",
  };

  /**
   * Disable dates in the calendar that don't have available time slots.
   */
  const disabled = (date: Date) => !availableDates.has(formatDate(date));

  /**
   * Called when a user selects a date in the calendar.
   */
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formatted = formatDate(date);
      setSelectedDate(formatted);
      setSelectedTime("");
      setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    }
  };

  /**
   * Called when a user selects a time slot from the grid.
   */
  const handleTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    onDateTimeSelect(date, time);
  };

  return (
    <div className="flex w-full flex-col gap-6 p-4 md:flex-row">
      {/* Calendar Panel */}
      <div className="w-full max-w-sm">
        <Calendar
          mode="single"
          selected={new Date(selectedDate)}
          onSelect={handleDateChange}
          className="rounded-md border text-gray-800 bg-white w-max shadow-sm"
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          disabled={disabled}
        />
      </div>

      {/* Time Slot Selector Panel */}
      <div className="flex-1">
        {/* Week Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            ← Previous
          </Button>
          <h2 className="text-lg font-semibold">
            Week of{" "}
            {weekStart.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </h2>
          <Button
            variant="outline"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            Next →
          </Button>
        </div>

        {/* Weekday Buttons (User selects a day here) */}
        <div className="mb-4 grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-7">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const isSelected = dateStr === selectedDate;
            return (
              <Button
                key={dateStr}
                disabled={!availableDates.has(dateStr)}
                variant="outline"
                className={cn(
                  "flex flex-col py-2 h-11",
                  isSelected && availableDates.has(dateStr)
                    ? "bg-indigo-200 ring-2 ring-indigo-100"
                    : ""
                )}
                onClick={() => handleTimeSelect(dateStr, "")}
              >
                <span className="text-xs">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="font-semibold">
                  {date.toLocaleDateString("en-US", { day: "numeric" })}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Mobile View: Only show selected day's time slots */}
        <div className="space-y-2 md:hidden">
          {(groupedSlots[selectedDate] || []).length === 0 ? (
            <div className="text-center text-muted-foreground">No slots</div>
          ) : (
            groupedSlots[selectedDate].map((time) => {
              const isSelected = selectedTime === time;
              return (
                <Card
                  key={time}
                  onClick={() => handleTimeSelect(selectedDate, time)}
                  className={cn(
                    "cursor-pointer border py-2 text-center text-sm transition",
                    isSelected
                      ? "bg-indigo-200 ring-2 ring-indigo-100"
                      : "hover:bg-muted"
                  )}
                >
                  {time}
                </Card>
              );
            })
          )}
        </div>

        {/* Desktop View: Show full week grid of time slots */}
        <div className="hidden grid-cols-7 gap-3 md:grid">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const times = groupedSlots[dateStr] || [];
            return (
              <div key={dateStr} className="space-y-2">
                {times.length === 0 ? (
                  <div className="text-center text-muted-foreground">—</div>
                ) : (
                  times.map((time) => {
                    const isSelected =
                      selectedDate === dateStr && selectedTime === time;
                    return (
                      <Card
                        key={time}
                        onClick={() => handleTimeSelect(dateStr, time)}
                        className={cn(
                          "cursor-pointer border py-2 text-center text-sm transition",
                          isSelected
                            ? "bg-indigo-200 ring-2 ring-indigo-100"
                            : "hover:bg-muted"
                        )}
                      >
                        {time}
                      </Card>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
