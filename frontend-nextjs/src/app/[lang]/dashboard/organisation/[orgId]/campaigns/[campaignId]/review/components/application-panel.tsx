"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ApplicationDetails,
  ApplicationStatus,
  getApplicationRoleStatuses,
} from "@/models/application";
import { getCategoryRatingsByApplication } from "@/models/rating";
import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import ApplicationDetailsComponent from "../application-details";
import ApplicationRatingForm from "../application-rating-form";
import ApplicationDiscussionPanel from "../application-discussion-panel";
import { StarDisplay } from "@/components/application-review/star-display";

export function ApplicationPanel({
  app,
  index,
  total,
  campaignId,
  dict,
  ratedApplications,
  setRatedApplications,
  onDecision,
}: {
  app: ApplicationDetails;
  index: number;
  total: number;
  campaignId: string;
  dict: any;
  ratedApplications: Record<string, boolean>;
  setRatedApplications: (v: Record<string, boolean>) => void;
  onDecision: (appId: string, roleId: string, status: ApplicationStatus) => void;
}) {
  const [activeTab, setActiveTab] = useState<"application" | "review">("application");
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const sortedRoles = [...app.applied_roles].sort((a, b) => a.preference - b.preference);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    sortedRoles[0]?.campaign_role_id ?? null,
  );

  const { data: allRatings } = useQuery({
    queryKey: [`${app.id}-application-rating`],
    queryFn: () => getCategoryRatingsByApplication(app.id),
  });

  const { data: roleStatuses } = useQuery({
    queryKey: [`${app.id}-application-role-statuses`],
    queryFn: () => getApplicationRoleStatuses(app.id),
  });

  const avgRating = useMemo(() => {
    if (!allRatings || allRatings.length === 0) return 0;
    const values = allRatings.flatMap((r) =>
      r.category_ratings.filter((cr) => cr.rating !== null).map((cr) => cr.rating as number),
    );
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }, [allRatings]);

  return (
    <div className="flex flex-col h-full">
      {/* Subheader */}
      <div className="px-6 pt-4 pb-0 border-b shrink-0">
        <p className="text-xs text-muted-foreground mb-1">
          Application #{index + 1} of {total}
        </p>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">{app.user.name}</h2>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Avg.</span>
              <StarDisplay value={avgRating} />
            </div>
            <Select
              value={
                roleStatuses?.find((rs) => rs.campaign_role_id === selectedRoleId)?.status ??
                "Pending"
              }
              onValueChange={(v) =>
                onDecision(app.id, selectedRoleId as string, v as ApplicationStatus)
              }
            >
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue placeholder="Decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Successful">Offer</SelectItem>
                <SelectItem value="Rejected">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Role chips */}
        <div className="flex items-center gap-3 mt-3 pb-3 flex-wrap">
          {sortedRoles.map((role, i) => (
            <div key={role.campaign_role_id} className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{i + 1}.</span>
              <button
                type="button"
                onClick={() => setSelectedRoleId(role.campaign_role_id)}
                className={cn(
                  "px-3 py-0.5 rounded-full text-sm font-medium transition-colors",
                  selectedRoleId === role.campaign_role_id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-muted",
                )}
              >
                {role.role_name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between border-b px-6 shrink-0">
        <div className="flex">
          {(["application", "review"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-10 px-1 mr-4 text-sm border-b-2 transition-colors",
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "application" ? "Application" : "Review"}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDiscussionOpen((o) => !o)}
          className={cn(
            "gap-1.5 transition-colors",
            discussionOpen ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Discussion
        </Button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "application" && (
          <ApplicationDetailsComponent
            applicationId={app.id}
            campaignId={campaignId}
            dict={dict}
            selectedRoleId={selectedRoleId}
          />
        )}
        {activeTab === "review" && (
          <ScrollArea className="h-full">
            <div className="p-6">
              <ApplicationRatingForm
                applicationId={app.id}
                campaignId={campaignId}
                dict={dict}
                ratedApplications={ratedApplications}
                setRatedApplications={setRatedApplications}
              />
            </div>
          </ScrollArea>
        )}
      </div>

      {discussionOpen && (
        <ApplicationDiscussionPanel
          applicationId={app.id}
          onClose={() => setDiscussionOpen(false)}
        />
      )}
    </div>
  );
}
