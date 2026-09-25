"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AvailabilityAdjuster,
  newTimeRange,
  type Day,
} from "./components/availability-adjuster";
import { ConfirmDialog } from "./components/confirm-dialog";
import { OverridesSection } from "./components/overrides-section";

const initialDays: Day[] = [
  { name: "Sunday", enabled: false, ranges: [newTimeRange()] },
  { name: "Monday", enabled: false, ranges: [newTimeRange()] },
  { name: "Tuesday", enabled: false, ranges: [newTimeRange()] },
  { name: "Wednesday", enabled: true, ranges: [newTimeRange()] },
  { name: "Thursday", enabled: true, ranges: [newTimeRange()] },
  { name: "Friday", enabled: true, ranges: [newTimeRange()] },
  { name: "Saturday", enabled: false, ranges: [newTimeRange()] },
];

export default function AvailabilityPage() {
  const [days, setDays] = useState<Day[]>(initialDays);
  const [tab, setTab] = useState("you");
  const [dayToTurnOff, setDayToTurnOff] = useState<number | null>(null);

  function updateDay(index: number, updated: Day) {
    setDays((prev) => prev.map((day, i) => (i === index ? updated : day)));
  }

  function handleDayChange(index: number, updated: Day) {
    if (days[index].enabled && !updated.enabled) {
      setDayToTurnOff(index);
      return;
    }
    updateDay(index, updated);
  }

  function confirmTurnOff() {
    if (dayToTurnOff !== null) {
      updateDay(dayToTurnOff, { ...days[dayToTurnOff], enabled: false });
    }
    setDayToTurnOff(null);
  }

  return (
    <div className="p-8">
      <button className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-1">Availability</h1>
      <p className="text-sm">Sydney Time Zone</p>
      <p className="text-sm text-muted-foreground mb-4">
        26 Mar 2026 0:00 - 31 Dec 2026 0:00
      </p>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="you">You</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-8">
        <Card className="flex-1 max-w-2xl">
          <CardContent className="py-2">
            {days.map((day, index) => (
              <AvailabilityAdjuster
                key={day.name}
                day={day}
                onChange={(updated) => handleDayChange(index, updated)}
              />
            ))}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground max-w-xs">
          We recommend setting your availability before a campaign begins.
          Please resolve any ongoing appointments prior to altering
          availability.
        </p>
      </div>

      <OverridesSection />

      <ConfirmDialog
        open={dayToTurnOff !== null}
        onConfirm={confirmTurnOff}
        onCancel={() => setDayToTurnOff(null)}
      />
    </div>
  );
}
