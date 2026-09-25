"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import {
  AvailabilityAdjuster,
  newTimeRange,
  type Day,
} from "./components/availability-adjuster";

const initialDays: Day[] = [
  { name: "Sunday", enabled: false, ranges: [newTimeRange()] },
  { name: "Monday", enabled: false, ranges: [newTimeRange()] },
  { name: "Tuesday", enabled: false, ranges: [newTimeRange()] },
  { name: "Wednesday", enabled: true, ranges: [newTimeRange()] },
  { name: "Thursday", enabled: true, ranges: [newTimeRange()] },
  { name: "Friday", enabled: true, ranges: [newTimeRange()] },
  { name: "Saturday", enabled: false, ranges: [newTimeRange()] },
];

type Override = {
  id: number;
  date: string;
  start: string;
  end: string;
};

const initialOverrides: Override[] = [
  { id: 1, date: "31 July 2026", start: "9:00am", end: "9:00am" },
];

export default function AvailabilityPage() {
  const [days, setDays] = useState<Day[]>(initialDays);
  const [tab, setTab] = useState("you");
  const [overrides, setOverrides] = useState<Override[]>(initialOverrides);

  function updateDay(index: number, updated: Day) {
    setDays((prev) => prev.map((day, i) => (i === index ? updated : day)));
  }

  function updateOverride(id: number, field: keyof Override, value: string) {
    setOverrides((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  }

  function removeOverride(id: number) {
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  }

  function addOverride() {
    setOverrides((prev) => [
      ...prev,
      { id: Date.now(), date: "", start: "", end: "" },
    ]);
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
                onChange={(updated) => updateDay(index, updated)}
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

      <h2 className="text-xl font-bold mt-8 mb-1">Overrides</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Remove a single time slot from your regular availability.
      </p>

      <Card className="max-w-2xl">
        <CardContent className="py-2">
          {overrides.map((o) => (
            <div key={o.id} className="flex items-center gap-4 py-4 border-b last:border-b-0">
              <button className="w-40 flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                {o.date || "dd mm yyyy"}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              <Input
                value={o.start}
                onChange={(e) => updateOverride(o.id, "start", e.target.value)}
                placeholder="-:--"
                className="w-28"
              />
              <span>-</span>
              <Input
                value={o.end}
                onChange={(e) => updateOverride(o.id, "end", e.target.value)}
                placeholder="-:--"
                className="w-28"
              />

              <Button variant="ghost" size="icon" onClick={() => removeOverride(o.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex items-center gap-4 py-4">
            <button className="w-40 flex items-center justify-between border rounded-md px-3 py-2 text-sm text-muted-foreground">
              dd mm yyyy
              <ChevronDown className="h-4 w-4" />
            </button>
            <Input disabled placeholder="-:--" className="w-28" />
            <span>-</span>
            <Input disabled placeholder="-:--" className="w-28" />
            <Button variant="ghost" size="icon" onClick={addOverride}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
