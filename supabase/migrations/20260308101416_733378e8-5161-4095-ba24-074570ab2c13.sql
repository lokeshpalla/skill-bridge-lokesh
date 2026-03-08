
-- Add last_active_date to profiles for streak tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date date;

-- Create function to update streak and award XP based on activity
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
  -- Get current profile data
  SELECT last_active_date, streak, xp INTO _last_date, _current_streak, _current_xp
  FROM public.profiles WHERE user_id = _user_id;

  -- Calculate time-based bonus XP (2 XP per minute spent)
  _total_xp := _xp_amount + (_minutes_spent * 2);

  -- Calculate new streak
  IF _last_date IS NULL OR _last_date < _today - INTERVAL '1 day' THEN
    -- Streak broken or first activity, start at 1
    _new_streak := 1;
  ELSIF _last_date = _today - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    _new_streak := _current_streak + 1;
  ELSE
    -- Same day, keep streak
    _new_streak := _current_streak;
  END IF;

  -- Update profile
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
