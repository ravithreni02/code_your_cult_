-- Expose only identity fields needed by marketplace cards.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT user_id, display_name, avatar_url
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '' CHECK (char_length(comment) <= 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Marketplace reviews are publicly readable" ON public.marketplace_reviews;
CREATE POLICY "Marketplace reviews are publicly readable"
  ON public.marketplace_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Customers can review completed bookings" ON public.marketplace_reviews;
CREATE POLICY "Customers can review completed bookings"
  ON public.marketplace_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.booker_id = auth.uid()
        AND b.provider_id = provider_id
        AND b.status = 'completed'
    )
  );
DROP POLICY IF EXISTS "Reviewers can update their own reviews" ON public.marketplace_reviews;
CREATE POLICY "Reviewers can update their own reviews"
  ON public.marketplace_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
DROP POLICY IF EXISTS "Reviewers can delete their own reviews" ON public.marketplace_reviews;
CREATE POLICY "Reviewers can delete their own reviews"
  ON public.marketplace_reviews FOR DELETE USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS marketplace_reviews_provider_idx
  ON public.marketplace_reviews(provider_id);
