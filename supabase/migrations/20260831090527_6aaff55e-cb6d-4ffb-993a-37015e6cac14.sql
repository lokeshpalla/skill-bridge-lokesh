
-- 1) course_exam_results: clients may only READ their own rows.
--    Writes happen exclusively inside the grade-course-exam edge function (service role),
--    which holds the answer keys and computes score/grade/passed server-side.
DROP POLICY IF EXISTS "Users can manage own exam results" ON public.course_exam_results;
DROP POLICY IF EXISTS "Users can view own exam results" ON public.course_exam_results;
CREATE POLICY "Users can view own exam results"
  ON public.course_exam_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.course_exam_results FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.course_exam_results FROM anon;
GRANT SELECT ON public.course_exam_results TO authenticated;

-- 2) coding_problems: hide the solution column from non-admins.
--    Base table is no longer directly readable by authenticated users; they read the
--    solution-free view instead. Admins keep full access via the existing admin policy.
REVOKE SELECT ON public.coding_problems FROM authenticated;
REVOKE SELECT ON public.coding_problems FROM anon;
DROP POLICY IF EXISTS "Problems are viewable by authenticated" ON public.coding_problems;

CREATE OR REPLACE VIEW public.coding_problems_public
WITH (security_barrier = true) AS
SELECT id, title, description, difficulty, category, starter_code, test_cases, xp_reward, created_at
FROM public.coding_problems;

GRANT SELECT ON public.coding_problems_public TO authenticated;

-- 3) room_participants: presence only visible to members of that room (or its creator).
CREATE OR REPLACE FUNCTION public.is_room_participant(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_id = _room_id AND user_id = _user_id AND left_at IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.collaboration_rooms
    WHERE id = _room_id AND created_by = _user_id
  )
$$;

DROP POLICY IF EXISTS "Participants viewable by authenticated" ON public.room_participants;
DROP POLICY IF EXISTS "Participants viewable by room members" ON public.room_participants;
CREATE POLICY "Participants viewable by room members"
  ON public.room_participants FOR SELECT TO authenticated
  USING (public.is_room_participant(room_id, auth.uid()));

-- Lobby needs an anonymous-safe headcount without exposing who is inside.
CREATE OR REPLACE FUNCTION public.room_participant_count(_room_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.room_participants
  WHERE room_id = _room_id AND left_at IS NULL
$$;

GRANT EXECUTE ON FUNCTION public.is_room_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.room_participant_count(uuid) TO authenticated;
