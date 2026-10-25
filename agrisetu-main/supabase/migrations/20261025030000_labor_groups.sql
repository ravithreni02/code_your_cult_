-- Phase 2 group labour persistence. Keep this migration append-only.

CREATE TABLE public.labor_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL CHECK (length(btrim(group_name)) BETWEEN 2 AND 120),
  workers INTEGER NOT NULL CHECK (workers BETWEEN 1 AND 1000),
  price NUMERIC NOT NULL CHECK (price > 0 AND price <> 'NaN'::numeric),
  availability BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.labor_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view labor groups"
ON public.labor_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Group leaders can create labor groups"
ON public.labor_groups FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = provider_id
  AND public.has_role(auth.uid(), 'group_leader')
);

CREATE POLICY "Group leaders can update their groups"
ON public.labor_groups FOR UPDATE TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Group leaders can delete their groups"
ON public.labor_groups FOR DELETE TO authenticated
USING (auth.uid() = provider_id);

CREATE INDEX labor_groups_provider_created_idx
ON public.labor_groups (provider_id, created_at DESC);

CREATE TRIGGER update_labor_groups_updated_at
BEFORE UPDATE ON public.labor_groups
FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

CREATE OR REPLACE FUNCTION public.set_booking_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_type = 'equipment' THEN
    SELECT owner_id INTO NEW.provider_id FROM public.equipment WHERE id::text = NEW.item_id;
  ELSIF NEW.booking_type = 'labor' THEN
    SELECT provider_id INTO NEW.provider_id FROM public.labor_profiles WHERE id::text = NEW.item_id;
  ELSIF NEW.booking_type = 'group_labor' THEN
    SELECT provider_id INTO NEW.provider_id FROM public.labor_groups WHERE id::text = NEW.item_id;
  END IF;

  IF NEW.provider_id IS NULL THEN
    RAISE EXCEPTION 'The selected listing does not exist';
  END IF;
  RETURN NEW;
END;
$$;
