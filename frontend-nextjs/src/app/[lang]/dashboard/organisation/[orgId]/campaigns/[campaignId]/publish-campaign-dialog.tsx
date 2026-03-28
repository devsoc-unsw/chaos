"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CircleCheck } from "lucide-react";

type PublishCampaignDialogProps = {
  onPublish: () => Promise<void> | void;
  label: string;
  buttonClassName?: string;
};

export function PublishCampaignDialog({ onPublish, label, buttonClassName }: PublishCampaignDialogProps) {
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePublishClick = async () => {
    if (!confirmPublish || loading) return;
    try {
      setLoading(true);
      await onPublish();
    } finally {
      setLoading(false);
      setConfirmPublish(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={loading} className={buttonClassName}>
          <CircleCheck className="w-4 h-4 text-green-500 mr-1" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish campaign?</AlertDialogTitle>
          <AlertDialogDescription>
            Publishing this campaign is final and cannot be undone. You will not be able to delete this campaign or
            edit any of it's details including, but not limited to, roles, questions, rating categories, and attachments.
            Please ensure all details are correct and final before publishing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-start gap-2 py-4">
          <Checkbox
            id="confirm-publish"
            checked={confirmPublish}
            onCheckedChange={(checked) => setConfirmPublish(!!checked)}
          />
          <Label
            htmlFor="confirm-publish"
            className="text-sm leading-snug cursor-pointer select-none"
          >
            I understand that publishing this campaign is final, and have confirmed all details are correct.
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmPublish(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="default"
              onClick={handlePublishClick}
              disabled={!confirmPublish || loading}
            >
              <CircleCheck className="w-4 h-4 mr-2 text-green-500" />
              {label}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}