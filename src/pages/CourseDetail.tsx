import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, BookOpen, Star, Users, Play, CheckCircle, Lock, Award, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import ModuleViewer from "@/components/courses/ModuleViewer";
import CourseExam from "@/components/courses/CourseExam";
import CertificateCard from "@/components/courses/CertificateCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CourseModule {
  title: string;
  duration: string;
}

interface Course {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  duration: string | null;
  image_emoji: string | null;
  modules: CourseModule[];
  description: string | null;
}

const difficultyColor: Record<string, string> = {
  Beginner: "text-success bg-success/10 border-success/20",
  Intermediate: "text-warning bg-warning/10 border-warning/20",
  Advanced: "text-destructive bg-destructive/10 border-destructive/20",
};

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [certificate, setCertificate] = useState<any>(null);

  const modules = course?.modules ?? [];
  const allCompleted = modules.length > 0 && modules.every((_, i) => completedModules.includes(i));
  const completedCount = completedModules.length;
  const progress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
  const nextModule = modules.findIndex((_, i) => !completedModules.includes(i));

  // Fetch course from DB
  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, category, difficulty, duration, image_emoji, modules, description")
        .eq("id", id)
        .maybeSingle();

      if (error) console.error("Error fetching course:", error);
      if (data) {
        setCourse({
          ...data,
          modules: Array.isArray(data.modules)
            ? (data.modules as any[]).map((m: any) => ({ title: m.title || "Untitled", duration: m.duration || "30min" }))
            : [],
        });
      }
      setLoading(false);
    };
    fetchCourse();
  }, [id]);

  // Inject Course JSON-LD structured data
  useEffect(() => {
    if (!course) return;
    const existing = document.getElementById("course-json-ld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "course-json-ld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.description || `${course.title} — ${course.category} course on Skill Bridge.`,
      provider: { "@type": "Organization", name: "Skill Bridge", sameAs: "https://grexil-lokesh01.lovable.app" },
      educationalLevel: course.difficulty,
      hasCourseInstance: course.modules.map((m, i) => ({
        "@type": "CourseInstance",
        name: m.title,
        courseMode: "online",
        position: i + 1,
      })),
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [course]);

  // Fetch enrollment & certificate
  useEffect(() => {
    if (!user || !id) return;
    const fetchUserData = async () => {
      // Enrollment
      const { data: enrollment } = await supabase
        .from("course_enrollments")
        .select("progress, completed_modules")
        .eq("user_id", user.id)
        .eq("course_id", id)
        .maybeSingle();

      if (enrollment) {
        setEnrolled(true);
        const cm = Array.isArray(enrollment.completed_modules) ? (enrollment.completed_modules as number[]) : [];
        setCompletedModules(cm);
      }

      // Certificate (course_id is integer in this table, so try numeric parse)
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        const { data: cert } = await supabase
          .from("course_certificates")
          .select("*")
          .eq("user_id", user.id)
          .eq("course_id", numericId)
          .maybeSingle();
        if (cert) setCertificate(cert);
      }
    };
    fetchUserData();
  }, [user, id]);

  const handleEnroll = useCallback(async () => {
    if (!user || !id) {
      toast({ title: "Please log in", description: "You need to be logged in to enroll." });
      return;
    }
    const { error } = await supabase
      .from("course_enrollments")
      .insert({ user_id: user.id, course_id: id, progress: 0, completed_modules: [] });

    if (error) {
      if (error.code === "23505") {
        setEnrolled(true);
        return;
      }
      console.error("Enrollment error:", error);
      toast({ title: "Error", description: "Could not enroll. Please try again." });
      return;
    }
    setEnrolled(true);
    toast({ title: "🎉 Enrolled!", description: `You've enrolled in ${course?.title}` });
  }, [user, id, course]);

  const handleStartModule = (index: number) => {
    if (!enrolled) {
      handleEnroll();
      return;
    }
    if (index > nextModule && nextModule !== -1 && !completedModules.includes(index)) {
      toast({ title: "🔒 Locked", description: "Complete previous modules first" });
      return;
    }
    setActiveModule(index);
  };

  const handleCompleteModule = useCallback(async () => {
    if (activeModule === null || !course) return;

    const updated = [...new Set([...completedModules, activeModule])];

    if (user && id) {
      const { data, error } = await supabase.rpc("complete_course_module", {
        p_course_id: id,
        p_module_index: activeModule,
      });
      if (error) {
        toast.error("Could not save module completion. Please try again.");
        return;
      }
      const result = data as { xp_earned: number; new_streak: number; streak_increased: boolean } | null;
      const completedOnServer = (result as any)?.completed_modules;
      setCompletedModules(Array.isArray(completedOnServer) ? completedOnServer as number[] : updated);
      const xpEarned = result?.xp_earned ?? 0;
      const streakMsg = result?.streak_increased ? ` 🔥 Streak: ${result.new_streak} days!` : "";
      toast({ title: "✅ Module Completed!", description: `"${modules[activeModule].title}" — +${xpEarned} XP${streakMsg}` });
    } else {
      setCompletedModules(updated);
      toast({ title: "✅ Module Completed!", description: `"${modules[activeModule].title}" marked as complete.` });
    }
    setActiveModule(null);
  }, [activeModule, completedModules, modules, user, id, course]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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

  if (activeModule !== null) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <ModuleViewer
          moduleTitle={modules[activeModule].title}
          moduleIndex={activeModule}
          courseId={parseInt(course.id) || 0}
          onBack={() => setActiveModule(null)}
          onComplete={handleCompleteModule}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
      <Link to="/courses" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Header */}
        <div className="rounded-xl border border-border/50 bg-card/60 p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-secondary/80 flex items-center justify-center text-3xl flex-shrink-0">
              {course.image_emoji || "📚"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${difficultyColor[course.difficulty] || difficultyColor.Beginner}`}>
                  {course.difficulty}
                </span>
                <span className="text-[10px] text-muted-foreground">{course.category}</span>
              </div>
              <h1 className="text-xl font-bold mb-1.5">{course.title}</h1>
              <p className="text-xs text-muted-foreground mb-3">{course.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                {course.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>}
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{modules.length} modules</span>
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
              const isCompleted = completedModules.includes(i);
              const isLocked = !enrolled || (i > nextModule && nextModule !== -1 && !isCompleted);
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
                    {isCompleted ? <CheckCircle className="w-4 h-4 text-success" /> : isLocked ? <Lock className="w-4 h-4 text-muted-foreground/30" /> : <Play className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isLocked && !isCompleted ? "text-muted-foreground/40" : ""}`}>
                      {i + 1}. {mod.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{mod.duration}</span>
                  {isCurrent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">Current</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Course Exam */}
        {allCompleted && enrolled && (
          <CourseExam
            courseId={parseInt(course.id) || 0}
            courseTitle={course.title}
            onCertificateEarned={() => {
              const numericId = parseInt(course.id);
              if (!isNaN(numericId) && user) {
                supabase.from("course_certificates").select("*").eq("user_id", user.id).eq("course_id", numericId).maybeSingle().then(({ data }) => { if (data) setCertificate(data); });
              }
            }}
          />
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
