-- 1. course_certificates: remove the over-permissive "viewable by authenticated" policy
DROP POLICY IF EXISTS "Certificates viewable by authenticated" ON public.course_certificates;

-- 2. coding_problems: restrict reads to authenticated users and hide the solution column from non-admins
DROP POLICY IF EXISTS "Problems are viewable by everyone" ON public.coding_problems;
CREATE POLICY "Problems are viewable by authenticated"
  ON public.coding_problems
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT (solution) ON public.coding_problems FROM anon, authenticated;
-- Admins keep full access via the existing "Admins can manage problems" ALL policy + table-level grant via has_role

-- 3. realtime.messages: tighten the DM topic check so users can only join their own DM channels
DROP POLICY IF EXISTS "Authenticated can read own realtime channels" ON realtime.messages;
CREATE POLICY "Authenticated can read own realtime channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = ('notifications:' || auth.uid()::text)
    OR (
      realtime.topic() ~ '^dm:[0-9a-fA-F-]{36}:[0-9a-fA-F-]{36}$'
      AND (
        split_part(realtime.topic(), ':', 2) = auth.uid()::text
        OR split_part(realtime.topic(), ':', 3) = auth.uid()::text
      )
    )
    OR (
      realtime.topic() ~~ 'interview:%'
      AND EXISTS (
        SELECT 1 FROM public.interview_schedules s
        WHERE s.id::text = split_part(realtime.topic(), ':', 2)
          AND (s.candidate_id = auth.uid() OR s.recruiter_id = auth.uid())
      )
    )
    OR realtime.topic() ~~ 'room:%'
  );

-- 4. team-projects storage bucket: let project owners access their own files
CREATE POLICY "Project owners can view team-project files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'team-projects'
    AND EXISTS (
      SELECT 1 FROM public.group_projects gp
      WHERE gp.owner_id = auth.uid()
        AND gp.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Project owners can upload team-project files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'team-projects'
    AND EXISTS (
      SELECT 1 FROM public.group_projects gp
      WHERE gp.owner_id = auth.uid()
        AND gp.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Project owners can update team-project files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'team-projects'
    AND EXISTS (
      SELECT 1 FROM public.group_projects gp
      WHERE gp.owner_id = auth.uid()
        AND gp.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Project owners can delete team-project files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'team-projects'
    AND EXISTS (
      SELECT 1 FROM public.group_projects gp
      WHERE gp.owner_id = auth.uid()
        AND gp.id::text = (storage.foldername(name))[1]
    )
  );