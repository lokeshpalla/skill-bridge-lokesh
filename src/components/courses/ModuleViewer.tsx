import { useState } from "react";
import CourseNotes from "./CourseNotes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Code2, ChevronDown, Copy, Check } from "lucide-react";

interface ModuleViewerProps {
  moduleTitle: string;
  moduleIndex: number;
  courseId: number;
  onBack: () => void;
  onComplete: () => void;
}

// Curated YouTube videos mapped to course modules
const moduleVideos: Record<number, string[]> = {
  1: [ // React & TypeScript
    "SqcY0GlETPk", // React TS intro
    "TPACABQTHvM", // Component patterns
    "O6P86uwfdR0", // useState & useEffect
    "Jl4q2cccwf0", // Custom hooks
    "5LrDIWkK_Bc", // Context API
    "Ul3y1LXxzdU", // React Router
    "SdzMBWT2CDQ", // Forms
    "bYFYF2GnMy8", // API integration
    "0ZJgIjIuY7U", // Performance
    "7dTTFW7yACQ", // Testing
  ],
  2: [ // Python Data Science
    "kqtD5dpn9C8", // Python basics
    "gOMW_n2-2Mw", // Data types
    "9Os0o3wzS_I", // Functions
    "eg4xgjJQbS0", // NumPy
    "2uvysYbKdjM", // Pandas
    "UO98lJQ3QGI", // Data visualization
  ],
  3: [ // System Design
    "Y-Gl4HEyeUQ", // Scalability
    "K0Ta65OqQkY", // Load balancing
    "ztHopE5Wnpc", // Database design
    "U3RkDLtS7uY", // Caching
    "rv4LlmLmVWk", // Microservices
  ],
  4: [ // DSA JavaScript
    "orV1aMgfHEo", // Arrays & Strings
    "Hj_rA0dhr2I", // Linked lists
    "1AJ4ldKvASY", // Stacks & Queues
    "i_Q0v_Ct5lY", // Trees & Graphs
    "g-PGLbMth_g", // Sorting
    "oBt53YbR9Kk", // Dynamic programming
  ],
  5: [ // AWS
    "ulprqHHWlng", // Cloud concepts
    "JIbIYCM48to", // AWS services
    "i-xDbPRzfyA", // Security
    "DSiOT7EZKIY", // Billing
  ],
  6: [ // Full-Stack Node.js
    "Oe421EPjeBE", // Node fundamentals
    "SccSCuHhOw0", // Express
    "ldYcgPKEZC8", // PostgreSQL
    "mbsmsi7l3r4", // Auth & JWT
    "fgTGADljAMg", // REST API
    "AXjD7ceS4F8", // Deployment
  ],
};

const starterCode: Record<string, string> = {
  javascript: `// Practice coding here!\nconsole.log("Hello, World!");\n\n// Try writing a function:\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("Developer"));`,
  typescript: `// Practice TypeScript here!\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);\n\n// Try with types:\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = { name: "Dev", age: 25 };\nconsole.log(user);`,
  python: `# Practice Python here!\nprint("Hello, World!")\n\n# Try writing a function:\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("Developer"))`,
  java: `// Practice Java here!\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n\n    public static String greet(String name) {\n        return "Hello, " + name + "!";\n    }\n}`,
  cpp: `// Practice C++ here!\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    \n    string name = "Developer";\n    cout << "Hello, " << name << "!" << endl;\n    return 0;\n}`,
};

const languages = [
  { id: "javascript", label: "JavaScript", icon: "🟨" },
  { id: "typescript", label: "TypeScript", icon: "🔷" },
  { id: "python", label: "Python", icon: "🐍" },
  { id: "java", label: "Java", icon: "☕" },
  { id: "cpp", label: "C++", icon: "⚙️" },
];

const ModuleViewer = ({ moduleTitle, moduleIndex, courseId, onBack, onComplete }: ModuleViewerProps) => {
  const [selectedLang, setSelectedLang] = useState("javascript");
  const [code, setCode] = useState(starterCode.javascript);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const videoId = moduleVideos[courseId]?.[moduleIndex] || "dQw4w9WgXcQ";

  const handleLangChange = (langId: string) => {
    setSelectedLang(langId);
    setCode(starterCode[langId]);
    setOutput("");
    setLangDropdownOpen(false);
  };

  const handleRunCode = () => {
    if (selectedLang === "javascript") {
      try {
        const logs: string[] = [];
        const fakeConsole = { log: (...args: unknown[]) => logs.push(args.map(String).join(" ")) };
        const fn = new Function("console", code);
        fn(fakeConsole);
        setOutput(logs.join("\n") || "// No output");
      } catch (e) {
        setOutput(`Error: ${(e as Error).message}`);
      }
    } else {
      setOutput(`// ${languages.find(l => l.id === selectedLang)?.label} execution requires a backend compiler.\n// Practice writing the code — the syntax highlighting helps you learn!\n\n// Tip: Use an online compiler like replit.com to test this code.`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const currentLang = languages.find(l => l.id === selectedLang)!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Modules
        </button>
        <Button variant="hero" size="sm" className="gap-1.5" onClick={onComplete}>
          <Check className="w-4 h-4" /> Mark Complete
        </Button>
      </div>

      {/* Module title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Play className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Module {moduleIndex + 1}</p>
          <h2 className="text-lg font-bold">{moduleTitle}</h2>
        </div>
      </div>

      {/* Video Player */}
      <div className="rounded-xl overflow-hidden border border-border/50 bg-card/60">
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={moduleTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            style={{ border: "none" }}
          />
        </div>
      </div>

      {/* Code Practice Section */}
      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Code Practice</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/50 hover:bg-secondary transition-colors"
              >
                <span>{currentLang.icon}</span>
                <span>{currentLang.label}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-border/50 bg-popover shadow-lg overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLangChange(lang.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/60 transition-colors ${
                        selectedLang === lang.id ? "bg-primary/10 text-primary" : ""
                      }`}
                    >
                      <span>{lang.icon}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleCopy} className="text-xs px-2.5 py-1.5 rounded-lg bg-secondary/80 border border-border/50 hover:bg-secondary transition-colors flex items-center gap-1">
              {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Code editor */}
        <div className="relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full min-h-[220px] p-4 bg-[#0a0f1a] text-[13px] leading-relaxed resize-y focus:outline-none"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "#e2e8f0",
              tabSize: 2,
            }}
            spellCheck={false}
          />
        </div>

        {/* Run button & output */}
        <div className="border-t border-border/40">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Output</span>
            <Button variant="default" size="sm" className="h-7 text-xs gap-1.5" onClick={handleRunCode}>
              <Play className="w-3 h-3" /> Run Code
            </Button>
          </div>
          <pre
            className="px-4 pb-4 text-xs min-h-[60px] whitespace-pre-wrap"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: output.startsWith("Error") ? "#f87171" : "#94a3b8",
            }}
          >
            {output || "// Click 'Run Code' to see output"}
          </pre>
        </div>
      </div>

      {/* Notes & Bookmarks */}
      <CourseNotes courseId={courseId} moduleIndex={moduleIndex} />
    </motion.div>
  );
};

export default ModuleViewer;
