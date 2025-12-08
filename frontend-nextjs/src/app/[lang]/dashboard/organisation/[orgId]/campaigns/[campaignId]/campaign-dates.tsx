import EditDetail from "@/app/[lang]/dashboard/organisation/[orgId]/campaigns/[campaignId]/edit-detail";
import { Button } from "@/components/ui/button";
import { dateToString } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useRef } from "react";
import type { CampaignUpdateKeys } from "./campaign-details";

interface CampaignDatesProps {
    starts_at: string;
    ends_at: string;
    editingMode: boolean;
    onUpdate: (data: string | Date | undefined, key: CampaignUpdateKeys) => void;
    isError: boolean;
    setIsError: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CampaignDates({ starts_at, ends_at, editingMode, onUpdate, isError, setIsError }: CampaignDatesProps) {
    const [range, setRange] = useState<DateRange>({
        from: new Date(starts_at),
        to: new Date(ends_at),
    });
    
    const rangeRef = useRef(range);
    rangeRef.current = range;

    if (editingMode) {
        const updateDateRange = (date: DateRange | null) => {
            if (date && date.from && date.to) {
                if (isError && setIsError) {
                    setIsError(false);
                }
                const newFrom = new Date(date.from);
                const newTo = new Date(date.to);
                
                const currentRange = rangeRef.current;
                if (currentRange.from) {
                    newFrom.setHours(
                        currentRange.from.getHours(),
                        currentRange.from.getMinutes(),
                    );
                }
                if (currentRange.to) {
                    newTo.setHours(
                        currentRange.to.getHours(),
                        currentRange.to.getMinutes(),
                    );
                }
                
                if (date.to !== currentRange.to) {
                    onUpdate(newTo, "endsAt");
                }
                if (date.from !== currentRange.from) {
                    onUpdate(newFrom, "startsAt");
                }
                
                setRange({
                    from: newFrom,
                    to: newTo,
                });
            }
        }

        const updateStartTime = (time: string) => {
            if (isError && setIsError) {
                setIsError(false);
            }
            const [hours, minutes] = time.split(":").map(Number);
            
            const currentRange = rangeRef.current;
            if (!currentRange.from) return;
            
            const newStart = new Date(currentRange.from);
            newStart.setHours(hours, minutes);
            
            onUpdate(newStart, "startsAt");
            
            setRange({
                ...currentRange,
                from: newStart,
            });
        }

        const updateEndTime = (time: string) => {
            if (isError && setIsError) {
                setIsError(false);
            }
            const [hours, minutes] = time.split(":").map(Number);
            
            const currentRange = rangeRef.current;
            if (!currentRange.to) return;
            
            const newEnd = new Date(currentRange.to);
            newEnd.setHours(hours, minutes);
            
            onUpdate(newEnd, "endsAt");
            
            setRange({
                ...currentRange,
                to: newEnd,
            });
        }

        return (
            <div className="w-fit">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="dates"
                            className={`justify-between w-auto ${isError ? "ring-2 ring-red-500" : ""}`}
                        >
                            {range?.from && range?.to
                                ? `${dateToString(range.from.toLocaleString())} - ${dateToString(range.to.toLocaleString())}`
                                : "Select dates"}
                            <ChevronDownIcon />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Card className="w-fit py-0!">
                            <CardContent className="px-0!">
                                <Calendar
                                    mode="range"
                                    required
                                    selected={range}
                                    captionLayout="dropdown"
                                    onSelect={updateDateRange}
                                />
                            </CardContent>
                            <CardFooter className="flex gap-2 border-t px-4 py-3! *:[div]:w-full">
                                <Input
                                    id="time-from"
                                    type="time"
                                    step="60"
                                    defaultValue={range?.from?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    onChange={(e) => updateStartTime(e.target.value)}
                                />
                                <span>-</span>
                                <Input
                                    id="time-to"
                                    type="time"
                                    step="60"
                                    defaultValue={range?.to?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    onChange={(e) => updateEndTime(e.target.value)}
                                />
                            </CardFooter>
                        </Card>
                    </PopoverContent>
                </Popover>
            </div>
        );
    }
    return (
        <p className="text-sm text-gray-500">{dateToString(starts_at)} - {dateToString(ends_at)}</p>
    );
}