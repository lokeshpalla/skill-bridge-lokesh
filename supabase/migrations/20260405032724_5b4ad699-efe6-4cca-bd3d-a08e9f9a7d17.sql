
-- 3a. Fix team-projects storage policies
DROP POLICY IF EXISTS "Project owners can upload team project files" ON storage.objects;
DROP POLICY IF EXISTS "Project owners can delete team project files" ON storage.objects;

CREATE POLICY "Members can upload to own project"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'team-projects' AND
    EXISTS (
      SELECT 1 FROM public.group_project_members
      WHERE user_id = auth.uid()
      AND project_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Members can delete from own project"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'team-projects' AND
    EXISTS (
      SELECT 1 FROM public.group_project_members
      WHERE user_id = auth.uid()
      AND project_id::text = (storage.foldername(name))[1]
    )
  );

-- 3b. Fix user_badges self-award: replace INSERT policy with SECURITY DEFINER function
DROP POLICY IF EXISTS "System can insert user badges" ON public.user_badges;

CREATE OR REPLACE FUNCTION public.award_badge(p_user_id uuid, p_badge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow awarding if badge exists
  IF NOT EXISTS (SELECT 1 FROM badges WHERE id = p_badge_id) THEN
    RAISE EXCEPTION 'Badge does not exist';
  END IF;

  -- Prevent duplicates
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN;
  END IF;

  INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, p_badge_id);
END;
$$;

-- 3c. Fix mentor reviews: require completed booking, prevent duplicates
DROP POLICY IF EXISTS "Students can create reviews" ON public.mentor_reviews;

CREATE POLICY "Students can review completed sessions"
  ON public.mentor_reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM public.mentor_bookings
      WHERE id = mentor_reviews.booking_id
      AND student_id = auth.uid()
      AND mentor_id = mentor_reviews.mentor_id
      AND status = 'completed'
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.mentor_reviews mr2
      WHERE mr2.booking_id = mentor_reviews.booking_id
      AND mr2.student_id = auth.uid()
    )
  );
