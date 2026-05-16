"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import Link from "next/link";
import { templateVariables, type EmailTemplate } from "@/models/email";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRef, useState, useEffect } from "react";
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

  // History management for undo/redo
  type HistoryState = {
    text: string;
    cursorPosition: number;
  };

  const historyRef = useRef<HistoryState[]>([
    { text: template?.template_body ?? "", cursorPosition: 0 },
  ]);
  const currentIndexRef = useRef<number>(0);
  const pendingCursorRef = useRef<number | null>(null);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await submitData(templateId, name, subject, body);
    setSaving(false);
  };

  // Apply pending cursor position whenever body changes
  useEffect(() => {
    if (pendingCursorRef.current !== null) {
      const textarea = textAreaRef.current;
      if (textarea) {
        textarea.selectionStart = textarea.selectionEnd =
          pendingCursorRef.current;
        textarea.focus();
      }
      pendingCursorRef.current = null;
    }
  }, [body]);

  // Add a new state to history and update current index
  const addToHistory = (newBody: string) => {
    const textarea = textAreaRef.current;
    const cursorPosition = textarea?.selectionStart ?? 0;

    // If user is not at the end of history (e.g., after undo, they make a new edit),
    // remove all future states
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(
        0,
        currentIndexRef.current + 1
      );
    }

    // Add new state to history
    historyRef.current.push({ text: newBody, cursorPosition });
    currentIndexRef.current = historyRef.current.length - 1;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newBody = e.target.value;
    setBody(newBody);
    addToHistory(newBody);
  };

  const handleAddVariable = (value: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) {
      return;
    }

    textarea.setRangeText(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      "end"
    );

    const newBody = textarea.value;
    setBody(newBody);
    addToHistory(newBody);
    textarea.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Undo: Ctrl+Z
    if (e.ctrlKey && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();

      if (currentIndexRef.current > 0) {
        currentIndexRef.current--;
        const state = historyRef.current[currentIndexRef.current];
        pendingCursorRef.current = state.cursorPosition;
        setBody(state.text);
      }
    }

    // Redo: Ctrl+Shift+Z
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();

      if (currentIndexRef.current < historyRef.current.length - 1) {
        currentIndexRef.current++;
        const state = historyRef.current[currentIndexRef.current];
        pendingCursorRef.current = state.cursorPosition;
        setBody(state.text);
      }
    }
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
          <Tooltip>
            <TooltipTrigger asChild>
              <ButtonGroup>
                {templateVariables.map((variable) => {
                  return (
                    <Button
                      variant="outline"
                      className="text-xs"
                      key={variable.key}
                      onClick={() => handleAddVariable(variable.key)}
                    >
                      {variable.key}
                    </Button>
                  );
                })}
              </ButtonGroup>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-xs gap-2 flex flex-col"
            >
              <p>
                These buttons add variables which will automatically be replaced
                when your emails are generated.
              </p>
              <p>
                Please do not add any variables for emails which you won't have
                data for (e.g adding an offer_link for rejection templates)
              </p>
            </TooltipContent>
          </Tooltip>

          <Textarea
            className="max-w-2xl min-h-[300px]"
            value={body}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            ref={textAreaRef}
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
