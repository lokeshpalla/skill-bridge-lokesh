-- ============ Performance indexes ============
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_dm_sender_created ON public.direct_messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver_created ON public.direct_messages (receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts (is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON public.forum_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON public.forum_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user ON public.forum_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_user ON public.forum_votes (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON public.chat_conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON public.chat_messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_room_messages_room ON public.room_messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON public.room_participants (room_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rooms_active ON public.collaboration_rooms (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_user ON public.mock_interviews (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mock_interview_messages_iv ON public.mock_interview_messages (interview_id, created_at);

CREATE INDEX IF NOT EXISTS idx_course_notes_user_course ON public.course_notes (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_exam_results_user ON public.course_exam_results (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_user ON public.course_certificates (user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses (category);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_paths_user ON public.user_learning_paths (user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participation_user ON public.challenge_participation (user_id);

CREATE INDEX IF NOT EXISTS idx_applications_internship ON public.internship_applications (internship_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_internships_created ON public.internships (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internships_posted_by ON public.internships (posted_by);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_recruiter ON public.interview_schedules (recruiter_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_candidate ON public.interview_schedules (candidate_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentor_payments_mentor ON public.mentor_payments (mentor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor ON public.mentor_reviews (mentor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_available ON public.mentor_profiles (available, rating DESC);

CREATE INDEX IF NOT EXISTS idx_problem_solves_user_time ON public.problem_solves (user_id, solved_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_time ON public.coding_submissions (user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_coding_problems_difficulty ON public.coding_problems (difficulty, category);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_created ON public.portfolio_projects (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_files_project ON public.project_files (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_project_members_user ON public.group_project_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_projects_status ON public.group_projects (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements (active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON public.profiles (created_at);

-- ============ Admin analytics aggregated server-side ============
CREATE OR REPLACE FUNCTION public.admin_platform_analytics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _res jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'monthlyUsers', (
      SELECT coalesce(jsonb_agg(t ORDER BY t->>'month'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('month', to_char(date_trunc('month', created_at), 'YYYY-MM'), 'count', count(*)) AS t
        FROM profiles WHERE created_at > now() - interval '12 months'
        GROUP BY 1 ORDER BY 1
      ) s
    ),
    'monthlyEnrollments', (
      SELECT coalesce(jsonb_agg(t ORDER BY t->>'month'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('month', to_char(date_trunc('month', enrolled_at), 'YYYY-MM'), 'count', count(*)) AS t
        FROM course_enrollments WHERE enrolled_at > now() - interval '12 months'
        GROUP BY 1 ORDER BY 1
      ) s
    ),
    'monthlySubmissions', (
      SELECT coalesce(jsonb_agg(t ORDER BY t->>'month'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('month', to_char(date_trunc('month', submitted_at), 'YYYY-MM'), 'count', count(*)) AS t
        FROM coding_submissions WHERE submitted_at > now() - interval '12 months'
        GROUP BY 1 ORDER BY 1
      ) s
    ),
    'monthlyPosts', (
      SELECT coalesce(jsonb_agg(t ORDER BY t->>'month'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('month', to_char(date_trunc('month', created_at), 'YYYY-MM'), 'count', count(*)) AS t
        FROM forum_posts WHERE created_at > now() - interval '12 months'
        GROUP BY 1 ORDER BY 1
      ) s
    ),
    'monthlyRevenue', (
      SELECT coalesce(jsonb_agg(t ORDER BY t->>'month'), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('month', to_char(date_trunc('month', created_at), 'YYYY-MM'), 'total', coalesce(sum(amount),0)) AS t
        FROM mentor_payments WHERE created_at > now() - interval '12 months'
        GROUP BY 1 ORDER BY 1
      ) s
    ),
    'statusData', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('name', status, 'value', c)), '[]'::jsonb)
      FROM (SELECT status, count(*) c FROM coding_submissions GROUP BY status) s
    ),
    'bookingData', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('name', status, 'value', c)), '[]'::jsonb)
      FROM (SELECT status, count(*) c FROM mentor_bookings GROUP BY status) s
    ),
    'xpDist', jsonb_build_array(
      jsonb_build_object('name', '0-100',   'value', (SELECT count(*) FROM profiles WHERE xp >= 0 AND xp < 100)),
      jsonb_build_object('name', '100-500', 'value', (SELECT count(*) FROM profiles WHERE xp >= 100 AND xp < 500)),
      jsonb_build_object('name', '500-1K',  'value', (SELECT count(*) FROM profiles WHERE xp >= 500 AND xp < 1000)),
      jsonb_build_object('name', '1K-5K',   'value', (SELECT count(*) FROM profiles WHERE xp >= 1000 AND xp < 5000)),
      jsonb_build_object('name', '5K+',     'value', (SELECT count(*) FROM profiles WHERE xp >= 5000))
    )
  ) INTO _res;

  RETURN _res;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_platform_analytics() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_platform_analytics() TO authenticated;