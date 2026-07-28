"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import {
  getOrganisationEmailTemplates,
  type QueueOutcomeEmailsPayload,
} from "@/models/email";
import { renderAcceptanceEmail } from "@/emails";

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
  /** Selected recipients — thank-you email goes only to these. */
  recipients: SendEmailsApplicant[];
  organisationName?: string;
  campaignName?: string;
  onSend?: (payload: QueueOutcomeEmailsPayload) => Promise<void>;
}

/** Demo modal: hardcoded thank-you React Email → selected people only. */
export function SendEmailsModal(props: SendEmailsModalProps) {
  const {
    open,
    onOpenChange,
    orgId,
    recipients,
    organisationName = "",
    campaignName = "",
    onSend,
  } = props;
  const [sending, setSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: [`${orgId}-email-templates`],
    queryFn: () => getOrganisationEmailTemplates(orgId),
    enabled: open && !!orgId,
  });

  const previewVars = useMemo(() => {
    const sample = recipients[0];
    return {
      name: sample?.name ?? "Applicant",
      role: sample?.roles?.length ? sample.roles.join(", ") : "Role",
      organisation_name: organisationName || "Organisation",
      campaign_name: campaignName || "Campaign",
      expiry_date: "soon",
    };
  }, [recipients, organisationName, campaignName]);

  useEffect(() => {
    if (!open) {
      setPreviewHtml("");
      setPreviewSubject("");
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    renderAcceptanceEmail(previewVars)
      .then(({ subject, html }) => {
        if (cancelled) return;
        setPreviewSubject(subject);
        setPreviewHtml(html);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setPreviewHtml("");
          setPreviewSubject("");
          toast.error("Failed to render email preview.");
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, previewVars]);

  const handleSend = async () => {
    if (sending) return;

    if (!onSend) {
      toast.error("Sending is not configured.");
      return;
    }

    if (recipients.length === 0) {
      toast.error("Select at least one applicant.");
      return;
    }

    const missingRole = recipients.find((a) => a.roleIds.length === 0);
    if (missingRole) {
      toast.error(`Missing role for ${missingRole.name}.`);
      return;
    }

    // Dummy template id for the queue payload (Reject path does not create offers).
    const templateId = templates[0]?.id ?? "0";
    const expiryIso = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString();

    setSending(true);
    try {
      const emails: QueueOutcomeEmailsPayload["emails"] = [];

      for (const a of recipients) {
        const roleStr = a.roles.length ? a.roles.join(", ") : "";
        const { subject, html } = await renderAcceptanceEmail({
          name: a.name,
          role: roleStr,
          organisation_name: organisationName,
          campaign_name: campaignName,
          expiry_date: "soon",
        });

        emails.push({
          id: a.id,
          application_id: a.id,
          name: a.name,
          email: a.email,
          // Reject avoids creating offer records; body is still the thank-you HTML.
          email_type: "Reject",
          role: roleStr,
          role_id: a.roleIds[0],
          email_template_id: templateId,
          expiry: expiryIso,
          subject,
          body: html,
        });
      }

      await onSend({ emails });
      toast.success(
        `Queued thank-you email${recipients.length !== 1 ? "s" : ""}`,
      );
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5" />
            Send emails
          </DialogTitle>
          <DialogDescription>
            Sends the thank-you email to the selected applicants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Recipients (
              <span className="font-medium">{recipients.length}</span>)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recipients.map((a) => (
                <Badge key={a.id} variant="outline" className="text-xs">
                  {a.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Subject</Label>
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {previewLoading ? "Rendering…" : previewSubject || "—"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Preview</Label>
            <div className="overflow-hidden rounded-md border bg-white">
              {previewLoading ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Rendering preview…
                </div>
              ) : previewHtml ? (
                <iframe
                  title="Thank-you email preview"
                  srcDoc={previewHtml}
                  sandbox=""
                  className="h-[320px] w-full border-0 bg-white"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  No preview available
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              sending ||
              recipients.length === 0 ||
              previewLoading ||
              !previewHtml
            }
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {sending
              ? "Sending..."
              : `Send ${recipients.length} Email${recipients.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
