"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCampaign } from "@/models/campaign";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface InterviewTimelineConfig {
  startsAt: string;
  endsAt: string;
}

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" });

const formatTimeLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatDateOnly = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });

const getDaysInRange = (start: Date, end: Date) => {
  const days: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const final = new Date(end);
  final.setHours(0, 0, 0, 0);

  while (current <= final) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

export default function InterviewTimeline({ campaignId, dict }: { campaignId: string; dict: any }) {
  const [isClient, setIsClient] = useState(false);
  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const timeline = useMemo(() => {
    if (!campaign?.interview_period_starts_at || !campaign?.interview_period_ends_at) return null;
    const startsAt = new Date(campaign.interview_period_starts_at);
    const endsAt = new Date(campaign.interview_period_ends_at);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return null;
    }
    return { startsAt, endsAt };
  }, [campaign]);

  const headerDates = isClient && timeline
    ? `${formatDateOnly(timeline.startsAt)} - ${formatDateOnly(timeline.endsAt)}`
    : "";

  const headerTimes = isClient && timeline
    ? `${formatTime(timeline.startsAt)} - ${formatTime(timeline.endsAt)}`
    : "";

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}`}>
            <div className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              {dict.common.back}
            </div>
          </Link>
          <h1 className="text-2xl font-bold">Interview timeline</h1>
          <h2 className="text-lg font-medium">{campaign?.name}</h2>
          {headerDates && headerTimes && (
            <p className="text-sm text-gray-500">{headerDates} | {headerTimes}</p>
          )}
        </div>
      </div>
      {(!isClient || !timeline) && <div className="min-h-[200px]" />}
      {isClient && timeline && (() => {
        const days = getDaysInRange(timeline.startsAt, timeline.endsAt);
        const startMinutes = timeline.startsAt.getHours() * 60 + timeline.startsAt.getMinutes();
        const endMinutes = timeline.endsAt.getHours() * 60 + timeline.endsAt.getMinutes();
        const timeSlots: number[] = [];
        for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
          timeSlots.push(minutes);
        }

        return (
          <div className="overflow-x-auto">
            <div
              className="grid border border-gray-200 rounded-md overflow-hidden min-w-max"
              style={{
                gridTemplateColumns: `120px repeat(${days.length}, minmax(140px, 1fr))`,
              }}
            >
              <div className="bg-gray-50 border-b border-gray-200 p-2 text-sm font-medium" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="bg-gray-50 border-b border-l border-gray-200 p-2 text-sm font-medium text-center"
                >
                  {formatDayLabel(day)}
                </div>
              ))}
              {timeSlots.map((minutes) => (
                <div key={`row-${minutes}`} className="contents">
                  <div className="border-t border-gray-200 px-2 text-sm text-gray-600 flex items-center min-h-[32px]">
                    {formatTimeLabel(minutes)}
                  </div>
                  {days.map((day) => (
                    <div
                      key={`${day.toISOString()}-${minutes}`}
                      className="border-t border-l border-gray-200 min-h-[32px]"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
