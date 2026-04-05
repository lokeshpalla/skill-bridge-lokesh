
-- 4. Fix mentor_profiles public exposure (earnings, etc.)
DROP POLICY IF EXISTS "Mentor profiles are viewable by everyone" ON public.mentor_profiles;

CREATE POLICY "Mentor profiles viewable by authenticated"
  ON public.mentor_profiles FOR SELECT TO authenticated
  USING (true);
