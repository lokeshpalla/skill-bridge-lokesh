import { motion } from "framer-motion";
import { BookOpen, Clock, Star, Play, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/ui/loading-skeletons";

interface Course {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  duration: string | null;
  image_emoji: string | null;
  modules: any[];
  description: string | null;
}

interface Enrollment {
  course_id: string;
  progress: number;
}

const categories = ["All", "Web Dev", "AI/ML", "Algorithms", "Cloud", "Architecture", "General"];

const difficultyColor: Record<string, string> = {
  Beginner: "text-success bg-success/10 border-success/20",
  Intermediate: "text-warning bg-warning/10 border-warning/20",
  Advanced: "text-destructive bg-destructive/10 border-destructive/20",
};

const CoursesPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (user) fetchEnrollments();
  }, [user]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, category, difficulty, duration, image_emoji, modules, description")
      .order("created_at", { ascending: false });
    if (data) {
      setCourses(data.map((c: any) => ({
        ...c,
        modules: Array.isArray(c.modules) ? c.modules : [],
      })));
    }
    if (error) console.error("Error fetching courses:", error);
    setLoading(false);
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("course_enrollments")
      .select("course_id, progress")
      .eq("user_id", user.id);
    if (data) {
      const map = new Map<string, number>();
      data.forEach((e: Enrollment) => map.set(e.course_id, e.progress));
      setEnrollments(map);
    }
  };

  const filtered = courses
    .filter(c => activeCategory === "All" || c.category === activeCategory)
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-1">Courses</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Expert-led courses to accelerate your career</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card/60 border-border/50 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={search ? "Try adjusting your search or filters." : "No courses available yet. Check back soon!"}
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course, i) => {
            const progress = enrollments.get(course.id) ?? 0;
            const moduleCount = course.modules?.length ?? 0;
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border/50 bg-card/60 overflow-hidden group cursor-pointer hover:border-primary/20 transition-all"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="h-24 sm:h-28 bg-gradient-to-br from-secondary to-background flex items-center justify-center text-3xl sm:text-4xl relative">
                  {course.image_emoji || "📚"}
                  {progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                      <div className="h-full bg-gradient-primary" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${difficultyColor[course.difficulty] || difficultyColor.Beginner}`}>
                      {course.difficulty}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{course.category}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] sm:text-[11px] text-muted-foreground">
                    {course.duration && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                    )}
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{moduleCount} modules</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground">
                      {progress > 0 ? `${progress}% complete` : "Not enrolled"}
                    </span>
                    <Button size="sm" variant={progress > 0 ? "default" : "glow"} className="h-7 text-[11px] px-3">
                      {progress > 0 ? <><Play className="w-3 h-3" /> Continue</> : "Enroll"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
