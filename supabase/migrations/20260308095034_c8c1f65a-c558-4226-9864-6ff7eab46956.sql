
CREATE TABLE public.exam_proctoring_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id integer NOT NULL,
  event_type text NOT NULL DEFAULT 'unknown',
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_proctoring_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own proctoring logs"
ON public.exam_proctoring_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own proctoring logs"
ON public.exam_proctoring_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all proctoring logs"
ON public.exam_proctoring_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_proctoring_user_course ON public.exam_proctoring_logs(user_id, course_id);
