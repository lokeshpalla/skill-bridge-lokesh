import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const problems = [
  { id: 1, title: "Two Sum", difficulty: "Easy", category: "Arrays", acceptance: "78%", solved: true },
  { id: 2, title: "Add Two Numbers", difficulty: "Medium", category: "Linked Lists", acceptance: "42%", solved: true },
  { id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", category: "Strings", acceptance: "35%", solved: false },
  { id: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard", category: "Arrays", acceptance: "22%", solved: false },
  { id: 5, title: "Valid Parentheses", difficulty: "Easy", category: "Stacks", acceptance: "85%", solved: true },
  { id: 6, title: "Merge Two Sorted Lists", difficulty: "Easy", category: "Linked Lists", acceptance: "72%", solved: false },
  { id: 7, title: "Binary Tree Inorder Traversal", difficulty: "Easy", category: "Trees", acceptance: "68%", solved: false },
  { id: 8, title: "Maximum Subarray", difficulty: "Medium", category: "Arrays", acceptance: "55%", solved: true },
  { id: 9, title: "Reverse Linked List", difficulty: "Easy", category: "Linked Lists", acceptance: "82%", solved: false },
  { id: 10, title: "Container With Most Water", difficulty: "Medium", category: "Two Pointers", acceptance: "48%", solved: false },
];

const diffColor: Record<string, string> = {
  Easy: "text-success",
  Medium: "text-warning",
  Hard: "text-destructive",
};

const starterCode = `function twoSum(nums, target) {
  // Your solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`;

const CodingPage = () => {
  const [selected, setSelected] = useState(problems[0]);
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = problems
    .filter(p => filter === "All" || p.difficulty === filter)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  const runCode = () => {
    setOutput("Running...");
    setTimeout(() => {
      setOutput(`✅ All test cases passed!\n\nTest 1: twoSum([2,7,11,15], 9) → [0,1] ✓\nTest 2: twoSum([3,2,4], 6) → [1,2] ✓\nTest 3: twoSum([3,3], 6) → [0,1] ✓\n\nRuntime: 4ms | Memory: 42.3MB`);
    }, 1500);
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Coding Challenges</h1>
        <p className="text-sm text-muted-foreground">500+ problems across all difficulty levels</p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Problem list */}
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/60 flex flex-col max-h-[75vh]">
          <div className="p-3 border-b border-border/40 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/40 border-border/30"
              />
            </div>
            <div className="flex gap-1">
              {["All", "Easy", "Medium", "Hard"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
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
        </div>

        {/* Code editor */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="rounded-xl border border-border/50 bg-card/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">{selected.id}. {selected.title}</h2>
              <span className={`text-xs font-medium ${diffColor[selected.difficulty]}`}>{selected.difficulty}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Given an array of integers <code className="bg-secondary px-1 py-0.5 rounded text-primary font-mono text-[11px]">nums</code> and an integer <code className="bg-secondary px-1 py-0.5 rounded text-primary font-mono text-[11px]">target</code>, return indices of the two numbers such that they add up to target.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
              <span className="text-[11px] text-muted-foreground font-mono">JavaScript</span>
              <Button size="sm" variant="hero" onClick={runCode} className="h-7 text-[11px] px-3">
                <Play className="w-3 h-3" /> Run
              </Button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-52 bg-transparent p-4 font-mono text-xs text-foreground resize-none outline-none"
              spellCheck={false}
            />
          </div>

          {output && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4"
            >
              <h3 className="text-xs font-semibold mb-2">Output</h3>
              <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">{output}</pre>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingPage;
