import { motion } from "framer-motion";
import { BookOpen, Clock, Users, Star, Play, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const courses = [
  { id: 1, title: "React & TypeScript Masterclass", category: "Web Dev", difficulty: "Intermediate", duration: "12h", enrolled: 2340, rating: 4.8, modules: 24, image: "🚀", progress: 65 },
  { id: 2, title: "Python for Data Science", category: "AI/ML", difficulty: "Beginner", duration: "18h", enrolled: 5120, rating: 4.9, modules: 32, image: "🐍", progress: 0 },
  { id: 3, title: "System Design Fundamentals", category: "Architecture", difficulty: "Advanced", duration: "15h", enrolled: 1890, rating: 4.7, modules: 20, image: "🏗️", progress: 30 },
  { id: 4, title: "DSA in JavaScript", category: "Algorithms", difficulty: "Intermediate", duration: "20h", enrolled: 3450, rating: 4.8, modules: 40, image: "⚡", progress: 0 },
  { id: 5, title: "AWS Cloud Practitioner", category: "Cloud", difficulty: "Beginner", duration: "10h", enrolled: 4200, rating: 4.6, modules: 16, image: "☁️", progress: 0 },
  { id: 6, title: "Full-Stack Node.js", category: "Web Dev", difficulty: "Intermediate", duration: "22h", enrolled: 2100, rating: 4.7, modules: 28, image: "🌐", progress: 10 },
];

const categories = ["All", "Web Dev", "AI/ML", "Algorithms", "Cloud", "Architecture"];

const difficultyColor: Record<string, string> = {
  Beginner: "text-success bg-success/10 border-success/20",
  Intermediate: "text-warning bg-warning/10 border-warning/20",
  Advanced: "text-destructive bg-destructive/10 border-destructive/20",
};

const CoursesPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const filtered = courses
    .filter(c => activeCategory === "All" || c.category === activeCategory)
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Courses</h1>
        <p className="text-sm text-muted-foreground">Expert-led courses to accelerate your career</p>
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
        <div className="flex gap-1.5 overflow-x-auto pb-1">
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
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border/50 bg-card/60 overflow-hidden group cursor-pointer hover:border-primary/20 transition-all"
            onClick={() => navigate(`/courses/${course.id}`)}
          >
            <div className="h-28 bg-gradient-to-br from-secondary to-background flex items-center justify-center text-4xl relative">
              {course.image}
              {course.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                  <div className="h-full bg-gradient-primary" style={{ width: `${course.progress}%` }} />
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${difficultyColor[course.difficulty]}`}>
                  {course.difficulty}
                </span>
                <span className="text-[10px] text-muted-foreground">{course.category}</span>
              </div>
              <h3 className="text-sm font-semibold mb-2.5 group-hover:text-primary transition-colors">{course.title}</h3>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.modules}</span>
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{course.rating}</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                <span className="text-[10px] text-muted-foreground">{course.enrolled.toLocaleString()} enrolled</span>
                <Button size="sm" variant={course.progress > 0 ? "default" : "glow"} className="h-7 text-[11px] px-3">
                  {course.progress > 0 ? <><Play className="w-3 h-3" /> Continue</> : "Enroll"}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
