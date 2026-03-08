
-- Collaboration rooms
CREATE TABLE public.collaboration_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT DEFAULT 'general',
  max_participants INTEGER NOT NULL DEFAULT 6,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.collaboration_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms viewable by authenticated users"
ON public.collaboration_rooms FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create rooms"
ON public.collaboration_rooms FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update rooms"
ON public.collaboration_rooms FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete rooms"
ON public.collaboration_rooms FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Room participants
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_audio_on BOOLEAN NOT NULL DEFAULT true,
  is_video_on BOOLEAN NOT NULL DEFAULT true,
  is_screen_sharing BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants viewable by authenticated"
ON public.room_participants FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can join rooms"
ON public.room_participants FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participant"
ON public.room_participants FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.room_participants FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Room chat messages
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room messages viewable by authenticated"
ON public.room_messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can send messages"
ON public.room_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for all three tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
