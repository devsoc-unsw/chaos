import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import dayjs, { Dayjs } from "dayjs";
import availableTime from "./availableTimeSlots.json";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DatePicker, StaticDatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";


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
  Array.from({ length: 7 }, (_, i) => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i));
const getMonday = (date: Dayjs): Date => {
  const jsDate = date.toDate();
  const day = jsDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate() + diff);
};

const BookingCalendar: React.FC<BookingCalendarProps> = ({ onDateTimeSelect }) => {
  // Removed duplicate handleTimeSelect function
  const slotData: Slot[] = availableTime; // Replace with your data source
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(dayjs()));
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md")); // md = 768px+
  const isMobile = window.innerWidth < 768; // Tailwind's 'md' breakpoint

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const groupedSlots = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const slot of slotData) {
      if (!map[slot.date]) map[slot.date] = [];
      map[slot.date].push(slot.time);
    }
    return map;
  }, []);

  const handleDateChange = (newDate: Dayjs | null) => {
    if (newDate) {
      const formatted = newDate.format("YYYY-MM-DD");
      setSelectedDate(formatted);
      setSelectedTime("");
      setWeekStart(getMonday(newDate));
    }
  };

  const handleTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    onDateTimeSelect(date, time);
  };

  
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8 p-4 md:p-8 w-full">
      
      {/* MUI Calendar Section */}
      <div className="w-full max-w-sm">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {isDesktop ? (
            <StaticDatePicker
              className="bg-indigo-600"
              value={dayjs(selectedDate)}
              onChange={handleDateChange}
              displayStaticWrapperAs="desktop"
            />
          ) : (
            <DatePicker
              value={dayjs(selectedDate)}
              onChange={handleDateChange}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                },
              }}
            />
          )}
        </LocalizationProvider>
      </div>

          
      {/* Time Slot Section */}
      <div className="w-full mt-6 md:mt-0 transition-all duration-300 overflow-x-auto">
        {/* Header with week control */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <button
            type="button"
            onClick={() => setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7))}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            ← Previous
          </button>
          {!isMobile ? (
          <h2 className="text-md md:text-lg font-semibold text-gray-800 text-center flex-1">
            Week of {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h2>) :
          <h2 className="w-full text-lg font-semibold text-gray-800 text-center mx-2">
            {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h2>
          }

          <button
            type="button"
            onClick={() => setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7))}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            Next →
          </button>
        </div>

        {/* Day buttons */}
        <div className="grid grid-cols-1 mb-8 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-4">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const isSelected = dateStr === selectedDate;
            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => handleTimeSelect(dateStr, "")}
                className={`py-2 text-sm font-medium border rounded-full transition-all w-full h-12 flex items-center justify-center ${
                  isSelected
                    ? "bg-gray-400 text-white border-gray-400 ring-2 ring-gray-300"
                    : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-xs">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-sm font-semibold">
                    {date.toLocaleDateString("en-US", { day: "numeric" })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="grid sm:grid-cols-4 md:grid-cols-7 gap-2">
          
        {(isMobile ? weekDates.filter(d => formatDate(d) === selectedDate) : weekDates).map((date) => {
            const dateStr = formatDate(date);
            const times = groupedSlots[dateStr] || [];
            return (
              <div key={dateStr} className="space-y-2">
                {times.length === 0 ? (
                  <div className="text-center text-gray-300">—</div>
                ) : (
                  times.map((time) => {
                    const isSelected = selectedDate === dateStr && selectedTime === time;
                    return (
                      <button
                        type="button"
                        key={time}
                        onClick={() => handleTimeSelect(dateStr, time)}
                        className={`w-full text-xs py-2 px-2 border rounded-md shadow-sm transition-all duration-200 ${
                          isSelected
                            ? "bg-indigo-400 text-white border-gray-400 ring-2 ring-gray-300"
                            : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:shadow"
                        }`}
                      >
                        {time}
                      </button>
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
