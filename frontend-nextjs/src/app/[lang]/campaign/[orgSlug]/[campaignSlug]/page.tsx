"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignDetails, getCampaignRoles } from "@/models/campaign";
import { useParams } from "next/navigation";
import { Calendar, Users, MapPin, ExternalLink, Mail, FileText, Video, Clock } from "lucide-react";
import { dateToString } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CampaignPage() {
    const { orgSlug, campaignSlug } = useParams<{
        lang: string;
        orgSlug: string;
        campaignSlug: string;
    }>();

    const { data: campaignData, isLoading: campaignLoading } = useQuery({
        queryKey: [`${orgSlug}-${campaignSlug}-recruitment-page`],
        queryFn: () => getCampaignDetails(orgSlug, campaignSlug)
    });

    const { data: roleData } = useQuery({
        queryKey: [`campaign-roles`, campaignData?.id],
        queryFn: () => getCampaignRoles(campaignData!.id)
    });

    if (campaignLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading campaign details...</p>
                </div>
            </div>
        );
    }

    if (!campaignData) return <div>Campaign not found</div>
    if (!roleData) return <div>Roles not found</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Hero Section */}
            <div className="relative h-[400px] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                <img 
                    src={campaignData.cover_image || '/placeholder.svg'}
                    alt="Campaign cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                
                <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-end pb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-primary/20 text-primary dark:text-primary-foreground rounded-full text-sm font-medium backdrop-blur-sm">
                            {campaignData.published ? 'OPEN' : 'DRAFT'}
                        </span>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        {campaignData.name}
                    </h1>
                    {campaignData.organisation_name && (
                        <p className="text-xl text-white/90 drop-shadow">
                            {campaignData.organisation_name}
                        </p>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Flexbox container for main layout */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column */}
                    <div className="lg:w-2/3">
                        {/* Main Content Container with unified card */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            {/* Campaign Description */}
                            {campaignData.description && (
                                <div className="p-6">
                                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                                        About This Campaign
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {campaignData.description}
                                    </p>
                                </div>
                            )}

                            {/* Divider */}
                            {campaignData.description && campaignData.application_requirements && (
                                <hr className="border-slate-200 dark:border-slate-700" />
                            )}

                            {/* Application Requirements */}
                            {campaignData.application_requirements && (
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                        <FileText className="w-5 h-5" />
                                        Application Requirements
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {campaignData.application_requirements}
                                    </p>
                                </div>
                            )}

                            {/* Divider */}
                            {(campaignData.application_requirements || campaignData.description) && campaignData.interview_format && (
                                <hr className="border-slate-200 dark:border-slate-700" />
                            )}

                            {/* Interview Information */}
                            {campaignData.interview_format && (
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                        <Video className="w-5 h-5" />
                                        Interview Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white min-w-24">
                                                Format:
                                            </span>
                                            <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                                                {campaignData.interview_format}
                                            </span>
                                        </div>
                                        {campaignData.interview_period_starts_at && campaignData.interview_period_ends_at && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white min-w-24">
                                                    Period:
                                                </span>
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    {dateToString(campaignData.interview_period_starts_at.toString())} - {dateToString(campaignData.interview_period_ends_at.toString())}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            <hr className="border-slate-200 dark:border-slate-700" />

                            {/* Available Roles */}
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                                    Available Roles
                                </h3>
                                <div className="space-y-4">
                                    {roleData.map(role => (
                                        <div 
                                            key={role.id} 
                                            className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="flex justify-between mb-2">
                                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    {role.name}
                                                </h4>
                                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm font-medium rounded-full">
                                                    {role.max_available} {role.max_available === 1 ? 'position' : 'positions'}
                                                </span>
                                            </div>
                                            {role.description && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {role.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="border-slate-200 dark:border-slate-700" />

                            {/* Timeline Section */}
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                    <Clock className="w-5 h-5" />
                                    Recruitment Timeline
                                </h3>
                                
                                <div className="space-y-4">
                                    {/* Applications Open */}
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
                                                {dateToString(campaignData.starts_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Applications Close */}
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
                                                {dateToString(campaignData.ends_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Interviews */}
                                    {campaignData.interview_period_starts_at && campaignData.interview_period_ends_at && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                                <div className="w-px h-full bg-slate-200 dark:bg-slate-700"></div>
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    Interviews
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {dateToString(campaignData.interview_period_starts_at.toString())} - {dateToString(campaignData.interview_period_ends_at.toString())}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Results Announced */}
                                    {campaignData.outcomes_released_at && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    Results Announced
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {dateToString(campaignData.outcomes_released_at.toString())}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="border-slate-200 dark:border-slate-700" />

                            {/* Contact Information Section */}
                            <div className="pt-6 ml-6 mb-6">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                    Contact Information
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="text-slate-400 mt-0.5 w-4 h-4 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                                                Location
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                UNSW Sydney, Kensington Campus
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {campaignData.website_url && (
                                        <div className="flex items-center gap-3">
                                            <ExternalLink className="text-slate-400 w-4 h-4 flex-shrink-0" />
                                            <div>
                                                <a 
                                                    href={campaignData.website_url}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    Visit Website
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {campaignData.contact_email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="text-slate-400 w-4 h-4 flex-shrink-0" />
                                            <div>
                                                <a 
                                                    href={`mailto:${campaignData.contact_email}`}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    {campaignData.contact_email}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:w-1/3">
                        <div className="sticky top-6">
                            {/* Apply Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                    Apply Now
                                </h3>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="text-slate-400 mt-0.5 w-5 h-5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                Application Deadline
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                {dateToString(campaignData.ends_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {campaignData.outcomes_released_at && (
                                        <div className="flex items-start gap-3">
                                            <Calendar className="text-slate-400 mt-0.5 w-5 h-5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    Results Announced
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    {dateToString(campaignData.outcomes_released_at.toString())}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button className="w-full cursor-pointer mb-2" size="lg">
                                    APPLY
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}