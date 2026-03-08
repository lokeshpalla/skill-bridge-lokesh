import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Mic, MicOff, VideoIcon, VideoOff, Monitor, MonitorOff,
  Phone, Send, MessageSquare, Users, Clock, Code2,
  Hand, Play, Copy, Check, Save, Terminal, Wifi, WifiOff
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ChatMsg {
  id: string;
  sender: string;
  text: string;
  time: string;
}

const LANG_TEMPLATES: Record<string, string> = {
  javascript: `// JavaScript\nfunction solution() {\n  \n}\n`,
  python: `# Python\ndef solution():\n    pass\n`,
  typescript: `// TypeScript\nfunction solution(): void {\n  \n}\n`,
  java: `// Java\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n`,
  cpp: `// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n`,
};

export default function MentorSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const mentorName = searchParams.get("mentor") || "Mentor";
  const slot = searchParams.get("slot") || "";
  const bookingId = searchParams.get("booking") || "session";

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "1", sender: mentorName, text: "Hi! Welcome to the session. Let's get started.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [elapsed, setElapsed] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const [code, setCode] = useState(LANG_TEMPLATES.javascript);
  const [language, setLanguage] = useState("javascript");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [connectionState, setConnectionState] = useState("new");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const handleRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, []);

  const { isConnected, startCall, endCall: endWebRTC, toggleAudio, toggleVideo } = useWebRTC({
    roomId: bookingId,
    userId: user?.id || "anonymous",
    onRemoteStream: handleRemoteStream,
    onConnectionState: setConnectionState,
  });

  // Start video call on mount
  useEffect(() => {
    const init = async () => {
      const stream = await startCall(true, true);
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };
    if (user) init();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync audio/video toggles
  useEffect(() => {
    toggleAudio(isMicOn);
  }, [isMicOn, toggleAudio]);

  useEffect(() => {
    toggleVideo(isVideoOn);
  }, [isVideoOn, toggleVideo]);

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
      { id: Date.now().toString(), sender: profile?.display_name || "You", text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setChatInput("");
  };

  const endCall = () => {
    endWebRTC();
    navigate("/mentors");
  };

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    setCode(LANG_TEMPLATES[lang] || "");
    setOutput("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const ext = language === "python" ? "py" : language === "cpp" ? "cpp" : language === "java" ? "java" : language === "typescript" ? "ts" : "js";
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    toast.success("Code saved!");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRun = () => {
    if (language === "javascript") {
      try {
        const logs: string[] = [];
        const fakeConsole = { log: (...args: any[]) => logs.push(args.map(String).join(" ")), error: (...args: any[]) => logs.push("Error: " + args.map(String).join(" ")) };
        // Inject customInput as a readline-like variable
        const inputLines = customInput.split("\n");
        let inputIdx = 0;
        const readline = () => inputIdx < inputLines.length ? inputLines[inputIdx++] : "";
        const fn = new Function("console", "readline", code);
        fn(fakeConsole, readline);
        setOutput(logs.length ? logs.join("\n") : "(no output)");
      } catch (e: any) {
        setOutput("Error: " + e.message);
      }
    } else {
      setOutput(`⚠ Live execution only available for JavaScript.\nShare your ${language} code with your mentor for review.`);
    }
  };

  const toggleSidePanel = (panel: "chat" | "participants" | "code") => {
    if (panel === "chat") {
      setShowChat(!showChat); setShowParticipants(false); setShowCode(false);
    } else if (panel === "participants") {
      setShowParticipants(!showParticipants); setShowChat(false); setShowCode(false);
    } else {
      setShowCode(!showCode); setShowChat(false); setShowParticipants(false);
    }
  };

  const displayName = profile?.display_name || "You";
  const sidePanelOpen = showChat || showParticipants || showCode;

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
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isConnected ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? "Connected" : "Waiting..."}
          </div>
          <span className="text-xs text-muted-foreground font-mono">{formatTime(elapsed)}</span>
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4 grid grid-cols-2 gap-3">
            {/* Remote video (Mentor/Other participant) */}
            <div className="rounded-2xl bg-secondary/30 border border-border/30 flex items-center justify-center relative overflow-hidden">
              {isConnected ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl">👨‍🏫</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <WifiOff className="w-3 h-3" /> Waiting for {mentorName} to join...
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
                {isConnected ? <Wifi className="w-3 h-3 text-success" /> : <WifiOff className="w-3 h-3 text-muted-foreground" />}
                {mentorName}
              </div>
            </div>

            {/* Your video */}
            <div className="rounded-2xl bg-secondary/30 border border-border/30 flex items-center justify-center relative overflow-hidden">
              {isVideoOn ? (
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl">🧑‍💻</div>
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
          <div className="flex items-center justify-center gap-2 p-3 border-t border-border/30">
            <ControlBtn active={isMicOn} onClick={() => setIsMicOn(!isMicOn)} title={isMicOn ? "Mute" : "Unmute"}>
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </ControlBtn>
            <ControlBtn active={isVideoOn} onClick={() => setIsVideoOn(!isVideoOn)} title={isVideoOn ? "Camera off" : "Camera on"}>
              {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </ControlBtn>
            <ControlBtn active={!isScreenSharing} highlight={isScreenSharing} onClick={() => setIsScreenSharing(!isScreenSharing)} title="Screen share">
              {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
            </ControlBtn>
            <ControlBtn active={!handRaised} highlight={handRaised} color="warning" onClick={() => setHandRaised(!handRaised)} title="Raise hand">
              <Hand className="w-5 h-5" />
            </ControlBtn>

            <div className="w-px h-6 bg-border/40 mx-1" />

            <ControlBtn active={!showCode} highlight={showCode} onClick={() => toggleSidePanel("code")} title="Code Editor">
              <Code2 className="w-5 h-5" />
            </ControlBtn>
            <ControlBtn active={!showChat} highlight={showChat} onClick={() => toggleSidePanel("chat")} title="Chat">
              <MessageSquare className="w-5 h-5" />
            </ControlBtn>
            <ControlBtn active={!showParticipants} highlight={showParticipants} onClick={() => toggleSidePanel("participants")} title="Participants">
              <Users className="w-5 h-5" />
            </ControlBtn>

            <div className="w-px h-6 bg-border/40 mx-1" />

            <button onClick={endCall} className="w-14 h-11 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-all" title="Leave call">
              <Phone className="w-5 h-5 rotate-[135deg]" />
            </button>
          </div>
        </div>

        {/* Side panel */}
        {sidePanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: showCode ? 420 : 320, opacity: 1 }}
            className="border-l border-border/30 bg-card/40 flex flex-col overflow-hidden"
            style={{ width: showCode ? 420 : 320 }}
          >
            {/* Code Editor Panel */}
            {showCode && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-border/30 flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-primary" /> Code Editor
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Select value={language} onValueChange={handleLangChange}>
                      <SelectTrigger className="h-7 w-28 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                      </SelectContent>
                    </Select>
                    <button onClick={handleSave} className="w-7 h-7 rounded-md bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-all" title="Save code">
                      {saved ? <Check className="w-3.5 h-3.5 text-success" /> : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={handleCopy} className="w-7 h-7 rounded-md bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-all" title="Copy code">
                      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 resize-none rounded-none border-0 border-b border-border/30 font-mono text-xs leading-relaxed bg-background/50 focus-visible:ring-0 focus-visible:ring-offset-0 p-3"
                    spellCheck={false}
                  />

                  {/* Custom Input */}
                  <div className="border-t border-border/30">
                    <div className="flex items-center gap-1.5 p-2 px-3">
                      <Terminal className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">Input</span>
                    </div>
                    <Textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom input (one value per line)..."
                      className="resize-none rounded-none border-0 font-mono text-xs leading-relaxed bg-secondary/20 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 pb-2 pt-0 h-16"
                      spellCheck={false}
                    />
                  </div>

                  {/* Output panel */}
                  <div className="border-t border-border/30">
                    <div className="flex items-center justify-between p-2 px-3">
                      <span className="text-[10px] font-medium text-muted-foreground">Output</span>
                      <Button size="sm" variant="hero" className="h-6 text-[10px] gap-1 px-2" onClick={handleRun}>
                        <Play className="w-3 h-3" /> Run
                      </Button>
                    </div>
                    <ScrollArea className="h-20">
                      <pre className="px-3 pb-2 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
                        {output || "Click Run to execute code..."}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Panel */}
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
                  <Input placeholder="Send a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="text-xs h-8" onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                  <Button size="sm" className="h-8 w-8 p-0" onClick={sendChat}><Send className="w-3.5 h-3.5" /></Button>
                </div>
              </>
            )}

            {/* Participants Panel */}
            {showParticipants && (
              <>
                <div className="p-3 border-b border-border/30 text-sm font-semibold">Participants (2)</div>
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">👨‍🏫</div>
                    <div><p className="text-xs font-medium">{mentorName}</p><p className="text-[10px] text-muted-foreground">Mentor • Host</p></div>
                    <Mic className="w-3.5 h-3.5 text-success ml-auto" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">🧑‍💻</div>
                    <div><p className="text-xs font-medium">{displayName}</p><p className="text-[10px] text-muted-foreground">Student</p></div>
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

// Reusable control button
function ControlBtn({ active, highlight, color, onClick, title, children }: {
  active?: boolean; highlight?: boolean; color?: "warning"; onClick: () => void; title: string; children: React.ReactNode;
}) {
  const base = "w-11 h-11 rounded-full flex items-center justify-center transition-all";
  const cls = highlight
    ? color === "warning"
      ? `${base} bg-warning/20 text-warning`
      : `${base} bg-primary/20 text-primary`
    : active === false
      ? `${base} bg-destructive/20 text-destructive`
      : `${base} bg-secondary/80 text-foreground hover:bg-secondary`;
  return <button onClick={onClick} className={cls} title={title}>{children}</button>;
}
