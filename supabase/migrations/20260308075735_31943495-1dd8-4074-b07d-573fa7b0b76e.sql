
-- Trigger: notify on badge earned
CREATE OR REPLACE FUNCTION public.notify_badge_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_name TEXT;
  badge_emoji TEXT;
BEGIN
  SELECT name, icon_emoji INTO badge_name, badge_emoji
  FROM public.badges WHERE id = NEW.badge_id;

  INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
  VALUES (
    NEW.user_id,
    'achievement',
    'Badge Earned: ' || COALESCE(badge_name, 'New Badge'),
    'Congratulations! You earned the ' || COALESCE(badge_name, '') || ' badge.',
    COALESCE(badge_emoji, '🏅'),
    '/achievements'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_badge_earned
  AFTER INSERT ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_badge_earned();

-- Trigger: notify on course enrollment
CREATE OR REPLACE FUNCTION public.notify_course_enrolled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_title TEXT;
  course_emoji TEXT;
BEGIN
  SELECT title, image_emoji INTO course_title, course_emoji
  FROM public.courses WHERE id = NEW.course_id;

  INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
  VALUES (
    NEW.user_id,
    'course',
    'Enrolled in ' || COALESCE(course_title, 'a course'),
    'You have successfully enrolled. Start learning now!',
    COALESCE(course_emoji, '📚'),
    '/courses/' || NEW.course_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_course_enrolled
  AFTER INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_course_enrolled();

-- Trigger: notify on mock interview completed
CREATE OR REPLACE FUNCTION public.notify_interview_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
    VALUES (
      NEW.user_id,
      'interview',
      'Interview Completed!',
      'Your ' || COALESCE(NEW.topic, 'mock') || ' interview scored ' || COALESCE(NEW.score::TEXT, 'N/A') || '/100.',
      '🎯',
      '/interview'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_interview_completed
  AFTER UPDATE ON public.mock_interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_interview_completed();

-- Trigger: welcome notification on profile creation
CREATE OR REPLACE FUNCTION public.notify_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
  VALUES (
    NEW.user_id,
    'welcome',
    'Welcome to SkillBridge! 🎉',
    'Start your learning journey by exploring courses, practicing coding, or connecting with mentors.',
    '🚀',
    '/dashboard'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_welcome();
