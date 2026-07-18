"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getCommentsByApplication,
    createComment,
    deleteComment,
    CommentDetails,
} from "@/models/comment";
import { getCurrentUser } from "@/lib";
import { useState, useRef, useEffect } from "react";
import { X, SendHorizontal, CornerUpLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AVATAR_COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
];

function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xff;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function Avatar({ name }: { name: string }) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    return (
        <div
            className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                avatarColor(name),
            )}
        >
            {initials}
        </div>
    );
}

function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today at ${time}`;
    return (
        date.toLocaleDateString([], { day: "numeric", month: "short" }) + ` at ${time}`
    );
}

function CommentItem({
    comment,
    currentUserId,
    applicationId,
    onReply,
}: {
    comment: CommentDetails;
    currentUserId: string | undefined;
    applicationId: string;
    onReply: (comment: CommentDetails) => void;
}) {
    const queryClient = useQueryClient();

    const { mutate: remove, isPending: isDeleting } = useMutation({
        mutationFn: () => deleteComment(applicationId, comment.id),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ["application-comments", applicationId],
            }),
        onError: () => toast.error("Could not delete comment."),
    });

    const isOwn = currentUserId === comment.author_id;

    return (
        <div className="group flex gap-2.5 px-4 py-2 hover:bg-muted/50 transition-colors relative">
            <Avatar name={comment.name} />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{comment.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {formatTime(comment.created_at)}
                    </span>
                </div>
                <p className="text-sm mt-0.5 break-words leading-relaxed">{comment.body}</p>
            </div>

            {/* Hover actions */}
            <div className="absolute top-1.5 right-3 hidden group-hover:flex items-center gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
                <button
                    type="button"
                    onClick={() => onReply(comment)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Reply"
                >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                </button>
                {isOwn && (
                    <button
                        type="button"
                        onClick={() => remove()}
                        disabled={isDeleting}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default function ApplicationDiscussionPanel({
    applicationId,
    onClose,
}: {
    applicationId: string;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [text, setText] = useState("");
    const [replyingTo, setReplyingTo] = useState<CommentDetails | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: currentUser } = useQuery({
        queryKey: ["user"],
        queryFn: () => getCurrentUser(),
    });

    const { data: comments = [], isPending } = useQuery({
        queryKey: ["application-comments", applicationId],
        queryFn: () => getCommentsByApplication(applicationId),
    });

    const { mutate: submit, isPending: isSubmitting } = useMutation({
        mutationFn: (body: string) => createComment(applicationId, body),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ["application-comments", applicationId],
            }),
        onError: () => toast.error("Could not post comment."),
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    useEffect(() => {
        // Focus on input after submitting a comment
        if (!isSubmitting) {
            inputRef.current?.focus();
        }
    }, [isSubmitting]);

    const handleReply = (comment: CommentDetails) => {
        setReplyingTo(comment);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        const body = replyingTo ? `@${replyingTo.name} ${trimmed}` : trimmed;
        submit(body);
        setText("");
        setReplyingTo(null);
    };

    return (
        <>
            {/* Panel */}
            <div className="h-full w-96 bg-background border-l shadow-2xl flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-2 min-h-0">
                    {isPending ? (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-1 px-6 text-center">
                            <p className="text-sm font-medium text-muted-foreground">No comments yet</p>
                            <p className="text-xs text-muted-foreground">
                                Start the discussion about this candidate.
                            </p>
                        </div>
                    ) : (
                        <>
                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    currentUserId={currentUser?.id}
                                    applicationId={applicationId}
                                    onReply={handleReply}
                                />
                            ))}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>

                {/* Input area */}
                <div className="border-t px-3 py-3 shrink-0">
                    {replyingTo && (
                        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-md bg-muted text-xs text-muted-foreground">
                            <CornerUpLeft className="w-3 h-3 shrink-0" />
                            <span className="flex-1 truncate">
                                Replying to{" "}
                                <span className="font-semibold text-foreground">
                                    {replyingTo.name}
                                </span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="hover:text-foreground transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            className="flex-1 text-sm bg-muted rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                            placeholder="Write a comment…"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!text.trim() || isSubmitting}
                            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
                        >
                            <SendHorizontal className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
