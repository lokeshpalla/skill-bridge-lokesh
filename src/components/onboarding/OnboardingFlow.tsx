import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code2, BookOpen, Brain, Briefcase, Rocket, ArrowRight,
  CheckCircle2, Sparkles, Target, Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SKILLS = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js",
  "SQL", "Java", "C++", "Go", "Rust", "Docker", "AWS",
  "Machine Learning", "Data Science", "System Design", "Cybersecurity",
];

const GOALS = [
  { id: "job", icon: Briefcase, label: "Land a tech job", desc: "Prepare for interviews and build a portfolio" },
  { id: "skills", icon: Code2, label: "Learn new skills", desc: "Master programming languages and frameworks" },
  { id: "switch", icon: Rocket, label: "Career switch", desc: "Transition into tech from another field" },
  { id: "freelance", icon: Users, label: "Freelance / Build", desc: "Learn to build and ship products" },
];

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Just starting out", emoji: "🌱" },
  { id: "intermediate", label: "Intermediate", desc: "Some coding experience", emoji: "🌿" },
  { id: "advanced", label: "Advanced", desc: "Working professional", emoji: "🌳" },
];

interface OnboardingProps {
  onComplete: () => void;
}

const OnboardingFlow = forwardRef<HTMLDivElement, OnboardingProps>(function OnboardingFlow({ onComplete }, ref) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    // Save skills and bio to profile
    const bio = `${selectedLevel || "beginner"} level · Goal: ${selectedGoal || "learn"}`;
    await supabase
      .from("profiles")
      .update({ skills: selectedSkills, bio })
      .eq("user_id", user.id);

    setSaving(false);
    onComplete();
  };

  const canProceed = () => {
    if (step === 0) return true; // welcome
    if (step === 1) return selectedLevel !== null;
    if (step === 2) return selectedSkills.length > 0;
    if (step === 3) return selectedGoal !== null;
    return true;
  };

  const steps = [
    // Step 0: Welcome
    <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center shadow-glow">
        <Sparkles className="w-9 h-9 text-primary-foreground" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome to SkillBridge! 🎉</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Let's personalize your learning journey. This takes less than a minute.
        </p>
      </div>
    </motion.div>,

    // Step 1: Experience Level
    <motion.div key="level" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What's your experience level?</h2>
        <p className="text-muted-foreground mt-1">This helps us recommend the right content</p>
      </div>
      <div className="grid gap-3 max-w-md mx-auto">
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => setSelectedLevel(level.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              selectedLevel === level.id
                ? "border-primary bg-primary/10 shadow-glow"
                : "border-border/50 hover:border-primary/30 bg-card/60"
            }`}
          >
            <span className="text-3xl">{level.emoji}</span>
            <div>
              <p className="font-semibold text-foreground">{level.label}</p>
              <p className="text-sm text-muted-foreground">{level.desc}</p>
            </div>
            {selectedLevel === level.id && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 2: Skills
    <motion.div key="skills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What do you want to learn?</h2>
        <p className="text-muted-foreground mt-1">Select all that interest you</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
        {SKILLS.map((skill) => (
          <button
            key={skill}
            onClick={() => toggleSkill(skill)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selectedSkills.includes(skill)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/60 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {skill}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {selectedSkills.length} selected
      </p>
    </motion.div>,

    // Step 3: Goal
    <motion.div key="goal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What's your main goal?</h2>
        <p className="text-muted-foreground mt-1">We'll tailor your dashboard experience</p>
      </div>
      <div className="grid gap-3 max-w-md mx-auto">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          return (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                selectedGoal === goal.id
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border/50 hover:border-primary/30 bg-card/60"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{goal.label}</p>
                <p className="text-sm text-muted-foreground">{goal.desc}</p>
              </div>
              {selectedGoal === goal.id && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
            </button>
          );
        })}
      </div>
    </motion.div>,

    // Step 4: Ready
    <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center shadow-glow">
        <Target className="w-9 h-9 text-primary-foreground" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">You're all set! 🚀</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Your personalized learning path is ready. Let's start building your future.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {selectedSkills.slice(0, 6).map((skill) => (
          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
        ))}
        {selectedSkills.length > 6 && (
          <Badge variant="outline" className="text-xs">+{selectedSkills.length - 6} more</Badge>
        )}
      </div>
    </motion.div>,
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        {/* Progress */}
        <div className="flex items-center gap-1 max-w-xs mx-auto">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-secondary/50"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between max-w-md mx-auto">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button
              variant="hero"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="gap-1.5"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="hero"
              onClick={handleComplete}
              disabled={saving}
              className="gap-1.5"
            >
              {saving ? "Setting up..." : "Start Learning"} <Rocket className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
