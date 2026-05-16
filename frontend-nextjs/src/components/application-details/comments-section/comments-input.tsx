"use client";

import { Input } from "@components/ui/input";
import { SendHorizontal } from "lucide-react";
import { useState } from "react";

type Props = {
  createComment: (body: string) => void;
};
function CommentsInput({ createComment }: Props) {
  const [commentBody, setCommentBody] = useState("");

  return (
    <div>
      <form
        className="flex flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          createComment(commentBody);
          setCommentBody("");
        }}
      >
        <Input
          placeholder="Enter your comment here"
          onChange={(e) => setCommentBody(e.target.value)}
          value={commentBody}
        />
        <button type="submit" aria-label="Send message">
          <SendHorizontal className="text-card-foreground" />
        </button>
      </form>
    </div>
  );
}

export default CommentsInput;
