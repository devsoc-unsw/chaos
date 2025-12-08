"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaignDetails } from "@/models/campaign";
import { useParams } from "next/navigation";
import { CalendarIcon, UsersIcon } from "lucide-react";
import { dateToString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Mail } from "lucide-react";

export default function CampaignPage() {
    const { orgSlug, campaignSlug } = useParams<{
        lang: string;
        orgSlug: string;
        campaignSlug: string;
    }>();

    const { data, error, isLoading } = useQuery({
        queryKey: [`${orgSlug}-${campaignSlug}-recruitment-page`],
        queryFn: () => getCampaignDetails(orgSlug, campaignSlug),
    });

    if (!orgSlug || !campaignSlug) return <div>Waiting for params…</div>;
    if (isLoading) return <div>Loading...</div>
    if (error) return <pre>{String(error)}</pre>
    if (!data) {
        return <div>Where's the data!</div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Hero Section with Cover Image */}
            <div className="relative h-[400px] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                {data.cover_image && (
                    <img 
                        src={data.cover_image} 
                        alt="Campaign cover"
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                
                <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-end pb-12">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-primary/20 text-primary dark:text-primary-foreground rounded-full text-sm font-medium backdrop-blur-sm">
                            OPEN
                        </span>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        {data.name || "Campaign Recruitment"}
                    </h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Organization Info */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                {data.organisation_name || "Development Society"}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {data.description || "Join the leading tech society at UNSW! We're looking for passionate individuals to help run events, workshops, and hackathons."}
                            </p>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                                About This Campaign
                            </h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {data.description}
                                </p>
                            </div>
                        </div>

                        {/* Available Roles - Placeholder */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                                Available Roles
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 italic">
                                Role details will be displayed here
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Apply Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 sticky top-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Apply Now
                            </h3>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <CalendarIcon className="text-slate-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            Application Deadline
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">
                                            {dateToString(data.ends_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full" size="lg">
                                Apply for this Campaign
                            </Button>
                        </div>

                        {/* Timeline Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Recruitment Timeline
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        <div className="w-px h-full bg-slate-200 dark:bg-slate-700"></div>
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            Applications Open
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {dateToString(data.starts_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                        <div className="w-px h-full bg-slate-200 dark:bg-slate-700"></div>
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            Applications Close
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {dateToString(data.ends_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            Interviews
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            TBA
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Contact Information
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <MapPin className="text-slate-400 flex-shrink-0" />
                                    <span className="text-slate-600 dark:text-slate-300">
                                        UNSW Sydney, Kensington Campus
                                    </span>
                                </div>
                                
                                <a 
                                    href="https://devsoc.com" 
                                    className="flex items-center gap-3 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="flex-shrink-0" />
                                    <span>devsoc.com</span>
                                </a>
                                
                                <a 
                                    href="mailto:recruitment@devsoc.com"
                                    className="flex items-center gap-3 text-sm text-primary hover:underline"
                                >
                                    <Mail className="flex-shrink-0" />
                                    <span>recruitment@devsoc.com</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}