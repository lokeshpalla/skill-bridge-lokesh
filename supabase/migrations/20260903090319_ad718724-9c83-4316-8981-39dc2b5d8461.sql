DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;
CREATE POLICY "Users can join rooms"
  ON public.room_participants FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.collaboration_rooms r
      WHERE r.id = room_id
        AND r.is_active = true
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_room_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  room_limit integer;
  active_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.room_id::text, 0));

  SELECT max_participants
  INTO room_limit
  FROM public.collaboration_rooms
  WHERE id = NEW.room_id
    AND is_active = true;

  IF room_limit IS NULL THEN
    RAISE EXCEPTION 'Room is not active';
  END IF;

  SELECT count(*)::integer
  INTO active_count
  FROM public.room_participants
  WHERE room_id = NEW.room_id
    AND left_at IS NULL
    AND last_seen_at > now() - interval '90 seconds';

  IF active_count >= room_limit THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_room_capacity_before_insert ON public.room_participants;
CREATE TRIGGER enforce_room_capacity_before_insert
  BEFORE INSERT ON public.room_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_room_capacity();

REVOKE EXECUTE ON FUNCTION public.can_join_room(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_room_capacity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_room_capacity() TO service_role;