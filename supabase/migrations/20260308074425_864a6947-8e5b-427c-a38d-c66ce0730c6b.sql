
-- Mock interviews
CREATE TABLE public.mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL DEFAULT 'general',
  difficulty text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'in_progress',
  score integer,
  feedback text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interviews" ON public.mock_interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create interviews" ON public.mock_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interviews" ON public.mock_interviews FOR UPDATE USING (auth.uid() = user_id);

-- Interview messages
CREATE TABLE public.mock_interview_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES public.mock_interviews(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_interview_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interview messages" ON public.mock_interview_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.mock_interviews WHERE id = mock_interview_messages.interview_id AND user_id = auth.uid()
  ));
CREATE POLICY "Users can insert interview messages" ON public.mock_interview_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.mock_interviews WHERE id = mock_interview_messages.interview_id AND user_id = auth.uid()
  ));
