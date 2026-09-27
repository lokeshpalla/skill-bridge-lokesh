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
  Phone, Send, MessageSquare, Users, ChevronRight, Link2, Copy, Check, Settings
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
  meeting_code: string | null;
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
  const [lobbyAudioOn, setLobbyAudioOn] = useState(true);
  const [lobbyVideoOn, setLobbyVideoOn] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [connectionState, setConnectionState] = useState("Connecting");
  const [roomEnded, setRoomEnded] = useState(false);
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const lobbyStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const participantIdRef = useRef<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const signalingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const participantChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const joiningRef = useRef(false);
  const mountedRef = useRef(true);

  // Fetch room data
  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!roomId) return;

    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from("collaboration_rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (error || !data) { navigate("/rooms"); return; }
      setRoom(data as RoomData);
    };
    fetchRoom();
  }, [roomId, user, navigate]);

  const refreshParticipants = useCallback(async () => {
    if (!roomId || !mountedRef.current) return;
    const { data } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomId)
      .is("left_at", null);
    if (data && mountedRef.current) setParticipants(data as Participant[]);
  }, [roomId]);

  const sendHeartbeat = useCallback(async () => {
    const participantId = participantIdRef.current;
    if (!participantId) return;
    await supabase
      .from("room_participants")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", participantId);
  }, []);

  // Join room
  const joinRoom = useCallback(async () => {
    if (!user || !roomId || !profile || !room?.is_active || joiningRef.current) return;
    joiningRef.current = true;
    let streamWasCreatedForJoin = false;

    try {
      // Get local media — fall back gracefully when devices are missing
      const previewStream = lobbyStreamRef.current;
      let stream: MediaStream | null = previewStream;
      streamWasCreatedForJoin = !previewStream;
      if (!stream && navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch {
            stream = null; // No devices available — join without media
          }
        }
      }
      if (stream) {
        stream.getAudioTracks().forEach((track) => { track.enabled = lobbyAudioOn; });
        stream.getVideoTracks().forEach((track) => { track.enabled = lobbyVideoOn; });
        localStreamRef.current = stream;
        lobbyStreamRef.current = null;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        localStreamRef.current = null;
        lobbyStreamRef.current = null;
        toast({ title: "No camera/mic found", description: "You joined without audio/video. Others can still see you in the participant list." });
      }

      // Reuse an active row from a previous interrupted session when possible.
      const { data: currentParticipant } = await supabase
        .from("room_participants")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .is("left_at", null)
        .maybeSingle();

      let participant = currentParticipant;
      let error = null;
      if (participant) {
        const result = await supabase
          .from("room_participants")
          .update({
            display_name: profile.display_name || "User",
            is_audio_on: lobbyAudioOn,
            is_video_on: lobbyVideoOn,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", participant.id)
          .select()
          .single();
        participant = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("room_participants")
          .insert({
            room_id: roomId,
            user_id: user.id,
            display_name: profile.display_name || "User",
            is_audio_on: lobbyAudioOn,
            is_video_on: lobbyVideoOn,
            last_seen_at: new Date().toISOString(),
          })
          .select()
          .single();
        participant = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!participant) throw new Error("Could not create your participant session");
      participantIdRef.current = participant.id;
      setJoined(true);
      setConnectionState("Connecting");

      heartbeatRef.current = setInterval(() => { void sendHeartbeat(); }, 30_000);

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
        .on("broadcast", { event: "participant-joined" }, async ({ payload }) => {
          if (payload.from && payload.from !== user.id && user.id < payload.from) {
            await createPeerConnection(payload.from, true);
          }
        })
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
        .subscribe((status) => {
          if (!mountedRef.current) return;
           if (status === "SUBSCRIBED") {
             setConnectionState("Connected");
             void channel.send({ type: "broadcast", event: "participant-joined", payload: { from: user.id } });
           }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnectionState("Reconnecting");
        });

      signalingChannelRef.current = channel;

      // Subscribe to realtime participant and message changes
      participantChannelRef.current = supabase
        .channel(`room-participants-${roomId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` }, () => { void refreshParticipants(); })
        .subscribe();

      messagesChannelRef.current = supabase
        .channel(`room-messages-${roomId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` }, (payload) => {
          const message = payload.new as ChatMessage;
          setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
        })
        .subscribe();

      roomChannelRef.current = supabase
        .channel(`room-status-${roomId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "collaboration_rooms", filter: `id=eq.${roomId}` }, (payload) => {
          const updatedRoom = payload.new as RoomData;
          setRoom(updatedRoom);
          if (!updatedRoom.is_active) {
            setRoomEnded(true);
            toast({ title: "Room ended", description: "The host has closed this meeting." });
          }
        })
        .subscribe();

      // Create peer connections with existing participants
      if (existingParticipants) {
        for (const p of existingParticipants as Participant[]) {
          if (p.user_id !== user.id && user.id < p.user_id) {
            await createPeerConnection(p.user_id, true);
          }
        }
      }

      toast({ title: "Joined room", description: `You're now in ${room?.name}` });
    } catch (err: any) {
      console.error("Join error:", err);
      if (streamWasCreatedForJoin) localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      toast({ title: "Error", description: err.message || "Failed to join room. Check camera/mic permissions.", variant: "destructive" });
    } finally {
      joiningRef.current = false;
    }
  }, [user, roomId, profile, room, lobbyAudioOn, lobbyVideoOn, refreshParticipants, sendHeartbeat, toast]);

  const createPeerConnection = async (remoteUserId: string, initiator: boolean) => {
    if (!user || peerConnectionsRef.current.has(remoteUserId)) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionsRef.current.set(remoteUserId, pc);

    // Add local tracks
    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => { pc.addTrack(track, localStream); });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const videoEl = remoteVideosRef.current.get(remoteUserId);
      if (videoEl && event.streams[0]) {
        remoteStreamsRef.current.set(remoteUserId, event.streams[0]);
        videoEl.srcObject = event.streams[0];
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { from: user.id, target: remoteUserId, candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        peerConnectionsRef.current.delete(remoteUserId);
      }
      if (pc.connectionState === "connected") setConnectionState("Connected");
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalingChannelRef.current?.send({
        type: "broadcast",
        event: "offer",
        payload: { from: user.id, target: remoteUserId, offer: pc.localDescription?.toJSON() },
      });
    }
  };

  const handleOffer = async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    try {
      await createPeerConnection(fromUserId, false);
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (!pc || pc.signalingState !== "stable") return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (user) {
        signalingChannelRef.current?.send({
          type: "broadcast",
          event: "answer",
          payload: { from: user.id, target: fromUserId, answer: pc.localDescription?.toJSON() },
        });
      }
    } catch (error) {
      console.error("Offer handling error:", error);
    }
  };

  const handleAnswer = async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc || pc.signalingState !== "have-local-offer") return;
    try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); } catch (error) { console.error("Answer handling error:", error); }
  };

  const handleIceCandidate = async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) return;
    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (error) { console.error("ICE candidate error:", error); }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const nextValue = !isAudioOn;
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = nextValue));
      setIsAudioOn(nextValue);
      if (participantIdRef.current) {
        void supabase.from("room_participants").update({ is_audio_on: nextValue, last_seen_at: new Date().toISOString() }).eq("id", participantIdRef.current);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const nextValue = !isVideoOn;
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = nextValue));
      setIsVideoOn(nextValue);
      if (participantIdRef.current) {
        void supabase.from("room_participants").update({ is_video_on: nextValue, last_seen_at: new Date().toISOString() }).eq("id", participantIdRef.current);
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
      void supabase.from("room_participants").update({ is_screen_sharing: !isScreenSharing, last_seen_at: new Date().toISOString() }).eq("id", participantIdRef.current);
    }
  };

  // Leave room
  const leaveRoom = async () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
    if (participantIdRef.current) {
      await supabase.from("room_participants").update({ left_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }).eq("id", participantIdRef.current);
    }
    participantIdRef.current = null;
    [signalingChannelRef, participantChannelRef, messagesChannelRef, roomChannelRef].forEach((channelRef) => {
      if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null; }
    });
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

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void sendHeartbeat();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [sendHeartbeat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionsRef.current.forEach((pc) => pc.close());
      mountedRef.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      [signalingChannelRef, participantChannelRef, messagesChannelRef, roomChannelRef].forEach((channelRef) => {
        if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null; }
      });
      if (participantIdRef.current) void supabase.from("room_participants").update({ left_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }).eq("id", participantIdRef.current);
    };
  }, []);

  const remoteParticipants = participants.filter((p) => p.user_id !== user?.id);

  // Lobby: start camera preview
  useEffect(() => {
    if (joined || lobbyStreamRef.current) return;
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .catch(() => navigator.mediaDevices.getUserMedia({ audio: true }))
        .then((stream) => {
          lobbyStreamRef.current = stream;
          stream.getAudioTracks().forEach((track) => { track.enabled = lobbyAudioOn; });
          stream.getVideoTracks().forEach((track) => { track.enabled = lobbyVideoOn; });
          if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = stream;
        }).catch(() => {});
    }
    return () => {};
  }, [joined, lobbyAudioOn, lobbyVideoOn]);

  useEffect(() => {
    lobbyStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = lobbyAudioOn));
  }, [lobbyAudioOn]);

  useEffect(() => {
    lobbyStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = lobbyVideoOn));
  }, [lobbyVideoOn]);

  // Attach local stream once the in-meeting video element is mounted
  useEffect(() => {
    if (joined && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [joined]);

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    toast({ title: "Link copied!", description: "Share this link to invite others." });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleJoin = () => {
    setIsAudioOn(lobbyAudioOn);
    setIsVideoOn(lobbyVideoOn);
    joinRoom();
  };

  useEffect(() => {
    if (!roomEnded) return;
    const timeout = window.setTimeout(() => { void leaveRoom(); }, 1500);
    return () => window.clearTimeout(timeout);
  }, [roomEnded]);

  // Pre-join lobby — Google Meet style
  if (!joined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="grid lg:grid-cols-5 gap-8 max-w-5xl w-full items-center">
          {/* Left: Camera preview */}
          <div className="lg:col-span-3 space-y-4">
          <div className="relative w-full aspect-video bg-secondary/30 rounded-2xl border border-border/30 overflow-hidden">
              {lobbyVideoOn ? (
                <video ref={lobbyVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1] rounded-2xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-5xl font-bold text-primary">
                    {(profile?.display_name || "U").charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <Button
                  type="button"
                  variant={lobbyAudioOn ? "secondary" : "destructive"}
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={() => setLobbyAudioOn(!lobbyAudioOn)}
                  title={lobbyAudioOn ? "Mute microphone" : "Unmute microphone"}
                >
                  {lobbyAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                <Button
                  type="button"
                  variant={lobbyVideoOn ? "secondary" : "destructive"}
                  size="icon"
                  className="w-12 h-12 rounded-full"
                  onClick={() => setLobbyVideoOn(!lobbyVideoOn)}
                  title={lobbyVideoOn ? "Turn off camera" : "Turn on camera"}
                >
                  {lobbyVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </div>

              {/* Status indicators */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {!lobbyAudioOn && (
                  <span className="bg-destructive/90 text-destructive-foreground text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                    <MicOff className="w-3 h-3" /> Mic off
                  </span>
                )}
                {!lobbyVideoOn && (
                  <span className="bg-destructive/90 text-destructive-foreground text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                    <VideoOff className="w-3 h-3" /> Camera off
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Room info & Join */}
          <div className="lg:col-span-2 space-y-5">
            <div className="space-y-2">
              <h1 className="text-xl font-bold">{room?.name || "Loading..."}</h1>
              {room?.description && (
                <p className="text-sm text-muted-foreground">{room.description}</p>
              )}
              {room?.topic && (
                <Badge variant="outline" className="text-xs">{room.topic}</Badge>
              )}
              {room?.meeting_code && (
                <p className="text-xs text-muted-foreground">Meeting code <span className="font-mono text-foreground">{room.meeting_code}</span></p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Joining as</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                  {(profile?.display_name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{profile?.display_name || "User"}</p>
                  <p className="text-[11px] text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="hero" size="lg" className="w-full gap-2" onClick={handleJoin}>
                Join Now
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={copyMeetingLink}>
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                {linkCopied ? "Link Copied!" : "Copy meeting link"}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Your mic and camera can be changed during the meeting
            </p>
          </div>
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
          {room?.meeting_code && <span className="hidden sm:inline text-xs text-muted-foreground font-mono">{room.meeting_code}</span>}
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
              {(!isVideoOn || !localStreamRef.current?.getVideoTracks().length) && (
                <div className="absolute inset-0 flex items-center justify-center bg-card">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                    {(profile?.display_name || "Y").charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
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
