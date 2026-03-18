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

// Curated YouTube videos mapped by module title keywords
// Each entry: [keyword in module title] → YouTube video ID
const videoByModuleTitle: Record<string, string> = {
  // ── JavaScript Fundamentals ──
  "variables & types": "edlFjlzxkSI",         // JS variables explained
  "functions & scope": "iLWTnMzWtj4",         // JS functions & scope
  "arrays & objects": "oigfaZ5ApsM",          // JS arrays & objects
  "async javascript": "ZYb_ZU8LNxs",          // Async JS - callbacks, promises, async/await
  "dom manipulation": "5fb2aPlgoys",          // DOM manipulation crash course
  "error handling": "blBoIyNhGvY",            // JS error handling

  // ── React (multiple courses) ──
  "introduction to react": "SqcY0GlETPk",     // React intro
  "jsx & components": "bMknfKXIFA8",          // JSX & components
  "component patterns": "TNhaISOUy6Q",        // React component patterns
  "state & props": "4ORZ1GmjaMc",            // React state & props
  "usestate & useeffect": "O6P86uwfdR0",      // useState & useEffect
  "hooks deep dive": "TNhaISOUy6Q",           // React hooks deep dive
  "custom hooks": "Jl4q2cccwf0",             // Custom hooks
  "context api": "5LrDIWkK_Bc",              // Context API
  "context & state management": "5LrDIWkK_Bc",
  "react router": "Ul3y1LXxzdU",             // React Router
  "forms & validation": "SdzMBWT2CDQ",        // React forms
  "forms": "SdzMBWT2CDQ",
  "api integration": "bYFYF2GnMy8",          // API integration
  "performance optimization": "0ZJgIjIuY7U",  // React performance
  "performance": "0ZJgIjIuY7U",
  "testing": "7dTTFW7yACQ",                  // React testing
  "testing with vitest": "7dTTFW7yACQ",
  "deployment": "AXjD7ceS4F8",               // Deployment

  // ── TypeScript ──
  "typescript basics": "BwuLxPH8IDs",         // TS crash course
  "type system": "ahCwqrYpIuM",              // TypeScript type system
  "interfaces & types": "crjIq7LEAYw",        // TS interfaces
  "generics": "nViEqpgwxHE",                 // TS generics
  "advanced types": "F9wzk9cpQtM",            // TS advanced types
  "type utilities": "F9wzk9cpQtM",
  "decorators": "O6A-u_FoEX8",               // TS decorators
  "project setup": "gp5H0Vw39yw",            // TS project setup

  // ── Python / Data Science ──
  "python basics": "kqtD5dpn9C8",            // Python basics
  "data types": "gOMW_n2-2Mw",               // Python data types
  "data types & structures": "gOMW_n2-2Mw",
  "functions & modules": "9Os0o3wzS_I",       // Python functions
  "functions": "9Os0o3wzS_I",
  "numpy": "eg4xgjJQbS0",                    // NumPy tutorial
  "numpy fundamentals": "eg4xgjJQbS0",
  "numpy essentials": "eg4xgjJQbS0",
  "pandas": "2uvysYbKdjM",                   // Pandas tutorial
  "pandas dataframes": "2uvysYbKdjM",
  "data visualization": "UO98lJQ3QGI",       // Data visualization
  "statistical analysis": "xxpc-HPKN28",      // Statistics for data science
  "real-world project": "r-uOLxNrNk8",        // Data science project

  // ── System Design ──
  "scalability": "Y-Gl4HEyeUQ",              // Scalability basics
  "scalability basics": "Y-Gl4HEyeUQ",
  "fundamentals": "Y-Gl4HEyeUQ",
  "load balancing": "K0Ta65OqQkY",            // Load balancing
  "database design": "ztHopE5Wnpc",           // Database design
  "caching": "U3RkDLtS7uY",                  // Caching strategies
  "caching strategies": "U3RkDLtS7uY",
  "microservices": "rv4LlmLmVWk",             // Microservices
  "microservices architecture": "rv4LlmLmVWk",
  "message queues": "oUJbuFMyBDk",            // Message queues explained
  "case studies": "jPKTo1iGQiE",              // System design case studies

  // ── DSA ──
  "arrays & strings": "orV1aMgfHEo",          // Arrays & strings
  "linked lists": "Hj_rA0dhr2I",              // Linked lists
  "stacks & queues": "1AJ4ldKvASY",           // Stacks & queues
  "trees & graphs": "i_Q0v_Ct5lY",            // Trees & graphs
  "sorting algorithms": "g-PGLbMth_g",        // Sorting
  "sorting": "g-PGLbMth_g",
  "dynamic programming": "oBt53YbR9Kk",       // Dynamic programming

  // ── AWS / Cloud ──
  "cloud concepts": "ulprqHHWlng",            // Cloud concepts
  "aws core services": "JIbIYCM48to",         // AWS services overview
  "aws services": "JIbIYCM48to",
  "security & compliance": "i-xDbPRzfyA",     // AWS security
  "security": "i-xDbPRzfyA",
  "billing & pricing": "DSiOT7EZKIY",         // AWS billing

  // ── Node.js / Full-Stack ──
  "node.js fundamentals": "Oe421EPjeBE",      // Node fundamentals
  "node fundamentals": "Oe421EPjeBE",
  "express.js & routing": "SccSCuHhOw0",      // Express.js
  "express": "SccSCuHhOw0",
  "database with postgresql": "ldYcgPKEZC8",   // PostgreSQL
  "postgresql": "ldYcgPKEZC8",
  "authentication & jwt": "mbsmsi7l3r4",       // Auth & JWT
  "rest api design": "fgTGADljAMg",           // REST API
  "rest api": "fgTGADljAMg",

  // ── Java ──
  "java basics": "eIrMbAQSU34",              // Java crash course
  "oop in java": "pTB0EiLXUC8",              // Java OOP
  "collections framework": "rzA7UJ-hQn4",     // Java collections
  "multithreading": "r_MbozD32eo",            // Java multithreading
  "spring boot basics": "9SGDpanrc8U",         // Spring Boot
  "spring boot intro": "9SGDpanrc8U",
  "building rest apis": "9SGDpanrc8U",         // Spring REST APIs
  "spring data jpa": "8SGI_XS5OPw",           // Spring Data JPA
  "database integration": "8SGI_XS5OPw",
  "spring security": "her_7pa0vrg",            // Spring Security
  "microservices with spring": "BnknNTN8icw",  // Spring microservices
  "ci/cd & deployment": "R8_veQiYBjI",        // CI/CD pipelines

  // ── Mobile (React Native / Flutter) ──
  "react native setup": "0-S5a0eXPoc",        // React Native setup
  "core components": "0-S5a0eXPoc",
  "navigation": "npe3Ii_sQIk",               // React Native navigation
  "flutter basics": "1ukSR1GRtMU",            // Flutter crash course
  "widgets & layout": "1ukSR1GRtMU",
  "state management": "3tm-R7jcqjU",          // Flutter state management

  // ── DevOps ──
  "linux basics": "sWbUDq4S6Y8",              // Linux for beginners
  "docker fundamentals": "pTFZFxd4hOI",       // Docker crash course
  "docker": "pTFZFxd4hOI",
  "kubernetes": "X48VuDVv0do",                // Kubernetes explained
  "kubernetes basics": "X48VuDVv0do",
  "ci/cd pipelines": "R8_veQiYBjI",           // CI/CD
  "monitoring & logging": "9TJx7QTrTyo",       // Monitoring
  "infrastructure as code": "SLB_c_ayRMo",     // Terraform/IaC

  // ── AI / Machine Learning ──
  "intro to ml": "ukzFI9rgwfU",               // ML intro
  "supervised learning": "4qVRBYAdLAo",        // Supervised learning
  "neural networks": "aircAruvnKk",           // Neural networks
  "deep learning basics": "aircAruvnKk",
  "nlp fundamentals": "CMrHM8a3hqw",          // NLP basics
  "computer vision": "01sAkU_NvOY",           // Computer vision
  "model deployment": "H73m_4A2bJ8",          // ML model deployment

  // ── Cybersecurity ──
  "security fundamentals": "hXSFdwIOfnE",     // Cybersecurity intro
  "network security": "E03gh1huvR4",           // Network security
  "ethical hacking": "3Kq1MIfTWCE",            // Ethical hacking
  "cryptography": "jhXCTbFnK8o",              // Cryptography basics
  "web security": "WlmKwIe9z1Q",              // Web security (OWASP)
};

// Finds the best matching video for a module title
const getVideoForModule = (moduleTitle: string): string => {
  const title = moduleTitle.toLowerCase().trim();

  // Exact match
  if (videoByModuleTitle[title]) return videoByModuleTitle[title];

  // Partial match — find the best keyword overlap
  let bestMatch = "";
  let bestScore = 0;
  for (const key of Object.keys(videoByModuleTitle)) {
    if (title.includes(key) || key.includes(title)) {
      const score = key.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = key;
      }
    }
  }
  if (bestMatch) return videoByModuleTitle[bestMatch];

  // Word-level fuzzy match
  const words = title.split(/\s+/);
  for (const key of Object.keys(videoByModuleTitle)) {
    const matchingWords = words.filter(w => w.length > 2 && key.includes(w));
    if (matchingWords.length > bestScore) {
      bestScore = matchingWords.length;
      bestMatch = key;
    }
  }
  if (bestMatch) return videoByModuleTitle[bestMatch];

  // Fallback — generic programming tutorial
  return "PkZNo7MFNFg";
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
