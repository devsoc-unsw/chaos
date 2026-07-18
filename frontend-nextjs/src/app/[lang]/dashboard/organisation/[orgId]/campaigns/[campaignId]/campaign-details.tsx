"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles, getCampaignAttachments, publishCampaign, getCampaignApplications } from "@/models/campaign";
import { Button } from "@/components/ui/button";
import { Copy, SquarePen, Trash, FormIcon, FileText, Menu, Play, Link as LinkIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn, dateToString } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link";
import { getOrganisationUserRole } from "@/models/organisation";
import { useEffect, useMemo, useState } from "react";
import { remark } from "remark";
import html from "remark-html";
import CopyButton from "@/components/copy-button";
import { PublishCampaignDialog } from "./publish-campaign-dialog";
import { getCurrentUser } from "@/lib/auth";
import { getCampaignRoleStatuses } from "@/models/application";
import { getOffersByCampaign } from "@/models/offer";

interface RolePipeline {
  applications: number;
  assessment: number;
  offer: number;
  hired: number;
}

const EMPTY_PIPELINE: RolePipeline = {
  applications: 0,
  assessment: 0,
  offer: 0,
  hired: 0,
};

export default function CampaignDetails({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
  const { data: campaign, refetch: refetchCampaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  const { data: roles } = useQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () => getCampaignRoles(campaignId),
  });

  const { data: userRole } = useQuery({
    queryKey: [`${orgId}-organisation-user-role`],
    queryFn: () => getOrganisationUserRole(orgId),
  });

  const { data: attachments } = useQuery({
    queryKey: [`${campaignId}-attachments`],
    queryFn: () => getCampaignAttachments(campaignId),
    retry: false,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => getCurrentUser(),
  });

  const { data: applications } = useQuery({
    queryKey: [`${campaignId}-applications`],
    queryFn: () => getCampaignApplications(campaignId),
  });

  const { data: roleStatuses } = useQuery({
    queryKey: [`${campaignId}-role-statuses`],
    queryFn: () => getCampaignRoleStatuses(campaignId),
  });

  const { data: offers } = useQuery({
    queryKey: [`${campaignId}-offers`],
    queryFn: () => getOffersByCampaign(campaignId),
  });

  // Pipeline counts per campaign role. An application can apply to multiple
  // roles, so it counts towards each role it lists.
  const pipelineByRole = useMemo(() => {
    const counts = new Map<string, RolePipeline>();

    const bucket = (roleId: string) => {
      let entry = counts.get(roleId);
      if (!entry) {
        entry = { applications: 0, assessment: 0, offer: 0, hired: 0 };
        counts.set(roleId, entry);
      }
      return entry;
    };

    for (const application of applications ?? []) {
      for (const appliedRole of application.applied_roles) {
        bucket(appliedRole.campaign_role_id).applications += 1;
      }
    }

    for (const roleStatus of roleStatuses ?? []) {
      if (roleStatus.status === "Interview") {
        bucket(roleStatus.campaign_role_id).assessment += 1;
      }
    }

    for (const offer of offers ?? []) {
      // Drafts haven't been extended to the applicant yet
      if (offer.status === "Draft") continue;

      bucket(offer.role_id).offer += 1;
      if (offer.status === "Accepted") {
        bucket(offer.role_id).hired += 1;
      }
    }

    return counts;
  }, [applications, roleStatuses, offers]);

  const [hoveredDeleteIndex, setHoveredDeleteIndex] = useState<number | null>(null);
  const [descriptionHtmlState, setDescriptionHtmlState] = useState<string>("");

  const handlePublish = async () => {
    try {
      await publishCampaign(campaignId);
      await refetchCampaign();
    } catch (error) {
      console.error("Failed to publish campaign:", error);
    }
  };

  useEffect(() => {
    async function processMarkdown() {
      if (campaign?.description) {
        const processed = await remark()
          .use(html)
          .process(campaign.description);

        setDescriptionHtmlState(processed.toString());
      }
    }
    processMarkdown();
  }, [campaign?.description]);

  const existingBannerSrc =
    campaign?.cover_image_url ||
    (campaign?.cover_image && /^https?:\/\//i.test(campaign.cover_image)
      ? campaign.cover_image
      : null) ||
    "/placeholder.svg";


  return (

    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <img className="w-full max-h-52 object-cover" src={existingBannerSrc} alt={`${campaign?.name} cover image`} />
        <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Good Morning, {currentUser?.name}.
            </h1>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                {campaign?.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Quick actions */}
      <section className="flex flex-col">
        <h2 className="text-lg font-semibold text-gray-900">{dict.common.quick_actions}</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <CopyButton
              value={`https://chaos.devsoc.app/campaign/${campaign?.organisation_slug}/${campaign?.campaign_slug}`}
              className="w-full justify-center sm:w-auto"
            >
              <LinkIcon className="w-4 h-4" /> {dict.dashboard.campaigns.share_link}
            </CopyButton>
            {userRole?.role === "Admin" && <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}/edit`} className="w-full sm:w-auto">
              <Button variant="outline" className="cursor-pointer w-full justify-center sm:w-auto">
                <SquarePen className="w-4 h-4" /> {dict.dashboard.actions.edit}
              </Button>
            </Link>}
            <CopyButton value={campaignId} className="w-full justify-center sm:w-auto">
              <Copy className="w-4 h-4" /> {dict.dashboard.campaigns.copy_campaign_id}
            </CopyButton>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/review`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full justify-center sm:w-auto">
                <Play className="w-4 h-4" /> {dict.dashboard.campaigns.grading_queue}
              </Button>
            </Link>

            <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/applications`} className="w-full sm:w-auto">
              <Button className="w-full justify-center sm:w-auto">
                <Menu className="w-4 h-4" /> {dict.dashboard.campaigns.application_summary}
              </Button>
            </Link>
          </div>


          {userRole?.role === "Admin" && (
            <>
              {/* <Button variant="outline" className="cursor-pointer w-full justify-center sm:w-auto">
                <Trash className="w-4 h-4" /> {dict.dashboard.actions.delete}
              </Button> */}
              {!campaign?.published && (
                <>
                  <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                    <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}/questions`} className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full justify-center sm:w-auto">
                        <FormIcon className="w-4 h-4" /> {dict.dashboard.campaigns.manage_questions}
                      </Button>
                    </Link>
                  </ButtonGroup>
                  <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                    <PublishCampaignDialog
                      onPublish={handlePublish}
                      label={dict.dashboard.campaigns.publish}
                      buttonClassName="w-full justify-center sm:w-auto"
                    />
                  </ButtonGroup>
                </>
              )}
            </>
          )}

        </div>
      </section>

      {/* Applicant Pipeline */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">{dict.dashboard.campaigns.applicant_pipeline}</h2>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="mt-4 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader >
                <TableRow className="bg-muted">
                  <TableHead className="w-[160px]">
                    {dict.dashboard.campaigns.roles.role}
                  </TableHead>
                  <TableHead className="w-[160px]">
                    {dict.dashboard.campaigns.roles.position}
                  </TableHead>
                  <TableHead className="w-[160px]">
                    {dict.dashboard.campaigns.roles.applications}
                  </TableHead>
                  <TableHead className="w-[160px]">
                    {dict.dashboard.campaigns.roles.assessment}
                  </TableHead>
                  <TableHead className="w-[160px]">
                    {dict.dashboard.campaigns.roles.offer}
                  </TableHead>
                  <TableHead className="w-[160px]">
                    {dict.dashboard.campaigns.roles.hired}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Role name e.g. "Freerooms" */}
                {roles?.map((role, index) => {
                  const pipeline =
                    pipelineByRole.get(role.id) ?? EMPTY_PIPELINE;
                  return (
                    <TableRow
                      key={role.id}
                      className={cn(
                        "group transition-colors",
                        hoveredDeleteIndex === index && "bg-red-50! hover:bg-red-50!"
                      )}
                    >
                      <TableCell>
                        {role.name}
                      </TableCell>
                      <TableCell>
                        {/* Number of roles available */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {role.min_available}
                          <span>-</span>
                          {role.max_available}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {pipeline.applications}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {pipeline.assessment}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {pipeline.offer}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {pipeline.hired}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {roles?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <p className="text-sm text-gray-600">{dict.dashboard.campaigns.no_roles_available}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-gray-900">{dict.common.description}</h2>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <div dangerouslySetInnerHTML={{ __html: descriptionHtmlState }} />
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-gray-900">{dict.common.attachments}</h2>
            </div>
            {attachments && attachments.length > 0 ? (
              <div className="mt-3 space-y-2">
                {attachments.map(attachment => (
                  <a
                    href={attachment.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border border-transparent bg-muted/40 px-3 py-2 text-sm text-blue-600 transition-colors hover:border-blue-200 hover:text-blue-800"
                    key={attachment.id}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{attachment.file_name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No attachments yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
