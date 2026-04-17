import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import CommentsContainer from "@components/application-details/comments-section/comments-container";
import CommentsInput from "@components/application-details/comments-section/comments-input";
import { Separator } from "@components/ui/separator";
import { createComment, getCommentsByApplication } from "@/models/comment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Props = {
  applicationId: string;
};

function CommentsSection({ applicationId }: Props) {
  // Use query client
  const queryClient = useQueryClient();

  // Fetch comments
  const { isPending, data: comments } = useQuery({
    queryKey: ["application-comments", applicationId],
    queryFn: () => getCommentsByApplication(applicationId),
  });

  // Create new comment mutation
  const { mutateAsync: mutateCreateComment } = useMutation({
    mutationFn: (body: string) => createComment(applicationId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["application-comments", applicationId],
      });
    },
    onError: () => {
      toast.error("Could not post comment.");
    },
  });

  // Return component
  return (
    <Card className="w-full gap-0">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <CommentsContainer
          comments={comments}
          isPending={isPending}
          applicationId={applicationId}
        />
        <Separator className="my-2" />
        <CommentsInput createComment={mutateCreateComment} />
      </CardContent>
    </Card>
  );
}

export default CommentsSection;
