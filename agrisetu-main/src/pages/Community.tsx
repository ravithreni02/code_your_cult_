import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Send, Image, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

type CommunityPostRow = Database["public"]["Tables"]["community_posts"]["Row"];
type CommentRow = Database["public"]["Tables"]["post_comments"]["Row"];
type CommunityPost = CommunityPostRow & {
  likes: number;
  comments: CommentRow[];
};

const Community = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agrisetu.community-draft") || "{\"text\":\"\",\"image\":\"\"}");
    } catch {
      return { text: "", image: "" };
    }
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const fetchPosts = useCallback(async () => {
    const [{ data, error }, { data: comments, error: commentsError }, { data: likes, error: likesError }] = await Promise.all([
      supabase.from("community_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("post_comments").select("*").order("created_at", { ascending: true }),
      supabase.from("post_likes").select("post_id"),
    ]);
    if (error || commentsError || likesError) {
      const loadError = error || commentsError || likesError;
      toast({ title: "Could not load community posts", description: loadError.message, variant: "destructive" });
    } else {
      const commentMap = new Map<string, CommentRow[]>();
      (comments ?? []).forEach((comment) => {
        const existing = commentMap.get(comment.post_id) ?? [];
        commentMap.set(comment.post_id, [...existing, comment]);
      });
      const likeCounts = new Map<string, number>();
      (likes ?? []).forEach((like) => likeCounts.set(like.post_id, (likeCounts.get(like.post_id) ?? 0) + 1));
      setPosts((data ?? []).map((post) => ({
        ...post,
        likes: likeCounts.get(post.id) ?? 0,
        comments: commentMap.get(post.id) ?? [],
      })));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (user) void fetchPosts();
    else setLoading(false);
  }, [fetchPosts, user]);

  useEffect(() => {
    localStorage.setItem("agrisetu.community-draft", JSON.stringify(newPost));
  }, [newPost]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.text.trim()) return;
    const { error } = await supabase.from("community_posts").insert({
      author_id: user.id,
      author_name: profile?.display_name || user.email || "Farmer",
      text: newPost.text,
      image_url: newPost.image.trim() || null,
    });
    if (error) {
      toast({ title: "Could not create post", description: error.message, variant: "destructive" });
      return;
    }
    await fetchPosts();
    setNewPost({ text: "", image: "" });
    localStorage.removeItem("agrisetu.community-draft");
    toast({ title: "Posted!" });
  };

  const handleLike = async (id: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    const result = existing
      ? await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", user.id)
      : await supabase.from("post_likes").insert({ post_id: id, user_id: user.id });
    if (result.error) {
      toast({ title: "Could not update like", description: result.error.message, variant: "destructive" });
      return;
    }
    await fetchPosts();
  };

  const handleComment = async (id: string) => {
    const text = commentInputs[id]?.trim();
    if (!user || !text) return;
    const { error } = await supabase.from("post_comments").insert({
      post_id: id,
      author_id: user.id,
      author_name: profile?.display_name || user.email || "Farmer",
      text,
    });
    if (error) {
      toast({ title: "Could not add comment", description: error.message, variant: "destructive" });
      return;
    }
    await fetchPosts();
    setCommentInputs({ ...commentInputs, [id]: "" });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-xl pb-24 md:pb-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="h-7 w-7 text-primary" />
        Community
      </h1>

      {/* New post */}
      <Card className="mb-6 rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-5">
          {!user && <p className="text-sm text-muted-foreground mb-3">{t("loginToPost")}</p>}
          <form onSubmit={handlePost} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">Y</div>
              <Textarea
                disabled={!user}
                placeholder={`${t("communityPrompt")} 🌾`}
                value={newPost.text} 
                onChange={(e) => setNewPost({ ...newPost, text: e.target.value })} 
                rows={3} 
                className="rounded-xl border-border/50 resize-none bg-muted/50 focus:bg-card" 
              />
            </div>
            <div className="flex items-center justify-between pl-13">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Image URL" 
                  value={newPost.image} 
                  onChange={(e) => setNewPost({ ...newPost, image: e.target.value })} 
                  className="rounded-xl text-sm h-9 w-48 border-border/50"
                />
                <Image className="h-5 w-5 text-muted-foreground" />
              </div>
              <Button type="submit" className="rounded-2xl" disabled={!user}>Post</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-4">
        {loading && <p className="text-muted-foreground">{t("loading")}</p>}
        {!loading && !user && <p className="text-muted-foreground">Log in to view the community.</p>}
        {!loading && user && posts.length === 0 && <p className="text-muted-foreground">{t("noPosts")}</p>}
        {posts.map((post) => (
          <Card key={post.id} className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {post.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{post.author_name}</p>
                    <p className="text-muted-foreground text-xs">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Image */}
              {post.image_url && <img src={post.image_url} alt="" className="w-full max-h-80 object-cover" />}

              {/* Content */}
              <div className="p-4 pt-3">
                <p className="text-sm mb-3 leading-relaxed">{post.text}</p>

                {/* Actions */}
                <div className="flex items-center gap-5 mb-3">
                  <button aria-label={`${t("like")} ${post.author_name}`} onClick={() => handleLike(post.id)} className="flex min-h-11 items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Heart className="h-5 w-5" aria-hidden="true" /> <span className="text-sm font-medium">{post.likes}</span>
                  </button>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-5 w-5" /> <span className="text-sm font-medium">{post.comments.length}</span>
                  </span>
                </div>

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="space-y-2 mb-3 bg-muted/40 rounded-xl p-3">
                    {post.comments.map((c, i) => (
                      <p key={c.id} className="text-sm"><span className="font-semibold">{c.author_name}</span> {c.text}</p>
                    ))}
                  </div>
                )}

                {/* Comment input */}
                <div className="flex gap-2">
                  <Input
                    placeholder={t("postComment")}
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                    className="rounded-xl border-border/50 text-sm h-9"
                  />
                  <Button aria-label={t("comment")} size="sm" variant="ghost" className="rounded-xl h-9 px-3" onClick={() => handleComment(post.id)}>
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Community;
