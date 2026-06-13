import { Button } from "@/components/ui/button";
import type { MouseEventHandler } from "react";
import { Trash2 } from "lucide-react";

type Props = {
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export default function CommentDeleteButton({ onClick }: Props) {
  return (
    <Button
      size="icon-sm"
      className="bg-slate-900 hover:scale-105 hover:bg-slate-900 hover:text-red-400 focus:scale-105 focus:text-red-400"
      onClick={onClick}
      aria-label="Delete message"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
