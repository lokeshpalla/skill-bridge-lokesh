ALTER TABLE public.collaboration_rooms
  ADD COLUMN IF NOT EXISTS meeting_code TEXT;

ALTER TABLE public.collaboration_rooms
  ALTER COLUMN meeting_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 3) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

UPDATE public.collaboration_rooms
SET meeting_code = upper(substr(replace(id::text, '-', ''), 1, 3) || '-' || substr(replace(id::text, '-', ''), 4, 4))
WHERE meeting_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS collaboration_rooms_meeting_code_key
  ON public.collaboration_rooms (meeting_code)
  WHERE meeting_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collaboration_rooms_meeting_code
  ON public.collaboration_rooms (lower(meeting_code));