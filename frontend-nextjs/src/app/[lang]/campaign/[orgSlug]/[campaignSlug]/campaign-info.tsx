"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaignBySlugs, getCampaignAttachments, getCampaignRoles } from "@/models/campaign";

import { Calendar, ExternalLink, Mail, FileText, Video, Clock, Users, Briefcase, Info, Phone, Files } from "lucide-react";
import { dateToString } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";

export default function CampaignInfo({ orgSlug, campaignSlug, dict }: { orgSlug: string, campaignSlug: string, dict: any, lang: string }) {
    const params = useParams();
    const lang = params.lang
    const { data: campaignData } = useQuery({
        queryKey: [`${orgSlug}-${campaignSlug}-campaign-details`],
        queryFn: () => getCampaignBySlugs(orgSlug, campaignSlug)
    });

    if (!campaignData) return notFound();

    const { data: roleData } = useQuery({
        queryKey: [`${campaignData?.id}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignData!.id.toString())
    });

    const { data: attachmentsData } = useQuery({
        queryKey: [`${campaignData?.id}-campaign-attachments`],
        queryFn: () => getCampaignAttachments(campaignData!.id.toString())
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Hero Section */}
            <div className="relative h-[280px] overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 sm:h-[340px] lg:h-[400px]">
                <img
                    src={campaignData.cover_image || '/placeholder.svg'}
                    alt="Campaign cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>

                <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-4 pb-8 sm:px-6 sm:pb-12">
                    <h1 className="mb-3 break-words text-3xl font-bold leading-tight text-white drop-shadow-lg sm:mb-4 sm:text-4xl lg:text-5xl">
                        {campaignData.name}
                    </h1>
                    {campaignData.organisation_name && (
                        <p className="text-base text-white/90 drop-shadow sm:text-xl">
                            {campaignData.organisation_name}
                        </p>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
                {/* Flexbox container for main layout */}
                <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                    {/* Left Column */}
                    <div className="order-2 lg:order-1 lg:w-2/3">
                        {/* Main Content Container with unified card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            {/* Campaign Description */}
                            {campaignData.description && (
                                <div className="p-4 sm:p-6">
                                    <h2 className="mb-4 flex items-center gap-1 text-xl font-semibold text-gray-900 sm:text-2xl">
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
                                <div className="p-4 sm:p-6">
                                    <h3 className="mb-4 flex items-center gap-1 text-lg font-semibold sm:text-xl">
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
                                <div className="p-4 sm:p-6">
                                    <h3 className="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-900 sm:text-xl">
                                        <Video className="w-5 h-5" />
                                        {dict.common.interview_details}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                                        <div className="col-span-1 flex flex-col justify-start gap-3 sm:col-span-2">
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
                            <div className="p-4 sm:p-6">
                                <h3 className="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-900 sm:text-xl">
                                    <Briefcase className="w-5 h-5" />
                                    {dict.common.available_roles}
                                </h3>
                                <div className="space-y-4">
                                    {roleData?.map(role => (
                                        <div
                                            key={role.id}
                                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <h4 className="text-base font-semibold text-gray-900 sm:text-lg">
                                                    {role.name}
                                                </h4>
                                                <span className="flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-medium">
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

                            {/* Attachments */}
                            <div className="p-4 sm:p-6">
                                <h3 className="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-900 sm:text-xl">
                                    <Files className="w-5 h-5" />
                                    {dict.common.attachments}
                                </h3>
                                <div>
                                    {attachmentsData && attachmentsData.length > 0 && attachmentsData.map(attachment => (
                                        <div key={attachment.id} className="mb-2 last:mb-0">
                                            <a
                                                href={attachment.download_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-start gap-2 break-all text-sm text-blue-600 underline hover:text-blue-800 sm:text-base"
                                            >
                                                <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                                                {attachment.file_name} ({(attachment.file_size / 1024).toFixed(2)} KB)
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="border-gray-200" />

                            {/* Timeline Section */}
                            <div className="p-4 sm:p-6">
                                <h3 className="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-900 sm:text-xl">
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
                            <div className="p-4 pb-6 sm:p-6">
                                <h3 className="mb-4 flex items-center gap-1 text-lg font-semibold text-gray-900 sm:text-xl">
                                    <Phone className="w-5 h-5" />
                                    {dict.common.contact_information}
                                </h3>

                                <div className="space-y-4">
                                    {campaignData.website_url && (
                                        <div className="flex items-start gap-3">
                                            <ExternalLink className="h-5 w-5 shrink-0 text-gray-400" />
                                            <div>
                                                <a
                                                    href={campaignData.website_url}
                                                    className="break-all text-sm text-primary hover:underline"
                                                >
                                                    {dict.common.visit_website}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {campaignData.contact_email && (
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-5 w-5 shrink-0 text-gray-400" />
                                            <div>
                                                <a
                                                    href={`mailto:${campaignData.contact_email}?subject=[Chaos Application Query] ${campaignData.organisation_name} ${campaignData.name}`}
                                                    className="break-all text-sm text-primary hover:underline"
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
                    <div className="order-1 lg:order-2 lg:w-1/3">
                        <div className="lg:sticky lg:top-6">
                            {/* Apply Card */}
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
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
                                <Link href={`/${lang}/campaign/apply/${campaignData.id}`}>
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