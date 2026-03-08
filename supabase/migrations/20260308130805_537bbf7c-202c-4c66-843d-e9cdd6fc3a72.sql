
CREATE OR REPLACE FUNCTION public.restore_streak(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_xp integer;
  _current_streak integer;
  _last_date date;
BEGIN
  SELECT xp, streak, last_active_date INTO _current_xp, _current_streak, _last_date
  FROM public.profiles WHERE user_id = _user_id;

  -- Must have at least 1000 XP
  IF _current_xp < 1000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough XP. Need 1000 XP.');
  END IF;

  -- Streak must be broken (0) to restore
  IF _current_streak > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Streak is not broken.');
  END IF;

  -- Deduct 1000 XP and set streak to 1
  UPDATE public.profiles
  SET xp = xp - 1000,
      streak = 1,
      last_active_date = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('success', true, 'xp_spent', 1000, 'new_streak', 1);
END;
$$;
