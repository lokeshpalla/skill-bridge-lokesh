import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ChevronRight, Trophy, AlertCircle, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  codeSnippet?: string;
}

interface CourseExamProps {
  courseId: number;
  courseTitle: string;
  onCertificateEarned: () => void;
}

// Exam questions per course — coding-focused with code snippets
const courseExams: Record<number, ExamQuestion[]> = {
  1: [
    { question: "What will this component render?", codeSnippet: `const App = () => {\n  const [count, setCount] = useState(0);\n  return <p>{count}</p>;\n};`, options: ["undefined", "0", "null", "Error"], correctIndex: 1 },
    { question: "What is the type of 'name' in this code?", codeSnippet: `interface Props {\n  name: string;\n  age?: number;\n}\nconst Greet = ({ name }: Props) => <h1>{name}</h1>;`, options: ["any", "string", "string | undefined", "unknown"], correctIndex: 1 },
    { question: "What's wrong with this code?", codeSnippet: `const App = () => {\n  if (true) {\n    const [val, setVal] = useState(0);\n  }\n  return <div />;\n};`, options: ["Nothing wrong", "Hook called inside condition", "Missing return type", "Wrong import"], correctIndex: 1 },
    { question: "What does this useEffect do?", codeSnippet: `useEffect(() => {\n  console.log("hello");\n  return () => console.log("bye");\n}, []);`, options: ["Runs on every render", "Runs once, cleans up on unmount", "Runs only on unmount", "Never runs"], correctIndex: 1 },
    { question: "What will console.log output?", codeSnippet: `const nums: number[] = [1, 2, 3];\nconst doubled = nums.map(n => n * 2);\nconsole.log(doubled);`, options: ["[1, 2, 3]", "[2, 4, 6]", "[1, 4, 9]", "Error"], correctIndex: 1 },
    { question: "What does this custom hook return?", codeSnippet: `function useToggle(init: boolean) {\n  const [val, setVal] = useState(init);\n  const toggle = () => setVal(v => !v);\n  return [val, toggle] as const;\n}`, options: ["A boolean", "An object", "A readonly tuple [boolean, function]", "undefined"], correctIndex: 2 },
    { question: "What will this render?", codeSnippet: `const items = ["a", "b", "c"];\nreturn (\n  <ul>\n    {items.map(i => <li key={i}>{i.toUpperCase()}</li>)}\n  </ul>\n);`, options: ["a, b, c", "A, B, C", "Error: toUpperCase is not a function", "Nothing"], correctIndex: 1 },
    { question: "What's the issue with this code?", codeSnippet: `const App = () => {\n  const ref = useRef<HTMLInputElement>(null);\n  ref.current.focus();\n  return <input ref={ref} />;\n};`, options: ["Wrong ref type", "ref.current may be null", "Missing useEffect", "Both B and C"], correctIndex: 3 },
    { question: "What pattern does this implement?", codeSnippet: `const ThemeContext = createContext("light");\nconst App = () => (\n  <ThemeContext.Provider value="dark">\n    <Child />\n  </ThemeContext.Provider>\n);`, options: ["Higher-Order Component", "Render Props", "Context Provider pattern", "Observer pattern"], correctIndex: 2 },
    { question: "What will this test check?", codeSnippet: `test("renders greeting", () => {\n  render(<Greet name="Ada" />);\n  expect(screen.getByText("Hello, Ada")).toBeInTheDocument();\n});`, options: ["Component renders with correct text", "Component handles clicks", "Component unmounts", "API response"], correctIndex: 0 },
  ],
  2: [
    { question: "What does this code output?", codeSnippet: `x = [1, 2, 3, 4, 5]\nprint(x[1:3])`, options: ["[1, 2, 3]", "[2, 3]", "[2, 3, 4]", "[1, 2]"], correctIndex: 1 },
    { question: "What is the output?", codeSnippet: `import numpy as np\narr = np.array([1, 2, 3])\nprint(arr * 2)`, options: ["[1, 2, 3, 1, 2, 3]", "[2, 4, 6]", "Error", "[1, 4, 9]"], correctIndex: 1 },
    { question: "What does this return?", codeSnippet: `d = {"a": 1, "b": 2, "c": 3}\nprint(d.get("x", 0))`, options: ["None", "Error: KeyError", "0", "x"], correctIndex: 2 },
    { question: "What does this code create?", codeSnippet: `import pandas as pd\ndf = pd.DataFrame({\n  "name": ["Alice", "Bob"],\n  "age": [25, 30]\n})\nprint(df.shape)`, options: ["(2,)", "(2, 2)", "(1, 2)", "Error"], correctIndex: 1 },
    { question: "What will this print?", codeSnippet: `nums = [1, 2, 3, 4, 5]\nresult = list(filter(lambda x: x % 2 == 0, nums))\nprint(result)`, options: ["[1, 3, 5]", "[2, 4]", "[1, 2, 3, 4, 5]", "Error"], correctIndex: 1 },
    { question: "What does this function return for f(3)?", codeSnippet: `def f(n):\n    if n <= 1:\n        return n\n    return f(n-1) + f(n-2)`, options: ["3", "2", "1", "5"], correctIndex: 1 },
    { question: "What does this list comprehension produce?", codeSnippet: `result = [x**2 for x in range(5) if x % 2 != 0]\nprint(result)`, options: ["[0, 1, 4, 9, 16]", "[1, 9]", "[1, 4, 9]", "[0, 4, 16]"], correctIndex: 1 },
    { question: "What is the output?", codeSnippet: `s = "hello world"\nprint(s.split()[0].capitalize())`, options: ["Hello", "hello", "HELLO", "Hello world"], correctIndex: 0 },
  ],
  3: [
    { question: "What pattern does this pseudocode describe?", codeSnippet: `client -> load_balancer\nload_balancer -> server_1\nload_balancer -> server_2\nload_balancer -> server_3`, options: ["Database sharding", "Load balancing", "Caching", "Message queue"], correctIndex: 1 },
    { question: "What caching strategy does this implement?", codeSnippet: `def get_data(key):\n    data = cache.get(key)\n    if data is None:\n        data = db.query(key)\n        cache.set(key, data, ttl=300)\n    return data`, options: ["Write-through", "Cache-aside (Lazy loading)", "Write-behind", "Read-through"], correctIndex: 1 },
    { question: "What does this SQL achieve?", codeSnippet: `-- Users table partitioned by region\nCREATE TABLE users_us (...) -- shard 1\nCREATE TABLE users_eu (...) -- shard 2\nCREATE TABLE users_asia (...) -- shard 3`, options: ["Replication", "Horizontal sharding", "Vertical partitioning", "Normalization"], correctIndex: 1 },
    { question: "What rate limiting algorithm is this?", codeSnippet: `class RateLimiter:\n    def __init__(self, capacity, rate):\n        self.tokens = capacity\n        self.capacity = capacity\n        self.rate = rate\n    def allow(self):\n        self.tokens = min(self.capacity, self.tokens + self.rate)\n        if self.tokens >= 1:\n            self.tokens -= 1\n            return True\n        return False`, options: ["Fixed window", "Sliding window", "Token bucket", "Leaky bucket"], correctIndex: 2 },
    { question: "What consistency model does this represent?", codeSnippet: `# Write to primary DB\nprimary.write(data)\n# Async replicate to replicas\nfor replica in replicas:\n    queue.send(replica, data)`, options: ["Strong consistency", "Eventual consistency", "Causal consistency", "Linearizability"], correctIndex: 1 },
    { question: "What pattern is this?", codeSnippet: `class CircuitBreaker:\n    def call(self, fn):\n        if self.state == "OPEN":\n            raise ServiceUnavailable\n        try:\n            result = fn()\n            self.reset()\n            return result\n        except:\n            self.failures += 1\n            if self.failures > threshold:\n                self.state = "OPEN"`, options: ["Retry pattern", "Circuit breaker", "Bulkhead", "Saga pattern"], correctIndex: 1 },
  ],
  4: [
    { question: "What does this function return for [2,7,11,15] and target=9?", codeSnippet: `function twoSum(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map[comp] !== undefined) return [map[comp], i];\n    map[nums[i]] = i;\n  }\n}`, options: ["[0, 1]", "[1, 2]", "[0, 2]", "undefined"], correctIndex: 0 },
    { question: "What is the time complexity of this code?", codeSnippet: `function search(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    else if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}`, options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctIndex: 1 },
    { question: "What data structure is implemented here?", codeSnippet: `class Node {\n  constructor(val) {\n    this.val = val;\n    this.next = null;\n  }\n}\nclass Structure {\n  push(val) { /* add to top */ }\n  pop() { /* remove from top */ }\n  peek() { /* view top */ }\n}`, options: ["Queue", "Stack", "Linked List", "Heap"], correctIndex: 1 },
    { question: "What does this function compute?", codeSnippet: `function mystery(n, memo = {}) {\n  if (n <= 1) return n;\n  if (memo[n]) return memo[n];\n  memo[n] = mystery(n-1, memo) + mystery(n-2, memo);\n  return memo[n];\n}`, options: ["Factorial", "Fibonacci with memoization", "Power of 2", "Sum of digits"], correctIndex: 1 },
    { question: "What sorting algorithm is this?", codeSnippet: `function sort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = sort(arr.slice(0, mid));\n  const right = sort(arr.slice(mid));\n  return merge(left, right);\n}`, options: ["Quick Sort", "Merge Sort", "Heap Sort", "Bubble Sort"], correctIndex: 1 },
    { question: "What traversal order does this print?", codeSnippet: `function traverse(node) {\n  if (!node) return;\n  traverse(node.left);\n  console.log(node.val);\n  traverse(node.right);\n}`, options: ["Preorder", "Inorder", "Postorder", "Level-order"], correctIndex: 1 },
    { question: "What will this return for 'racecar'?", codeSnippet: `function check(s) {\n  let l = 0, r = s.length - 1;\n  while (l < r) {\n    if (s[l] !== s[r]) return false;\n    l++; r--;\n  }\n  return true;\n}`, options: ["false", "true", "undefined", "Error"], correctIndex: 1 },
    { question: "What is the space complexity of this BFS?", codeSnippet: `function bfs(root) {\n  const queue = [root];\n  while (queue.length) {\n    const node = queue.shift();\n    if (node.left) queue.push(node.left);\n    if (node.right) queue.push(node.right);\n  }\n}`, options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], correctIndex: 2 },
  ],
  5: [
    { question: "What AWS service does this config use?", codeSnippet: `resource "aws_instance" "web" {\n  ami           = "ami-0c55b159"\n  instance_type = "t2.micro"\n  tags = { Name = "WebServer" }\n}`, options: ["S3", "EC2", "Lambda", "RDS"], correctIndex: 1 },
    { question: "What does this Lambda function do?", codeSnippet: `exports.handler = async (event) => {\n  const name = event.queryStringParameters?.name || "World";\n  return {\n    statusCode: 200,\n    body: JSON.stringify({ message: \`Hello, \${name}!\` })\n  };\n};`, options: ["Writes to database", "Returns a greeting API response", "Sends an email", "Processes a file"], correctIndex: 1 },
    { question: "What S3 operation is this?", codeSnippet: `aws s3 cp ./build s3://my-bucket/ --recursive\naws cloudfront create-invalidation \\\n  --distribution-id E1234 \\\n  --paths "/*"`, options: ["Backup database", "Deploy static website", "Upload Lambda code", "Create VPC"], correctIndex: 1 },
    { question: "What does this IAM policy allow?", codeSnippet: `{\n  "Effect": "Allow",\n  "Action": [\n    "s3:GetObject",\n    "s3:PutObject"\n  ],\n  "Resource": "arn:aws:s3:::my-bucket/*"\n}`, options: ["Full AWS access", "Read & write to a specific S3 bucket", "Delete S3 objects", "Create new buckets"], correctIndex: 1 },
    { question: "What type of scaling is configured here?", codeSnippet: `resource "aws_autoscaling_group" "web" {\n  min_size         = 2\n  max_size         = 10\n  desired_capacity = 4\n  target_group_arns = [aws_lb_target_group.web.arn]\n}`, options: ["Vertical scaling", "Horizontal auto-scaling", "Manual scaling", "Database scaling"], correctIndex: 1 },
  ],
  6: [
    { question: "What does this Express route return?", codeSnippet: `app.get("/api/users/:id", async (req, res) => {\n  const user = await db.query(\n    "SELECT * FROM users WHERE id = $1",\n    [req.params.id]\n  );\n  res.json(user.rows[0]);\n});`, options: ["All users", "A single user by ID", "User count", "Error"], correctIndex: 1 },
    { question: "What does this middleware do?", codeSnippet: `const auth = (req, res, next) => {\n  const token = req.headers.authorization?.split(" ")[1];\n  if (!token) return res.status(401).json({ error: "No token" });\n  try {\n    req.user = jwt.verify(token, SECRET);\n    next();\n  } catch {\n    res.status(403).json({ error: "Invalid token" });\n  }\n};`, options: ["Logs requests", "Validates JWT authentication", "Parses request body", "Handles CORS"], correctIndex: 1 },
    { question: "What SQL operation does this perform?", codeSnippet: `app.post("/api/posts", auth, async (req, res) => {\n  const { title, content } = req.body;\n  const result = await db.query(\n    "INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3) RETURNING *",\n    [title, content, req.user.id]\n  );\n  res.status(201).json(result.rows[0]);\n});`, options: ["SELECT", "INSERT with parameterized query", "UPDATE", "DELETE"], correctIndex: 1 },
    { question: "What does this code hash?", codeSnippet: `const bcrypt = require("bcrypt");\n\nasync function register(email, password) {\n  const salt = await bcrypt.genSalt(10);\n  const hash = await bcrypt.hash(password, salt);\n  await db.query(\n    "INSERT INTO users (email, password) VALUES ($1, $2)",\n    [email, hash]\n  );\n}`, options: ["The email", "The password before storing", "The user ID", "The database connection"], correctIndex: 1 },
    { question: "What HTTP status does this return on success?", codeSnippet: `app.delete("/api/posts/:id", auth, async (req, res) => {\n  await db.query("DELETE FROM posts WHERE id = $1 AND author_id = $2",\n    [req.params.id, req.user.id]);\n  res.status(204).send();\n});`, options: ["200 OK", "201 Created", "204 No Content", "404 Not Found"], correctIndex: 2 },
    { question: "What does this Dockerfile create?", codeSnippet: `FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]`, options: ["A database container", "A production Node.js container", "A test environment", "A static site"], correctIndex: 1 },
  ],
};

