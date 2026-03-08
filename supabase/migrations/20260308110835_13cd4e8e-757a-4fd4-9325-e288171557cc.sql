
-- Create storage bucket for team project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-projects', 'team-projects', true)
ON CONFLICT (id) DO NOTHING;

-- Create table to track project files with metadata
CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.group_projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  folder_path text NOT NULL DEFAULT '',
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Everyone can view project files
CREATE POLICY "Project files viewable by authenticated" ON public.project_files
  FOR SELECT USING (true);

-- Project owner can manage files
CREATE POLICY "Project owner can insert files" ON public.project_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_projects
      WHERE id = project_files.project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owner can delete files" ON public.project_files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.group_projects
      WHERE id = project_files.project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owner can update files" ON public.project_files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_projects
      WHERE id = project_files.project_id AND owner_id = auth.uid()
    )
  );

-- Storage RLS policies
CREATE POLICY "Authenticated users can view team project files"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-projects');

CREATE POLICY "Project owners can upload team project files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'team-projects' AND auth.role() = 'authenticated');

CREATE POLICY "Project owners can delete team project files"
ON storage.objects FOR DELETE
USING (bucket_id = 'team-projects' AND auth.role() = 'authenticated');
