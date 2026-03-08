import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Github, Globe, Star } from "lucide-react";
import { useState } from "react";

const initialProjects = [
  { id: 1, title: "AI Chat Application", description: "Real-time chat app with OpenAI integration, streaming responses, and multi-language support", tech: ["React", "Node.js", "Socket.IO", "OpenAI"], stars: 24, image: "💬", link: "#" },
  { id: 2, title: "E-commerce Dashboard", description: "Admin dashboard with analytics, inventory management, and order tracking", tech: ["Next.js", "PostgreSQL", "Tailwind", "Recharts"], stars: 18, image: "📊", link: "#" },
  { id: 3, title: "Cloud Infrastructure CLI", description: "CLI tool for managing multi-cloud deployments with Terraform integration", tech: ["Go", "Terraform", "AWS", "Docker"], stars: 42, image: "☁️", link: "#" },
];

const PortfolioPage = () => {
  const [projects] = useState(initialProjects);

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Portfolio</h1>
              <p className="text-muted-foreground">Showcase your best work</p>
            </div>
            <Button variant="hero" size="sm">
              <Plus className="w-4 h-4" /> Add Project
            </Button>
          </div>
        </motion.div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl">
              🧑‍💻
            </div>
            <div>
              <h2 className="text-xl font-bold">Alex Developer</h2>
              <p className="text-sm text-muted-foreground">Full-Stack Engineer • 4,820 XP • Rank #23</p>
              <div className="flex gap-2 mt-2">
                {["React", "TypeScript", "Node.js", "Python", "AWS"].map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects */}
        <div className="space-y-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-hover rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
                  {project.image}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{project.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-warning" />{project.stars}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.tech.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="glow" size="sm"><Github className="w-3 h-3" /> Code</Button>
                    <Button variant="ghost" size="sm"><Globe className="w-3 h-3" /> Demo</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
