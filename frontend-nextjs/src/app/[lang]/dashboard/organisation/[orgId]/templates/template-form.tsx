"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import Link from "next/link";
import {
  EmailTemplate,
  getEmailTemplate,
  templateVariables,
  updateEmailTemplate,
} from "@/models/email";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function TemplateForm({
  templateId,
  template,
  orgId,
  dict,
  submitData,
}: {
  templateId: string;
  template?: EmailTemplate;
  orgId: string;
  dict: any;
  submitData: (
    templateId: string,
    name: string,
    subject: string,
    body: string
  ) => Promise<void>;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.template_subject ?? "");
  const [body, setBody] = useState(template?.template_body ?? "");

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await submitData(templateId, name, subject, body);
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/dashboard/organisation/${orgId}/templates`}>
            <div className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              {dict.common.back}
            </div>
          </Link>
          <h1 className="text-2xl font-bold">
            {dict.dashboard.email.edit_template}
          </h1>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label>{dict.dashboard.email.name}</Label>
          <Input
            className="max-w-[300px]"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{dict.dashboard.email.subject}</Label>
          <Input
            className="max-w-lg"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{dict.dashboard.email.body}</Label>
          <ButtonGroup>
            {templateVariables.map((variable) => {
              return (
                <Button
                  variant="outline"
                  className="text-xs"
                  key={variable.key}
                >
                  {variable.key}
                </Button>
              );
            })}
          </ButtonGroup>
          <Textarea
            className="max-w-2xl min-h-[300px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div>
          <Button
            disabled={!name || !subject || !body || saving}
            onClick={async () => await handleSave()}
          >
            {dict.dashboard.actions.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
