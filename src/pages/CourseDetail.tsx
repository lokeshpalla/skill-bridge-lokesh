import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, BookOpen, Star, Users, Play, CheckCircle, Lock, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import ModuleViewer from "@/components/courses/ModuleViewer";
import CourseExam from "@/components/courses/CourseExam";
import CertificateCard from "@/components/courses/CertificateCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const coursesData: Record<number, {
  id: number; title: string; category: string; difficulty: string; duration: string;
  enrolled: number; rating: number; modules: { title: string; duration: string; completed: boolean }[];
  description: string; image: string;
}> = {
  1: {
    id: 1, title: "React & TypeScript Masterclass", category: "Web Dev", difficulty: "Intermediate",
    duration: "12h", enrolled: 2340, rating: 4.8, image: "🚀",
    description: "Master React with TypeScript from component patterns to advanced hooks, state management, and performance optimization.",
    modules: [
      { title: "Introduction to React + TS", duration: "25min", completed: true },
      { title: "Component Patterns & Props", duration: "40min", completed: true },
      { title: "useState & useEffect Deep Dive", duration: "35min", completed: true },
      { title: "Custom Hooks", duration: "30min", completed: true },
      { title: "Context API & State Management", duration: "45min", completed: false },
      { title: "React Router & Navigation", duration: "30min", completed: false },
      { title: "Forms & Validation", duration: "35min", completed: false },
      { title: "API Integration & Data Fetching", duration: "40min", completed: false },
      { title: "Performance Optimization", duration: "30min", completed: false },
      { title: "Testing with Vitest", duration: "35min", completed: false },
    ],
  },
  2: { id: 2, title: "Python for Data Science", category: "AI/ML", difficulty: "Beginner", duration: "18h", enrolled: 5120, rating: 4.9, image: "🐍", description: "Learn Python fundamentals and dive into data science with Pandas, NumPy, and Matplotlib.", modules: [{ title: "Python Basics", duration: "30min", completed: false },{ title: "Data Types & Structures", duration: "35min", completed: false },{ title: "Functions & Modules", duration: "25min", completed: false },{ title: "NumPy Fundamentals", duration: "40min", completed: false },{ title: "Pandas DataFrames", duration: "45min", completed: false },{ title: "Data Visualization", duration: "35min", completed: false }] },
  3: { id: 3, title: "System Design Fundamentals", category: "Architecture", difficulty: "Advanced", duration: "15h", enrolled: 1890, rating: 4.7, image: "🏗️", description: "Learn to design scalable distributed systems.", modules: [{ title: "Scalability Basics", duration: "30min", completed: true },{ title: "Load Balancing", duration: "35min", completed: true },{ title: "Database Design", duration: "40min", completed: false },{ title: "Caching Strategies", duration: "30min", completed: false },{ title: "Microservices Architecture", duration: "45min", completed: false }] },
  4: { id: 4, title: "DSA in JavaScript", category: "Algorithms", difficulty: "Intermediate", duration: "20h", enrolled: 3450, rating: 4.8, image: "⚡", description: "Master data structures and algorithms in JavaScript.", modules: [{ title: "Arrays & Strings", duration: "40min", completed: false },{ title: "Linked Lists", duration: "35min", completed: false },{ title: "Stacks & Queues", duration: "30min", completed: false },{ title: "Trees & Graphs", duration: "45min", completed: false },{ title: "Sorting Algorithms", duration: "35min", completed: false },{ title: "Dynamic Programming", duration: "50min", completed: false }] },
  5: { id: 5, title: "AWS Cloud Practitioner", category: "Cloud", difficulty: "Beginner", duration: "10h", enrolled: 4200, rating: 4.6, image: "☁️", description: "Prepare for AWS Cloud Practitioner certification.", modules: [{ title: "Cloud Concepts", duration: "25min", completed: false },{ title: "AWS Core Services", duration: "40min", completed: false },{ title: "Security & Compliance", duration: "30min", completed: false },{ title: "Billing & Pricing", duration: "25min", completed: false }] },
  6: { id: 6, title: "Full-Stack Node.js", category: "Web Dev", difficulty: "Intermediate", duration: "22h", enrolled: 2100, rating: 4.7, image: "🌐", description: "Build production-ready full-stack applications.", modules: [{ title: "Node.js Fundamentals", duration: "30min", completed: true },{ title: "Express.js & Routing", duration: "35min", completed: false },{ title: "Database with PostgreSQL", duration: "40min", completed: false },{ title: "Authentication & JWT", duration: "35min", completed: false },{ title: "REST API Design", duration: "30min", completed: false },{ title: "Deployment", duration: "25min", completed: false }] },
};

const difficultyColor: Record<string, string> = {
  Beginner: "text-success bg-success/10 border-success/20",
  Intermediate: "text-warning bg-warning/10 border-warning/20",
  Advanced: "text-destructive bg-destructive/10 border-destructive/20",
};

