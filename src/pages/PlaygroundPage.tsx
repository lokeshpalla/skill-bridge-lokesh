import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Play, RotateCcw, Download, Copy, Check, ChevronDown,
  Terminal, Layout, Maximize2, Minimize2, Share2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const languages = [
  { id: "html", label: "HTML/CSS/JS", icon: "🌐", defaultCode: `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      font-family: system-ui, sans-serif;
      color: #e2e8f0;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 0.9rem; }
    button {
      margin-top: 20px;
      padding: 10px 24px;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #06b6d4, #8b5cf6);
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9rem;
    }
    button:hover { opacity: 0.9; }
    #counter { font-size: 3rem; margin: 16px 0; font-weight: bold; color: #06b6d4; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 Playground</h1>
    <p>Build anything right here</p>
    <div id="counter">0</div>
    <button onclick="increment()">Click Me</button>
  </div>
  <script>
    let count = 0;
    function increment() {
      count++;
      document.getElementById('counter').textContent = count;
    }
  </script>
</body>
</html>` },
  { id: "javascript", label: "JavaScript", icon: "JS", defaultCode: `// JavaScript Playground
// Output appears in the console below

function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

console.log("Fibonacci sequence (first 10):");
for (let i = 0; i < 10; i++) {
  console.log(\`  fib(\${i}) = \${fibonacci(i)}\`);
}

// Array operations
const nums = [5, 3, 8, 1, 9, 2, 7, 4, 6];
console.log("\\nOriginal:", nums);
console.log("Sorted:", [...nums].sort((a, b) => a - b));
console.log("Sum:", nums.reduce((a, b) => a + b, 0));
console.log("Max:", Math.max(...nums));
console.log("Filtered (>5):", nums.filter(n => n > 5));` },
  { id: "python", label: "Python", icon: "PY", defaultCode: `# Python Playground
# Note: This is a simulated Python environment

def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

print("Fibonacci sequence (first 10):")
for i in range(10):
    print(f"  fib({i}) = {fibonacci(i)}")

# List operations
nums = [5, 3, 8, 1, 9, 2, 7, 4, 6]
print(f"\\nOriginal: {nums}")
print(f"Sorted: {sorted(nums)}")
print(f"Sum: {sum(nums)}")
print(f"Max: {max(nums)}")
print(f"Filtered (>5): {[n for n in nums if n > 5]}")` },
  { id: "typescript", label: "TypeScript", icon: "TS", defaultCode: `// TypeScript Playground
// Types are checked visually — runs as JavaScript

interface User {
  name: string;
  age: number;
  skills: string[];
}

const users: User[] = [
  { name: "Alice", age: 28, skills: ["React", "TypeScript", "Node.js"] },
  { name: "Bob", age: 32, skills: ["Python", "Django", "PostgreSQL"] },
  { name: "Charlie", age: 25, skills: ["Go", "Docker", "Kubernetes"] },
];

function getSkillCount(users: User[]): Map<string, number> {
  const counts = new Map<string, number>();
  users.forEach(u => {
    u.skills.forEach(s => {
      counts.set(s, (counts.get(s) || 0) + 1);
    });
  });
  return counts;
}

console.log("Users:");
users.forEach(u => console.log(\`  \${u.name} (age \${u.age}): \${u.skills.join(", ")}\`));

console.log("\\nSkill frequency:");
const skills = getSkillCount(users);
skills.forEach((count, skill) => console.log(\`  \${skill}: \${count}\`));` },
  { id: "java", label: "Java", icon: "JV", defaultCode: `// Java Playground (Simulated)

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java Playground!");
        
        // Fibonacci
        System.out.println("\\nFibonacci (first 10):");
        for (int i = 0; i < 10; i++) {
            System.out.println("  fib(" + i + ") = " + fibonacci(i));
        }
    }
    
    static int fibonacci(int n) {
        if (n <= 1) return n;
        int a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            int temp = b;
            b = a + b;
            a = temp;
        }
        return b;
    }
}` },
  { id: "cpp", label: "C++", icon: "C+", defaultCode: `// C++ Playground (Simulated)
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int temp = b;
        b = a + b;
        a = temp;
    }
    return b;
}

int main() {
    cout << "Hello from C++ Playground!" << endl;
    
    cout << "\\nFibonacci (first 10):" << endl;
    for (int i = 0; i < 10; i++) {
        cout << "  fib(" << i << ") = " << fibonacci(i) << endl;
    }
    
    vector<int> nums = {5, 3, 8, 1, 9, 2, 7, 4, 6};
    sort(nums.begin(), nums.end());
    cout << "\\nSorted: ";
    for (int n : nums) cout << n << " ";
    cout << endl;
    
    return 0;
}` },
  { id: "go", label: "Go", icon: "GO", defaultCode: `// Go Playground (Simulated)
package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    a, b := 0, 1
    for i := 2; i <= n; i++ {
        a, b = b, a+b
    }
    return b
}

func main() {
    fmt.Println("Hello from Go Playground!")
    
    fmt.Println("\\nFibonacci (first 10):")
    for i := 0; i < 10; i++ {
        fmt.Printf("  fib(%d) = %d\\n", i, fibonacci(i))
    }
}` },
  { id: "rust", label: "Rust", icon: "RS", defaultCode: `// Rust Playground (Simulated)

fn fibonacci(n: u32) -> u64 {
    if n <= 1 { return n as u64; }
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 2..=n {
        let temp = b;
        b = a + b;
        a = temp;
    }
    b
}

fn main() {
    println!("Hello from Rust Playground!");
    
    println!("\\nFibonacci (first 10):");
    for i in 0..10 {
        println!("  fib({}) = {}", i, fibonacci(i));
    }
    
    let mut nums = vec![5, 3, 8, 1, 9, 2, 7, 4, 6];
    nums.sort();
    println!("\\nSorted: {:?}", nums);
}` },
];

