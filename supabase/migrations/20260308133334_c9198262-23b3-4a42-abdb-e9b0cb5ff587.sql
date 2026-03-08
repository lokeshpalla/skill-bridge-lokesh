
-- Mentor reviews table
CREATE TABLE public.mentor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentor_profiles(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.mentor_bookings(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id, student_id)
);

ALTER TABLE public.mentor_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Reviews viewable by everyone"
  ON public.mentor_reviews FOR SELECT USING (true);

-- Students can create reviews for their own bookings
CREATE POLICY "Students can create reviews"
  ON public.mentor_reviews FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Add availability_slots to mentor_profiles
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS availability_slots text[] DEFAULT '{}';

-- Add earnings tracking
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS total_earnings numeric DEFAULT 0;
