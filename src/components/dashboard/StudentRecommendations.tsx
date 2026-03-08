import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RecommendedCourse {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  image_emoji: string | null;
  duration: string | null;
}

export default function StudentRecommendations({ userId, skills }: { userId: string; skills: string[] }) {
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Get enrolled course IDs to exclude
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", userId);

      const enrolledIds = enrollments?.map(e => e.course_id) || [];

      // Fetch courses not enrolled in
      let query = supabase
        .from("courses")
        .select("id, title, category, difficulty, image_emoji, duration")
        .limit(4);

      if (enrolledIds.length > 0) {
        // Filter manually after fetch since .not().in() can be tricky
      }

      const { data } = await query;
      if (data) {
        const filtered = data.filter(c => !enrolledIds.includes(c.id));
        // Sort by skill relevance if user has skills
        if (skills.length > 0) {
          filtered.sort((a, b) => {
            const aMatch = skills.some(s => a.category.toLowerCase().includes(s.toLowerCase()) || a.title.toLowerCase().includes(s.toLowerCase()));
            const bMatch = skills.some(s => b.category.toLowerCase().includes(s.toLowerCase()) || b.title.toLowerCase().includes(s.toLowerCase()));
            return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
          });
        }
        setCourses(filtered.slice(0, 3));
      }
    };
    fetch();
  }, [userId, skills]);

  if (courses.length === 0) return null;

  const difficultyColor: Record<string, string> = {
    Beginner: "text-success bg-success/10",
    Intermediate: "text-warning bg-warning/10",
    Advanced: "text-destructive bg-destructive/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold">Recommended for You</h2>
        </div>
        <Link to="/courses" className="text-[11px] text-primary hover:underline">Browse all</Link>
      </div>
      <div className="space-y-2.5">
        {courses.map((course) => (
          <Link to={`/courses/${course.id}`} key={course.id}>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors group">
              <span className="text-xl">{course.image_emoji || "📚"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{course.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${difficultyColor[course.difficulty] || "text-muted-foreground bg-secondary"}`}>
                    {course.difficulty}
                  </span>
                  {course.duration && (
                    <span className="text-[10px] text-muted-foreground">{course.duration}</span>
                  )}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
