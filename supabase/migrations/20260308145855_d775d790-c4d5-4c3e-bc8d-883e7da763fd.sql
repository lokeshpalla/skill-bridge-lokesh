
-- Trigger: Notify mentor when a student books a session
CREATE OR REPLACE FUNCTION public.notify_mentor_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  student_name TEXT;
  mentor_user_id UUID;
BEGIN
  -- Get student display name
  SELECT display_name INTO student_name
  FROM public.profiles WHERE user_id = NEW.student_id;

  -- Get mentor's user_id from mentor_profiles
  SELECT user_id INTO mentor_user_id
  FROM public.mentor_profiles WHERE user_id = NEW.mentor_id;

  -- Insert notification for the mentor
  INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
  VALUES (
    COALESCE(mentor_user_id, NEW.mentor_id),
    'booking',
    'New Session Booking! 📅',
    COALESCE(student_name, 'A student') || ' booked a session on ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM') || '.',
    '📅',
    '/mentor-dashboard'
  );

  -- Also notify the student of their booking confirmation
  INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
  VALUES (
    NEW.student_id,
    'booking',
    'Session Booked! ✅',
    'Your mentor session is scheduled for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM') || '.',
    '✅',
    '/mentors'
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_mentor_booking_created
  AFTER INSERT ON public.mentor_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mentor_booking();

-- Also notify mentor when booking status changes (accepted/declined by mentor, or completed)
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mentor_name TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get mentor display name
  SELECT p.display_name INTO mentor_name
  FROM public.profiles p WHERE p.user_id = NEW.mentor_id;

  IF NEW.status = 'confirmed' THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
    VALUES (
      NEW.student_id,
      'booking',
      'Session Confirmed! 🎉',
      COALESCE(mentor_name, 'Your mentor') || ' confirmed your session on ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM') || '.',
      '🎉',
      '/mentors'
    );
  ELSIF NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
    VALUES (
      NEW.student_id,
      'booking',
      'Session Cancelled ❌',
      'Your session on ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH:MI AM') || ' was cancelled.',
      '❌',
      '/mentors'
    );
  ELSIF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, type, title, message, icon_emoji, link)
    VALUES (
      NEW.student_id,
      'booking',
      'Session Completed! ⭐',
      'Your session with ' || COALESCE(mentor_name, 'your mentor') || ' is complete. Leave a review!',
      '⭐',
      '/mentors'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.mentor_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_status_change();
