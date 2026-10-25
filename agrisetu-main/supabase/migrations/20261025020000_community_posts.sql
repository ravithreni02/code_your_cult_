-- Phase 2 community persistence. Keep this migration append-only.

CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL CHECK (length(btrim(author_name)) BETWEEN 1 AND 120),
  text TEXT NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 2000),
  image_url TEXT CHECK (image_url IS NULL OR length(image_url) <= 2048),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view community posts"
ON public.community_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own community posts"
ON public.community_posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own community posts"
ON public.community_posts FOR UPDATE TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own community posts"
ON public.community_posts FOR DELETE TO authenticated
USING (auth.uid() = author_id);

CREATE INDEX community_posts_created_idx
ON public.community_posts (created_at DESC);
