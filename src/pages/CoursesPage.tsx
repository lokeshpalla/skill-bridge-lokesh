import { motion } from "framer-motion";
import { BookOpen, Clock, Users, Star, Play, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Beginner: "text-success bg-success/10",
  Intermediate: "text-warning bg-warning/10",
  Advanced: "text-destructive bg-destructive/10",
};

const CoursesPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();
  const filtered = activeCategory === "All" ? courses : courses.filter(c => c.category === activeCategory);

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Courses</h1>
          <p className="text-muted-foreground mb-6">Expert-led courses to accelerate your career</p>
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Course grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-hover rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              {/* Card header */}
              <div className="h-32 bg-gradient-card flex items-center justify-center text-5xl relative">
                {course.image}
                {course.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                    <div className="h-full bg-gradient-primary" style={{ width: `${course.progress}%` }} />
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[course.difficulty]}`}>
                    {course.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground">{course.category}</span>
                </div>
                <h3 className="font-semibold mb-3 group-hover:text-primary transition-colors">{course.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.modules} modules</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{course.rating}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground"><Users className="w-3 h-3 inline mr-1" />{course.enrolled.toLocaleString()} enrolled</span>
                  <Button size="sm" variant={course.progress > 0 ? "default" : "glow"}>
                    {course.progress > 0 ? (
                      <><Play className="w-3 h-3" /> Continue</>
                    ) : "Enroll"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
