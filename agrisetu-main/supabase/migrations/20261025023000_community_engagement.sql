-- Phase 2 community engagement. Keep this migration append-only.

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL CHECK (length(btrim(author_name)) BETWEEN 1 AND 120),
  text TEXT NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
ON public.post_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own comments"
ON public.post_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own comments"
ON public.post_comments FOR DELETE TO authenticated
USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can view likes"
ON public.post_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like as themselves"
ON public.post_likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
ON public.post_likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX post_comments_post_created_idx
ON public.post_comments (post_id, created_at);

CREATE INDEX post_likes_post_idx
ON public.post_likes (post_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
  END IF;
END;
$$;
