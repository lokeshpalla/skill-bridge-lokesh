import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Github, Globe, Star, User } from "lucide-react";
import { useState } from "react";

const initialProjects = [
  { id: 1, title: "AI Chat Application", description: "Real-time chat app with OpenAI integration, streaming responses, and multi-language support", tech: ["React", "Node.js", "Socket.IO", "OpenAI"], stars: 24, image: "💬" },
  { id: 2, title: "E-commerce Dashboard", description: "Admin dashboard with analytics, inventory management, and order tracking", tech: ["Next.js", "PostgreSQL", "Tailwind", "Recharts"], stars: 18, image: "📊" },
  { id: 3, title: "Cloud Infrastructure CLI", description: "CLI tool for managing multi-cloud deployments with Terraform integration", tech: ["Go", "Terraform", "AWS", "Docker"], stars: 42, image: "☁️" },
];

const PortfolioPage = () => {
  const [projects] = useState(initialProjects);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">My Portfolio</h1>
          <p className="text-sm text-muted-foreground">Showcase your best work</p>
        </div>
        <Button variant="hero" size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Project
        </Button>
      </motion.div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border/50 bg-card/60 p-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Alex Developer</h2>
            <p className="text-xs text-muted-foreground">Full-Stack Engineer • 4,820 XP • Rank #23</p>
            <div className="flex gap-1.5 mt-2">
              {["React", "TypeScript", "Node.js", "Python", "AWS"].map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Projects */}
      <div className="space-y-3">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="rounded-xl border border-border/50 bg-card/60 p-5 hover:border-primary/20 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-xl flex-shrink-0">
                {project.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{project.title}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Star className="w-3 h-3 text-warning" />{project.stars}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {project.tech.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground">{t}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="glow" size="sm" className="h-7 text-[11px] px-3"><Github className="w-3 h-3" /> Code</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] px-3"><Globe className="w-3 h-3" /> Demo</Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioPage;
