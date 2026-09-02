REVOKE EXECUTE ON FUNCTION public.can_join_room(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_join_room(uuid) TO service_role;