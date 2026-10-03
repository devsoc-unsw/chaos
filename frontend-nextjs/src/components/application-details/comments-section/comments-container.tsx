"use client";

import { CommentDetails } from "@/models/comment";
import { Spinner } from "@components/ui/spinner";
import { useEffect, useRef } from "react";
import Comment from "@components/application-details/comments-section/comment";

type Props = {
  applicationId: string;
  comments: CommentDetails[] | undefined;
  isPending: boolean;
};

function CommentsContainer({ applicationId, comments, isPending }: Props) {
  // Get ref to comments container div
  const commentsContainer = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of comments whenever a new comment is written / received
  useEffect(() => {
    commentsContainer.current?.lastElementChild?.scrollIntoView({
      behavior: "instant",
    });
  }, [comments]);

  // Return spinner if pending
  if (isPending || comments == undefined) {
    return (
      <div className="flex h-24 w-full flex-col items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  // Otherwise, render comments
  return (
    <div
      className="-mx-2 max-h-96 overflow-x-hidden overflow-y-auto"
      ref={commentsContainer}
    >
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          applicationId={applicationId}
        />
      ))}
    </div>
  );
}

export default CommentsContainer;
