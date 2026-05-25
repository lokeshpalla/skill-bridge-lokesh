import { motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Search, ChevronDown, RotateCcw, Timer, Lightbulb, Terminal, ChevronLeft, ChevronRight, ArrowLeft, List, Youtube, Languages, ExternalLink } from "lucide-react";

const TUTORIAL_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", q: "english" },
  { code: "hi", label: "Hindi", flag: "🇮🇳", q: "hindi" },
  { code: "te", label: "Telugu", flag: "🇮🇳", q: "telugu" },
  { code: "ta", label: "Tamil", flag: "🇮🇳", q: "tamil" },
  { code: "es", label: "Spanish", flag: "🇪🇸", q: "español" },
];

// Curated YouTube solution videos mapped by problem title (lowercased).
// English embeds play inline; other languages link out to a YouTube search.
const solutionVideoByTitle: Record<string, string> = {
  "two sum": "KLlXCFG5TnA",
  "best time to buy and sell stock": "1pkOgXD63yU",
  "contains duplicate": "3OamzN90kPg",
  "product of array except self": "bNvIQI2wAjk",
  "maximum subarray": "5WZl3MMT0Eg",
  "maximum product subarray": "lXVy6YWFcRM",
  "find minimum in rotated sorted array": "nIVW4P8b1VA",
  "search in rotated sorted array": "U8XENwh8Oy8",
  "container with most water": "UuiTKBwPgAo",
  "three sum": "jzZsG8n2R9A",
  "move zeroes": "aayNRwUN3Do",
  "rotate array": "BHr381Guz3Y",
  "merge sorted array": "P1Ic85RarKY",
  "remove duplicates from sorted array": "DEJAZBq0FDA",
  "single number": "qMPX1AOa83k",
  "missing number": "WnPLSRLSANE",
  "majority element": "7pnhv842keE",
  "subarray sum equals k": "fFVZt-6sgyo",
  "first missing positive": "8g78yfzMlao",
  "trapping rain water": "ZI2z5pq0TqA",
  "spiral matrix": "BJnMZNwUk1M",
  "set matrix zeroes": "T41rL0L3Pnw",
  "jump game": "Yan0cv2cLy8",
  "jump game ii": "dJ7sWiOoK7g",
  "merge intervals": "44H3cEC2fFM",
  "insert interval": "A8NUOmlwOlM",
  "non-overlapping intervals": "nONCGxWoUfM",
  "sort colors": "4xbWSRZHqac",
  "kth largest element": "XEmy13g1Qxc",
  "top k frequent elements": "YPTqKIgVk-k",
  "sliding window maximum": "DfljaUwZsOk",
  "longest consecutive sequence": "P6RZZMu_maU",
  "valid anagram": "9UtInBqnCgA",
  "valid palindrome": "jJXJ16kPFWg",
  "longest palindromic substring": "XYQecbcd6_c",
  "longest common prefix": "0sWShKIJoo4",
  "group anagrams": "vzdNOK2oB2E",
  "longest substring without repeating characters": "wiGpQwVHdE0",
  "minimum window substring": "jSto0O4AJbM",
  "string to integer (atoi)": "YA0LYrKI1CQ",
  "reverse string": "_d0T_2Lk2qA",
  "reverse words in a string": "kCw3xrt0z2Y",
  "encode and decode strings": "B1k_sxOSgv8",
  "letter combinations of a phone number": "0snEunUacZY",
  "generate parentheses": "s9fokUqJ76A",
  "regular expression matching": "l3hda49XcDE",
  "edit distance": "XYi2-LPrwm4",
  "word break": "Sx9NNgInc3A",
  "word search": "pfiQ_PS1g8E",
  "longest repeating character replacement": "gqXU1UyA8pk",
  "reverse linked list": "G0_I-ZF0S38",
  "merge two sorted lists": "XIdigk956u0",
  "linked list cycle": "gBTe7lFR3vc",
  "remove nth node from end of list": "XVuQxVej6y8",
  "reorder list": "S5bfdUTrKLM",
  "merge k sorted lists": "q5a5OiGbT6Q",
  "maximum depth of binary tree": "hTM3phVI6YQ",
  "same tree": "vRbbcKXCxOw",
  "invert binary tree": "OnSn2XEQ4MY",
  "binary tree level order traversal": "6ZnyEApgFYg",
  "validate binary search tree": "s6ATEkipzow",
  "lowest common ancestor of a binary search tree": "gs2LMfuOR9k",
  "kth smallest element in a bst": "5LUXSvjmGCw",
  "serialize and deserialize binary tree": "u4JAi2JJhI8",
  "climbing stairs": "Y0lT9Fck7qI",
  "coin change": "H9bfqozjoqs",
  "longest increasing subsequence": "cjWnW0hdF1Y",
  "house robber": "73r3KWiEvyk",
  "house robber ii": "rWAJCfYYOvM",
  "unique paths": "IlEsdxuD4lY",
  "longest common subsequence": "Ua0GhsJSlWM",
  "partition equal subset sum": "IsvocB5BJhw",
  "number of islands": "pV2kpPD66nE",
  "clone graph": "mQeF6bN8hMk",
  "course schedule": "EgI5nU9etnU",
  "pacific atlantic water flow": "s-VkcjHqkGI",
  "valid parentheses": "WTzjTskDFMg",
  "min stack": "qkLl7nAwDPo",
  "evaluate reverse polish notation": "iu0082c4HDE",
  "daily temperatures": "cTBiBSnjO3c",
  "largest rectangle in histogram": "zx5Sw9130L0",
  "binary search": "s4DPM8ct1pI",
  "search a 2d matrix": "Ber2pi2C0j0",
  "koko eating bananas": "U2SozAs9RzA",
  "find median from data stream": "itmhHWaHupI",
  "lru cache": "7ABFKPK2hD4",
  "implement trie (prefix tree)": "oobqoCJlHA0",
};

