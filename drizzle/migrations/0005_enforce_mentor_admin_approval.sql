CREATE OR REPLACE FUNCTION public.enforce_mentor_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    IF TG_OP = 'INSERT' THEN
      IF auth.uid() IS DISTINCT FROM NEW.user_id THEN
        RAISE EXCEPTION 'You may only submit your own mentor application';
      END IF;
      NEW.approval_status := 'pending';
      NEW.available := false;
    ELSIF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      RAISE EXCEPTION 'Only an administrator can change mentor approval status';
    END IF;
  END IF;

  IF NEW.approval_status <> 'approved' THEN
    NEW.available := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_mentor_approval_fields_before_write
BEFORE INSERT OR UPDATE ON public.mentor_profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_mentor_approval_fields();

CREATE OR REPLACE FUNCTION public.admin_review_mentor(_user_id uuid, _approve boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden: administrator approval required';
  END IF;

  UPDATE public.mentor_profiles
  SET approval_status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
      available = CASE WHEN _approve THEN COALESCE(available, false) ELSE false END
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentor application not found';
  END IF;

  IF _approve THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'mentor'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = _user_id AND role = 'mentor'::public.app_role;
  END IF;

  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_review_mentor(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_mentor(uuid, boolean) TO authenticated;