const PlaygroundPage = () => {
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [code, setCode] = useState(languages[0].defaultCode);
  const [output, setOutput] = useState<string>("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"output" | "preview">(
    "preview"
  );

  const switchLanguage = (lang: typeof languages[0]) => {
    setSelectedLang(lang);
    setCode(lang.defaultCode);
    setOutput("");
    setShowLangPicker(false);
    setActiveTab(lang.id === "html" ? "preview" : "output");
  };

  const runCode = useCallback(() => {
    setRunning(true);
    setOutput("");

    if (selectedLang.id === "html") {
      setActiveTab("preview");
      setRunning(false);
      return;
    }

    if (selectedLang.id === "javascript" || selectedLang.id === "typescript") {
      setActiveTab("output");
      setTimeout(() => {
        try {
          const logs: string[] = [];
          const fakeConsole = {
            log: (...args: unknown[]) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
            error: (...args: unknown[]) => logs.push("❌ " + args.join(" ")),
            warn: (...args: unknown[]) => logs.push("⚠️ " + args.join(" ")),
          };
          const fn = new Function("console", code);
          fn(fakeConsole);
          setOutput(logs.join("\n") || "✅ Code executed successfully (no output)");
        } catch (e: unknown) {
          setOutput(`❌ Error: ${(e as Error).message}`);
        }
        setRunning(false);
      }, 500);
      return;
    }

    // Simulated for other languages
    setActiveTab("output");
    setTimeout(() => {
      const simOutputs: Record<string, string> = {
        python: `Hello from Python Playground!\n\nFibonacci (first 10):\n  fib(0) = 0\n  fib(1) = 1\n  fib(2) = 1\n  fib(3) = 2\n  fib(4) = 3\n  fib(5) = 5\n  fib(6) = 8\n  fib(7) = 13\n  fib(8) = 21\n  fib(9) = 34\n\nOriginal: [5, 3, 8, 1, 9, 2, 7, 4, 6]\nSorted: [1, 2, 3, 4, 5, 6, 7, 8, 9]\nSum: 45\nMax: 9\nFiltered (>5): [8, 9, 7, 6]`,
        java: `Hello from Java Playground!\n\nFibonacci (first 10):\n  fib(0) = 0\n  fib(1) = 1\n  fib(2) = 1\n  fib(3) = 2\n  fib(4) = 3\n  fib(5) = 5\n  fib(6) = 8\n  fib(7) = 13\n  fib(8) = 21\n  fib(9) = 34`,
        cpp: `Hello from C++ Playground!\n\nFibonacci (first 10):\n  fib(0) = 0\n  fib(1) = 1\n  fib(2) = 1\n  fib(3) = 2\n  fib(4) = 3\n  fib(5) = 5\n  fib(6) = 8\n  fib(7) = 13\n  fib(8) = 21\n  fib(9) = 34\n\nSorted: 1 2 3 4 5 6 7 8 9`,
        go: `Hello from Go Playground!\n\nFibonacci (first 10):\n  fib(0) = 0\n  fib(1) = 1\n  fib(2) = 1\n  fib(3) = 2\n  fib(4) = 3\n  fib(5) = 5\n  fib(6) = 8\n  fib(7) = 13\n  fib(8) = 21\n  fib(9) = 34`,
        rust: `Hello from Rust Playground!\n\nFibonacci (first 10):\n  fib(0) = 0\n  fib(1) = 1\n  fib(2) = 1\n  fib(3) = 2\n  fib(4) = 3\n  fib(5) = 5\n  fib(6) = 8\n  fib(7) = 13\n  fib(8) = 21\n  fib(9) = 34\n\nSorted: [1, 2, 3, 4, 5, 6, 7, 8, 9]`,
      };
      setOutput(simOutputs[selectedLang.id] || `✅ ${selectedLang.label} code compiled & executed successfully.`);
      setRunning(false);
    }, 1200);
  }, [code, selectedLang]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const downloadCode = () => {
    const ext: Record<string, string> = { html: "html", javascript: "js", python: "py", typescript: "ts", java: "java", cpp: "cpp", go: "go", rust: "rs" };
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playground.${ext[selectedLang.id] || "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPreviewSrc = () => {
    if (selectedLang.id !== "html") return "";
    return `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;
  };

  return (
    <div className={`${fullscreen ? "fixed inset-0 z-50 bg-background" : ""} flex flex-col h-full`}>
      <div className="p-4 lg:p-6 flex-1 flex flex-col max-w-[1600px] mx-auto w-full space-y-3">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight">Coding Playground</h1>
            <p className="text-xs text-muted-foreground">Write, run & experiment in 8 languages</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        {/* Language bar */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => switchLanguage(lang)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border whitespace-nowrap ${
                selectedLang.id === lang.id
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-secondary/30 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
              }`}
            >
              <span className="text-xs">{lang.icon}</span>
              {lang.label}
            </button>
          ))}
        </div>

        {/* Editor + Output */}
        <div className="flex-1 grid lg:grid-cols-2 gap-3 min-h-0">
          {/* Editor */}
          <div className="rounded-xl border border-border/50 bg-card/60 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono ml-2">{selectedLang.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={copyCode} className="p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={downloadCode} className="p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Download">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setCode(selectedLang.defaultCode); setOutput(""); }} className="p-1 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Reset">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent p-4 font-mono text-xs text-foreground resize-none outline-none min-h-[300px]"
              spellCheck={false}
              placeholder="Write your code here..."
            />
            <div className="px-3 py-2 border-t border-border/40 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{code.split("\n").length} lines</span>
              <Button size="sm" variant="hero" onClick={runCode} disabled={running} className="h-7 text-[11px] px-4 gap-1.5">
                <Play className="w-3 h-3" /> {running ? "Running..." : "Run Code"}
              </Button>
            </div>
          </div>

          {/* Output / Preview */}
          <div className="rounded-xl border border-border/50 bg-card/60 flex flex-col overflow-hidden">
            <div className="flex items-center px-3 py-2 border-b border-border/40 gap-1">
              {selectedLang.id === "html" && (
                <>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activeTab === "preview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layout className="w-3 h-3 inline mr-1" />Preview
                  </button>
                  <button
                    onClick={() => setActiveTab("output")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activeTab === "output" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Terminal className="w-3 h-3 inline mr-1" />Console
                  </button>
                </>
              )}
              {selectedLang.id !== "html" && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Terminal className="w-3 h-3" />
                  <span>Console Output</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-[300px] overflow-auto">
              {activeTab === "preview" && selectedLang.id === "html" ? (
                <iframe
                  key={code}
                  srcDoc={code}
                  className="w-full h-full border-0 bg-background"
                  sandbox="allow-scripts"
                  title="Preview"
                />
              ) : (
                <div className="p-4">
                  {output ? (
                    <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">{output}</pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 py-16">
                      <Terminal className="w-8 h-8 mb-2" />
                      <p className="text-xs">Click "Run Code" to see output</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundPage;
