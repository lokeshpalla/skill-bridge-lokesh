import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff, Volume2, VolumeX, Globe, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INDIAN_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "or-IN", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "as-IN", label: "অসমীয়া (Assamese)" },
  { code: "ur-IN", label: "اردو (Urdu)" },
  { code: "ne-IN", label: "नेपाली (Nepali)" },
  { code: "sa-IN", label: "संस्कृतम् (Sanskrit)" },
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

const AIAssistant = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI learning assistant. Ask me about coding, courses, career advice, or anything else! 🚀" },
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Load last conversation on open
  useEffect(() => {
    if (open && user) {
      loadLastConversation();
    }
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
    setMessages([{ role: "assistant", content: "Hi! I'm your AI learning assistant. Ask me about coding, courses, career advice, or anything else! 🚀" }]);
    setConversationId(null);
    if (user) {
      const { data } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, language })
        .select()
        .single();
      if (data) {
        setConversationId(data.id);
        await saveMessage(data.id, "assistant", "Hi! I'm your AI learning assistant. Ask me about coding, courses, career advice, or anything else! 🚀");
      }
    }
  };

  const clearHistory = async () => {
    if (conversationId) {
      await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
      await supabase.from("chat_conversations").delete().eq("id", conversationId);
    }
    setMessages([{ role: "assistant", content: "Hi! I'm your AI learning assistant. Ask me about coding, courses, career advice, or anything else! 🚀" }]);
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

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Speech recognition is not available in this browser", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(transcript);
      if (event.results[0]?.isFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({ title: "Voice error", description: "Could not recognize speech. Try again.", variant: "destructive" });
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, language]);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_~]/g, ""));
    utterance.lang = language;
    utterance.rate = 0.95;
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

    // Ensure conversation exists
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
          if (convId && assistantSoFar) {
            await saveMessage(convId, "assistant", assistantSoFar);
          }
          if (autoSpeak && assistantSoFar) {
            speak(assistantSoFar);
          }
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
      <AnimatePresence>
        {!open && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-6 right-6 z-50">
            <Button onClick={() => setOpen(true)} className="h-14 w-14 rounded-full bg-gradient-primary shadow-glow animate-pulse-glow" size="icon">
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[580px] rounded-2xl glass border border-border/50 shadow-card flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-primary">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-foreground" />
                <span className="font-semibold text-primary-foreground text-sm">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={startNewChat} title="New chat">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={clearHistory} title="Clear history">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Language & Voice Bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-secondary/50 relative">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              >
                <Globe className="w-3 h-3" />
                <span className="max-w-[100px] truncate">{currentLang?.label || "English"}</span>
              </button>

              <button
                onClick={() => { setAutoSpeak(!autoSpeak); toast({ title: autoSpeak ? "Auto-speak off" : "Auto-speak on" }); }}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${autoSpeak ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                title={autoSpeak ? "Disable auto-speak" : "Enable auto-speak"}
              >
                {autoSpeak ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                <span>Auto</span>
              </button>

              {isSpeaking && (
                <button onClick={stopSpeaking} className="text-xs px-2 py-1 rounded-md bg-destructive/20 text-destructive">
                  Stop
                </button>
              )}

              {/* Language dropdown */}
              <AnimatePresence>
                {showLangPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 mt-1 z-10 w-56 max-h-60 overflow-y-auto rounded-lg bg-card border border-border shadow-lg"
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
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${
                          language === lang.code ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.content}
                    {msg.role === "assistant" && i > 0 && (
                      <button
                        onClick={() => speak(msg.content)}
                        className="block mt-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3 h-3 inline mr-1" />
                        Listen
                      </button>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-xl px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-border/50">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "default" : "ghost"}
                  className={`h-9 w-9 rounded-lg flex-shrink-0 ${isListening ? "bg-destructive text-destructive-foreground animate-pulse" : ""}`}
                  onClick={toggleListening}
                  disabled={isStreaming}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Ask me anything..."}
                  disabled={isStreaming}
                  className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                />
                <Button type="submit" size="icon" variant="default" className="h-9 w-9 rounded-lg flex-shrink-0" disabled={isStreaming || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
