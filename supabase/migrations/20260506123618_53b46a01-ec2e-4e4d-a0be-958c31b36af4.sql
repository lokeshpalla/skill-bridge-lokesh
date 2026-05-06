
-- ===== 1. profiles: hide email/phone from other users =====
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own full profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public view exposing only non-PII fields (no email/phone)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT user_id, display_name, avatar_url, bio, skills, xp, streak,
       github_url, linkedin_url, portfolio_url, created_at, last_active_date
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- ===== 2. course_certificates: remove public access =====
DROP POLICY IF EXISTS "Certificates viewable publicly" ON public.course_certificates;

CREATE POLICY "Certificates viewable by authenticated"
  ON public.course_certificates FOR SELECT TO authenticated
  USING (true);

-- ===== 3. user_roles: prevent self-privilege escalation =====
-- Only admins can insert/update/delete role assignments.
-- (handle_new_user inserts default 'student' via SECURITY DEFINER, bypasses RLS.)
CREATE POLICY "Only admins can assign roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ===== 4. mentor_profiles: hide total_earnings from other users =====
DROP POLICY IF EXISTS "Mentor profiles viewable by authenticated" ON public.mentor_profiles;

CREATE POLICY "Mentors can view own full profile"
  ON public.mentor_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mentor profiles"
  ON public.mentor_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public view excluding total_earnings
CREATE OR REPLACE VIEW public.public_mentor_profiles
WITH (security_invoker = true) AS
SELECT id, user_id, title, company, skills, hourly_rate, rating,
       total_sessions, available, bio, created_at, availability_slots, weekly_pattern
FROM public.mentor_profiles;

GRANT SELECT ON public.public_mentor_profiles TO authenticated, anon;

-- ===== 5. project_files: scope to authenticated + project members =====
DROP POLICY IF EXISTS "Project files viewable by authenticated" ON public.project_files;

CREATE POLICY "Project members can view files"
  ON public.project_files FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_project_members gpm
      WHERE gpm.project_id = project_files.project_id
        AND gpm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_projects gp
      WHERE gp.id = project_files.project_id
        AND gp.owner_id = auth.uid()
    )
  );

-- ===== 6. storage: team-projects bucket membership check =====
DROP POLICY IF EXISTS "Authenticated users can view team project files" ON storage.objects;

CREATE POLICY "Members can view own project files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'team-projects'
    AND EXISTS (
      SELECT 1 FROM public.group_project_members gpm
      WHERE gpm.user_id = auth.uid()
        AND gpm.project_id::text = (storage.foldername(objects.name))[1]
    )
  );

-- ===== 7. Revoke EXECUTE on trigger-only SECURITY DEFINER functions =====
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_interview_completed() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_badge_earned() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_welcome() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_mentor_booking() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_course_enrolled() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_new_application() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_booking_status_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_payment_on_completion() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.award_badge(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, integer, integer) FROM anon, authenticated, public;

-- ===== 8. Realtime: scope subscriptions to participants only =====
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own realtime channels" ON realtime.messages;
CREATE POLICY "Authenticated can read own realtime channels"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    -- Notifications channel: notifications:<user_id>
    (realtime.topic() = 'notifications:' || auth.uid()::text)
    OR
    -- Direct messages: dm:<userA>:<userB> (sorted ids); allow if uid present
    (realtime.topic() LIKE 'dm:%' AND realtime.topic() LIKE '%' || auth.uid()::text || '%')
    OR
    -- Interview schedule: interview:<schedule_id>
    (realtime.topic() LIKE 'interview:%' AND EXISTS (
      SELECT 1 FROM public.interview_schedules s
      WHERE s.id::text = split_part(realtime.topic(), ':', 2)
        AND (s.candidate_id = auth.uid() OR s.recruiter_id = auth.uid())
    ))
    OR
    -- Public collaboration rooms (intentionally open)
    (realtime.topic() LIKE 'room:%')
  );
