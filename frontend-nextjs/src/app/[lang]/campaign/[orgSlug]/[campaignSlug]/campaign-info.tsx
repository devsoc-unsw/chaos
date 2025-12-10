"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaignBySlugs, getCampaignRoles } from "@/models/campaign";

import { Calendar, ExternalLink, Mail, FileText, Video, Clock, Users, Briefcase, Info, Phone } from "lucide-react";
import { dateToString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function CampaignInfo({ orgSlug, campaignSlug, dict }: { orgSlug: string, campaignSlug: string, dict: any }) {
    const { data: campaignData } = useQuery({
        queryKey: [`${orgSlug}-${campaignSlug}-campaign-details`],
        queryFn: () => getCampaignBySlugs(orgSlug, campaignSlug)
    });

    if (!campaignData) return notFound();

    const { data: roleData } = useQuery({
        queryKey: [`${campaignData?.id}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignData!.id)
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Hero Section */}
            <div className="relative h-[400px] bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                <img
                    src={campaignData.cover_image || '/placeholder.svg'}
                    alt="Campaign cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>

                <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-end pb-12">
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
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {/* Campaign Description */}
                            {campaignData.description && (
                                <div className="p-6">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-1">
                                        <Info className="w-6 h-6" />
                                        {dict.common.about}
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {campaignData.description}
                                    </p>
                                </div>
                            )}

                            {/* Divider */}
                            {campaignData.description && campaignData.application_requirements && (
                                <hr className="border-gray-200" />
                            )}

                            {/* Application Requirements */}
                            {campaignData.application_requirements && (
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-1">
                                        <FileText className="w-5 h-5" />
                                        {dict.common.application_requirements}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {campaignData.application_requirements}
                                    </p>
                                </div>
                            )}

                            {/* Divider */}
                            {(campaignData.application_requirements || campaignData.description) && campaignData.interview_format && (
                                <hr className="border-gray-200" />
                            )}

                            {/* Interview Information */}
                            {campaignData.interview_format && (
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-1">
                                        <Video className="w-5 h-5" />
                                        {dict.common.interview_details}
                                    </h3>
                                    <div className="space-y-3 grid grid-cols-3">
                                        <div className="flex flex-col justify-start gap-3">
                                            <span className="text-sm font-medium text-gray-900 min-w-24">
                                                {dict.common.interview_format}
                                            </span>
                                            {campaignData.interview_period_starts_at && campaignData.interview_period_ends_at && (
                                                <span className="text-sm font-medium text-gray-900 min-w-24">
                                                    {dict.common.interview_period}
                                                </span>
                                            )}

                                        </div>
                                        <div className="flex flex-col justify-start gap-3 col-span-2">
                                            <span className="text-sm text-gray-600 capitalize">
                                                {campaignData.interview_format}
                                            </span>
                                            {campaignData.interview_period_starts_at && campaignData.interview_period_ends_at && (
                                                <span className="text-sm text-gray-600">
                                                    {dateToString(campaignData.interview_period_starts_at.toString())} - {dateToString(campaignData.interview_period_ends_at.toString())}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            <hr className="border-gray-200" />

                            {/* Available Roles */}
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-1">
                                    <Briefcase className="w-5 h-5" />
                                    {dict.common.available_roles}
                                </h3>
                                <div className="space-y-4">
                                    {roleData?.map(role => (
                                        <div
                                            key={role.id}
                                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex justify-between mb-2">
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    {role.name}
                                                </h4>
                                                <span className="flex gap-1 items-center px-3 py-1 text-sm font-medium rounded-full">
                                                    <Users className="w-5 h-5" /> {role.max_available}
                                                </span>
                                            </div>
                                            {role.description && (
                                                <p className="text-sm text-gray-600">
                                                    {role.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                    {roleData?.length === 0 && (
                                        <p className="text-sm text-gray-600">
                                            No roles available for this campaign.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="border-gray-200" />

                            {/* Timeline Section */}
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-1">
                                    <Clock className="w-5 h-5" />
                                    {dict.common.recruitment_timeline}
                                </h3>

                                <div>
                                    {/* Applications Open */}
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                            <div className="w-px h-full bg-gray-200"></div>
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm font-medium text-gray-900">
                                                {dict.common.applications_open}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {dateToString(campaignData.starts_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Applications Close */}
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                            <div className="w-px h-full bg-gray-200"></div>
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm font-medium text-gray-900">
                                                {dict.common.applications_close}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {dateToString(campaignData.ends_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Interviews */}
                                    {campaignData.interview_period_starts_at && campaignData.interview_period_ends_at && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                <div className="w-px h-full bg-gray-200"></div>
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {dict.common.interviews}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {dateToString(campaignData.interview_period_starts_at.toString())} - {dateToString(campaignData.interview_period_ends_at.toString())}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Results Announced */}
                                    {campaignData.outcomes_released_at && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {dict.common.results_announced}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {dateToString(campaignData.outcomes_released_at.toString())}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="border-gray-200" />

                            {/* Contact Information Section */}
                            <div className="pt-6 ml-6 mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-1">
                                    <Phone className="w-5 h-5" />
                                    {dict.common.contact_information}
                                </h3>

                                <div className="space-y-4">
                                    {campaignData.website_url && (
                                        <div className="flex items-center gap-3">
                                            <ExternalLink className="text-gray-400 w-5 h-5 flex-shrink-0" />
                                            <div>
                                                <a
                                                    href={campaignData.website_url}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    {dict.common.visit_website}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {campaignData.contact_email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="text-gray-400 w-5 h-5 flex-shrink-0" />
                                            <div>
                                                <a
                                                    href={`mailto:${campaignData.contact_email}?subject=[Chaos Application Query] ${campaignData.organisation_name} ${campaignData.name}`}
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
                            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {dict.common.apply_now}
                                </h3>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="text-gray-400 mt-0.5 w-5 h-5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {dict.common.application_deadline}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {dateToString(campaignData.ends_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {campaignData.outcomes_released_at && (
                                        <div className="flex items-start gap-3">
                                            <Calendar className="text-gray-400 mt-0.5 w-5 h-5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {dict.common.results_announced}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {dateToString(campaignData.outcomes_released_at.toString())}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* TODO: If user is logged in, check for existing application and change text to "Continue Application" */}
                                <Link href={`/campaign/${campaignData.id}/apply`}>
                                    <Button className="w-full cursor-pointer mb-2" size="lg">
                                        {dict.common.apply}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}