"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import {
  getOrganisationEmailTemplates,
  type EmailTemplate,
} from "@/models/email";
import { dateToString } from "@/lib/utils";
import type { QueueOutcomeEmailsPayload } from "@/models/email";

type OutcomeType = "accepted" | "rejected";

/** Replace `{{name}}`, `{{role}}`, etc. in template strings. */
function mergeOutcomePlaceholders(
  text: string,
  vars: Record<string, string>,
): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    return vars[key] ?? "";
  });
}

export interface SendEmailsApplicant {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  roles: string[];
}

export type SendEmailsPayload = QueueOutcomeEmailsPayload;

export interface SendEmailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  acceptedApplicants: SendEmailsApplicant[];
  rejectedApplicants: SendEmailsApplicant[];
  organisationName?: string;
  campaignName?: string;
  eventName?: string;
  /** Campaign end date for `{{expiry_date}}` */
  campaignEndsAt?: string;
  onSend?: (payload: QueueOutcomeEmailsPayload) => Promise<void>;
}

export function SendEmailsModal(props: SendEmailsModalProps) {
  const {
    open,
    onOpenChange,
    orgId,
    acceptedApplicants,
    rejectedApplicants,
    organisationName = "",
    campaignName = "",
    eventName = "",
    campaignEndsAt = "",
    onSend,
  } = props;
  const [sending, setSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [activeOutcome, setActiveOutcome] = useState<OutcomeType>("accepted");

  const {
    data: templates = [],
    isLoading: templatesLoading,
  } = useQuery<EmailTemplate[]>({
    queryKey: [`${orgId}-email-templates`],
    queryFn: () => getOrganisationEmailTemplates(orgId),
    enabled: open && !!orgId,
  });

  useEffect(() => {
    if (!open) return;
    if (templates.length === 0) return;
    if (selectedTemplateId) return;

    const first = templates[0];
    setSelectedTemplateId(first.id);
    setSubject(first.template_subject);
    setBody(first.template_body);
  }, [open, templates, selectedTemplateId]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setSubject(tmpl.template_subject);
    setBody(tmpl.template_body);
  };

  const totalEmails = acceptedApplicants.length + rejectedApplicants.length;
  const activeApplicants =
    activeOutcome === "accepted" ? acceptedApplicants : rejectedApplicants;

  const handleSend = async () => {
    if (sending) {
      return;
    }

    setSending(true);

    if (!onSend) {
      toast.error("Sending is not configured.");
      return;
    }

    const subj = subject.trim();
    const bod = body.trim();

    if (!subj || !bod) {
      toast.error("Subject and body are required.");
      return;
    }

    if (!selectedTemplateId) {
      toast.error("Please choose an email template.");
      return;
    }

    const expiryDate = campaignEndsAt ? dateToString(campaignEndsAt) : "";
    const eventLabel = eventName || campaignName;

    const recipients = [...acceptedApplicants, ...rejectedApplicants];
    const missingRoleApplicant = recipients.find((a) => a.roleIds.length === 0);

    if (missingRoleApplicant) {
      toast.error(`Missing role for ${missingRoleApplicant.name}.`);
      return;
    }

    const expiryIso = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const payload: QueueOutcomeEmailsPayload = {
      emails: recipients.map((a) => {
        const roleStr = a.roles.length ? a.roles.join(", ") : "";
        const primaryRoleId = a.roleIds[0];

        const vars: Record<string, string> = {
          name: a.name,
          role: roleStr,
          organisation_name: organisationName,
          campaign_name: campaignName,
          event_name: eventLabel,
          expiry_date: expiryDate,
        };
        return {
          id: a.id,
          application_id: a.id,
          name: a.name,
          email: a.email,
          role: roleStr,
          role_id: primaryRoleId,
          email_template_id: selectedTemplateId,
          expiry: expiryIso,
          subject: mergeOutcomePlaceholders(subj, vars),
          body: mergeOutcomePlaceholders(bod, vars),
        };
      }),
    };

    try {
      await onSend(payload);
      toast.success("Sent out emails");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to queue emails.", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5" />
            Send Outcome Emails
          </DialogTitle>
          <DialogDescription>
            Configure a template and message for your accepted/rejected
            applicants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Recipients (
                <span className="font-medium">{totalEmails}</span>)
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Outcome</Label>
                <Select
                  value={activeOutcome}
                  onValueChange={(val) => setActiveOutcome(val as OutcomeType)}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepted">
                      Accepted ({acceptedApplicants.length})
                    </SelectItem>
                    <SelectItem value="rejected">
                      Rejected ({rejectedApplicants.length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {activeApplicants.map((a) => (
                <Badge key={a.id} variant="outline" className="text-xs">
                  {a.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <Label>Template</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateChange}
                disabled={templatesLoading || templates.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      templatesLoading
                        ? "Loading templates..."
                        : "Choose a template"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject line for outcome email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email-body">Body</Label>
              <Textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[160px]"
                placeholder="Write the message you would send to these applicants"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-end">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || totalEmails === 0 || templatesLoading}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {sending
                ? "Sending..."
                : `Send ${totalEmails} Email${totalEmails !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
