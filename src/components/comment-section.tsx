"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-provider";
import { Comment } from "@/lib/types";
import { mockComments } from "@/lib/mock-data";
import { Send, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export function CommentSection({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!videoId) return;

    const commentsRef = collection(db, "videos", videoId, "comments");
    const q = query(commentsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        commentsData.push({ 
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
         } as Comment);
      });
      setComments(commentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments: ", error);
      // Fallback to mock comments on error
      setComments(mockComments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [videoId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.channel || !videoId) return;

    try {
      await addDoc(collection(db, "videos", videoId, "comments"), {
        user: {
          name: user.channel.handle,
          avatar: user.channel.photoURL,
        },
        text: newComment,
        timestamp: serverTimestamp(),
      });
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment: ", error);
    }
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

      {loading ? (
         <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">@{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
