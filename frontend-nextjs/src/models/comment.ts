import { apiRequest } from "@/lib";

export interface CommentDetails {
  id: string;
  name: string;
  body: string;
  author_id: string;
  created_at: string;
}

export async function createComment(
  applicationId: string,
  body: string,
): Promise<{ comment_id: string }> {
  return await apiRequest<{ comment_id: string }>(
    `/api/v1/application/${applicationId}/comment`,
    {
      method: "POST",
      body: {
        body,
      },
    },
  );
}

export async function editComment(
  applicationId: string,
  commentId: string,
  body: string,
): Promise<void> {
  await apiRequest(
    `/api/v1/application/${applicationId}/comment/${commentId}`,
    {
      method: "PUT",
      body: {
        body,
      },
    },
  );
}

export async function deleteComment(
  applicationId: string,
  commentId: string,
): Promise<void> {
  await apiRequest(
    `/api/v1/application/${applicationId}/comment/${commentId}`,
    {
      method: "DELETE",
    },
  );
}

export async function getCommentsByApplication(
  applicationId: string,
): Promise<CommentDetails[]> {
  return await apiRequest<CommentDetails[]>(
    `/api/v1/application/${applicationId}/comment`,
    {
      method: "GET",
    },
  );
}

export async function getUnreadCommentCount(
  applicationId: string,
): Promise<{ count: number }> {
  return await apiRequest<{ count: number }>(
    `/api/v1/application/${applicationId}/comment/unread_count`,
    {
      method: "GET",
    },
  );
}

export async function markAllCommentsRead(
  applicationId: string,
): Promise<void> {
  await apiRequest(`/api/v1/application/${applicationId}/comment/read_all`, {
    method: "PATCH",
  });
}
