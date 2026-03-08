
-- Function to register as mentor (adds role securely)
CREATE OR REPLACE FUNCTION public.register_as_mentor(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only add if not already a mentor
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'mentor') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'mentor');
  END IF;
  RETURN true;
END;
$$;
