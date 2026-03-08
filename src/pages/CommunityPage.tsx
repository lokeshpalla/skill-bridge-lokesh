import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, ThumbsUp, Plus, Send, Users,
  Tag, Clock, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
  comment_count?: number;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  created_at: string;
  author_name?: string;
}

const forumCategories = ["all", "general", "help", "showcase", "review", "discussion"];

const CommunityPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("forum_posts")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (!data) return;

    const userIds = [...new Set(data.map((p: any) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const nameMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) ?? []);

    const postIds = data.map((p: any) => p.id);
    const { data: commentData } = await supabase
      .from("forum_comments")
      .select("post_id")
      .in("post_id", postIds);

    const countMap = new Map<string, number>();
    commentData?.forEach((c: any) => {
      countMap.set(c.post_id, (countMap.get(c.post_id) ?? 0) + 1);
    });

    setPosts(
      data.map((p: any) => ({
        ...p,
        author_name: nameMap.get(p.user_id) || "Anonymous",
        comment_count: countMap.get(p.id) ?? 0,
      }))
    );
  };

  const createPost = async () => {
    if (!user) return toast.error("Sign in to post");
    if (!newTitle.trim() || !newContent.trim()) return toast.error("Fill in title and content");
    const { error } = await supabase.from("forum_posts").insert({
      user_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });
    if (error) return toast.error("Failed to create post");
    setNewTitle("");
    setNewContent("");
    setShowNewPost(false);
    toast.success("Post created!");
    fetchPosts();
  };

  const loadComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    const { data } = await supabase
      .from("forum_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at");
    if (!data) return;

    const userIds = [...new Set(data.map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    const nameMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) ?? []);

    setComments((prev) => ({
      ...prev,
      [postId]: data.map((c: any) => ({ ...c, author_name: nameMap.get(c.user_id) || "Anonymous" })),
    }));
    setExpandedPost(postId);
  };

  const addComment = async (postId: string) => {
    if (!user) return toast.error("Sign in to comment");
    if (!commentText.trim()) return;
    const { error } = await supabase.from("forum_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: commentText.trim(),
    });
    if (error) return toast.error("Failed to comment");
    setCommentText("");
    loadComments(postId);
    fetchPosts();
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const filteredPosts = selectedCat === "all" ? posts : posts.filter((p) => p.category === selectedCat);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Community
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Ask questions, share knowledge, and discuss with peers</p>
      </motion.div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {forumCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCat === cat
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="hero" size="sm" className="gap-1 text-xs flex-shrink-0" onClick={() => setShowNewPost(!showNewPost)}>
            <Plus className="w-3.5 h-3.5" /> Post
          </Button>
        </div>

        {showNewPost && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
            <Input placeholder="Post title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="text-sm" />
            <Textarea placeholder="What's on your mind?" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} className="text-sm" />
            <div className="flex items-center gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-foreground"
              >
                {forumCategories.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <Button size="sm" className="text-xs gap-1 ml-auto" onClick={createPost}>
                <Send className="w-3 h-3" /> Post
              </Button>
            </div>
          </motion.div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No posts yet. Be the first!</p>
          </div>
        ) : (
          filteredPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">
                    {post.author_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate">{post.title}</h3>
                    {post.is_pinned && <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded">📌 Pinned</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{post.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)} ago</span>
                    <span className="text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded">{post.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                      <ThumbsUp className="w-3 h-3" /> {post.upvotes}
                    </button>
                    <button
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => loadComments(post.id)}
                    >
                      <MessageSquare className="w-3 h-3" /> {post.comment_count} comments
                      {expandedPost === post.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {expandedPost === post.id && (
                    <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
                      {(comments[post.id] ?? []).map((c) => (
                        <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/20">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold">{c.author_name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-medium">{c.author_name}</span>
                              <span className="text-[10px] text-muted-foreground">• {timeAgo(c.created_at)} ago</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="text-xs h-8"
                          onKeyDown={(e) => e.key === "Enter" && addComment(post.id)}
                        />
                        <Button size="sm" className="h-8 px-3" onClick={() => addComment(post.id)}>
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
