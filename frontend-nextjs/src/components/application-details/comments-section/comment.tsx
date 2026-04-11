"use client";

import { CommentDetails, deleteComment } from "@/models/comment";
import { dateToString } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CommentDeleteButton from "@components/application-details/comments-section/comment-delete-button";
import { getCurrentUser } from "@/lib";

type Props = {
  comment: CommentDetails;
  applicationId: string;
};

function Comment({ comment, applicationId }: Props) {
  // Get query client
  const queryClient = useQueryClient();

  // Get current user
  const { isPending, data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getCurrentUser(),
  });

  // Delete comment mutation
  const { mutateAsync: mutateDeleteComment } = useMutation({
    mutationFn: () => deleteComment(applicationId, comment.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["application-comments", applicationId],
      });
    },
    onError: () => {
      toast.error("Could not delete comment.");
    },
  });

  // Return comment component
  return (
    <div
      className="group relative rounded-lg p-2 focus-within:bg-slate-100 hover:bg-slate-100 focus:outline-none"
      tabIndex={0}
    >
      <div className="absolute -top-2 right-3 hidden group-focus-within:block group-hover:block">
        {comment.author_id == user?.id && (
          <CommentDeleteButton onClick={() => mutateDeleteComment()} />
        )}
      </div>
      <div>
        <span className="font-semibold">{comment.name}</span>{" "}
        <span className="text-sm text-gray-500">
          {dateToString(comment.created_at)}
        </span>
      </div>
      <p>{comment.body}</p>
    </div>
  );
}

export default Comment;
