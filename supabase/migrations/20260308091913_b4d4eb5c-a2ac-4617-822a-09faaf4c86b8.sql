
-- Course notes/bookmarks table
CREATE TABLE public.course_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id INTEGER NOT NULL,
  module_index INTEGER NOT NULL,
  timestamp_seconds INTEGER DEFAULT 0,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON public.course_notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Course exam results table
CREATE TABLE public.course_exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'F',
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exam results" ON public.course_exam_results
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Certificates table
CREATE TABLE public.course_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id INTEGER NOT NULL,
  course_title TEXT NOT NULL,
  grade TEXT NOT NULL,
  percentage NUMERIC NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_number TEXT NOT NULL DEFAULT ('CERT-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates" ON public.course_certificates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificates" ON public.course_certificates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Certificates viewable publicly" ON public.course_certificates
  FOR SELECT
  USING (true);
