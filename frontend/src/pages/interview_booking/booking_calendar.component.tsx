import React, { useState, useMemo } from "react";
import { addDays, startOfWeek } from "date-fns";
import { Calendar } from "../../components/shad_cn/ui/calendar";

import { Button } from "../../components/shad_cn/ui/button";
import { Card } from "../../components/shad_cn/ui/card";
import { cn } from "../../components/shad_cn/lib/utils";
import availableTime from "./availableTimeSlots.json";

interface Slot {
  date: string;
  time: string;
}

interface BookingCalendarProps {
  onDateTimeSelect: (date: string, time: string) => void;
}

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getWeekDates = (startDate: Date): Date[] =>
  Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

const BookingCalendar: React.FC<BookingCalendarProps> = ({ onDateTimeSelect }) => {
  const slotData: Slot[] = availableTime;
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const groupedSlots = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const slot of slotData) {
      if (!map[slot.date]) map[slot.date] = [];
      map[slot.date].push(slot.time);
    }
    return map;
  }, []);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formatted = formatDate(date);
      setSelectedDate(formatted);
      setSelectedTime("");
      setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    }
  };

  const handleTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    onDateTimeSelect(date, time);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 w-full">
      {/* Calendar */}
      <div className="max-w-sm w-full">
        <Calendar
          mode="single"
          selected={new Date(selectedDate)}
          onSelect={handleDateChange}
          className="rounded-md border"
        />
      </div>

      {/* Time Selector */}
      <div className="flex-1">
        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            ← Previous
          </Button>
          <h2 className="text-md font-semibold">
            Week of {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h2>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Next →
          </Button>
        </div>

        {/* Week Day Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-4">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const isSelected = dateStr === selectedDate;
            return (
              <Button
                key={dateStr}
                variant={isSelected ? "default" : "outline"}
                className="flex flex-col py-2"
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

        {/* Time Slots */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const times = groupedSlots[dateStr] || [];
            return (
              <div key={dateStr} className="space-y-2">
                {times.length === 0 ? (
                  <div className="text-center text-muted-foreground">—</div>
                ) : (
                  times.map((time) => {
                    const isSelected = selectedDate === dateStr && selectedTime === time;
                    return (
                      <Card
                        key={time}
                        onClick={() => handleTimeSelect(dateStr, time)}
                        className={cn(
                          "text-center py-2 text-sm cursor-pointer border transition",
                          isSelected
                            ? "bg-black text-white ring-2 ring-gray-200"
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