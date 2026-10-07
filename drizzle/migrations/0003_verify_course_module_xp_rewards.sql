CREATE OR REPLACE FUNCTION public.complete_course_module(p_course_id uuid, p_module_index integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_modules jsonb;
  v_module_count integer;
  v_enrollment public.course_enrollments%ROWTYPE;
  v_updated_modules jsonb;
  v_progress integer;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_course_id IS NULL OR p_module_index IS NULL OR p_module_index < 0 THEN
    RAISE EXCEPTION 'Invalid course module';
  END IF;

  SELECT c.modules INTO v_modules
  FROM public.courses c
  WHERE c.id = p_course_id;
  IF NOT FOUND OR jsonb_typeof(v_modules) <> 'array' THEN
    RAISE EXCEPTION 'Invalid course';
  END IF;
  v_module_count := jsonb_array_length(v_modules);
  IF v_module_count = 0 OR p_module_index >= v_module_count THEN
    RAISE EXCEPTION 'Invalid course module';
  END IF;

  SELECT ce.* INTO v_enrollment
  FROM public.course_enrollments ce
  WHERE ce.user_id = v_user_id AND ce.course_id = p_course_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course enrollment required';
  END IF;

  IF COALESCE(v_enrollment.completed_modules, '[]'::jsonb) @> jsonb_build_array(p_module_index) THEN
    RETURN jsonb_build_object(
      'already_completed', true,
      'xp_earned', 0,
      'progress', v_enrollment.progress,
      'completed_modules', v_enrollment.completed_modules
    );
  END IF;

  v_updated_modules := COALESCE(v_enrollment.completed_modules, '[]'::jsonb) || jsonb_build_array(p_module_index);
  v_progress := LEAST(100, ROUND((jsonb_array_length(v_updated_modules)::numeric / v_module_count) * 100)::integer);

  UPDATE public.course_enrollments
  SET completed_modules = v_updated_modules,
      progress = v_progress,
      completed_at = CASE WHEN v_progress = 100 THEN COALESCE(completed_at, now()) ELSE NULL END
  WHERE id = v_enrollment.id;

  v_result := public.record_activity(v_user_id, 50, 0);
  RETURN v_result || jsonb_build_object(
    'already_completed', false,
    'progress', v_progress,
    'completed_modules', v_updated_modules
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_course_module(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_course_module(uuid, integer) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.record_activity(uuid, integer, integer) FROM PUBLIC, anon, authenticated;