
REVOKE EXECUTE ON FUNCTION public.is_room_participant(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.room_participant_count(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_room_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.room_participant_count(uuid) TO authenticated;
