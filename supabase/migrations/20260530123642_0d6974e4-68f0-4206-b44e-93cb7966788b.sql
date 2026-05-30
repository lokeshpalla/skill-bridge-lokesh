
-- 1. Restrict coding_problems.solution column to admins only
REVOKE SELECT ON public.coding_problems FROM authenticated, anon;
GRANT SELECT (id, title, description, category, difficulty, test_cases, starter_code, xp_reward, created_at)
  ON public.coding_problems TO authenticated;

-- 2. Restrict room_messages SELECT to participants of that room
DROP POLICY IF EXISTS "Room messages viewable by authenticated" ON public.room_messages;
CREATE POLICY "Room participants can view messages"
  ON public.room_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_messages.room_id
        AND rp.user_id = auth.uid()
    )
  );

-- 3. Restrict Realtime room:* topic subscriptions to actual participants
DROP POLICY IF EXISTS "Authenticated users can subscribe to rooms" ON realtime.messages;
DROP POLICY IF EXISTS "Room participants can subscribe" ON realtime.messages;
CREATE POLICY "Room participants can subscribe"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    CASE
      WHEN realtime.topic() LIKE 'room:%' THEN
        EXISTS (
          SELECT 1 FROM public.room_participants rp
          WHERE rp.room_id::text = split_part(realtime.topic(), ':', 2)
            AND rp.user_id = auth.uid()
        )
      ELSE true
    END
  );
