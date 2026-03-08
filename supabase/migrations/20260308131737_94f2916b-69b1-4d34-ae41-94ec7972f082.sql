
-- Add resume_url to internship_applications
ALTER TABLE public.internship_applications ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE public.internship_applications ADD COLUMN IF NOT EXISTS portfolio_url text;

-- Allow recruiters to view applications for their posted internships
CREATE POLICY "Recruiters can view applications for their internships"
ON public.internship_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.internships
    WHERE internships.id = internship_applications.internship_id
    AND internships.posted_by = auth.uid()
  )
);

-- Allow recruiters to update application status
CREATE POLICY "Recruiters can update application status"
ON public.internship_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.internships
    WHERE internships.id = internship_applications.internship_id
    AND internships.posted_by = auth.uid()
  )
);

-- Allow recruiters to manage (update/delete) their own internships
CREATE POLICY "Recruiters can update own internships"
ON public.internships
FOR UPDATE
TO authenticated
USING (auth.uid() = posted_by);

CREATE POLICY "Recruiters can delete own internships"
ON public.internships
FOR DELETE
TO authenticated
USING (auth.uid() = posted_by);
