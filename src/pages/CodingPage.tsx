import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";

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

  const filtered = filter === "All" ? problems : problems.filter(p => p.difficulty === filter);

  const runCode = () => {
    setOutput("Running...");
    setTimeout(() => {
      setOutput(`✅ All test cases passed!\n\nTest 1: twoSum([2,7,11,15], 9) → [0,1] ✓\nTest 2: twoSum([3,2,4], 6) → [1,2] ✓\nTest 3: twoSum([3,3], 6) → [0,1] ✓\n\nRuntime: 4ms | Memory: 42.3MB`);
    }, 1500);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Coding Challenges</h1>
          <p className="text-muted-foreground">500+ problems across all difficulty levels</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Problem list */}
          <div className="lg:col-span-2 glass rounded-xl p-4 max-h-[75vh] overflow-y-auto">
            <div className="flex gap-2 mb-4">
              {["All", "Easy", "Medium", "Hard"].map((f) => (
                <Button key={f} size="sm" variant={filter === f ? "default" : "secondary"} onClick={() => setFilter(f)}>
                  {f}
                </Button>
              ))}
            </div>
            <div className="space-y-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    selected.id === p.id ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary"
                  }`}
                >
                  {p.solved ? (
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.id}. {p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${diffColor[p.difficulty]}`}>{p.difficulty}</span>
                      <span className="text-xs text-muted-foreground">{p.category}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.acceptance}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code editor */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Problem description */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">{selected.id}. {selected.title}</h2>
                <span className={`text-sm font-medium ${diffColor[selected.difficulty]}`}>{selected.difficulty}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Given an array of integers <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-xs">nums</code> and an integer <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-xs">target</code>, return indices of the two numbers such that they add up to target.
              </p>
            </div>

            {/* Editor */}
            <div className="glass rounded-xl overflow-hidden flex-1">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground font-mono">JavaScript</span>
                <Button size="sm" variant="hero" onClick={runCode}>
                  <Play className="w-3 h-3" /> Run Code
                </Button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-56 bg-transparent p-4 font-mono text-sm text-foreground resize-none outline-none"
                spellCheck={false}
              />
            </div>

            {/* Output */}
            {output && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-4"
              >
                <h3 className="text-sm font-semibold mb-2">Output</h3>
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{output}</pre>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPage;
