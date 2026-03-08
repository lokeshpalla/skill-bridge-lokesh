
-- ============================================================
-- SkillBridge Nexus Phase 1 Schema
-- ============================================================

-- Utility: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ── ROLES ───────────────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('student', 'mentor', 'recruiter', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ── PROFILES ────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_ts BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── COURSES ─────────────────────────────────────────────────
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'Beginner',
  duration TEXT,
  image_emoji TEXT DEFAULT '📚',
  modules JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_courses_ts BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── COURSE ENROLLMENTS ──────────────────────────────────────
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_modules JSONB NOT NULL DEFAULT '[]',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollments" ON public.course_enrollments FOR UPDATE USING (auth.uid() = user_id);

-- ── CODING PROBLEMS ─────────────────────────────────────────
CREATE TABLE public.coding_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Easy',
  category TEXT NOT NULL DEFAULT 'Arrays',
  starter_code TEXT,
  test_cases JSONB NOT NULL DEFAULT '[]',
  solution TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Problems are viewable by everyone" ON public.coding_problems FOR SELECT USING (true);
CREATE POLICY "Admins can manage problems" ON public.coding_problems FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── CODING SUBMISSIONS ──────────────────────────────────────
CREATE TABLE public.coding_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem_id UUID REFERENCES public.coding_problems(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  status TEXT NOT NULL DEFAULT 'pending',
  runtime_ms INTEGER,
  xp_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coding_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own submissions" ON public.coding_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit" ON public.coding_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── MENTOR PROFILES ─────────────────────────────────────────
CREATE TABLE public.mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT,
  skills TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC(10,2),
  rating NUMERIC(3,2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  available BOOLEAN DEFAULT true,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentor profiles are viewable by everyone" ON public.mentor_profiles FOR SELECT USING (true);
CREATE POLICY "Mentors can update own profile" ON public.mentor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Mentors can insert own profile" ON public.mentor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── MENTOR BOOKINGS ─────────────────────────────────────────
CREATE TABLE public.mentor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mentor_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.mentor_bookings FOR SELECT USING (auth.uid() = student_id OR auth.uid() = mentor_id);
CREATE POLICY "Students can create bookings" ON public.mentor_bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants can update bookings" ON public.mentor_bookings FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = mentor_id);

-- ── INTERNSHIPS ─────────────────────────────────────────────
CREATE TABLE public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT DEFAULT 'Remote',
  duration TEXT,
  description TEXT,
  skills_required TEXT[] DEFAULT '{}',
  logo_emoji TEXT DEFAULT '🏢',
  posted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internships are viewable by everyone" ON public.internships FOR SELECT USING (true);
CREATE POLICY "Recruiters can post internships" ON public.internships FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'));

-- ── INTERNSHIP APPLICATIONS ─────────────────────────────────
CREATE TABLE public.internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  cover_letter TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, internship_id)
);
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own applications" ON public.internship_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can apply" ON public.internship_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── PORTFOLIO PROJECTS ──────────────────────────────────────
CREATE TABLE public.portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  live_url TEXT,
  github_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portfolio projects are viewable by everyone" ON public.portfolio_projects FOR SELECT USING (true);
CREATE POLICY "Users can manage own projects" ON public.portfolio_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.portfolio_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.portfolio_projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_portfolio_ts BEFORE UPDATE ON public.portfolio_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX idx_submissions_user ON public.coding_submissions(user_id);
CREATE INDEX idx_submissions_problem ON public.coding_submissions(problem_id);
CREATE INDEX idx_bookings_student ON public.mentor_bookings(student_id);
CREATE INDEX idx_bookings_mentor ON public.mentor_bookings(mentor_id);
CREATE INDEX idx_applications_user ON public.internship_applications(user_id);
CREATE INDEX idx_portfolio_user ON public.portfolio_projects(user_id);
