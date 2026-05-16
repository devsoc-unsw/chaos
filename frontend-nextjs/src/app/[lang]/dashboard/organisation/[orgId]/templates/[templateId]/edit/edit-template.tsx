"use client";

import { getEmailTemplate, updateEmailTemplate } from "@/models/email";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import TemplateForm from "../../template-form";

export default function TemplateEditForm({
  templateId,
  orgId,
  dict,
}: {
  templateId: string;
  orgId: string;
  dict: any;
}) {
  const queryClient = useQueryClient();

  const { data: template } = useQuery({
    queryKey: [`${templateId}-email-template`],
    queryFn: () => getEmailTemplate(templateId),
  });

  const submitData = async (
    templateId: string,
    name: string,
    subject: string,
    body: string
  ) => {
    await updateEmailTemplate(templateId, {
      id: templateId,
      organisation_id: orgId,
      name,
      template_subject: subject,
      template_body: body,
    });
    await queryClient.invalidateQueries({
      queryKey: [`${templateId}-email-template`],
    });
    await queryClient.invalidateQueries({
      queryKey: [`${orgId}-email-templates`],
    });
  };

  return (
    <TemplateForm
      templateId={templateId}
      template={template}
      orgId={orgId}
      dict={dict}
      submitData={submitData}
    />
  );
}
