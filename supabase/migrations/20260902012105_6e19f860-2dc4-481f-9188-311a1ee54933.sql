ALTER TABLE public.room_participants
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

UPDATE public.room_participants
SET last_seen_at = COALESCE(left_at, joined_at, now())
WHERE last_seen_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_room_participants_presence
  ON public.room_participants (room_id, last_seen_at)
  WHERE left_at IS NULL;

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
          AND p.last_seen_at > now() - interval '90 seconds'
      ) < r.max_participants
  )
$$;

CREATE OR REPLACE FUNCTION public.room_participant_count(_room_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.room_participants
  WHERE room_id = _room_id
    AND left_at IS NULL
    AND last_seen_at > now() - interval '90 seconds'
$$;

REVOKE EXECUTE ON FUNCTION public.can_join_room(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_join_room(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.room_participant_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.room_participant_count(uuid) TO authenticated, service_role;