"use client";

import { CommentDetails, getCommentsByApplication } from "@/models/comment";
import { Spinner } from "@components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { dateToString } from "@/lib/utils";
import { useEffect, useRef } from "react";
import Comment from "@components/application-details/comments-section/comment";

type Props = {
  comments: CommentDetails[] | undefined;
  isPending: boolean;
};

function CommentsContainer({ comments, isPending }: Props) {
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
        <Comment comment={comment} />
      ))}
    </div>
  );
}

export default CommentsContainer;
