import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const quizQuestions = [
  {
    question: "What excites you most about tech?",
    options: ["Building apps & websites", "Data & AI/ML", "Cloud & DevOps", "Cybersecurity"],
    paths: ["Full-Stack Development", "AI & Machine Learning", "Cloud Engineering", "Security Engineering"],
  },
  {
    question: "How do you prefer to learn?",
    options: ["Hands-on projects", "Video lectures", "Reading docs", "Pair programming"],
  },
  {
    question: "What's your current experience level?",
    options: ["Complete beginner", "Know basics", "Intermediate", "Advanced"],
  },
];

const roadmapResults: Record<string, string[]> = {
  "Full-Stack Development": ["HTML/CSS & JavaScript Fundamentals", "React + Tailwind Projects", "Node.js & REST APIs", "Database Design with SQL", "Build & Deploy a Full-Stack App"],
  "AI & Machine Learning": ["Python Fundamentals", "Statistics & Linear Algebra", "Intro to ML with scikit-learn", "Deep Learning with PyTorch", "Build an AI-Powered Project"],
  "Cloud Engineering": ["Linux & Networking Basics", "AWS/GCP Core Services", "Docker & Kubernetes", "CI/CD Pipelines", "Infrastructure as Code"],
  "Security Engineering": ["Networking & OS Fundamentals", "OWASP Top 10 & Web Security", "Penetration Testing Basics", "Security Automation", "Bug Bounty & CTF Challenges"],
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function InteractiveDemo() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (step === 0) {
      const idx = quizQuestions[0].options.indexOf(answer);
      setSelectedPath(quizQuestions[0].paths![idx]);
    }

    if (step < quizQuestions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(quizQuestions.length); // show results
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setSelectedPath(null);
  };

  const showResults = step >= quizQuestions.length && selectedPath;

  return (
    <section className="py-24 bg-background relative" aria-label="Try it now">
      <div className="absolute inset-0 bg-grid-subtle" />
      <div className="container relative">
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="text-xs text-primary uppercase tracking-widest font-medium">Try It Now</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Get Your <span className="text-gradient">AI Learning Roadmap</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Answer 3 quick questions and our AI generates a personalized learning path — in seconds.
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="max-w-xl mx-auto">
          <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              {quizQuestions.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {!showResults ? (
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">Question {step + 1} of {quizQuestions.length}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-5">{quizQuestions[step].question}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {quizQuestions[step].options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className="text-left px-4 py-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-medium"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-xs text-primary font-medium uppercase tracking-wide">Your Personalized Path</span>
                  </div>
                  <h3 className="text-xl font-bold mb-5">{selectedPath}</h3>
                  <ol className="space-y-3 mb-6">
                    {roadmapResults[selectedPath!]?.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="flex gap-3">
                    <Link to="/auth" className="flex-1">
                      <Button className="w-full bg-gradient-primary text-primary-foreground shadow-glow rounded-xl gap-2">
                        Start This Path <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={reset} className="rounded-xl">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
