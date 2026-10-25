-- Phase 2 booking handoff. Keep this migration append-only.

CREATE OR REPLACE FUNCTION public.notify_booking_parties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.provider_id IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.provider_id,
      'New booking request',
      format('A farmer requested %s for %s.', NEW.item_name, COALESCE(NEW.booking_date::text, 'a selected date')),
      'booking'
    );
  END IF;

  PERFORM public.create_notification(
    NEW.booker_id,
    'Booking request created',
    format('Your request for %s is pending provider approval.', NEW.item_name),
    'booking'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_booking_parties ON public.bookings;
CREATE TRIGGER notify_booking_parties
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_parties();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$$;
