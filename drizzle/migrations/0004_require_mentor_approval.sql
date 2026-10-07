ALTER TABLE public.mentor_profiles ADD COLUMN approval_status text;
UPDATE public.mentor_profiles SET approval_status = 'approved' WHERE approval_status IS NULL;
ALTER TABLE public.mentor_profiles ALTER COLUMN approval_status SET DEFAULT 'pending';
ALTER TABLE public.mentor_profiles ALTER COLUMN approval_status SET NOT NULL;

CREATE OR REPLACE VIEW public.public_mentor_profiles WITH (security_barrier = true) AS
SELECT mp.id,
    mp.user_id,
    mp.title,
    mp.company,
    mp.skills,
    mp.hourly_rate,
    mp.rating,
    mp.total_sessions,
    mp.available,
    mp.bio,
    mp.created_at,
    mp.availability_slots,
    mp.weekly_pattern
FROM public.mentor_profiles mp
WHERE mp.approval_status = 'approved'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = mp.user_id
      AND ur.role = 'mentor'::public.app_role
  );

CREATE OR REPLACE FUNCTION public.register_as_mentor(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Mentor access requires administrator approval';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.register_as_mentor(uuid) FROM PUBLIC, anon, authenticated;

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
      available = CASE WHEN _approve THEN available ELSE false END
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