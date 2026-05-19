CREATE OR REPLACE FUNCTION public.register_as_mentor(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'Forbidden: can only register yourself as a mentor';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'mentor') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'mentor');
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_activity(_user_id uuid, _xp_amount integer, _minutes_spent integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := CURRENT_DATE;
  _last_date date;
  _current_streak integer;
  _current_xp integer;
  _total_xp integer;
  _new_streak integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'Forbidden: cannot record activity for another user';
  END IF;
  -- Cap incoming xp to prevent abuse
  IF _xp_amount < 0 THEN _xp_amount := 0; END IF;
  IF _xp_amount > 500 THEN _xp_amount := 500; END IF;
  IF _minutes_spent < 0 THEN _minutes_spent := 0; END IF;
  IF _minutes_spent > 240 THEN _minutes_spent := 240; END IF;

  SELECT last_active_date, streak, xp INTO _last_date, _current_streak, _current_xp
  FROM public.profiles WHERE user_id = _user_id;

  _total_xp := _xp_amount + (_minutes_spent * 2);

  IF _last_date IS NULL OR _last_date < _today - INTERVAL '1 day' THEN
    _new_streak := 1;
  ELSIF _last_date = _today - INTERVAL '1 day' THEN
    _new_streak := _current_streak + 1;
  ELSE
    _new_streak := _current_streak;
  END IF;

  UPDATE public.profiles
  SET xp = xp + _total_xp,
      streak = _new_streak,
      last_active_date = _today,
      updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'xp_earned', _total_xp,
    'new_streak', _new_streak,
    'streak_increased', _new_streak > _current_streak
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_streak(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_xp integer;
  _current_streak integer;
  _last_date date;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'Forbidden: cannot restore streak for another user';
  END IF;

  SELECT xp, streak, last_active_date INTO _current_xp, _current_streak, _last_date
  FROM public.profiles WHERE user_id = _user_id;

  IF _current_xp < 1000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough XP. Need 1000 XP.');
  END IF;

  IF _current_streak > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Streak is not broken.');
  END IF;

  UPDATE public.profiles
  SET xp = xp - 1000,
      streak = 1,
      last_active_date = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('success', true, 'xp_spent', 1000, 'new_streak', 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.award_badge(p_user_id uuid, p_badge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If called from an authenticated client (not a trigger / service role), only allow self
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden: cannot award badges to other users';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM badges WHERE id = p_badge_id) THEN
    RAISE EXCEPTION 'Badge does not exist';
  END IF;

  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN;
  END IF;

  INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, p_badge_id);
END;
$$;