
-- Badges table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_emoji text DEFAULT '🏅',
  category text NOT NULL DEFAULT 'general',
  requirement_type text NOT NULL DEFAULT 'manual',
  requirement_value integer DEFAULT 0,
  xp_reward integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage badges" ON public.badges
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User badges (earned)
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "System can insert user badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seasonal challenges
CREATE TABLE public.seasonal_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon_emoji text DEFAULT '🎯',
  challenge_type text NOT NULL DEFAULT 'solve_problems',
  target_value integer NOT NULL DEFAULT 10,
  xp_reward integer DEFAULT 500,
  badge_id uuid REFERENCES public.badges(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seasonal_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by everyone" ON public.seasonal_challenges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage challenges" ON public.seasonal_challenges
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Challenge participation
CREATE TABLE public.challenge_participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.seasonal_challenges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.challenge_participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own participation" ON public.challenge_participation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges" ON public.challenge_participation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON public.challenge_participation
  FOR UPDATE USING (auth.uid() = user_id);
