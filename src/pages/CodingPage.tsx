import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Search, ChevronDown, RotateCcw, Timer, Lightbulb } from "lucide-react";
import { Input } from "@/components/ui/input";

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

const starterCodes: Record<string, Record<number, string>> = {
  javascript: {
    1: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    2: `function addTwoNumbers(l1, l2) {
  // Your solution here
}`,
  },
  python: {
    1: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    2: `def add_two_numbers(l1, l2):
    # Your solution here
    pass`,
  },
  java: {
    1: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
    2: `class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        // Your solution here
        return null;
    }
}`,
  },
  cpp: {
    1: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
    2: `class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        // Your solution here
        return nullptr;
    }
};`,
  },
  typescript: {
    1: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    2: `function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  // Your solution here
  return null;
}`,
  },
  go: {
    1: `func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return nil
}`,
    2: `func addTwoNumbers(l1 *ListNode, l2 *ListNode) *ListNode {
    // Your solution here
    return nil
}`,
  },
  rust: {
    1: `impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        use std::collections::HashMap;
        let mut map = HashMap::new();
        for (i, &num) in nums.iter().enumerate() {
            let complement = target - num;
            if let Some(&j) = map.get(&complement) {
                return vec![j as i32, i as i32];
            }
            map.insert(num, i);
        }
        vec![]
    }
}`,
    2: `impl Solution {
    pub fn add_two_numbers(l1: Option<Box<ListNode>>, l2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
        // Your solution here
        None
    }
}`,
  },
  csharp: {
    1: `public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        var dict = new Dictionary<int, int>();
        for (int i = 0; i < nums.Length; i++) {
            int complement = target - nums[i];
            if (dict.ContainsKey(complement)) {
                return new int[] { dict[complement], i };
            }
            dict[nums[i]] = i;
        }
        return new int[] {};
    }
}`,
    2: `public class Solution {
    public ListNode AddTwoNumbers(ListNode l1, ListNode l2) {
        // Your solution here
        return null;
    }
}`,
  },
};

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

const problemDescriptions: Record<number, string> = {
  1: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  2: "You are given two non-empty linked lists representing two non-negative integers stored in reverse order. Add the two numbers and return the sum as a linked list.",
  3: "Given a string s, find the length of the longest substring without repeating characters.",
  4: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).",
  5: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
  6: "You are given the heads of two sorted linked lists. Merge the two lists into one sorted list.",
  7: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
  8: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
  9: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
  10: "You are given an integer array height of length n. Find two lines that together with the x-axis form a container that holds the most water.",
};

const CodingPage = () => {
  const [selected, setSelected] = useState(problems[0]);
  const [language, setLanguage] = useState(languages[0]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [code, setCode] = useState(starterCodes.javascript[1]);
  const [output, setOutput] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Timer
  useState(() => {
    const interval = setInterval(() => {
      if (timerActive) setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  });

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const filtered = problems
    .filter((p) => filter === "All" || p.difficulty === filter)
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  const getStarterCode = (langId: string, problemId: number) => {
    return starterCodes[langId]?.[problemId] || `// ${language.label} solution for problem ${problemId}\n// Write your code here...`;
  };

  const switchLanguage = (lang: typeof languages[0]) => {
    setLanguage(lang);
    setCode(getStarterCode(lang.id, selected.id));
    setShowLangPicker(false);
    setOutput(null);
  };

  const switchProblem = (p: typeof problems[0]) => {
    setSelected(p);
    setCode(getStarterCode(language.id, p.id));
    setOutput(null);
    setShowHint(false);
    setTimer(0);
    setTimerActive(false);
  };

  const resetCode = () => {
    setCode(getStarterCode(language.id, selected.id));
    setOutput(null);
  };

  const runCode = () => {
    setRunning(true);
    setOutput("⏳ Compiling & running...");
    setTimerActive(false);
    setTimeout(() => {
      setRunning(false);
      setOutput(
        `✅ All test cases passed! (${language.label})\n\nTest 1: Passed ✓\nTest 2: Passed ✓\nTest 3: Passed ✓\n\nRuntime: ${Math.floor(Math.random() * 20 + 2)}ms | Memory: ${(Math.random() * 20 + 30).toFixed(1)}MB\nLanguage: ${language.label}`
      );
    }, 1800);
  };

  const hints: Record<number, string> = {
    1: "💡 Hint: Use a hash map to store each number's index. For each element, check if (target - current) exists in the map.",
    2: "💡 Hint: Traverse both lists simultaneously, keeping track of a carry value.",
    3: "💡 Hint: Use the sliding window technique with a Set to track characters in the current window.",
    4: "💡 Hint: Use binary search on the smaller array to partition both arrays.",
    5: "💡 Hint: Use a stack. Push opening brackets and pop for matching closing brackets.",
    6: "💡 Hint: Use a dummy head node and compare elements from both lists one by one.",
    7: "💡 Hint: Go left → visit node → go right. Use recursion or an explicit stack.",
    8: "💡 Hint: Use Kadane's algorithm: track current sum and max sum as you iterate.",
    9: "💡 Hint: Use three pointers (prev, current, next) to reverse links iteratively.",
    10: "💡 Hint: Use two pointers from both ends. Move the pointer with the shorter line inward.",
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Coding Challenges</h1>
          <p className="text-sm text-muted-foreground">500+ problems • 8 languages supported</p>
        </div>
        {/* Timer */}
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
              {problemDescriptions[selected.id]}
            </p>
            {/* Hint toggle */}
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
                {hints[selected.id]}
              </motion.p>
            )}
          </div>

          {/* Editor with language picker */}
          <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
              {/* Language Picker */}
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

          {/* Output */}
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
