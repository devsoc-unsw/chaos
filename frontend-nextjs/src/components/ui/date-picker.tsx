"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
}

export function DatePicker({ value, onChange, label }: DatePickerProps = {}) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [time, setTime] = React.useState<string>("00:00:00")

  // Combine date and time into ISO datetime string
  const updateDateTime = React.useCallback((newDate: Date | undefined, newTime: string) => {
    if (!onChange) return

    if (newDate) {
      const [hours, minutes, seconds = "00"] = newTime.split(':')
      const combinedDate = new Date(newDate)
      combinedDate.setHours(parseInt(hours) || 0)
      combinedDate.setMinutes(parseInt(minutes) || 0)
      combinedDate.setSeconds(parseInt(seconds) || 0)
      combinedDate.setMilliseconds(0)
      
      // Return ISO string
      onChange(combinedDate.toISOString())
    }
  }, [onChange])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      updateDateTime(selectedDate, time)
    }
    setOpen(false)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value || "00:00:00"
    setTime(newTime)
    if (date) {
      updateDateTime(date, newTime)
    }
  }

  return (
    <div className="flex gap-4">
      {/* Date  */}
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="px-1">{label || ""}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date" className="w-48 justify-between font-normal">
            {date ? date.toLocaleDateString() : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar mode="single" selected={date} captionLayout="dropdown" onSelect={handleDateSelect} />
        </PopoverContent>
      </Popover>
    </div>
    {/* Time  */}
    <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={time}
          onChange={handleTimeChange}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  )
}
