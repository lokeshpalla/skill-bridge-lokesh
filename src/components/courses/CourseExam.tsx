import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ChevronRight, Trophy, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface CourseExamProps {
  courseId: number;
  courseTitle: string;
  onCertificateEarned: () => void;
}

// Exam questions per course
const courseExams: Record<number, ExamQuestion[]> = {
  1: [
    { question: "What is the main benefit of using TypeScript with React?", options: ["Faster runtime", "Static type checking", "Smaller bundle size", "No need for JSX"], correctIndex: 1 },
    { question: "Which hook is used to manage state in a functional component?", options: ["useEffect", "useRef", "useState", "useContext"], correctIndex: 2 },
    { question: "What does useEffect's dependency array do?", options: ["Controls when the effect re-runs", "Defines state variables", "Sets default props", "Handles errors"], correctIndex: 0 },
    { question: "How do you type props in a React TypeScript component?", options: ["Using PropTypes", "Using an interface or type alias", "Using var declarations", "Props don't need types"], correctIndex: 1 },
    { question: "What is a custom hook?", options: ["A built-in React API", "A function starting with 'use' that shares logic", "A CSS framework", "A testing utility"], correctIndex: 1 },
    { question: "Which is NOT a valid React hook rule?", options: ["Call hooks at the top level", "Call hooks in loops or conditions", "Call hooks from React functions", "Call hooks from custom hooks"], correctIndex: 1 },
    { question: "What does React.memo() do?", options: ["Stores data in localStorage", "Memoizes a component to prevent re-renders", "Creates a new state", "Handles routing"], correctIndex: 1 },
    { question: "What is Context API used for?", options: ["Routing", "State management without prop drilling", "API calls", "Styling"], correctIndex: 1 },
    { question: "What does the 'key' prop help React do?", options: ["Style elements", "Identify which items changed in a list", "Create new components", "Handle events"], correctIndex: 1 },
    { question: "Which tool is used for testing React components?", options: ["Webpack", "Babel", "Vitest/Jest", "ESLint"], correctIndex: 2 },
  ],
  2: [
    { question: "What is Python's primary data structure for ordered collections?", options: ["Dictionary", "Set", "List", "Tuple"], correctIndex: 2 },
    { question: "Which library is used for numerical computing in Python?", options: ["Pandas", "NumPy", "Matplotlib", "Flask"], correctIndex: 1 },
    { question: "What does a Pandas DataFrame represent?", options: ["A single value", "A 2D labeled data structure", "A graph", "A function"], correctIndex: 1 },
    { question: "How do you create a NumPy array?", options: ["np.array()", "np.list()", "np.create()", "np.new()"], correctIndex: 0 },
    { question: "Which method reads a CSV file in Pandas?", options: ["pd.open_csv()", "pd.read_csv()", "pd.load_csv()", "pd.csv()"], correctIndex: 1 },
    { question: "What does matplotlib.pyplot.show() do?", options: ["Saves a file", "Displays the plot", "Clears the plot", "Creates data"], correctIndex: 1 },
    { question: "What is a Python dictionary?", options: ["Ordered list", "Key-value pair collection", "A module", "A class"], correctIndex: 1 },
    { question: "Which keyword defines a function in Python?", options: ["function", "func", "def", "fn"], correctIndex: 2 },
  ],
  3: [
    { question: "What is horizontal scaling?", options: ["Adding more RAM", "Adding more servers", "Using a bigger CPU", "Reducing code size"], correctIndex: 1 },
    { question: "What does a load balancer do?", options: ["Stores data", "Distributes traffic across servers", "Compiles code", "Monitors logs"], correctIndex: 1 },
    { question: "What is database sharding?", options: ["Deleting old data", "Splitting data across databases", "Encrypting data", "Backing up data"], correctIndex: 1 },
    { question: "What is a CDN?", options: ["Central Data Node", "Content Delivery Network", "Cloud Database Network", "Cache Data Node"], correctIndex: 1 },
    { question: "What is the CAP theorem about?", options: ["CPU, API, Protocol", "Consistency, Availability, Partition tolerance", "Cache, Access, Performance", "Code, Architecture, Patterns"], correctIndex: 1 },
    { question: "What is a microservices architecture?", options: ["One large application", "Small, independent services", "A database design", "A testing framework"], correctIndex: 1 },
  ],
  4: [
    { question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correctIndex: 1 },
    { question: "Which data structure uses LIFO?", options: ["Queue", "Array", "Stack", "Linked List"], correctIndex: 2 },
    { question: "What is a linked list?", options: ["An array with indices", "Nodes connected by pointers", "A hash table", "A tree structure"], correctIndex: 1 },
    { question: "What is Big O notation?", options: ["A programming language", "A way to describe algorithm efficiency", "A data structure", "A design pattern"], correctIndex: 1 },
    { question: "Which sorting algorithm has O(n log n) average case?", options: ["Bubble Sort", "Selection Sort", "Merge Sort", "Insertion Sort"], correctIndex: 2 },
    { question: "What is dynamic programming?", options: ["Real-time programming", "Breaking problems into overlapping subproblems", "Object-oriented design", "Functional programming"], correctIndex: 1 },
    { question: "What is a hash table's average lookup time?", options: ["O(n)", "O(log n)", "O(1)", "O(n²)"], correctIndex: 2 },
    { question: "What traversal visits root, left, right?", options: ["Inorder", "Preorder", "Postorder", "Level-order"], correctIndex: 1 },
  ],
  5: [
    { question: "What does AWS stand for?", options: ["Advanced Web Systems", "Amazon Web Services", "Automated Web Solutions", "Azure Web Services"], correctIndex: 1 },
    { question: "Which AWS service provides virtual servers?", options: ["S3", "EC2", "RDS", "Lambda"], correctIndex: 1 },
    { question: "What is AWS S3 used for?", options: ["Compute", "Object storage", "Database", "Networking"], correctIndex: 1 },
    { question: "What is AWS Lambda?", options: ["A database", "Serverless compute", "A CDN", "A load balancer"], correctIndex: 1 },
    { question: "What is the AWS shared responsibility model?", options: ["AWS handles everything", "Customer handles everything", "AWS secures infra, customer secures data/apps", "No security needed"], correctIndex: 2 },
  ],
  6: [
    { question: "What is Node.js?", options: ["A browser", "A JavaScript runtime built on V8", "A database", "A CSS framework"], correctIndex: 1 },
    { question: "What does Express.js provide?", options: ["Database ORM", "Web application framework", "Testing tools", "Build tools"], correctIndex: 1 },
    { question: "What is middleware in Express?", options: ["A database", "Functions that process requests", "A template engine", "A router"], correctIndex: 1 },
    { question: "What does JWT stand for?", options: ["JavaScript Web Tool", "JSON Web Token", "Java Web Type", "Just Web Tech"], correctIndex: 1 },
    { question: "What is REST?", options: ["A database", "An architectural style for APIs", "A programming language", "A testing framework"], correctIndex: 1 },
    { question: "Which HTTP method is used to update a resource?", options: ["GET", "POST", "PUT", "DELETE"], correctIndex: 2 },
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

  const questions = courseExams[courseId] || [];

  const handleStart = () => {
    setStarted(true);
    setCurrentQ(0);
    setAnswers(new Array(questions.length).fill(null));
    setSelectedOption(null);
    setShowResult(false);
    setResult(null);
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
      // Calculate results
      const score = newAnswers.reduce((acc, a, i) => acc + (a === questions[i].correctIndex ? 1 : 0), 0);
      const pct = Math.round((score / questions.length) * 100);
      const grade = getGrade(pct);
      setResult({ score, total: questions.length, pct, grade });
      setShowResult(true);
      saveResult(score, questions.length, pct, grade.grade, pct >= 50, newAnswers);
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
          {questions.length} questions • Pass mark: 50% • Earn a certificate!
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
