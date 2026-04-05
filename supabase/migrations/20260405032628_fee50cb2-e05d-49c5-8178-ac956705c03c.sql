
-- 1. Fix certificate self-issuance: replace INSERT policy with SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can insert own certificates" ON public.course_certificates;

CREATE OR REPLACE FUNCTION public.issue_certificate(p_course_id integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result course_exam_results%ROWTYPE;
  v_cert_id uuid;
  v_course_title text;
BEGIN
  -- Check user passed the exam
  SELECT * INTO v_result FROM course_exam_results
  WHERE user_id = auth.uid() AND course_id = p_course_id AND passed = true
  ORDER BY completed_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam not passed for this course';
  END IF;

  -- Check certificate doesn't already exist
  IF EXISTS (SELECT 1 FROM course_certificates WHERE user_id = auth.uid() AND course_id = p_course_id) THEN
    RAISE EXCEPTION 'Certificate already issued';
  END IF;

  -- Get course title from exam result or use a default
  v_course_title := 'Course ' || p_course_id;

  INSERT INTO course_certificates (user_id, course_id, course_title, grade, percentage)
  VALUES (auth.uid(), p_course_id, v_course_title, v_result.grade, v_result.percentage)
  RETURNING id INTO v_cert_id;

  RETURN v_cert_id;
END;
$$;
