import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff,
  Volume2, VolumeX, Globe, Trash2, Plus, Sparkles, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INDIAN_LANGUAGES = [
  { code: "en-IN", label: "English", flag: "🇬🇧" },
  { code: "hi-IN", label: "हिन्दी", flag: "🇮🇳" },
  { code: "bn-IN", label: "বাংলা", flag: "🇮🇳" },
  { code: "ta-IN", label: "தமிழ்", flag: "🇮🇳" },
  { code: "te-IN", label: "తెలుగు", flag: "🇮🇳" },
  { code: "mr-IN", label: "मराठी", flag: "🇮🇳" },
  { code: "gu-IN", label: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn-IN", label: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml-IN", label: "മലയാളം", flag: "🇮🇳" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "or-IN", label: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "as-IN", label: "অসমীয়া", flag: "🇮🇳" },
  { code: "ur-IN", label: "اردو", flag: "🇮🇳" },
  { code: "ne-IN", label: "नेपाली", flag: "🇳🇵" },
  { code: "sa-IN", label: "संस्कृतम्", flag: "🇮🇳" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  language,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  language: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, language }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "AI request failed" }));
    onError(err.error || "AI request failed");
    return;
  }
  if (!resp.body) { onError("No response body"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

// Get best voice for language - called at speak time for freshest voice list
function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const langPrefix = langCode.split("-")[0]; // e.g. "hi"
  const langUnderscore = langCode.replace("-", "_"); // e.g. "hi_IN"

  // Priority order: exact match → underscore variant → prefix match → Google voice with prefix
  return (
    voices.find((v) => v.lang === langCode) ||
    voices.find((v) => v.lang === langUnderscore) ||
    voices.find((v) => v.lang.startsWith(langPrefix + "-")) ||
    voices.find((v) => v.lang.startsWith(langPrefix + "_")) ||
    voices.find((v) => v.lang.startsWith(langPrefix) && v.name.toLowerCase().includes("google")) ||
    voices.find((v) => v.lang.startsWith(langPrefix)) ||
    null
  );
}

const WELCOME = "Hey there! 👋 I'm your AI learning buddy. Ask me anything about coding, careers, or courses!";

const AIAssistant = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const langPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Close lang picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langPickerRef.current && !langPickerRef.current.contains(e.target as Node)) {
        setShowLangPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Preload voices
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const handler = () => window.speechSynthesis?.getVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", handler);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", handler);
  }, []);

  // Load last conversation on open
  useEffect(() => {
    if (open && user) loadLastConversation();
  }, [open, user]);

  const loadLastConversation = async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (convos && convos.length > 0) {
      const conv = convos[0];
      setConversationId(conv.id);
      setLanguage(conv.language || "en-IN");

      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });

      if (msgs && msgs.length > 0) {
        setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
    }
  };

  const saveMessage = async (convId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("chat_messages").insert({ conversation_id: convId, role, content });
    await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
  };

  const startNewChat = async () => {
    setMessages([{ role: "assistant", content: WELCOME }]);
    setConversationId(null);
    if (user) {
      const { data } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, language })
        .select()
        .single();
      if (data) {
        setConversationId(data.id);
        await saveMessage(data.id, "assistant", WELCOME);
      }
    }
  };

  const clearHistory = async () => {
    if (conversationId) {
      await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
      await supabase.from("chat_conversations").delete().eq("id", conversationId);
    }
    setMessages([{ role: "assistant", content: WELCOME }]);
    setConversationId(null);
    toast({ title: "Chat cleared" });
  };

  // Voice recognition
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({ title: "Not supported", description: "Speech recognition not available in this browser", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join("");
      setInput(transcript);
      if (event.results[0]?.isFinal) setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Voice error", description: "Could not recognize speech", variant: "destructive" });
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, language]);

  // Text-to-speech — fetches voices fresh each time
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      toast({ title: "TTS not supported", variant: "destructive" });
      return;
    }
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*#`_~\[\]>]/g, "").replace(/\n{2,}/g, ". ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voice = getBestVoice(language);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let convId = conversationId;
    if (!convId && user) {
      const { data } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, language })
        .select()
        .single();
      if (data) {
        convId = data.id;
        setConversationId(data.id);
      }
    }

    if (convId) await saveMessage(convId, "user", input);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === newMessages.length + 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        language,
        onDelta: upsertAssistant,
        onDone: async () => {
          setIsStreaming(false);
          if (convId && assistantSoFar) await saveMessage(convId, "assistant", assistantSoFar);
          if (autoSpeak && assistantSoFar) speak(assistantSoFar);
        },
        onError: (msg) => {
          toast({ title: "AI Error", description: msg, variant: "destructive" });
          setIsStreaming(false);
        },
      });
    } catch {
      toast({ title: "Connection error", description: "Could not reach AI assistant", variant: "destructive" });
      setIsStreaming(false);
    }
  };

  const currentLang = INDIAN_LANGUAGES.find((l) => l.code === language);

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setOpen(true)}
              className="group relative h-14 w-14 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              <Sparkles className="w-6 h-6 text-primary-foreground transition-transform group-hover:rotate-12" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success animate-pulse" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] h-[600px] rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "hsl(var(--card))",
              boxShadow: "0 25px 60px -12px hsl(0 0% 0% / 0.5), 0 0 40px -10px hsl(var(--primary) / 0.15)",
              border: "1px solid hsl(var(--border) / 0.6)",
            }}
          >
            {/* Header */}
            <div
              className="relative px-5 py-4 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">AI Assistant</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isStreaming ? "Thinking..." : isSpeaking ? "Speaking..." : "Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={startNewChat}
                  title="New chat"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={clearHistory}
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Controls bar */}
            <div className="px-4 py-2 flex items-center gap-2 border-b border-border/30" ref={langPickerRef}>
              {/* Language selector */}
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/50 hover:border-primary/40 bg-secondary/50 hover:bg-secondary text-foreground transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>{currentLang?.flag} {currentLang?.label}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showLangPicker ? "rotate-180" : ""}`} />
              </button>

              {/* Auto-speak toggle */}
              <button
                onClick={() => {
                  setAutoSpeak(!autoSpeak);
                  toast({ title: autoSpeak ? "Auto-speak off" : "Auto-speak on" });
                }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                  autoSpeak
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/50 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Auto-speak</span>
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="text-xs px-3 py-1.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 transition-all"
                >
                  Stop
                </button>
              )}

              {/* Language dropdown */}
              <AnimatePresence>
                {showLangPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-4 top-[120px] z-20 w-52 max-h-56 overflow-y-auto rounded-2xl border border-border/60 shadow-lg"
                    style={{ background: "hsl(var(--card))" }}
                  >
                    {INDIAN_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangPicker(false);
                          if (conversationId) {
                            supabase.from("chat_conversations").update({ language: lang.code }).eq("id", conversationId);
                          }
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/80 transition-colors flex items-center gap-2 ${
                          language === lang.code ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                        } first:rounded-t-2xl last:rounded-b-2xl`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={i > 0 ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      msg.role === "assistant"
                        ? "bg-gradient-primary shadow-glow"
                        : "bg-accent/20"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-accent" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-secondary/80 text-foreground rounded-tl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>pre]:my-1 [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:rounded text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}

                    {/* Listen button for assistant messages */}
                    {msg.role === "assistant" && i > 0 && (
                      <button
                        onClick={() => speak(msg.content)}
                        className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        Listen
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="bg-secondary/80 rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-border/30" style={{ background: "hsl(var(--card) / 0.9)" }}>
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              >
                {/* Mic button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isStreaming}
                  className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    isListening
                      ? "bg-destructive text-destructive-foreground animate-pulse shadow-lg"
                      : "bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  } disabled:opacity-40`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Input field */}
                <div className="flex-1 relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "🎙️ Listening..." : "Type your message..."}
                    disabled={isStreaming}
                    className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:bg-secondary/80 disabled:opacity-50 transition-all border border-border/30 focus:border-primary/30"
                  />
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={isStreaming || !input.trim()}
                  className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 transition-all hover:shadow-glow hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