const getGrade = (pct: number): { grade: string; color: string; label: string } => {
  if (pct >= 90) return { grade: "A+", color: "#00d4ff", label: "Outstanding" };
  if (pct >= 80) return { grade: "A", color: "#22c55e", label: "Excellent" };
  if (pct >= 70) return { grade: "B", color: "#84cc16", label: "Good" };
  if (pct >= 60) return { grade: "C", color: "#eab308", label: "Satisfactory" };
  if (pct >= 50) return { grade: "D", color: "#f97316", label: "Needs Improvement" };
  return { grade: "F", color: "#ef4444", label: "Failed" };
};

const CourseExam = ({ courseId, courseTitle, onCertificateEarned }: CourseExamProps) => {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; pct: number; grade: ReturnType<typeof getGrade> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = courseExams[courseId] || [];
  const SECONDS_PER_QUESTION = 60; // 1 min per question

  const finishExam = useCallback((finalAnswers: (number | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = finalAnswers.reduce((acc, a, i) => acc + (a === questions[i].correctIndex ? 1 : 0), 0);
    const pct = Math.round((score / questions.length) * 100);
    const grade = getGrade(pct);
    setResult({ score, total: questions.length, pct, grade });
    setShowResult(true);
    saveResult(score, questions.length, pct, grade.grade, pct >= 50, finalAnswers);
  }, [questions]);

  useEffect(() => {
    if (!started || showResult) return;
    if (timeLeft <= 0 && started) {
      toast.error("Time's up! Submitting your exam.");
      finishExam(answers);
      return;
    }
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft, started, showResult]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setStarted(true);
    setCurrentQ(0);
    setAnswers(new Array(questions.length).fill(null));
    setSelectedOption(null);
    setShowResult(false);
    setResult(null);
    setTimeLeft(questions.length * SECONDS_PER_QUESTION);
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = selectedOption;
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
    } else {
      finishExam(newAnswers);
    }
  };

  const saveResult = async (score: number, total: number, pct: number, grade: string, passed: boolean, ans: (number | null)[]) => {
    if (!user) return;
    setSaving(true);

    // Upsert exam result
    await supabase.from("course_exam_results").upsert({
      user_id: user.id,
      course_id: courseId,
      score, total_questions: total,
      percentage: pct, grade, passed,
      answers: ans,
    }, { onConflict: "user_id,course_id" });

    // Issue certificate if passed
    if (passed) {
      await supabase.from("course_certificates").upsert({
        user_id: user.id,
        course_id: courseId,
        course_title: courseTitle,
        grade, percentage: pct,
      }, { onConflict: "user_id,course_id" });
      onCertificateEarned();
    }

    setSaving(false);
  };

  if (!started) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 p-6 text-center">
        <ClipboardCheck className="w-10 h-10 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-1">Course Exam</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {questions.length} questions • {questions.length} min timer • Pass mark: 50% • Earn a certificate!
        </p>
        <Button variant="hero" size="sm" className="gap-1.5" onClick={handleStart}>
          Start Exam <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-border/50 bg-card/60 p-6 text-center"
      >
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-black"
          style={{
            background: `linear-gradient(135deg, ${result.grade.color}22, ${result.grade.color}11)`,
            border: `2px solid ${result.grade.color}44`,
            color: result.grade.color,
          }}
        >
          {result.grade.grade}
        </div>
        <h3 className="text-xl font-bold mb-1">{result.grade.label}</h3>
        <p className="text-sm text-muted-foreground mb-2">
          You scored <strong className="text-foreground">{result.score}/{result.total}</strong> ({result.pct}%)
        </p>

        {result.pct >= 50 ? (
          <div className="flex items-center justify-center gap-2 text-xs mt-3 mb-4 px-3 py-2 rounded-lg bg-success/10 text-success border border-success/20">
            <Trophy className="w-4 h-4" /> Certificate earned! Check your certificates.
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs mt-3 mb-4 px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-4 h-4" /> You need 50% to pass. Try again!
          </div>
        )}

        <Button variant="outline" size="sm" onClick={handleStart}>
          Retake Exam
        </Button>
      </motion.div>
    );
  }

  const q = questions[currentQ];

  return (
    <motion.div
      key={currentQ}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-border/50 bg-card/60 overflow-hidden"
    >
      {/* Progress */}
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
        <span className="text-xs font-semibold">Question {currentQ + 1}/{questions.length}</span>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
            timeLeft <= 30 ? "bg-destructive/10 text-destructive animate-pulse" : "bg-secondary text-muted-foreground"
          }`}>
            <Timer className="w-3 h-3" />
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: i < currentQ ? "hsl(var(--primary))" : i === currentQ ? "hsl(var(--primary) / 0.5)" : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-sm font-semibold mb-4">{q.question}</h3>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelectedOption(i)}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs transition-all border ${
                selectedOption === i
                  ? "bg-primary/10 border-primary/30 text-primary font-medium"
                  : "bg-secondary/30 border-border/30 hover:bg-secondary/50"
              }`}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border mr-2 text-[10px] font-semibold"
                style={{
                  borderColor: selectedOption === i ? "hsl(var(--primary))" : "hsl(var(--border))",
                  background: selectedOption === i ? "hsl(var(--primary) / 0.15)" : "transparent",
                }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>

        <Button
          variant="hero"
          size="sm"
          className="w-full mt-4 gap-1.5"
          onClick={handleNext}
          disabled={selectedOption === null}
        >
          {currentQ === questions.length - 1 ? "Submit Exam" : "Next Question"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default CourseExam;
