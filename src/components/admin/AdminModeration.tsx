import { useState } from "react";
import { Trash2, MessageSquare, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
  display_name: string;
  upvotes: number;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  upvotes: number;
  created_at: string;
}

interface Props {
  posts: Post[];
  comments: Comment[];
  onRefresh: () => void;
}

const AdminModeration = ({ posts, comments, onRefresh }: Props) => {
  const { session } = useAuth();
  const [tab, setTab] = useState<"posts" | "comments">("posts");

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-stats", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { action: "delete_post", post_id: postId },
      });
      if (error) throw error;
      toast.success("Post deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-stats", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { action: "delete_comment", comment_id: commentId },
      });
      if (error) throw error;
      toast.success("Comment deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["posts", "comments"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
            }`}>{t === "posts" ? `📝 Posts (${posts.length})` : `💬 Comments (${comments.length})`}</button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">{p.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.display_name}</TableCell>
                  <TableCell className="text-xs">{p.category}</TableCell>
                  <TableCell className="text-xs">{p.upvotes}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePost(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {posts.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">No posts</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "comments" && (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm max-w-[300px] truncate">{c.content}</TableCell>
                  <TableCell className="text-xs">{c.upvotes}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteComment(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {comments.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">No comments</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
