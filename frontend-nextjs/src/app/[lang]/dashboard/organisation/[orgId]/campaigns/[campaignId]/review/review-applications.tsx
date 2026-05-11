"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampaign, getCampaignApplications } from "@/models/campaign";
import { updateApplicationPrivateStatus, ApplicationDetails, ApplicationStatus } from "@/models/application";
import { getCategoryRatingsByApplication } from "@/models/rating";
import { dateToString, cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { ArrowLeft, Trash2, Play, MessageSquare, Form } from "lucide-react";
import Link from "next/link";
import ApplicationDetailsComponent from "./application-details";
import ApplicationRatingForm from "./application-rating-form";
import ApplicationDiscussionPanel from "./application-discussion-panel";

function privateStatusLabel(status: ApplicationStatus): string {
    if (status === "Successful") return "Offer";
    if (status === "Rejected") return "Reject";
    return "Pending";
}

export default function ReviewCampaignApplications({
    campaignId,
    orgId,
    dict,
}: {
    campaignId: string;
    orgId: string;
    dict: any;
}) {
    const queryClient = useQueryClient();
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [ratedApplications, setRatedApplications] = useState<Record<string, boolean>>({});

    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: applications } = useQuery({
        queryKey: [`${campaignId}-campaign-applications`],
        queryFn: () => getCampaignApplications(campaignId),
    });

    useEffect(() => {
        if (!applications) return;
        setRatedApplications((prev) => {
            const base = Object.fromEntries(applications.map((a) => [a.id, a.current_user_rated]));
            const locallyRated = Object.fromEntries(Object.entries(prev).filter(([, v]) => v));
            return { ...base, ...locallyRated };
        });
    }, [applications]);

    const upNext = (applications ?? []).filter((a) => !ratedApplications[a.id]);
    const reviewed = (applications ?? []).filter((a) => ratedApplications[a.id]);

    const selectedApp = applications?.find((a) => a.id === selectedAppId);
    const selectedIndex = applications?.findIndex((a) => a.id === selectedAppId) ?? -1;
    const totalCount = applications?.length ?? 0;

    const handleNext = () => {
        if (!applications || applications.length === 0) return;
        const nextIndex = selectedIndex === -1 ? 0 : (selectedIndex + 1) % applications.length;
        setSelectedAppId(applications[nextIndex].id);
    };

    const handleDecision = async (appId: string, status: ApplicationStatus) => {
        await updateApplicationPrivateStatus(appId, status);
        await queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-applications`] });
    };

    return (
        <div className="flex flex-col gap-3 h-[calc(100vh-4rem)]">
            {/* Page header */}
            <div className="flex justify-between items-start shrink-0">
                <div>
                    <Link
                        href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {dict.common.back}
                    </Link>
                    <h1 className="text-2xl font-bold">
                        {dict.dashboard.campaigns.review_applications}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{campaign?.name}</span>
                        <span>
                            {dateToString(campaign?.starts_at ?? "")} –{" "}
                            {dateToString(campaign?.ends_at ?? "")}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleNext}>
                        <Play className="w-3 h-3 mr-1 fill-current" />
                        Next
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 rounded-lg border overflow-hidden mb-4">
                {/* Sidebar */}
                <div className="w-52 shrink-0 border-r flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1">
                        {upNext.length > 0 && (
                            <div>
                                <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">
                                    Up Next ({upNext.length}):
                                </p>
                                {upNext.map((app) => (
                                    <SidebarItem
                                        key={app.id}
                                        app={app}
                                        selected={selectedAppId === app.id}
                                        statusLabel={privateStatusLabel(app.private_status)}
                                        onClick={() => setSelectedAppId(app.id)}
                                    />
                                ))}
                            </div>
                        )}
                        {reviewed.length > 0 && (
                            <div>
                                <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">
                                    Reviewed ({reviewed.length}):
                                </p>
                                {reviewed.map((app) => (
                                    <SidebarItem
                                        key={app.id}
                                        app={app}
                                        selected={selectedAppId === app.id}
                                        statusLabel={privateStatusLabel(app.private_status)}
                                        onClick={() => setSelectedAppId(app.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Main panel */}
                <div className="flex-1 min-w-0 overflow-hidden">
                    {selectedApp ? (
                        <ApplicationPanel
                            key={selectedApp.id}
                            app={selectedApp}
                            index={selectedIndex}
                            total={totalCount}
                            campaignId={campaignId}
                            dict={dict}
                            ratedApplications={ratedApplications}
                            setRatedApplications={setRatedApplications}
                            onDecision={handleDecision}
                        />
                    ) : (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Form />
                                </EmptyMedia>
                                <EmptyTitle>
                                    {dict.dashboard.campaigns.application_review_page.no_application_selected}
                                </EmptyTitle>
                                <EmptyDescription>
                                    {dict.dashboard.campaigns.application_review_page.click_on_application_to_view}
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    )}
                </div>
            </div>
        </div>
    );
}

function SidebarItem({
    app,
    selected,
    statusLabel,
    onClick,
}: {
    app: ApplicationDetails;
    selected: boolean;
    statusLabel: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full flex items-start gap-2 px-3 py-2 border-b text-left hover:bg-muted transition-colors",
                selected && "bg-muted",
            )}
        >
            <div className={cn(
                "w-5 h-5 rounded-sm shrink-0 mt-0.5",
                app.private_status === "Rejected" && "bg-red-500",
                app.private_status === "Successful" && "bg-emerald-500",
                app.private_status === "Pending" && "bg-yellow-400",
            )} />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{app.user.name}</p>
                <p className="text-xs text-muted-foreground">
                    {app.applied_roles.length > 0
                        ? app.applied_roles.map((r) => r.role_name).join(", ")
                        : statusLabel}
                </p>
            </div>
        </button>
    );
}

function ApplicationPanel({
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
    onDecision: (appId: string, status: ApplicationStatus) => void;
}) {
    const [activeTab, setActiveTab] = useState<"application" | "review">("application");
    const [discussionOpen, setDiscussionOpen] = useState(false);
    const sortedRoles = [...app.applied_roles].sort((a, b) => a.preference - b.preference);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
        sortedRoles[0]?.campaign_role_id ?? null
    );

    const { data: allRatings } = useQuery({
        queryKey: [`${app.id}-application-rating`],
        queryFn: () => getCategoryRatingsByApplication(app.id),
    });

    const avgRating = useMemo(() => {
        if (!allRatings || allRatings.length === 0) return 0;
        const values = allRatings.flatMap((r) =>
            r.category_ratings.filter((cr) => cr.rating !== null).map((cr) => cr.rating as number)
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
                            value={app.private_status}
                            onValueChange={(v) => onDecision(app.id, v as ApplicationStatus)}
                        >
                            <SelectTrigger className="h-8 w-32 text-sm">
                                <SelectValue placeholder="Decision" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
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
                            <span className="text-xs text-muted-foreground">{i + 1}.</span>
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

function StarDisplay({ value }: { value: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={cn(
                        "w-4 h-4",
                        star <= value
                            ? "text-yellow-400 fill-yellow-400"
                            : "fill-none text-muted-foreground",
                    )}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                </svg>
            ))}
        </div>
    );
}
