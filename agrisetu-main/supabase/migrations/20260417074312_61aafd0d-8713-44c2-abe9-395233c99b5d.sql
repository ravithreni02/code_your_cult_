-- 1. Allow users to delete their own role rows (needed for "remove role" in settings)
CREATE POLICY "Users can delete their own roles"
ON public.user_roles
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Backfill: grant 'customer' role to every existing user that doesn't have it yet
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'customer'::app_role FROM auth.users
ON CONFLICT DO NOTHING;

-- 3. Update signup trigger:
--    - Always insert 'customer' role
--    - Also insert any role from raw_user_meta_data.role (single)
--    - Also insert any roles from raw_user_meta_data.roles (array of text)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r text;
BEGIN
  -- Always grant customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::app_role)
  ON CONFLICT DO NOTHING;

  -- Single role field (legacy)
  IF NEW.raw_user_meta_data ? 'role' THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role)
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;

  -- Array of roles
  IF NEW.raw_user_meta_data ? 'roles' THEN
    FOR r IN SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'roles')
    LOOP
      BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, r::app_role)
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN others THEN NULL;
      END;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- 4. Make sure the trigger is attached (re-create to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Also ensure profile trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();