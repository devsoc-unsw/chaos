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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Header Card Component */}
        <div className="w-full h-full md:col-span-1">
          <div className="rounded-lg border border-gray-300 bg-white shadow-lg overflow-hidden h-full flex flex-col">
            {/* Header Image Section */}
            <div className="bg-gray-100 border-b border-gray-300 px-6 py-8 text-center flex-shrink-0">
              <div className="text-2xl font-bold text-gray-700">Header Image</div>
            </div>

            {/* Content Section */}
            <div className="px-6 py-4 bg-gray-50 flex-grow flex flex-col justify-center">
              <div className="text-sm font-medium text-gray-600 mb-1">UNSW Devsoc</div>
              <div className="text-lg font-bold text-gray-800 mb-3">2025 Subcommittee Recruitment</div>

              <div className="text-sm text-gray-600 mb-2">Interview For:</div>
              <div className="text-3xl font-bold text-gray-800">Chaos</div>
            </div>
          </div>
        </div>

        {/* Personal Info and Notes Section - Side by side on desktop */}
        <div className="flex w-full flex-col gap-5 md:col-span-1 md:order-first">
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

              <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
                {/* Email and Phone Inputs */}
                <div className="grid grid-cols-1 gap-4 md:col-span-3">
                  <div className="flex gap-4">
                    <div className="w-full">
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
                        className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                    <div className="w-full">
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
                        className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                      className="w-full rounded-md border border-indigo-200 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-300"
                      rows={4}
                    />

                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>


      </div>


      {/* Calendar and Time Slot Section - Side by side */}

      <div className="flex w-full flex-col gap-6 md:flex-row md:outline md:outline-1 md:outline-indigo-300 md:p-4 md:rounded-lg">
        {/* Calendar Panel */}
        <div className="w-full max-w-sm">
          <div className="rounded-lg border border-gray-400 bg-white shadow-sm p-4">
            <Calendar
              mode="single"
              selected={new Date(selectedDate)}
              onSelect={handleDateChange}
              modifiers={modifiers}
              modifiersClassNames={{
                available: "bg-purple-100 text-purple-700 font-semibold border border-purple-400 hover:bg-purple-200",
              }}
              classNames={{
                months: "flex justify-center",
                month: "bg-white rounded-lg p-4 space-y-4",
                caption: "flex items-center justify-between px-4 text-center font-medium relative",
                caption_label: "text-sm font-medium",
                nav: "flex gap-1",
                nav_button: cn(
                  "inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md bg-transparent text-gray-500 cursor-pointer transition-all hover:bg-gray-100 hover:text-gray-700"
                ),
                nav_button_previous: "absolute left-0",
                nav_button_next: "absolute right-0",
                table: "w-full border-collapse mt-4",
                head_row: "flex",
                head_cell: "w-10 h-10 flex items-center justify-center text-xs font-medium text-gray-500",
                row: "flex w-full mt-2",
                cell: "w-10 h-10 flex items-center justify-center relative",
                day: cn(
                  "w-10 h-10 border-none bg-transparent rounded-md cursor-pointer text-sm transition-all hover:bg-gray-100"
                ),
                day_selected: "bg-purple-500 text-white hover:bg-purple-600 focus:bg-purple-500",
                day_today: "bg-gray-100 text-gray-900",
                day_outside: "text-gray-400 opacity-50",
                day_disabled: "text-gray-300 cursor-not-allowed",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>

        {/* Time Slot Selector Panel */}
        <div className="flex-1">
          {/* Week Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
            >
              ←
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
              →
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
