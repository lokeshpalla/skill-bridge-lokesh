import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Mic, MicOff, VideoIcon, VideoOff, Monitor, MonitorOff,
  Phone, Send, MessageSquare, Users, ChevronRight
} from "lucide-react";

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  is_audio_on: boolean;
  is_video_on: boolean;
  is_screen_sharing: boolean;
}

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

interface RoomData {
  id: string;
  name: string;
  description: string | null;
  topic: string;
  max_participants: number;
  is_active: boolean;
  created_by: string;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export default function LiveRoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [joined, setJoined] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const participantIdRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const signalingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch room data
  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!roomId) return;

    const fetchRoom = async () => {
      const { data } = await supabase
        .from("collaboration_rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (!data) { navigate("/rooms"); return; }
      setRoom(data as RoomData);
    };
    fetchRoom();
  }, [roomId, user]);

  // Join room
  const joinRoom = useCallback(async () => {
    if (!user || !roomId || !profile) return;

    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Insert participant record
      const { data: participant, error } = await supabase
        .from("room_participants")
        .insert({
          room_id: roomId,
          user_id: user.id,
          display_name: profile.display_name || "User",
          is_audio_on: true,
          is_video_on: true,
        })
        .select()
        .single();

      if (error) throw error;
      participantIdRef.current = participant.id;
      setJoined(true);

      // Fetch existing participants and messages
      const [{ data: existingParticipants }, { data: existingMessages }] = await Promise.all([
        supabase.from("room_participants").select("*").eq("room_id", roomId).is("left_at", null),
        supabase.from("room_messages").select("*").eq("room_id", roomId).order("created_at", { ascending: true }).limit(100),
      ]);

      if (existingParticipants) setParticipants(existingParticipants as Participant[]);
      if (existingMessages) setMessages(existingMessages as ChatMessage[]);

      // Set up signaling channel
      const channel = supabase.channel(`room-${roomId}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.target !== user.id) return;
          await handleOffer(payload.from, payload.offer);
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.target !== user.id) return;
          await handleAnswer(payload.from, payload.answer);
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (payload.target !== user.id) return;
          await handleIceCandidate(payload.from, payload.candidate);
        })
        .subscribe();

      signalingChannelRef.current = channel;

      // Subscribe to realtime participant and message changes
      supabase
        .channel(`room-participants-${roomId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` }, async () => {
          const { data } = await supabase.from("room_participants").select("*").eq("room_id", roomId).is("left_at", null);
          if (data) setParticipants(data as Participant[]);
        })
        .subscribe();

      supabase
        .channel(`room-messages-${roomId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` }, (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        })
        .subscribe();

      // Create peer connections with existing participants
      if (existingParticipants) {
        for (const p of existingParticipants as Participant[]) {
          if (p.user_id !== user.id) {
            await createPeerConnection(p.user_id, true);
          }
        }
      }

      toast({ title: "Joined room", description: `You're now in ${room?.name}` });
    } catch (err: any) {
      console.error("Join error:", err);
      toast({ title: "Error", description: err.message || "Failed to join room. Check camera/mic permissions.", variant: "destructive" });
    }
  }, [user, roomId, profile, room]);

  const createPeerConnection = async (remoteUserId: string, initiator: boolean) => {
    if (peerConnectionsRef.current.has(remoteUserId)) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionsRef.current.set(remoteUserId, pc);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const videoEl = remoteVideosRef.current.get(remoteUserId);
      if (videoEl && event.streams[0]) {
        videoEl.srcObject = event.streams[0];
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { from: user!.id, target: remoteUserId, candidate: event.candidate.toJSON() },
        });
      }
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalingChannelRef.current?.send({
        type: "broadcast",
        event: "offer",
        payload: { from: user!.id, target: remoteUserId, offer: pc.localDescription?.toJSON() },
      });
    }
  };

  const handleOffer = async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    await createPeerConnection(fromUserId, false);
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signalingChannelRef.current?.send({
      type: "broadcast",
      event: "answer",
      payload: { from: user!.id, target: fromUserId, answer: pc.localDescription?.toJSON() },
    });
  };

  const handleAnswer = async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsAudioOn((v) => !v);
      if (participantIdRef.current) {
        supabase.from("room_participants").update({ is_audio_on: !isAudioOn }).eq("id", participantIdRef.current);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsVideoOn((v) => !v);
      if (participantIdRef.current) {
        supabase.from("room_participants").update({ is_video_on: !isVideoOn }).eq("id", participantIdRef.current);
      }
    }
  };

  // Screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      // Replace screen track with camera track
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && videoTrack) sender.replaceTrack(videoTrack);
        });
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        const screenTrack = screenStream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            peerConnectionsRef.current.forEach((pc) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video");
              if (sender && videoTrack) sender.replaceTrack(videoTrack);
            });
          }
        };
      } catch {
        toast({ title: "Screen share cancelled", variant: "destructive" });
      }
    }
    if (participantIdRef.current) {
      supabase.from("room_participants").update({ is_screen_sharing: !isScreenSharing }).eq("id", participantIdRef.current);
    }
  };

  // Leave room
  const leaveRoom = async () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    if (participantIdRef.current) {
      await supabase.from("room_participants").update({ left_at: new Date().toISOString() }).eq("id", participantIdRef.current);
    }

    supabase.removeAllChannels();
    navigate("/rooms");
  };

  // Send chat message
  const sendMessage = async () => {
    if (!chatInput.trim() || !user || !roomId) return;
    await supabase.from("room_messages").insert({
      room_id: roomId,
      user_id: user.id,
      display_name: profile?.display_name || "User",
      content: chatInput.trim(),
    });
    setChatInput("");
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionsRef.current.forEach((pc) => pc.close());
      supabase.removeAllChannels();
      if (participantIdRef.current) {
        supabase.from("room_participants").update({ left_at: new Date().toISOString() }).eq("id", participantIdRef.current);
      }
    };
  }, []);

  const remoteParticipants = participants.filter((p) => p.user_id !== user?.id);

  // Pre-join screen
  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
          <VideoIcon className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{room?.name || "Loading..."}</h1>
          {room?.description && <p className="text-muted-foreground mt-1">{room.description}</p>}
          {room?.topic && <Badge variant="outline" className="mt-2">{room.topic}</Badge>}
        </div>
        <div className="w-80 aspect-video bg-card rounded-xl border border-border/50 overflow-hidden relative">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <p className="absolute bottom-2 left-2 text-xs text-foreground/70 bg-background/60 px-2 py-0.5 rounded">
            Camera preview
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={joinRoom} size="lg" className="gap-2">
            <VideoIcon className="w-4 h-4" /> Join Room
          </Button>
          <Button onClick={() => navigate("/rooms")} variant="secondary" size="lg">
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Live room
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="h-12 border-b border-border/40 flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-medium text-sm text-foreground">{room?.name}</span>
          <Badge variant="outline" className="text-[10px]">{room?.topic}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            className={showParticipants ? "text-primary" : "text-muted-foreground"}
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="w-4 h-4" />
            <span className="text-xs ml-1">{participants.length}</span>
          </Button>
          <Button
            variant="ghost" size="sm"
            className={showChat ? "text-primary" : "text-muted-foreground"}
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-4">
          <div className={`grid gap-3 h-full ${
            remoteParticipants.length === 0 ? "grid-cols-1" :
            remoteParticipants.length <= 1 ? "grid-cols-2" :
            remoteParticipants.length <= 3 ? "grid-cols-2 grid-rows-2" :
            "grid-cols-3 grid-rows-2"
          }`}>
            {/* Local video */}
            <div className="relative bg-card rounded-xl border border-border/50 overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay muted playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <span className="text-xs bg-background/70 text-foreground px-2 py-0.5 rounded-full">
                  You {isScreenSharing && "📺"}
                </span>
                {!isAudioOn && <MicOff className="w-3.5 h-3.5 text-destructive" />}
                {!isVideoOn && <VideoOff className="w-3.5 h-3.5 text-destructive" />}
              </div>
            </div>

            {/* Remote videos */}
            {remoteParticipants.map((p) => (
              <div key={p.user_id} className="relative bg-card rounded-xl border border-border/50 overflow-hidden">
                <video
                  ref={(el) => { if (el) remoteVideosRef.current.set(p.user_id, el); }}
                  autoPlay playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                  <span className="text-xs bg-background/70 text-foreground px-2 py-0.5 rounded-full">
                    {p.display_name} {p.is_screen_sharing && "📺"}
                  </span>
                  {!p.is_audio_on && <MicOff className="w-3 h-3 text-destructive" />}
                </div>
                {!p.is_video_on && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                      {p.display_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Chat / Participants */}
        {(showChat || showParticipants) && (
          <div className="w-80 border-l border-border/40 flex flex-col bg-background flex-shrink-0">
            {showParticipants && (
              <div className="p-3 border-b border-border/40">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Participants ({participants.length})
                </h3>
                <div className="space-y-1.5">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {p.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate text-foreground">
                        {p.display_name}
                        {p.user_id === user?.id && <span className="text-muted-foreground"> (you)</span>}
                      </span>
                      <div className="flex gap-1">
                        {p.is_audio_on ? <Mic className="w-3 h-3 text-muted-foreground" /> : <MicOff className="w-3 h-3 text-destructive" />}
                        {p.is_video_on ? <VideoIcon className="w-3 h-3 text-muted-foreground" /> : <VideoOff className="w-3 h-3 text-destructive" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showChat && (
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? "items-end" : "items-start"}`}>
                        <span className="text-[10px] text-muted-foreground/60 mb-0.5">{msg.display_name}</span>
                        <div className={`text-sm px-3 py-1.5 rounded-xl max-w-[85%] ${
                          msg.user_id === user?.id
                            ? "bg-primary/15 text-foreground"
                            : "bg-muted text-foreground"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-border/40 flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="text-sm"
                  />
                  <Button size="icon" variant="secondary" onClick={sendMessage} disabled={!chatInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="h-16 border-t border-border/40 flex items-center justify-center gap-3 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <Button
          variant={isAudioOn ? "secondary" : "destructive"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleAudio}
          title={isAudioOn ? "Mute" : "Unmute"}
        >
          {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
        <Button
          variant={isVideoOn ? "secondary" : "destructive"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleVideo}
          title={isVideoOn ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        <Button
          variant={isScreenSharing ? "default" : "secondary"}
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={leaveRoom}
          title="Leave room"
        >
          <Phone className="w-5 h-5 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
}
