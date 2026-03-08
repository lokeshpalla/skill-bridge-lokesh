import { motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Search, ChevronDown, RotateCcw, Timer, Lightbulb, Terminal, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { codingProblems, problemCategories, defaultHints, defaultDescriptions, CodingProblem } from "@/data/codingProblems";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const languages = [
  { id: "javascript", label: "JavaScript", icon: "JS", color: "text-warning" },
  { id: "python", label: "Python", icon: "PY", color: "text-success" },
  { id: "java", label: "Java", icon: "JV", color: "text-destructive" },
  { id: "cpp", label: "C++", icon: "C+", color: "text-primary" },
  { id: "typescript", label: "TypeScript", icon: "TS", color: "text-accent" },
  { id: "go", label: "Go", icon: "GO", color: "text-primary" },
  { id: "rust", label: "Rust", icon: "RS", color: "text-warning" },
  { id: "csharp", label: "C#", icon: "C#", color: "text-accent" },
];

const diffColor: Record<string, string> = {
  Easy: "text-success",
  Medium: "text-warning",
  Hard: "text-destructive",
};

const ITEMS_PER_PAGE = 50;

const CodingPage = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<CodingProblem>(codingProblems[0]);
  const [language, setLanguage] = useState(languages[0]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [code, setCode] = useState(`// Write your solution here\nfunction solution() {\n  \n}`);
  const [output, setOutput] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [diffFilter, setDiffFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [page, setPage] = useState(1);
  const [customInput, setCustomInput] = useState("");
  const [activeTab, setActiveTab] = useState<"output" | "input">("output");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Filter and paginate problems
  const filtered = useMemo(() => {
    return codingProblems
      .filter(p => filter === "All" || p.category === filter)
      .filter(p => diffFilter === "All" || p.difficulty === diffFilter)
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.id.toString().includes(search));
  }, [filter, diffFilter, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProblems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filter, diffFilter, search]);

  const switchLanguage = (lang: typeof languages[0]) => {
    setLanguage(lang);
    setShowLangPicker(false);
    setOutput(null);
  };

  const switchProblem = (p: CodingProblem) => {
    setSelected(p);
    setCode(`// Problem ${p.id}: ${p.title}\n// ${p.description}\n\nfunction solution() {\n  // Write your ${language.label} solution here\n  \n}`);
    setOutput(null);
    setShowHint(false);
    setTimer(0);
    setTimerActive(false);
    setCustomInput("");
  };

  const resetCode = () => {
    setCode(`// Problem ${selected.id}: ${selected.title}\n\nfunction solution() {\n  // Write your solution here\n  \n}`);
    setOutput(null);
  };

  const runCode = () => {
    setRunning(true);
    setActiveTab("output");
    setOutput("⏳ Running...");
    setTimerActive(false);

    setTimeout(() => {
      setRunning(false);
      const startTime = performance.now();
      try {
        // Capture console.log output
        const logs: string[] = [];
        const mockConsole = {
          log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args: unknown[]) => logs.push('⚠️ ' + args.map(a => String(a)).join(' ')),
          error: (...args: unknown[]) => logs.push('❌ ' + args.map(a => String(a)).join(' ')),
        };

        let execCode = code;

        // If custom input provided, make it available as `input` variable
        const inputVal = customInput.trim();
        let parsedInput: unknown = inputVal;
        if (inputVal) {
          try { parsedInput = JSON.parse(inputVal); } catch { parsedInput = inputVal; }
        }

        // eslint-disable-next-line no-new-func
        const fn = new Function('console', 'input', `
          ${execCode}
          // Try to detect and call common function patterns
          const __allFns = [];
          ${execCode.match(/function\s+(\w+)/g)?.map(m => {
            const name = m.replace('function ', '');
            return `try { if (typeof ${name} === 'function' && '${name}' !== 'solution') __allFns.push({name: '${name}', fn: ${name}}); } catch(e) {}`;
          })?.join('\n') || ''}
          try { if (typeof solution === 'function') __allFns.unshift({name: 'solution', fn: solution}); } catch(e) {}
          
          let __result;
          if (__allFns.length > 0) {
            const __main = __allFns[0];
            try {
              if (arguments[1] !== undefined && arguments[1] !== '') {
                const __input = arguments[1];
                if (Array.isArray(__input)) {
                  __result = __main.fn(...__input);
                } else {
                  __result = __main.fn(__input);
                }
              } else {
                __result = __main.fn();
              }
            } catch(e) {
              __result = '❌ ' + e.message;
            }
          }
          return { logs: undefined, result: __result };
        `);

        const execResult = fn(mockConsole, parsedInput);
        const elapsed = (performance.now() - startTime).toFixed(1);

        const parts: string[] = [];
        if (inputVal) {
          parts.push(`📥 Input:\n${inputVal}`);
        }
        if (logs.length > 0) {
          parts.push(`📋 Console Output:\n${logs.join('\n')}`);
        }
        if (execResult?.result !== undefined) {
          const resultStr = typeof execResult.result === 'object' 
            ? JSON.stringify(execResult.result, null, 2) 
            : String(execResult.result);
          parts.push(`📤 Return Value:\n${resultStr}`);
        } else if (logs.length === 0) {
          parts.push(`📤 Output:\n(no return value or console output)`);
        }
        parts.push(`\n⏱ Runtime: ${elapsed}ms | Language: ${language.label}`);
        setOutput(parts.join('\n\n'));

        // Record activity: award XP based on difficulty + time spent
        if (user && !String(execResult?.result).startsWith('❌')) {
          const diffXp: Record<string, number> = { Easy: 20, Medium: 40, Hard: 80 };
          const baseXp = diffXp[selected.difficulty] ?? 30;
          const minutesSpent = Math.floor(timer / 60);
          supabase.rpc("record_activity", {
            _user_id: user.id,
            _xp_amount: baseXp,
            _minutes_spent: minutesSpent,
          }).then(({ data }) => {
            const result = data as { xp_earned: number; new_streak: number; streak_increased: boolean } | null;
            if (result) {
              const streakMsg = result.streak_increased ? ` | 🔥 Streak: ${result.new_streak}` : "";
              toast({ title: "🎉 XP Earned!", description: `+${result.xp_earned} XP${streakMsg}` });
            }
          });
        }
      } catch (e) {
        const elapsed = (performance.now() - startTime).toFixed(1);
        setOutput(`❌ Error:\n${(e as Error).message}\n\n⏱ Runtime: ${elapsed}ms`);
      }
    }, 300);
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Coding Challenges</h1>
          <p className="text-sm text-muted-foreground">{codingProblems.length.toLocaleString()} problems • {languages.length} languages supported</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimerActive(!timerActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              timerActive ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary/60 border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            {formatTime(timer)}
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Problem list */}
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/60 flex flex-col max-h-[78vh]">
          <div className="p-3 border-b border-border/40 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search problems by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/40 border-border/30"
              />
            </div>
            {/* Difficulty filter */}
            <div className="flex gap-1">
              {["All", "Easy", "Medium", "Hard"].map((f) => (
                <button
                  key={f}
                  onClick={() => setDiffFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    diffFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {/* Category filter */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {problemCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                    filter === cat ? "bg-accent/20 text-accent-foreground border border-accent/30" : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {filtered.length.toLocaleString()} problems found • Page {page}/{totalPages || 1}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {paginatedProblems.map((p) => (
              <button
                key={p.id}
                onClick={() => switchProblem(p)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                  selected.id === p.id ? "bg-primary/10 border border-primary/25" : "hover:bg-secondary/50"
                }`}
              >
                {p.solved ? (
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.id}. {p.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium ${diffColor[p.difficulty]}`}>{p.difficulty}</span>
                    <span className="text-[10px] text-muted-foreground">{p.category}</span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{p.acceptance}</span>
              </button>
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] gap-1"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-6 h-6 rounded text-[10px] font-medium ${
                        page === pageNum ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] gap-1"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Code editor */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Problem description */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">{selected.id}. {selected.title}</h2>
              <span className={`text-xs font-medium ${diffColor[selected.difficulty]}`}>{selected.difficulty}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {defaultDescriptions[selected.id] || selected.description}
            </p>
            <button
              onClick={() => setShowHint(!showHint)}
              className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <Lightbulb className="w-3 h-3" />
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
            {showHint && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-[11px] text-accent mt-2 p-2 rounded-lg bg-accent/5 border border-accent/15"
              >
                {defaultHints[selected.id]}
              </motion.p>
            )}
          </div>

          {/* Editor with language picker */}
          <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
              <div className="relative">
                <button
                  onClick={() => setShowLangPicker(!showLangPicker)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/60 hover:bg-secondary text-xs font-medium transition-all"
                >
                  <span className={`font-mono text-[10px] font-bold ${language.color}`}>{language.icon}</span>
                  <span>{language.label}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </button>

                {showLangPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 mt-1 z-50 w-44 rounded-lg border border-border/50 bg-card shadow-lg p-1"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => switchLanguage(lang)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs transition-all ${
                          language.id === lang.id ? "bg-primary/10 text-primary" : "hover:bg-secondary/60 text-foreground"
                        }`}
                      >
                        <span className={`font-mono text-[10px] font-bold w-5 ${lang.color}`}>{lang.icon}</span>
                        <span className="font-medium">{lang.label}</span>
                        {language.id === lang.id && <CheckCircle className="w-3 h-3 text-primary ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetCode}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                  title="Reset code"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <Button size="sm" variant="hero" onClick={runCode} disabled={running} className="h-7 text-[11px] px-3">
                  <Play className="w-3 h-3" /> {running ? "Running..." : "Run"}
                </Button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-52 bg-transparent p-4 font-mono text-xs text-foreground resize-none outline-none"
              spellCheck={false}
            />
          </div>

          {/* Custom Input + Output tabs */}
          <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
            <div className="flex border-b border-border/40">
              <button
                onClick={() => setActiveTab("input")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all border-b-2 ${
                  activeTab === "input"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Terminal className="w-3 h-3" /> Custom Input
              </button>
              <button
                onClick={() => setActiveTab("output")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all border-b-2 ${
                  activeTab === "output"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Play className="w-3 h-3" /> Output
              </button>
            </div>
            <div className="p-4">
              {activeTab === "input" ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    Enter custom test input. It will be passed as the <code className="text-primary bg-primary/10 px-1 rounded">input</code> parameter to your <code className="text-primary bg-primary/10 px-1 rounded">solution()</code> function.
                  </p>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={"Enter your input here...\ne.g. [1, 2, 3, 4, 5]\nor multiple lines of input"}
                    className="w-full h-24 bg-secondary/30 rounded-lg p-3 font-mono text-xs text-foreground resize-none outline-none border border-border/30 focus:border-primary/30 transition-colors"
                    spellCheck={false}
                  />
                  <Button size="sm" variant="default" onClick={runCode} disabled={running} className="h-7 text-[11px] gap-1">
                    <Play className="w-3 h-3" /> Run with Custom Input
                  </Button>
                </div>
              ) : (
                <div>
                  {output ? (
                    <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">{output}</pre>
                  ) : (
                    <p className="text-xs text-muted-foreground">Click "Run" to see output here.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Language stats bar */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-3">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Practice in any language</p>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => switchLanguage(lang)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    language.id === lang.id
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-secondary/30 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  <span className={`font-mono text-[9px] font-bold ${lang.color}`}>{lang.icon}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPage;
