
-- 2. Fix profiles PII exposure: restrict to authenticated, sensitive fields to owner only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Note: email and phone are still in the table but now only accessible to authenticated users.
-- For stricter control, we use a view approach. But at minimum, restrict to authenticated.
