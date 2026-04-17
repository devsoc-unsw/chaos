"use client";

import type { EmailTemplate } from "@/models/email";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Copy, Eye, Pencil, Plus, Trash } from "lucide-react";
import {
  deleteEmailTemplate,
  duplicateEmailTemplate,
  getOrganisationEmailTemplates,
  templateVariables,
} from "@/models/email";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmailTemplates({
  orgId,
  dict,
}: {
  orgId: string;
  dict: any;
}) {
  const router = useRouter();

  let { data: templates } = useQuery({
    queryKey: [`${orgId}-email-templates`],
    queryFn: () => getOrganisationEmailTemplates(orgId),
  });

  if (!templates) {
    templates = [];
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">{dict.dashboard.email_templates}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {templates.map((template) => {
          return (
            <EmailCard key={template.id} template={template} dict={dict} />
          );
        })}
        <Card
          className="flex items-center justify-center gap-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          onClick={() =>
            router.push(`/dashboard/organisation/${orgId}/templates/new`)
          }
        >
          <Plus className="w-10 h-10" />
          <p className="text-xl font-semibold">{dict.dashboard.actions.new}</p>
        </Card>
      </div>
    </div>
  );
}

function EmailCard({ template, dict }: { template: EmailTemplate; dict: any }) {
  const queryClient = useQueryClient();

  const [loadingDuplicate, setLoadingDuplicate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDuplicateTemplate = async (templateId: string) => {
    setLoadingDuplicate(true);
    await duplicateEmailTemplate(templateId);
    await queryClient.invalidateQueries({
      queryKey: [`${template.organisation_id}-email-templates`],
    });
    setLoadingDuplicate(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setLoadingDelete(true);
    await deleteEmailTemplate(templateId);
    await queryClient.invalidateQueries({
      queryKey: [`${template.organisation_id}-email-templates`],
    });
    setLoadingDelete(false);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {dict.dashboard.email.name}:
          </p>
          <p className="text-2xl line-clamp-1">{template.name}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {dict.dashboard.email.subject}:
          </p>
          <p className="line-clamp-2">{template.template_subject}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {dict.dashboard.email.body}:
          </p>
          <p className="line-clamp-4 whitespace-pre-wrap">
            {template.template_body}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-1 justify-end mt-auto">
        <EmailTemplatePreview template={template} dict={dict} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/dashboard/organisation/${template.organisation_id}/templates/${template.id}/edit`}
            >
              <Button variant="outline" className="items-center">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dict.dashboard.actions.edit}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="items-center"
              onClick={() => handleDuplicateTemplate(template.id)}
              disabled={loadingDuplicate}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dict.dashboard.actions.duplicate}</p>
          </TooltipContent>
        </Tooltip>
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="items-center"
                  disabled={loadingDelete}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{dict.dashboard.actions.delete}</p>
            </TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dict.dashboard.actions.destructive_confirm}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dict.dashboard.email.delete_confirmation}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {dict.dashboard.actions.cancel}
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => handleDeleteTemplate(template.id)}
                disabled={loadingDelete}
              >
                {dict.dashboard.actions.delete}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

function EmailTemplatePreview({
  template,
  dict,
}: {
  template: EmailTemplate;
  dict: any;
}) {
  for (const variable of templateVariables) {
    template.template_body = template.template_body.replaceAll(
      variable.key,
      variable.example
    );
    template.template_subject = template.template_subject.replaceAll(
      variable.key,
      variable.example
    );
  }

  return (
    <Dialog>
      <form>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="w-4 h-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dict.dashboard.actions.preview}</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>{dict.dashboard.actions.preview}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-700">
                {dict.dashboard.email.subject}:
              </p>
              <p className="whitespace-pre-wrap">{template.template_subject}</p>
            </div>

            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-700">
                {dict.dashboard.email.body}:
              </p>
              <p className="whitespace-pre-wrap">{template.template_body}</p>
            </div>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}
