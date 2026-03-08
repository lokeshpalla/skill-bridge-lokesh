
-- Payment tracking table for mentor sessions
CREATE TABLE public.mentor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.mentor_bookings(id) ON DELETE CASCADE NOT NULL,
  mentor_id uuid NOT NULL,
  student_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'platform_credit',
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE public.mentor_payments ENABLE ROW LEVEL SECURITY;

-- Mentors can view their own payments
CREATE POLICY "Mentors can view own payments"
  ON public.mentor_payments FOR SELECT
  USING (auth.uid() = mentor_id);

-- Students can view own payments
CREATE POLICY "Students can view own payments"
  ON public.mentor_payments FOR SELECT
  USING (auth.uid() = student_id);

-- Admins can manage all payments
CREATE POLICY "Admins can manage payments"
  ON public.mentor_payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-create payment record when booking is completed
CREATE OR REPLACE FUNCTION public.create_payment_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rate numeric;
  _duration integer;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get mentor hourly rate
    SELECT hourly_rate INTO _rate FROM public.mentor_profiles WHERE user_id = NEW.mentor_id;
    _duration := NEW.duration_min;
    
    INSERT INTO public.mentor_payments (booking_id, mentor_id, student_id, amount, status)
    VALUES (
      NEW.id,
      NEW.mentor_id,
      NEW.student_id,
      COALESCE(_rate, 0) * (_duration::numeric / 60.0),
      'pending'
    );

    -- Update mentor total_sessions and total_earnings
    UPDATE public.mentor_profiles 
    SET total_sessions = COALESCE(total_sessions, 0) + 1,
        total_earnings = COALESCE(total_earnings, 0) + (COALESCE(_rate, 0) * (_duration::numeric / 60.0))
    WHERE user_id = NEW.mentor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_completed_payment
  AFTER UPDATE ON public.mentor_bookings
  FOR EACH ROW EXECUTE FUNCTION public.create_payment_on_completion();
