-- Keep profile settings editable while preventing clients from fabricating activity metrics.
REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, bio, skills, github_url, linkedin_url, portfolio_url, avatar_url)
  ON TABLE public.profiles TO authenticated;

-- Course rows are limited to their creator and administrators.
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Creators and admins can view courses"
  ON public.courses FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Challenges and learning paths are administrator-only per the selected access rule.
DROP POLICY IF EXISTS "Challenges viewable by everyone" ON public.seasonal_challenges;
CREATE POLICY "Admins can view challenges"
  ON public.seasonal_challenges FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Learning paths viewable by everyone" ON public.learning_paths;
CREATE POLICY "Admins can view learning paths"
  ON public.learning_paths FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
CREATE POLICY "Admins can view badges"
  ON public.badges FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Reviews are readable only by the authoring student and the associated mentor.
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.mentor_reviews;
CREATE POLICY "Reviewers and mentors can view reviews"
  ON public.mentor_reviews FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM public.mentor_profiles mp
      WHERE mp.id = mentor_reviews.mentor_id
        AND mp.user_id = auth.uid()
    )
  );

-- Only the posting recruiter can view their own internship listing; admins retain oversight.
DROP POLICY IF EXISTS "Internships are viewable by everyone" ON public.internships;
CREATE POLICY "Recruiters can view own internships"
  ON public.internships FOR SELECT TO authenticated
  USING (
    (auth.uid() = posted_by AND public.has_role(auth.uid(), 'recruiter'::public.app_role))
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Community content is author-only as selected.
DROP POLICY IF EXISTS "Forum posts viewable by everyone" ON public.forum_posts;
CREATE POLICY "Authors can view own forum posts"
  ON public.forum_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.forum_comments;
CREATE POLICY "Authors can view own forum comments"
  ON public.forum_comments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Project owners and actual members are the only users who can see projects or membership lists.
CREATE OR REPLACE FUNCTION public.user_can_access_group_project(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_projects gp
    WHERE gp.id = _project_id
      AND (
        gp.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.group_project_members gpm
          WHERE gpm.project_id = gp.id AND gpm.user_id = auth.uid()
        )
      )
  )
$$;
REVOKE ALL ON FUNCTION public.user_can_access_group_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_group_project(uuid) TO authenticated;

DROP POLICY IF EXISTS "Group projects viewable by everyone" ON public.group_projects;
CREATE POLICY "Project owners and members can view projects"
  ON public.group_projects FOR SELECT TO authenticated
  USING (public.user_can_access_group_project(id));

DROP POLICY IF EXISTS "Members viewable by everyone" ON public.group_project_members;
CREATE POLICY "Project owners and members can view membership lists"
  ON public.group_project_members FOR SELECT TO authenticated
  USING (public.user_can_access_group_project(project_id));

-- Portfolio projects remain private to their owner.
DROP POLICY IF EXISTS "Portfolio projects are viewable by everyone" ON public.portfolio_projects;
CREATE POLICY "Owners can view own portfolio projects"
  ON public.portfolio_projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Former participants lose room-chat access immediately; ended-room history stays creator-scoped.
DROP POLICY IF EXISTS "Room participants can view messages" ON public.room_messages;
CREATE POLICY "Active participants and room creators can view messages"
  ON public.room_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_messages.room_id
        AND rp.user_id = auth.uid()
        AND rp.left_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.collaboration_rooms r
      WHERE r.id = room_messages.room_id
        AND r.created_by = auth.uid()
        AND r.is_active = false
    )
  );