-- Meeting room production hardening

CREATE OR REPLACE FUNCTION public.can_join_room(_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaboration_rooms r
    WHERE r.id = _room_id
      AND r.is_active = true
      AND (
        SELECT count(*)
        FROM public.room_participants p
        WHERE p.room_id = _room_id
          AND p.left_at IS NULL
      ) < r.max_participants
  )
$$;

GRANT EXECUTE ON FUNCTION public.can_join_room(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_join_room(uuid) TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS uq_room_participant_active
  ON public.room_participants (room_id, user_id)
  WHERE left_at IS NULL;

DROP POLICY IF EXISTS "Creators can update rooms" ON public.collaboration_rooms;
CREATE POLICY "Creators can update rooms"
  ON public.collaboration_rooms FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;
CREATE POLICY "Users can join rooms"
  ON public.room_participants FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_join_room(room_id)
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.room_messages;
CREATE POLICY "Users can send messages"
  ON public.room_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND length(btrim(content)) BETWEEN 1 AND 2000
    AND EXISTS (
      SELECT 1
      FROM public.collaboration_rooms r
      WHERE r.id = room_id
        AND r.is_active = true
    )
    AND public.is_room_participant(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "Room participants can subscribe" ON realtime.messages;
CREATE POLICY "Room participants can subscribe"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    CASE
      WHEN realtime.topic() LIKE 'room-%' OR realtime.topic() LIKE 'room:%' THEN
        EXISTS (
          SELECT 1
          FROM public.room_participants rp
          WHERE rp.room_id::text = substring(realtime.topic() from 6)
            AND rp.user_id = auth.uid()
            AND rp.left_at IS NULL
        )
      ELSE true
    END
  );