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
 * - formData: Object containing form data including firstName, lastName, email, phone, notes
 * - handleChange: Function to handle form input changes
 */
interface BookingCalendarProps {
  onDateTimeSelect: (date: string, time: string) => void;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
  formData,
  handleChange,
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
    <div className="flex w-full flex-col gap-6 p-4">
      {/* Personal Info and Notes Section - Side by side on desktop */}
      <div className="flex w-full flex-col gap-5">
        {/* Personal Info Section */}
        <div className="w-full">
          <div className="mx-auto transform space-y-4 rounded-xl border border-indigo-300 bg-white p-6 shadow-lg transition-all duration-500">
            <div>
              <h2 className="mb-2 text-xl font-bold tracking-tight text-gray-800">
                {formData.firstName} {formData.lastName || "🧑"}
              </h2>
              <p className="text-xs italic text-gray-500">
                Please confirm your contact information. We'll reach out to you via
                email or phone.
              </p>
            </div>

            {/* Email and Phone Inputs */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-xs font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    placeholder="johndoe2005@gmail.com"
                    onChange={handleChange}
                    className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 max-w-1/3"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-xs font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    placeholder="+61 400 123 456"
                    onChange={handleChange}
                    className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 max-w-1/3"
                  />
                </div>
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-purple-700">
                  Additional Notes
                </h3>
                <textarea
                  id="notes"
                  placeholder="Enter any specific notes or requests... e.g. 'Please don't call during math class'"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-indigo-200 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-300 max-w-2/3"
                  rows={4}
                />
              </div>

            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="w-full">
          <div className="mx-auto rounded-xl border border-gray-300 bg-gradient-to-br from-white via-gray-50 to-purple-50 p-6 shadow-lg transition duration-300 ease-in-out">

          </div>
        </div>
      </div>

      {/* Calendar and Time Slot Section - Side by side */}
      <div className="flex w-full flex-col gap-6 md:flex-row">
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
    </div>
  );
};

export default BookingCalendar;