const getSolutionVideoId = (title: string): string | null => {
  const t = title.toLowerCase().trim();
  if (solutionVideoByTitle[t]) return solutionVideoByTitle[t];
  for (const key of Object.keys(solutionVideoByTitle)) {
    if (t.includes(key) || key.includes(t)) return solutionVideoByTitle[key];
  }
  return null;
};
import MonacoEditor from "@monaco-editor/react";
import { Input } from "@/components/ui/input";
import { codingProblems, problemCategories, defaultHints, defaultDescriptions, CodingProblem } from "@/data/codingProblems";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const languages = [
  { id: "javascript", label: "JavaScript", icon: "JS", color: "text-warning", supported: true },
  { id: "python", label: "Python", icon: "PY", color: "text-success", supported: false },
  { id: "java", label: "Java", icon: "JV", color: "text-destructive", supported: false },
  { id: "cpp", label: "C++", icon: "C+", color: "text-primary", supported: false },
  { id: "typescript", label: "TypeScript", icon: "TS", color: "text-accent", supported: false },
  { id: "go", label: "Go", icon: "GO", color: "text-primary", supported: false },
  { id: "rust", label: "Rust", icon: "RS", color: "text-warning", supported: false },
  { id: "csharp", label: "C#", icon: "C#", color: "text-accent", supported: false },
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

  const [tutorialLang, setTutorialLang] = useState(TUTORIAL_LANGUAGES[0]);

  // Mobile view: show problem list or editor
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

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
    // On mobile, switch to editor view when a problem is selected
    setMobileView("editor");
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
        const logs: string[] = [];
        const mockConsole = {
          log: (...args: unknown[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args: unknown[]) => logs.push('⚠️ ' + args.map(a => String(a)).join(' ')),
          error: (...args: unknown[]) => logs.push('❌ ' + args.map(a => String(a)).join(' ')),
        };

        let execCode = code;
        const inputVal = customInput.trim();
        let parsedInput: unknown = inputVal;
        if (inputVal) {
          try { parsedInput = JSON.parse(inputVal); } catch { parsedInput = inputVal; }
        }

        // eslint-disable-next-line no-new-func
        const fn = new Function('console', 'input', `
          ${execCode}
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

        // Run test cases from problem examples if no custom input
        if (!inputVal && selected.examples && selected.examples.length > 0 && language.id === "javascript") {
          let passed = 0;
          const total = selected.examples.length;
          const testResults: string[] = [];

          for (const ex of selected.examples) {
            try {
              // Parse input from example string (e.g. "nums = [2,7,11,15], target = 9")
              const inputStr = ex.input;
              const args: unknown[] = [];
              const assignments = inputStr.split(/,\s*(?=[a-zA-Z_]\w*\s*=)/);
              for (const assign of assignments) {
                const valueMatch = assign.match(/=\s*(.+)$/);
                if (valueMatch) {
                  try { args.push(JSON.parse(valueMatch[1].trim())); } catch { args.push(valueMatch[1].trim()); }
                }
              }

              const testFn = new Function('console', 'args', `
                ${code}
                const __allFns = [];
                ${code.match(/function\s+(\w+)/g)?.map(m => {
                  const name = m.replace('function ', '');
                  return `try { if (typeof ${name} === 'function') __allFns.push({name: '${name}', fn: ${name}}); } catch(e) {}`;
                })?.join('\n') || ''}
                if (__allFns.length === 0) return undefined;
                const __main = __allFns[0];
                return __main.fn(...args);
              `);
              const testResult = testFn(mockConsole, args);
              const resultStr = typeof testResult === 'object' ? JSON.stringify(testResult) : String(testResult);
              const expectedStr = ex.output.trim();

              // Normalize comparison
              const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
              const pass = normalize(resultStr) === normalize(expectedStr);
              if (pass) passed++;

              testResults.push(`${pass ? "✅" : "❌"} Test: ${ex.input}\n   Expected: ${expectedStr}\n   Got: ${resultStr}`);
            } catch (testErr) {
              testResults.push(`❌ Test: ${ex.input}\n   Error: ${(testErr as Error).message}`);
            }
          }

          parts.push(`🧪 Test Results: ${passed}/${total} passed\n\n${testResults.join('\n\n')}`);
          
          if (logs.length > 0) {
            parts.push(`📋 Console Output:\n${logs.join('\n')}`);
          }
          parts.push(`\n⏱ Runtime: ${elapsed}ms | Language: ${language.label}`);
          
          // Only award XP if all tests pass
          if (passed === total) {
            setOutput(parts.join('\n\n'));
            // XP award handled below
          } else {
            setOutput(parts.join('\n\n'));
            setRunning(false);
            return;
          }
        } else {
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
        }

        if (user && !String(execResult?.result).startsWith('❌')) {
          const diffXp: Record<string, number> = { Easy: 20, Medium: 40, Hard: 80 };
          const baseXp = diffXp[selected.difficulty] ?? 30;
          const minutesSpent = Math.floor(timer / 60);

          const solvedKey = `solved_problems_${user.id}`;
          const solved: number[] = JSON.parse(localStorage.getItem(solvedKey) || "[]");
          if (!solved.includes(selected.id)) {
            solved.push(selected.id);
            localStorage.setItem(solvedKey, JSON.stringify(solved));
          }

          supabase.rpc("record_activity", {
            _user_id: user.id,
            _xp_amount: baseXp,
            _minutes_spent: minutesSpent,
          }).then(({ data }) => {
            const result = data as { xp_earned: number; new_streak: number; streak_increased: boolean } | null;
            if (result) {
              const streakMsg = result.streak_increased ? ` | 🔥 Streak: ${result.new_streak}` : "";
              toast({ title: "🎉 Problem Solved!", description: `+${result.xp_earned} XP${streakMsg}` });
            }
          });
        }
      } catch (e) {
        const elapsed = (performance.now() - startTime).toFixed(1);
        setOutput(`❌ Error:\n${(e as Error).message}\n\n⏱ Runtime: ${elapsed}ms`);
      }
    }, 300);
  };

  // ── Problem List Panel ──
  const problemListPanel = (
    <div className={`rounded-xl border border-border/50 bg-card/60 flex flex-col ${mobileView === "list" ? "max-h-[85vh]" : "max-h-[78vh]"}`}>
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
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
              selected.id === p.id ? "bg-primary/10 border border-primary/25" : "hover:bg-secondary/50 active:bg-secondary/70"
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
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 lg:hidden" />
            <span className="text-[10px] text-muted-foreground hidden lg:block">{p.acceptance}</span>
          </button>
        ))}
      </div>
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
  );

  // ── Editor Panel ──
  const editorPanel = (
    <div className="flex flex-col gap-3">
      {/* Mobile back button */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileView("list")}
          className="flex items-center gap-1.5 text-sm text-primary font-medium mb-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Problems
        </button>
      </div>

      {/* Problem description */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4 max-h-[40vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">{selected.id}. {selected.title}</h2>
          <span className={`text-xs font-medium ${diffColor[selected.difficulty]}`}>{selected.difficulty}</span>
        </div>

        {selected.topics && selected.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {selected.topics.map((topic) => (
              <span key={topic} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                {topic}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {defaultDescriptions[selected.id] || selected.description}
        </p>

        {selected.examples && selected.examples.length > 0 && (
          <div className="space-y-2 mb-3">
            {selected.examples.map((ex, idx) => (
              <div key={idx} className="rounded-lg bg-secondary/30 border border-border/30 p-3 space-y-1">
                <p className="text-[11px] font-semibold text-foreground">Example {idx + 1}:</p>
                <div className="font-mono text-[11px] space-y-0.5">
                  <p><span className="text-muted-foreground">Input: </span><span className="text-foreground whitespace-pre-wrap break-all">{ex.input}</span></p>
                  <p><span className="text-muted-foreground">Output: </span><span className="text-foreground">{ex.output}</span></p>
                  {ex.explanation && (
                    <p className="text-muted-foreground mt-1"><span className="font-medium">Explanation: </span>{ex.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selected.constraints && selected.constraints.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-foreground mb-1">Constraints:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {selected.constraints.map((c, idx) => (
                <li key={idx} className="text-[11px] text-muted-foreground font-mono break-all">{c}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => setShowHint(!showHint)}
          className="mt-1 flex items-center gap-1 text-[11px] text-primary hover:underline"
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

      {/* Video Tutorials in multiple languages */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Youtube className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold">Video Tutorial</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Languages className="w-3 h-3 text-muted-foreground mr-1" />
            {TUTORIAL_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setTutorialLang(lang)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                  tutorialLang.code === lang.code
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Walkthrough of <span className="text-foreground font-medium">{selected.title}</span> in {tutorialLang.label}.
        </p>
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <iframe
            key={`${selected.id}-${tutorialLang.code}-${language.id}`}
            className="w-full h-full"
            src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${selected.title} ${language.label} tutorial ${tutorialLang.q}`)}`}
            title={`${selected.title} - ${tutorialLang.label}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* Editor with language picker */}
      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/40">
          <div className="relative">
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/60 hover:bg-secondary text-xs font-medium transition-all"
            >
              <span className={`font-mono text-[10px] font-bold ${language.color}`}>{language.icon}</span>
              <span className="hidden sm:inline">{language.label}</span>
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
                    onClick={() => lang.supported ? switchLanguage(lang) : null}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs transition-all ${
                      language.id === lang.id ? "bg-primary/10 text-primary" : lang.supported ? "hover:bg-secondary/60 text-foreground" : "text-muted-foreground/50 cursor-not-allowed"
                    }`}
                    disabled={!lang.supported}
                  >
                    <span className={`font-mono text-[10px] font-bold w-5 ${lang.supported ? lang.color : "text-muted-foreground/40"}`}>{lang.icon}</span>
                    <span className="font-medium">{lang.label}</span>
                    {!lang.supported && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Soon</span>}
                    {lang.supported && language.id === lang.id && <CheckCircle className="w-3 h-3 text-primary ml-auto" />}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={resetCode}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              title="Reset code"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <Button size="sm" onClick={runCode} disabled={running} className="h-7 text-[11px] px-3 bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Play className="w-3 h-3" /> {running ? "Running..." : "Run"}
            </Button>
          </div>
        </div>
        <MonacoEditor
          height="220px"
          language={language.id === "cpp" ? "cpp" : language.id === "csharp" ? "csharp" : language.id}
          value={code}
          onChange={(val) => setCode(val || "")}
          theme={document.documentElement.classList.contains('dark') ? "vs-dark" : "light"}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 8 },
          }}
        />
      </div>

      {/* Custom Input + Output tabs */}
      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <div className="flex border-b border-border/40">
          <button
            onClick={() => setActiveTab("input")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-medium transition-all border-b-2 ${
              activeTab === "input"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="w-3 h-3" /> Input
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-medium transition-all border-b-2 ${
              activeTab === "output"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Play className="w-3 h-3" /> Output
          </button>
        </div>
        <div className="p-3 sm:p-4">
          {activeTab === "input" ? (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Enter custom test input passed as <code className="text-primary bg-primary/10 px-1 rounded">input</code> to your function.
              </p>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={"e.g. [1, 2, 3, 4, 5]"}
                className="w-full h-20 sm:h-24 bg-secondary/30 rounded-lg p-3 font-mono text-xs text-foreground resize-none outline-none border border-border/30 focus:border-primary/30 transition-colors"
                spellCheck={false}
              />
              <Button size="sm" onClick={runCode} disabled={running} className="h-7 text-[11px] gap-1 bg-gradient-primary text-primary-foreground hover:opacity-90">
                <Play className="w-3 h-3" /> Run with Input
              </Button>
            </div>
          ) : (
            <div>
              {output ? (
                <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all">{output}</pre>
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
              onClick={() => lang.supported ? switchLanguage(lang) : null}
              disabled={!lang.supported}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                language.id === lang.id
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : lang.supported
                    ? "bg-secondary/30 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
                    : "bg-secondary/20 border-border/20 text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              <span className={`font-mono text-[9px] font-bold ${lang.supported ? lang.color : "text-muted-foreground/40"}`}>{lang.icon}</span>
              {lang.label}
              {!lang.supported && <span className="text-[8px] px-1 py-0.5 rounded bg-muted text-muted-foreground">Soon</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-0.5">Coding Challenges</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{codingProblems.length.toLocaleString()} problems • {languages.length} languages</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile toggle between list and editor */}
          <button
            onClick={() => setMobileView(mobileView === "list" ? "editor" : "list")}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/60 border border-border/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <List className="w-3.5 h-3.5" />
            {mobileView === "list" ? "Editor" : "Problems"}
          </button>
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

      {/* Desktop: side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          {problemListPanel}
        </div>
        <div className="lg:col-span-3">
          {editorPanel}
        </div>
      </div>

      {/* Mobile: toggle between list and editor */}
      <div className="lg:hidden">
        {mobileView === "list" ? problemListPanel : editorPanel}
      </div>
    </div>
  );
};

export default CodingPage;
