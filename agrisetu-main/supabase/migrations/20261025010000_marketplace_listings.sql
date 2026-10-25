-- Phase 2 marketplace foundation. Keep this migration append-only.

CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  price NUMERIC NOT NULL CHECK (price > 0 AND price <> 'NaN'::numeric),
  availability BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.labor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  skill TEXT NOT NULL CHECK (length(btrim(skill)) BETWEEN 2 AND 120),
  wage NUMERIC NOT NULL CHECK (wage > 0 AND wage <> 'NaN'::numeric),
  availability BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view equipment"
ON public.equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Equipment providers can create listings"
ON public.equipment FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND public.has_role(auth.uid(), 'machinery_provider')
);

CREATE POLICY "Equipment owners can update listings"
ON public.equipment FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Equipment owners can delete listings"
ON public.equipment FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can view labor profiles"
ON public.labor_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Labor providers can create profiles"
ON public.labor_profiles FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = provider_id
  AND (
    public.has_role(auth.uid(), 'labor')
    OR public.has_role(auth.uid(), 'group_leader')
  )
);

CREATE POLICY "Labor providers can update profiles"
ON public.labor_profiles FOR UPDATE TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Labor providers can delete profiles"
ON public.labor_profiles FOR DELETE TO authenticated
USING (auth.uid() = provider_id);

CREATE INDEX equipment_owner_created_idx
ON public.equipment (owner_id, created_at DESC);

CREATE INDEX labor_profiles_provider_created_idx
ON public.labor_profiles (provider_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_booking_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_type = 'equipment' THEN
    SELECT owner_id INTO NEW.provider_id
    FROM public.equipment
    WHERE id::text = NEW.item_id;
  ELSIF NEW.booking_type IN ('labor', 'group_labor') THEN
    SELECT provider_id INTO NEW.provider_id
    FROM public.labor_profiles
    WHERE id::text = NEW.item_id;
  END IF;

  IF NEW.provider_id IS NULL THEN
    RAISE EXCEPTION 'The selected listing does not exist';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_booking_provider ON public.bookings;
CREATE TRIGGER set_booking_provider
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_booking_provider();

CREATE OR REPLACE FUNCTION public.update_marketplace_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();

CREATE TRIGGER update_labor_profiles_updated_at
BEFORE UPDATE ON public.labor_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_updated_at();
