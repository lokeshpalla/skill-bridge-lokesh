
-- Learning paths (curated sequences of courses)
CREATE TABLE public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon_emoji text DEFAULT '🎯',
  difficulty text NOT NULL DEFAULT 'Beginner',
  estimated_hours integer DEFAULT 40,
  course_ids uuid[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learning paths viewable by everyone" ON public.learning_paths FOR SELECT USING (true);
CREATE POLICY "Admins can manage paths" ON public.learning_paths FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User learning path enrollment
CREATE TABLE public.user_learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  current_course_index integer NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, path_id)
);

ALTER TABLE public.user_learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own path progress" ON public.user_learning_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll in paths" ON public.user_learning_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own path progress" ON public.user_learning_paths FOR UPDATE USING (auth.uid() = user_id);
