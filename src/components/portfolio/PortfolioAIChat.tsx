import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, Bot, User, Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface PortfolioContext {
  display_name: string;
  bio: string | null;
  skills: string[];
  projects: { title: string; description: string | null; tech_stack: string[] }[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PortfolioAIChatProps {
  portfolioContext: PortfolioContext;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portfolio-ai`;

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "ja-JP", label: "日本語" },
  { code: "ko-KR", label: "한국어" },
  { code: "zh-CN", label: "中文" },
  { code: "pt-BR", label: "Português" },
  { code: "ar-SA", label: "العربية" },
  { code: "ru-RU", label: "Русский" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "mr-IN", label: "मराठी" },
];

const PortfolioAIChat = ({ portfolioContext, externalOpen, onExternalOpenChange }: PortfolioAIChatProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen);
    }
  }, [externalOpen]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    onExternalOpenChange?.(val);
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Stop speech on unmount or close
  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        setIsListening(false);
      }
    }
  }, [open]);

  const speakText = useCallback((text: string) => {
    if (!autoSpeak || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    // Strip markdown for cleaner speech
    const clean = text
      .replace(/[#*_`~>\-\[\]()!]/g, "")
      .replace(/\n+/g, ". ")
      .trim();
    if (!clean) return;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = selectedLang;
    utterance.rate = 1;
    utterance.pitch = 1;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [autoSpeak, selectedLang]);

  const toggleListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = selectedLang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim = transcript;
        }
      }
      setInput(finalTranscript || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone permissions.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, selectedLang]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: text,
          portfolio_context: portfolioContext,
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Auto-speak the final response
      if (assistantSoFar) {
        speakText(assistantSoFar);
      }
    } catch (e) {
      console.error("AI chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that request. Please try again." }]);
    }

    setLoading(false);
  };

  const quickPrompts = [
    "Make my bio more professional",
    "Improve my project descriptions",
    "Suggest skills to add",
    "Write a better portfolio headline",
  ];

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => handleOpenChange(true)}
              className="rounded-full w-14 h-14 shadow-lg shadow-primary/20 gap-0"
              variant="default"
            >
              <Sparkles className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[560px] rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Portfolio AI</h3>
                  <p className="text-[10px] text-muted-foreground">Voice & text powered assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Auto-speak toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${autoSpeak ? "text-primary" : "text-muted-foreground"}`}
                  onClick={() => {
                    setAutoSpeak(!autoSpeak);
                    if (autoSpeak) window.speechSynthesis?.cancel();
                    toast.success(autoSpeak ? "Auto-speak off" : "Auto-speak on");
                  }}
                  title={autoSpeak ? "Disable auto-speak" : "Enable auto-speak"}
                >
                  {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenChange(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Language selector */}
            <div className="px-4 py-2 border-b border-border/30 bg-secondary/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">🌐 Language:</span>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="text-[11px] bg-secondary/50 border border-border/30 rounded-md px-2 py-1 text-foreground flex-1 outline-none focus:ring-1 focus:ring-primary/50"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[180px] max-h-[300px]">
              {messages.length === 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Ask me to improve your portfolio! Try:
                  </p>
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); }}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 text-foreground transition-colors"
                    >
                      ✨ {prompt}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-foreground"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-xs prose-invert max-w-none [&_p]:m-0 [&_p]:mb-1 [&_pre]:text-[10px] [&_code]:text-[10px] [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-secondary/50 rounded-xl px-3 py-2">
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isListening ? "destructive" : "outline"}
                  className={`h-9 w-9 px-0 flex-shrink-0 ${isListening ? "animate-pulse" : ""}`}
                  onClick={toggleListening}
                  disabled={loading}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={isListening ? "Listening..." : "Ask AI to improve your portfolio..."}
                  className="text-xs h-9"
                  disabled={loading}
                />
                <Button size="sm" className="h-9 px-3" onClick={sendMessage} disabled={loading || !input.trim()}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              {isListening && (
                <p className="text-[10px] text-primary mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  Listening in {LANGUAGES.find(l => l.code === selectedLang)?.label}...
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PortfolioAIChat;
