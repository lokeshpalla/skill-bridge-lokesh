REVOKE SELECT ON public.coding_problems FROM authenticated, anon;
GRANT SELECT (id, title, description, difficulty, category, starter_code, test_cases, xp_reward, created_at) ON public.coding_problems TO authenticated;

DROP POLICY IF EXISTS "Authenticated can read own realtime channels" ON realtime.messages;
CREATE POLICY "Authenticated can read own realtime channels"
ON realtime.messages FOR SELECT TO authenticated
USING (
  (realtime.topic() = ('notifications:'::text || (auth.uid())::text))
  OR (
    (realtime.topic() ~ '^dm:[0-9a-fA-F-]{36}:[0-9a-fA-F-]{36}$'::text)
    AND (
      (split_part(realtime.topic(), ':'::text, 2) = (auth.uid())::text)
      OR (split_part(realtime.topic(), ':'::text, 3) = (auth.uid())::text)
    )
  )
  OR (
    (realtime.topic() ~~ 'interview:%'::text)
    AND EXISTS (
      SELECT 1 FROM interview_schedules s
      WHERE ((s.id)::text = split_part(realtime.topic(), ':'::text, 2))
        AND ((s.candidate_id = auth.uid()) OR (s.recruiter_id = auth.uid()))
    )
  )
);