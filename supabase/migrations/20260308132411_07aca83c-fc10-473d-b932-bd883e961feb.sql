
-- Interview scheduling table for recruiters
CREATE TABLE public.interview_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.internship_applications(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 30,
  meeting_link text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;

-- Recruiters can manage interviews for their internships
CREATE POLICY "Recruiters can manage own interviews"
  ON public.interview_schedules FOR ALL
  USING (auth.uid() = recruiter_id)
  WITH CHECK (auth.uid() = recruiter_id);

-- Candidates can view their interviews
CREATE POLICY "Candidates can view own interviews"
  ON public.interview_schedules FOR SELECT
  USING (auth.uid() = candidate_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_schedules;
