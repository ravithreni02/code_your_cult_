
-- Create availability table for calendar tracking
CREATE TABLE public.availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Everyone can view availability (customers need to see who's free)
CREATE POLICY "Anyone can view availability"
ON public.availability FOR SELECT
USING (true);

-- Users can manage their own availability
CREATE POLICY "Users can insert own availability"
ON public.availability FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own availability"
ON public.availability FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own availability"
ON public.availability FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for bookings and availability
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability;
