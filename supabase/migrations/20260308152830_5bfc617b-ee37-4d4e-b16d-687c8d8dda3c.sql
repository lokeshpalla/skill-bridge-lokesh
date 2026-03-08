
-- Trigger to notify recruiters when they receive a new application
CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _internship_title text;
  _recruiter_id uuid;
  _applicant_name text;
BEGIN
  SELECT title, posted_by INTO _internship_title, _recruiter_id
  FROM public.internships WHERE id = NEW.internship_id;

  SELECT display_name INTO _applicant_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  IF _recruiter_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
    VALUES (
      _recruiter_id,
      'application',
      'New Application! 📩',
      COALESCE(_applicant_name, 'A student') || ' applied for ' || COALESCE(_internship_title, 'your posting') || '.',
      '📩',
      '/recruiter'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_application
  AFTER INSERT ON public.internship_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_application();
