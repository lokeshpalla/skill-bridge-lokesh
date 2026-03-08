import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic, MicOff, VideoIcon, VideoOff, Monitor, MonitorOff,
  Phone, Send, MessageSquare, Users, Clock, MoreVertical,
  Hand, SmilePlus, Settings
} from "lucide-react";
import { motion } from "framer-motion";

interface ChatMsg {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export default function MentorSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const mentorName = searchParams.get("mentor") || "Mentor";
  const slot = searchParams.get("slot") || "";

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "1", sender: mentorName, text: `Hi! Welcome to the session. Let's get started.`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [elapsed, setElapsed] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Camera
  useEffect(() => {
    if (isVideoOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn }).then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      }).catch(() => {});
    } else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isVideoOn]);

  // Toggle mic on existing stream
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = isMicOn));
  }, [isMicOn]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: profile?.display_name || "You",
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setChatInput("");
  };

  const endCall = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigate("/mentors");
  };

  const displayName = profile?.display_name || "You";

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[hsl(var(--background))]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-card/40">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Session with {mentorName}</h2>
          <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> {slot}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">{formatTime(elapsed)}</span>
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 grid grid-cols-2 gap-3">
            {/* Mentor video (placeholder) */}
            <div className="rounded-2xl bg-secondary/30 border border-border/30 flex items-center justify-center relative overflow-hidden">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-5xl">
                👨‍🏫
              </div>
              <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
                <Mic className="w-3 h-3 text-success" />
                {mentorName}
              </div>
            </div>

            {/* Your video */}
            <div className="rounded-2xl bg-secondary/30 border border-border/30 flex items-center justify-center relative overflow-hidden">
              {isVideoOn ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-5xl">
                  🧑‍💻
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
                {isMicOn ? <Mic className="w-3 h-3 text-success" /> : <MicOff className="w-3 h-3 text-destructive" />}
                {displayName} (You)
              </div>
              {handRaised && (
                <div className="absolute top-3 right-3 bg-warning/20 border border-warning/30 rounded-lg px-2 py-1 text-xs flex items-center gap-1">
                  <Hand className="w-3 h-3 text-warning" /> ✋
                </div>
              )}
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border/30">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                isMicOn ? "bg-secondary/80 text-foreground hover:bg-secondary" : "bg-destructive/20 text-destructive"
              }`}
              title={isMicOn ? "Mute" : "Unmute"}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                isVideoOn ? "bg-secondary/80 text-foreground hover:bg-secondary" : "bg-destructive/20 text-destructive"
              }`}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                isScreenSharing ? "bg-primary/20 text-primary" : "bg-secondary/80 text-foreground hover:bg-secondary"
              }`}
              title="Share screen"
            >
              {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setHandRaised(!handRaised)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                handRaised ? "bg-warning/20 text-warning" : "bg-secondary/80 text-foreground hover:bg-secondary"
              }`}
              title="Raise hand"
            >
              <Hand className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                showChat ? "bg-primary/20 text-primary" : "bg-secondary/80 text-foreground hover:bg-secondary"
              }`}
              title="Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                showParticipants ? "bg-primary/20 text-primary" : "bg-secondary/80 text-foreground hover:bg-secondary"
              }`}
              title="Participants"
            >
              <Users className="w-5 h-5" />
            </button>

            <button
              onClick={endCall}
              className="w-14 h-11 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-all"
              title="Leave call"
            >
              <Phone className="w-5 h-5 rotate-[135deg]" />
            </button>
          </div>
        </div>

        {/* Side panel: Chat or Participants */}
        {(showChat || showParticipants) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border/30 bg-card/40 flex flex-col overflow-hidden"
            style={{ width: 320 }}
          >
            {showChat && (
              <>
                <div className="p-3 border-b border-border/30 text-sm font-semibold">Chat</div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold">{msg.sender}</span>
                          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-border/30 flex gap-2">
                  <Input
                    placeholder="Send a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="text-xs h-8"
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  />
                  <Button size="sm" className="h-8 w-8 p-0" onClick={sendChat}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            )}

            {showParticipants && (
              <>
                <div className="p-3 border-b border-border/30 text-sm font-semibold">Participants (2)</div>
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">👨‍🏫</div>
                    <div>
                      <p className="text-xs font-medium">{mentorName}</p>
                      <p className="text-[10px] text-muted-foreground">Mentor • Host</p>
                    </div>
                    <Mic className="w-3.5 h-3.5 text-success ml-auto" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">🧑‍💻</div>
                    <div>
                      <p className="text-xs font-medium">{displayName}</p>
                      <p className="text-[10px] text-muted-foreground">Student</p>
                    </div>
                    {isMicOn ? <Mic className="w-3.5 h-3.5 text-success ml-auto" /> : <MicOff className="w-3.5 h-3.5 text-destructive ml-auto" />}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
