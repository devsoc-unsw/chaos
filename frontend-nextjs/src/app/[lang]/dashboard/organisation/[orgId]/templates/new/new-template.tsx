"use client";

import { createEmailTemplate, getEmailTemplate, updateEmailTemplate } from "@/models/email";
import { useQueryClient } from "@tanstack/react-query";
import TemplateForm from "../template-form";
import { redirect } from "next/navigation";

export default function TemplateNewForm({ orgId, dict }: { orgId: string, dict: any }) {
    const queryClient = useQueryClient();

    const submitData = async (templateId: string, name: string, subject: string, body: string) => {
        await createEmailTemplate(orgId, { name, template_subject: subject, template_body: body });
        await queryClient.invalidateQueries({ queryKey: [`${orgId}-email-templates`] });
        redirect(`/dashboard/organisation/${orgId}/templates`);
    }

    return (
        <TemplateForm templateId={"0"} orgId={orgId} dict={dict} submitData={submitData} />
    )
}