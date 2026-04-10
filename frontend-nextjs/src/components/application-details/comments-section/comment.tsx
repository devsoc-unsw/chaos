import { CommentDetails } from "@/models/comment";
import { dateToString } from "@/lib/utils";

type Props = {
  comment: CommentDetails;
};

function Comment({ comment }: Props) {
  return (
    <div className="rounded-lg p-2 hover:bg-slate-100">
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
