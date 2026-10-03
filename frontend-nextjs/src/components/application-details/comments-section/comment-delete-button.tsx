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
      className="bg-foreground hover:scale-105 hover:bg-foreground hover:text-destructive focus:scale-105 focus:text-destructive"
      onClick={onClick}
      aria-label="Delete message"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
