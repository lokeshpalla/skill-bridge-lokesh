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

// Curated & verified YouTube videos mapped by module title keywords
// Each entry: [keyword in module title] → verified YouTube video ID
const videoByModuleTitle: Record<string, string> = {
  // ── JavaScript Fundamentals ──
  "variables & types": "le-URjBhevE",         // Mosh — JS variables & types
  "functions & scope": "N8ap4k_1QEQ",         // Dave Gray — JS functions
  "arrays & objects": "oigfaZ5ApsM",          // freeCodeCamp — JS arrays & objects
  "async javascript": "PoRJizFvM7s",          // Traversy — Async JS crash course
  "dom manipulation": "y17RuWkWdn8",          // Web Dev Simplified — DOM manipulation
  "error handling": "blBoIyNhGvY",            // Traversy — JS error handling

  // ── React (multiple courses) ──
  "introduction to react": "SqcY0GlETPk",     // Programming with Mosh — React intro
  "introduction to react + ts": "SqcY0GlETPk",
  "jsx & components": "bMknfKXIFA8",          // freeCodeCamp — JSX & components
  "component patterns": "YaZg8wg39QJ",        // Jack Herrington — React patterns
  "component patterns & props": "SqcY0GlETPk",
  "state & props": "4ORZ1GmjaMc",            // Web Dev Simplified — React state & props
  "usestate & useeffect deep dive": "O6P86uwfdR0", // Web Dev Simplified — useState & useEffect
  "usestate & useeffect": "O6P86uwfdR0",
  "hooks deep dive": "LlvBzyy-558",           // Codevolution — React hooks
  "custom hooks": "Jl4q2cccwf0",             // Web Dev Simplified — Custom hooks
  "context api & state management": "5LrDIWkK_Bc", // Traversy — Context API
  "context api": "5LrDIWkK_Bc",
  "context & state management": "5LrDIWkK_Bc",
  "react router": "Ul3y1LXxzdU",             // Web Dev Simplified — React Router
  "react router & navigation": "Ul3y1LXxzdU",
  "forms & validation": "SdzMBWT2CDQ",        // Lama Dev — React forms
  "forms": "SdzMBWT2CDQ",
  "api integration": "bYFYF2GnMy8",          // PedroTech — API integration in React
  "performance optimization": "CaShN564gMY",  // Jack Herrington — React performance
  "performance": "CaShN564gMY",
  "testing": "ML5egqL3YFE",                  // Laith Academy — React testing
  "testing with vitest": "ML5egqL3YFE",
  "deployment": "4lUkSgvmTYM",               // Traversy — Deploy React apps

  // ── TypeScript ──
  "typescript basics": "BwuLxPH8IDs",         // Traversy — TS crash course
  "type basics": "BwuLxPH8IDs",
  "type system": "ahCwqrYpIuM",              // Matt Pocock — TypeScript type system
  "interfaces & types": "crjIq7LEAYw",        // Net Ninja — TS interfaces
  "generics": "nViEqpgwxHE",                 // Ben Awad — TS generics
  "advanced types": "F9wzk9cpQtM",            // No BS TS — Advanced types
  "type utilities": "F9wzk9cpQtM",
  "decorators": "O6A-u_FoEX8",               // Fireship — TS decorators
  "project setup": "gp5H0Vw39yw",            // TS project setup

  // ── Python / Data Science ──
  "python basics": "rfscVS0vtbw",             // freeCodeCamp — Python full course (4.7M views)
  "data types": "gOMW_n2-2Mw",               // Python data types
  "data types & structures": "gOMW_n2-2Mw",
  "functions & modules": "9Os0o3wzS_I",       // Corey Schafer — Python functions
  "functions": "9Os0o3wzS_I",
  "numpy": "QUT1VHiLmmI",                    // freeCodeCamp — NumPy tutorial
  "numpy fundamentals": "QUT1VHiLmmI",
  "numpy essentials": "QUT1VHiLmmI",
  "pandas": "vmEHCJofslg",                   // Keith Galli — Pandas tutorial (3M+ views)
  "pandas dataframes": "vmEHCJofslg",
  "data visualization": "UO98lJQ3QGI",       // Corey Schafer — Matplotlib tutorial
  "statistical analysis": "xxpc-HPKN28",      // freeCodeCamp — Statistics
  "real-world project": "r-uOLxNrNk8",        // Data science project

  // ── System Design ──
  "scalability": "Y-Gl4HEyeUQ",              // Gaurav Sen — Scalability basics
  "scalability basics": "Y-Gl4HEyeUQ",
  "fundamentals": "Y-Gl4HEyeUQ",
  "load balancing": "K0Ta65OqQkY",            // Gaurav Sen — Load balancing
  "database design": "ztHopE5Wnpc",           // Gaurav Sen — Database design
  "caching": "U3RkDLtS7uY",                  // Gaurav Sen — Caching
  "caching strategies": "U3RkDLtS7uY",
  "microservices": "rv4LlmLmVWk",             // TechWorld with Nana — Microservices
  "microservices architecture": "rv4LlmLmVWk",
  "message queues": "oUJbuFMyBDk",            // Hussein Nasser — Message queues
  "case studies": "jPKTo1iGQiE",              // Gaurav Sen — System design case studies

  // ── DSA ──
  "arrays & strings": "o1EBi8jWKRs",          // NeetCode — Arrays & hashing
  "linked lists": "Hj_rA0dhr2I",              // freeCodeCamp — Linked lists
  "stacks & queues": "1AJ4ldKvASY",           // Jenny's Lectures — Stacks & queues
  "trees & graphs": "i_Q0v_Ct5lY",            // WilliamFiset — Trees & graphs
  "sorting algorithms": "g-PGLbMth_g",        // freeCodeCamp — Sorting
  "sorting": "g-PGLbMth_g",
  "dynamic programming": "oBt53YbR9Kk",       // freeCodeCamp — Dynamic programming

  // ── AWS / Cloud ──
  "cloud concepts": "ulprqHHWlng",            // freeCodeCamp — AWS Cloud Practitioner
  "aws core services": "JIbIYCM48to",         // Simplilearn — AWS services
  "aws services": "JIbIYCM48to",
  "security & compliance": "i-xDbPRzfyA",     // AWS security
  "billing & pricing": "DSiOT7EZKIY",         // AWS billing

  // ── Node.js / Full-Stack ──
  "node.js fundamentals": "Oe421EPjeBE",      // Traversy — Node.js crash course
  "node fundamentals": "Oe421EPjeBE",
  "express.js & routing": "SccSCuHhOw0",      // Traversy — Express crash course
  "express": "SccSCuHhOw0",
  "database with postgresql": "ldYcgPKEZC8",   // Amigoscode — PostgreSQL
  "postgresql": "ldYcgPKEZC8",
  "authentication & jwt": "mbsmsi7l3r4",       // Web Dev Simplified — JWT auth
  "rest api design": "fgTGADljAMg",           // Programming with Mosh — REST API
  "rest api": "fgTGADljAMg",

  // ── Java Full-Stack ──
  "core java fundamentals": "eIrMbAQSU34",    // Telusko — Java full course
  "java basics": "eIrMbAQSU34",
  "advanced java & design patterns": "E10Q6-nWO9g", // Engineering Digest — Java Streams & Advanced
  "advanced java": "E10Q6-nWO9g",
  "sql & database design": "HXV3zeQKqGY",     // freeCodeCamp — SQL full course (20M+ views)
  "jdbc & data access layer": "7v2OnUti2eM",   // Telusko — JDBC tutorial (617K views)
  "jdbc": "7v2OnUti2eM",
  "spring framework & dependency injection": "gJrjgg1KVL4", // Mosh — Spring Boot tutorial (850K views)
  "spring framework": "gJrjgg1KVL4",
  "spring boot & rest api development": "fm4RtXFiP7Y", // Genuine Coder — Spring Boot 3 full course
  "spring boot": "gJrjgg1KVL4",
  "spring data jpa & hibernate": "mcl_nibV39s", // Ali Bouali — Spring Data JPA 5hr tutorial (131K views)
  "spring data jpa": "mcl_nibV39s",
  "spring security & authentication": "GH7L4D8Q_ak", // EmbarkX — Spring Security JWT (96K views)
  "spring security": "GH7L4D8Q_ak",
  "frontend with html, css & javascript": "mU6anWqZJcc", // freeCodeCamp — HTML CSS JS full course
  "frontend with html": "mU6anWqZJcc",
  "react.js for java developers": "5PdEmeopJVQ", // freeCodeCamp — Full Stack Java Spring + React (1.3M views)
  "react.js for java": "5PdEmeopJVQ",
  "full-stack integration & testing": "5PdEmeopJVQ", // freeCodeCamp — Full Stack Spring + React
  "full-stack integration": "5PdEmeopJVQ",
  "devops, docker & deployment": "Hi6MGNhImFc", // EmbarkX — Java Spring Boot AWS Deployment & CI/CD
  "capstone: build a full-stack application": "sAVki6-iRQs", // Java Full-Stack Developer Course Spring Boot + React
  "capstone": "sAVki6-iRQs",

  // ── Java general ──
  "oop in java": "pTB0EiLXUC8",              // Bro Code — Java OOP
  "collections framework": "rzA7UJ-hQn4",     // Telusko — Java collections
  "multithreading": "r_MbozD32eo",            // Telusko — Java multithreading
  "building rest apis": "fm4RtXFiP7Y",
  "database integration": "mcl_nibV39s",
  "microservices with spring": "BnknNTN8icw",  // Amigoscode — Spring microservices
  "ci/cd & deployment": "Hi6MGNhImFc",

  // ── Mobile (React Native / Flutter) ──
  "react native setup": "0-S5a0eXPoc",        // React Native setup
  "core components": "0-S5a0eXPoc",
  "navigation": "npe3Ii_sQIk",               // React Native navigation
  "flutter basics": "1ukSR1GRtMU",            // Flutter crash course
  "widgets & layout": "1ukSR1GRtMU",
  "state management": "3tm-R7jcqjU",          // Flutter state management

  // ── DevOps ──
  "linux basics": "sWbUDq4S6Y8",              // freeCodeCamp — Linux for beginners
  "docker fundamentals": "pTFZFxd4hOI",       // TechWorld with Nana — Docker
  "docker": "pTFZFxd4hOI",
  "kubernetes": "X48VuDVv0do",                // TechWorld with Nana — Kubernetes
  "kubernetes basics": "X48VuDVv0do",
  "ci/cd pipelines": "R8_veQiYBjI",           // Fireship — CI/CD
  "monitoring & logging": "9TJx7QTrTyo",       // Monitoring
  "infrastructure as code": "SLB_c_ayRMo",     // Terraform/IaC

  // ── AI / Machine Learning ──
  "intro to ml": "ukzFI9rgwfU",               // freeCodeCamp — ML intro
  "supervised learning": "4qVRBYAdLAo",        // Supervised learning
  "neural networks": "aircAruvnKk",           // 3Blue1Brown — Neural networks
  "deep learning basics": "aircAruvnKk",
  "nlp fundamentals": "CMrHM8a3hqw",          // NLP basics
  "computer vision": "01sAkU_NvOY",           // Computer vision
  "model deployment": "H73m_4A2bJ8",          // ML model deployment

  // ── Cybersecurity ──
  "security fundamentals": "hXSFdwIOfnE",     // Cybersecurity intro
  "network security": "E03gh1huvR4",           // Network security
  "ethical hacking": "3Kq1MIfTWCE",            // freeCodeCamp — Ethical hacking
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

  const videoId = getVideoForModule(moduleTitle);

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
