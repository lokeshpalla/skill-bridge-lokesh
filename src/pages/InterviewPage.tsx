import GxIcon from "@/components/ui/GxIcon";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Mic, MicOff, Send, StopCircle, Play, Brain, Code2, Layout,
  Server, Users, Clock, Trophy, Volume2, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

// Extend Window for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}


type Msg = { role: "user" | "assistant"; content: string };

const topics = [
  { id: "general", label: "General", icon: Brain, desc: "Full-stack technical + behavioral" },
  { id: "frontend", label: "Frontend", icon: Layout, desc: "React, TypeScript, CSS, a11y" },
  { id: "backend", label: "Backend", icon: Server, desc: "APIs, databases, system design" },
  { id: "dsa", label: "DSA", icon: Code2, desc: "Data structures & algorithms" },
  { id: "behavioral", label: "Behavioral", icon: Users, desc: "STAR method, leadership" },
];

const INTERVIEW_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock-interview`;

const InterviewPage = () => {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [topic, setTopic] = useState("general");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>("");

  // Fetch user's skills/stack from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("skills")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.skills) setUserSkills(data.skills);
      });
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (started) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [started]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  // Speech Recognition (mic)
  const toggleMic = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Mic error — please try again");
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  // Auto-speak: read assistant responses aloud
  const speakText = useCallback((text: string) => {
    if (!autoSpeak || !text) return;
    // Strip markdown formatting for cleaner speech
    const clean = text.replace(/[#*_`~\[\]()>]/g, "").replace(/\n+/g, ". ");
    if (clean === lastSpokenRef.current) return;
    lastSpokenRef.current = clean;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [autoSpeak]);

  // Speak when a new assistant message is finalized
  useEffect(() => {
    if (!autoSpeak || isLoading) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") {
      speakText(last.content);
    }
  }, [messages, isLoading, autoSpeak, speakText]);

  // Stop speech when auto-speak is disabled
  useEffect(() => {
    if (!autoSpeak) window.speechSynthesis.cancel();
  }, [autoSpeak]);

  const startInterview = async () => {
    if (!user) return toast.error("Sign in to start an interview");

    // Create interview record
    const { data, error } = await supabase
      .from("mock_interviews")
      .insert({ user_id: user.id, topic, difficulty: "medium" })
      .select("id")
      .single();

    if (error || !data) return toast.error("Failed to start interview");
    setInterviewId(data.id);
    setStarted(true);
    setMessages([]);
    setElapsed(0);

    // Get first question
    await streamMessage([{ role: "user" as const, content: `Start the ${topic} interview. Ask me the first question.` }], true);
  };

  const streamMessage = async (msgs: Msg[], isFirst = false) => {
    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(INTERVIEW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: msgs, topic, skills: userSkills }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "Interview error");
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save messages to DB
      if (interviewId || isFirst) {
        // We'll save after the full response
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to get response");
    }

    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");

    // Save user message
    if (interviewId) {
      await supabase.from("mock_interview_messages").insert({
        interview_id: interviewId,
        role: "user",
        content: userMsg.content,
      });
    }

    await streamMessage(newMsgs);

    // Save assistant message after streaming
    if (interviewId) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          supabase.from("mock_interview_messages").insert({
            interview_id: interviewId,
            role: "assistant",
            content: last.content,
          });
        }
        return prev;
      });
    }
  };

  const endInterview = async () => {
    const endMsg: Msg = { role: "user", content: "End interview. Please provide my final score and detailed feedback using the structured JSON scoring format." };
    const newMsgs = [...messages, endMsg];
    setMessages(newMsgs);
    await streamMessage(newMsgs);

    clearInterval(timerRef.current);

    // Try to parse scores from the last assistant message
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && interviewId) {
        // Extract JSON scores
        const jsonMatch = last.content.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.scores?.overall !== undefined) {
              supabase.from("mock_interviews").update({
                status: "completed",
                completed_at: new Date().toISOString(),
                score: parsed.scores.overall,
                feedback: JSON.stringify(parsed.scores),
              }).eq("id", interviewId).then(() => {});
            }
          } catch {}
        } else {
          // Fallback: just mark completed
          supabase.from("mock_interviews").update({
            status: "completed",
            completed_at: new Date().toISOString(),
          }).eq("id", interviewId).then(() => {});
        }
      }
      return prev;
    });
  };

  // Topic selection screen
  if (!started) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> Mock Interview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Practice with an AI interviewer. Get real-time feedback and scoring.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topics.map((t, i) => {
            const Icon = t.icon;
            const selected = topic === t.id;
            return (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setTopic(t.id)}
                className={`rounded-xl border p-5 text-left transition-all ${
                  selected
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                    : "border-border/50 bg-card/60 hover:border-primary/20"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  selected ? "bg-primary/20" : "bg-secondary/80"
                }`}>
                  <Icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className="text-sm font-semibold">{t.label}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">{t.desc}</p>
              </motion.button>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="hero" size="lg" className="gap-2" onClick={startInterview}>
            <Play className="w-4 h-4" /> Start Interview
          </Button>
        </div>

        {/* Past interviews */}
        <PastInterviews userId={user?.id} />
      </div>
    );
  }

  // Interview chat screen
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold capitalize">{topic} Interview</h2>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime(elapsed)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-speak toggle */}
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              autoSpeak
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/50 bg-secondary/50 text-muted-foreground"
            }`}
            title={autoSpeak ? "Disable auto-speak" : "Enable auto-speak"}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            Auto-Speak
          </button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { clearInterval(timerRef.current); window.speechSynthesis.cancel(); setStarted(false); setMessages([]); setInterviewId(null); setElapsed(0); }} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" className="gap-1 text-xs" onClick={endInterview} disabled={isLoading}>
            <StopCircle className="w-3.5 h-3.5" /> End Interview
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] rounded-xl p-3 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 border border-border/50"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-secondary/50 border border-border/50 rounded-xl p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/40">
        <div className="flex gap-2 items-end">
          {/* Mic button */}
          <button
            onClick={toggleMic}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <Textarea
            placeholder={isRecording ? "🎙 Listening..." : "Type your answer..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            className="text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button className="self-end flex-shrink-0" onClick={() => { if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); } sendMessage(); }} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {isRecording && (
          <p className="text-[10px] text-destructive mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" /> Recording... speak your answer, then click Send
          </p>
        )}
      </div>
    </div>
  );
};

// Score radar chart component
const ScoreRadar = ({ scores }: { scores: Record<string, number> }) => {
  const data = [
    { subject: "Technical", value: scores.technical_knowledge || 0 },
    { subject: "Problem Solving", value: scores.problem_solving || 0 },
    { subject: "Communication", value: scores.communication || 0 },
    { subject: "Code Quality", value: scores.code_quality || 0 },
  ];

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
          <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Past interviews component
const PastInterviews = ({ userId }: { userId?: string }) => {
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("mock_interviews")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setInterviews(data);
      });
  }, [userId]);

  if (interviews.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <Trophy className="w-4 h-4 text-warning" /> Past Interviews
      </h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {interviews.map((iv) => {
          let parsedScores: Record<string, number> | null = null;
          try {
            if (iv.feedback) parsedScores = JSON.parse(iv.feedback);
          } catch {}

          return (
            <div key={iv.id} className="rounded-xl border border-border/50 bg-card/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium capitalize">{iv.topic}</span>
                {iv.score && (
                  <span className={`text-xs font-bold ${iv.score >= 70 ? "text-success" : iv.score >= 50 ? "text-warning" : "text-destructive"}`}>
                    {iv.score}/100
                  </span>
                )}
              </div>
              {parsedScores && <ScoreRadar scores={parsedScores} />}
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(iv.completed_at).toLocaleDateString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterviewPage;
