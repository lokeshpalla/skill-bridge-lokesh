
-- Track first-solve dedup per user/problem (uses text key to support local problem ids)
CREATE TABLE IF NOT EXISTS public.problem_solves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_ref text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Easy',
  xp_awarded integer NOT NULL DEFAULT 0,
  solved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, problem_ref)
);

GRANT SELECT, INSERT ON public.problem_solves TO authenticated;
GRANT ALL ON public.problem_solves TO service_role;

ALTER TABLE public.problem_solves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own solves"
  ON public.problem_solves FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- No client INSERT policy — only the RPC (security definer) writes here.

CREATE OR REPLACE FUNCTION public.award_problem_xp(
  _problem_ref text,
  _difficulty text,
  _minutes_spent integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _xp integer;
  _result jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Server-decided XP per difficulty (client cannot inflate)
  _xp := CASE lower(coalesce(_difficulty, 'easy'))
    WHEN 'hard' THEN 80
    WHEN 'medium' THEN 40
    ELSE 20
  END;

  IF _minutes_spent < 0 THEN _minutes_spent := 0; END IF;
  IF _minutes_spent > 60 THEN _minutes_spent := 60; END IF;

  -- Idempotent: only first solve per problem awards XP
  BEGIN
    INSERT INTO public.problem_solves (user_id, problem_ref, difficulty, xp_awarded)
    VALUES (_uid, _problem_ref, _difficulty, _xp);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('already_solved', true, 'xp_earned', 0);
  END;

  _result := public.record_activity(_uid, _xp, _minutes_spent);
  RETURN _result || jsonb_build_object('already_solved', false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.award_problem_xp(text, text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.award_problem_xp(text, text, integer) TO authenticated;
