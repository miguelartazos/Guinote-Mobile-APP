-- Grants for rejoin RPCs
GRANT EXECUTE ON FUNCTION public.soft_leave_room(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_room(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rejoinable_rooms() TO authenticated;


