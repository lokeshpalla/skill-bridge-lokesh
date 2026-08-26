CREATE OR REPLACE FUNCTION public.award_problem_xp(_problem_ref text, _difficulty text, _minutes_spent integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _xp integer;
  _result jsonb;
  _diff text;
  _db_diff text;
  _today_count integer;
  _today_xp integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _problem_ref := trim(coalesce(_problem_ref, ''));
  IF _problem_ref = '' OR length(_problem_ref) > 64 THEN
    RAISE EXCEPTION 'Invalid problem reference';
  END IF;

  -- Validate the reference: must be a real coding_problems UUID
  -- or a known local catalog id (integer 1..4000).
  IF _problem_ref ~ '^[0-9a-fA-F-]{36}$' THEN
    SELECT lower(difficulty) INTO _db_diff
    FROM public.coding_problems WHERE id::text = _problem_ref;
    IF _db_diff IS NULL THEN
      RAISE EXCEPTION 'Invalid problem reference';
    END IF;
    -- Difficulty is taken from the database, never from the client
    _diff := _db_diff;
  ELSIF _problem_ref ~ '^[0-9]{1,4}$' AND _problem_ref::integer BETWEEN 1 AND 4000 THEN
    _diff := lower(coalesce(_difficulty, 'easy'));
    IF _diff NOT IN ('easy', 'medium', 'hard') THEN
      _diff := 'easy';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid problem reference';
  END IF;

  -- Aggregate daily caps to prevent scripted XP farming
  SELECT count(*), coalesce(sum(xp_awarded), 0)
  INTO _today_count, _today_xp
  FROM public.problem_solves
  WHERE user_id = _uid AND solved_at >= (now() - interval '24 hours');

  IF _today_count >= 25 OR _today_xp >= 800 THEN
    RETURN jsonb_build_object('already_solved', false, 'xp_earned', 0, 'rate_limited', true);
  END IF;

  _xp := CASE _diff
    WHEN 'hard' THEN 80
    WHEN 'medium' THEN 40
    ELSE 20
  END;

  IF _minutes_spent < 0 THEN _minutes_spent := 0; END IF;
  IF _minutes_spent > 60 THEN _minutes_spent := 60; END IF;

  BEGIN
    INSERT INTO public.problem_solves (user_id, problem_ref, difficulty, xp_awarded)
    VALUES (_uid, _problem_ref, _diff, _xp);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('already_solved', true, 'xp_earned', 0);
  END;

  _result := public.record_activity(_uid, _xp, _minutes_spent);
  RETURN _result || jsonb_build_object('already_solved', false);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.award_problem_xp(text, text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.award_problem_xp(text, text, integer) TO authenticated;