const CourseDetail = () => {
  const { id } = useParams();
  const course = coursesData[Number(id)];
  
  // Load persisted module completion from localStorage
  const getPersistedModules = () => {
    if (!course) return [];
    const saved = localStorage.getItem(`course_progress_${id}`);
    if (saved) {
      try {
        const completedIndices: number[] = JSON.parse(saved);
        return course.modules.map((m, i) => ({ ...m, completed: completedIndices.includes(i) }));
      } catch { /* fallback */ }
    }
    return course.modules;
  };

  const [modules, setModules] = useState(getPersistedModules);
  const [enrolled, setEnrolled] = useState(() => {
    if (!course) return false;
    return localStorage.getItem(`course_enrolled_${id}`) === "true" || getPersistedModules().some(m => m.completed);
  });
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const { user } = useAuth();

  const allCompleted = modules.length > 0 && modules.every(m => m.completed);

  useEffect(() => {
    if (user && course) fetchCertificate();
  }, [user, course]);

  const fetchCertificate = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("course_certificates")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", Number(id))
      .maybeSingle();
    if (data) setCertificate(data);
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Link to="/courses"><Button variant="glow">Back to Courses</Button></Link>
        </div>
      </div>
    );
  }

  const completedCount = modules.filter(m => m.completed).length;
  const progress = Math.round((completedCount / modules.length) * 100);
  const nextModule = modules.findIndex(m => !m.completed);

  const handleEnroll = () => {
    setEnrolled(true);
    localStorage.setItem(`course_enrolled_${id}`, "true");
    toast({ title: "🎉 Enrolled!", description: `You've enrolled in ${course.title}` });
  };

  const handleStartModule = (index: number) => {
    if (!enrolled) { handleEnroll(); }
    if (index > nextModule && nextModule !== -1 && !modules[index].completed) {
      toast({ title: "🔒 Locked", description: "Complete previous modules first" });
      return;
    }
    setActiveModule(index);
  };

  const handleCompleteModule = async () => {
    if (activeModule === null) return;
    const updated = [...modules];
    updated[activeModule] = { ...updated[activeModule], completed: true };
    setModules(updated);
    // Persist to localStorage
    const completedIndices = updated.map((m, i) => m.completed ? i : -1).filter(i => i >= 0);
    localStorage.setItem(`course_progress_${id}`, JSON.stringify(completedIndices));

    // Parse module duration to estimate minutes spent
    const durationStr = modules[activeModule].duration || "30min";
    const minutesSpent = parseInt(durationStr) || 30;

    // Record activity: award 50 base XP + time-based bonus, update streak
    if (user) {
      const { data } = await supabase.rpc("record_activity", {
        _user_id: user.id,
        _xp_amount: 50,
        _minutes_spent: minutesSpent,
      });
      const result = data as { xp_earned: number; new_streak: number; streak_increased: boolean } | null;
      const xpEarned = result?.xp_earned ?? 50;
      const streakMsg = result?.streak_increased ? ` 🔥 Streak: ${result.new_streak} days!` : "";
      toast({ title: "✅ Module Completed!", description: `"${modules[activeModule].title}" — +${xpEarned} XP${streakMsg}` });
    } else {
      toast({ title: "✅ Module Completed!", description: `"${modules[activeModule].title}" marked as complete.` });
    }
    setActiveModule(null);
  };

  // Show module viewer when a module is active
  if (activeModule !== null) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <ModuleViewer
          moduleTitle={modules[activeModule].title}
          moduleIndex={activeModule}
          courseId={course.id}
          onBack={() => setActiveModule(null)}
          onComplete={handleCompleteModule}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
      <Link to="/courses" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-border/50 bg-card/60 p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-secondary/80 flex items-center justify-center text-3xl flex-shrink-0">
              {course.image}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${difficultyColor[course.difficulty]}`}>
                  {course.difficulty}
                </span>
                <span className="text-[10px] text-muted-foreground">{course.category}</span>
              </div>
              <h1 className="text-xl font-bold mb-1.5">{course.title}</h1>
              <p className="text-xs text-muted-foreground mb-3">{course.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{modules.length} modules</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{course.rating}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrolled.toLocaleString()}</span>
              </div>

              {enrolled && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">{completedCount}/{modules.length} modules</span>
                    <span className="text-primary font-semibold">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-primary rounded-full" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {!enrolled && (
            <Button variant="hero" className="w-full mt-4 h-9 text-sm" onClick={handleEnroll}>
              Enroll Now — Free
            </Button>
          )}
        </div>

        {/* Modules */}
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/40">
            <h2 className="text-sm font-semibold">Course Modules</h2>
          </div>
          <div className="divide-y divide-border/20">
            {modules.map((mod, i) => {
              const isLocked = !enrolled || (i > nextModule && nextModule !== -1 && !mod.completed);
              const isCurrent = i === nextModule && enrolled;
              return (
                <button
                  key={i}
                  onClick={() => handleStartModule(i)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                    isCurrent ? "bg-primary/5" : "hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {mod.completed ? <CheckCircle className="w-4 h-4 text-success" /> : isLocked ? <Lock className="w-4 h-4 text-muted-foreground/30" /> : <Play className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${isLocked && !mod.completed ? "text-muted-foreground/40" : ""}`}>
                      {i + 1}. {mod.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{mod.duration}</span>
                  {isCurrent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Current</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course Exam - show after all modules completed */}
        {allCompleted && enrolled && (
          <div className="space-y-4">
            <CourseExam
              courseId={course.id}
              courseTitle={course.title}
              onCertificateEarned={fetchCertificate}
            />
          </div>
        )}

        {/* Certificate */}
        {certificate && user && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Your Certificate</span>
            </div>
            <CertificateCard
              displayName={user.user_metadata?.display_name || user.email || "Student"}
              courseTitle={certificate.course_title}
              grade={certificate.grade}
              percentage={Number(certificate.percentage)}
              certificateNumber={certificate.certificate_number}
              issuedAt={certificate.issued_at}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CourseDetail;
