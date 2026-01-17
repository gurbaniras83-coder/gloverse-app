"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-provider";
import { Comment } from "@/lib/types";
import { mockComments } from "@/lib/mock-data";
import { Send } from "lucide-react";

export function CommentSection({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  // In a real app, this would use a real-time listener from Firebase
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.channel) return;

    const comment: Comment = {
      id: `c${comments.length + 1}`,
      user: {
        name: user.channel.handle,
        avatar: user.channel.photoURL,
      },
      text: newComment,
      timestamp: new Date(),
    };

    // In a real app, you'd add this to Firestore
    setComments([comment, ...comments]);
    setNewComment("");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Comments ({comments.length})</h3>

      {user && (
        <form onSubmit={handlePostComment} className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.channel?.photoURL} />
            <AvatarFallback>{user.channel?.handle.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="h-9"
          />
          <Button type="submit" size="icon" className="h-9 w-9 flex-shrink-0" disabled={!newComment.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user.avatar} />
              <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
