-- Phase 1 security hardening. Keep this migration append-only.

-- Role changes must go through a validated function. Finance provider access is
-- intentionally excluded from self-service role requests.
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can delete their own roles"
ON public.user_roles FOR DELETE
USING (auth.uid() = user_id AND role <> 'finance_provider');

CREATE OR REPLACE FUNCTION public.request_role(requested_role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF requested_role = 'finance_provider' THEN
    RAISE EXCEPTION 'Finance provider access requires administrator approval';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), requested_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN requested_role;
END;
$$;

REVOKE ALL ON FUNCTION public.request_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_role(public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_role_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_role_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Profiles are private; callers that need public identity fields use the
-- narrow view instead of selecting phone or location from the base table.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT user_id, display_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Booking fields that identify the parties and price are immutable after insert.
DROP POLICY IF EXISTS "Providers can update booking status" ON public.bookings;
CREATE POLICY "Bookers can cancel pending bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = booker_id AND status = 'pending')
WITH CHECK (auth.uid() = booker_id AND status = 'rejected');

CREATE POLICY "Providers can update booking status"
ON public.bookings FOR UPDATE
USING (auth.uid() = provider_id AND status IN ('pending', 'confirmed'))
WITH CHECK (
  auth.uid() = provider_id
  AND status IN ('confirmed', 'rejected', 'completed')
);

CREATE OR REPLACE FUNCTION public.prevent_booking_tampering()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.booker_id IS DISTINCT FROM OLD.booker_id
    OR NEW.provider_id IS DISTINCT FROM OLD.provider_id
    OR NEW.item_id IS DISTINCT FROM OLD.item_id
    OR NEW.price IS DISTINCT FROM OLD.price
    OR NEW.booking_type IS DISTINCT FROM OLD.booking_type
    OR NEW.item_name IS DISTINCT FROM OLD.item_name
    OR NEW.booking_date IS DISTINCT FROM OLD.booking_date THEN
    RAISE EXCEPTION 'Booking identity and price cannot be changed';
  END IF;

  IF NEW.status = 'completed' AND OLD.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed bookings can be completed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_booking_tampering ON public.bookings;
CREATE TRIGGER prevent_booking_tampering
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.prevent_booking_tampering();

CREATE UNIQUE INDEX IF NOT EXISTS bookings_item_date_unique
ON public.bookings (item_id, booking_date)
WHERE item_id IS NOT NULL AND booking_date IS NOT NULL
  AND status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS bookings_provider_status_idx
ON public.bookings (provider_id, status);

-- Notification rows are created only by trusted database functions/triggers.
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE OR REPLACE FUNCTION public.create_notification(
  recipient_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  IF recipient_id IS NULL OR notification_title IS NULL OR notification_message IS NULL THEN
    RAISE EXCEPTION 'Notification recipient and content are required';
  END IF;
  IF length(notification_title) > 160 OR length(notification_message) > 2000 THEN
    RAISE EXCEPTION 'Notification content is too long';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (recipient_id, notification_title, notification_message, notification_type)
  RETURNING id INTO notification_id;
  RETURN notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;

-- Restrict client updates to the read flag only.
CREATE OR REPLACE FUNCTION public.prevent_notification_tampering()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.message IS DISTINCT FROM OLD.message
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Notification content cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_notification_tampering ON public.notifications;
CREATE TRIGGER prevent_notification_tampering
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.prevent_notification_tampering();

-- Loan amounts and durations are constrained at the database boundary.
ALTER TABLE public.finance_requests
  DROP CONSTRAINT IF EXISTS finance_requests_amount_positive,
  DROP CONSTRAINT IF EXISTS finance_requests_duration_valid;

ALTER TABLE public.finance_requests
  ADD CONSTRAINT finance_requests_amount_positive
    CHECK (amount > 0 AND amount <> 'NaN'::numeric),
  ADD CONSTRAINT finance_requests_duration_valid
    CHECK (duration BETWEEN 1 AND 60);

CREATE INDEX IF NOT EXISTS finance_requests_provider_status_idx
ON public.finance_requests (status, created_at DESC);

DROP POLICY IF EXISTS "Finance providers can view all requests" ON public.finance_requests;
CREATE POLICY "Finance providers can view all requests"
ON public.finance_requests FOR SELECT
USING (public.has_role(auth.uid(), 'finance_provider'));

CREATE POLICY "Finance providers can update request status"
ON public.finance_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'finance_provider'))
WITH CHECK (
  public.has_role(auth.uid(), 'finance_provider')
  AND status IN ('pending', 'approved', 'rejected')
);

CREATE OR REPLACE FUNCTION public.prevent_finance_request_tampering()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.amount IS DISTINCT FROM OLD.amount
    OR NEW.duration IS DISTINCT FROM OLD.duration THEN
    RAISE EXCEPTION 'Borrower and loan terms cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_finance_request_tampering ON public.finance_requests;
CREATE TRIGGER prevent_finance_request_tampering
BEFORE UPDATE ON public.finance_requests
FOR EACH ROW EXECUTE FUNCTION public.prevent_finance_request_tampering();

CREATE INDEX IF NOT EXISTS user_roles_user_id_role_idx
ON public.user_roles (user_id, role);
