import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Building2, ExternalLink, Sparkles, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const internships = [
  { id: 1, title: "Frontend Engineer Intern", company: "Google", location: "Remote", duration: "3 months", skills: ["React", "TypeScript", "CSS"], match: 95, applied: false, logo: "🔵" },
  { id: 2, title: "ML Research Intern", company: "DeepMind", location: "London", duration: "6 months", skills: ["Python", "PyTorch", "Research"], match: 78, applied: true, logo: "🧠" },
  { id: 3, title: "Full-Stack Intern", company: "Stripe", location: "San Francisco", duration: "3 months", skills: ["Node.js", "React", "PostgreSQL"], match: 88, applied: false, logo: "💳" },
  { id: 4, title: "Backend Engineer Intern", company: "Netflix", location: "Remote", duration: "4 months", skills: ["Java", "Microservices", "AWS"], match: 72, applied: false, logo: "🎬" },
  { id: 5, title: "Mobile Developer Intern", company: "Uber", location: "New York", duration: "3 months", skills: ["React Native", "iOS", "Android"], match: 65, applied: false, logo: "🚗" },
  { id: 6, title: "DevOps Intern", company: "Cloudflare", location: "Remote", duration: "6 months", skills: ["Docker", "K8s", "CI/CD"], match: 82, applied: true, logo: "☁️" },
];

const InternshipsPage = () => {
  const [apps, setApps] = useState<Set<number>>(new Set(internships.filter(i => i.applied).map(i => i.id)));

  const handleApply = (id: number, company: string) => {
    setApps(prev => new Set(prev).add(id));
    toast({ title: "🚀 Application Submitted!", description: `Your application to ${company} has been sent.` });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Internships</h1>
          <p className="text-muted-foreground mb-8">AI-matched opportunities based on your skills</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {internships.map((intern, i) => (
            <motion.div
              key={intern.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-hover rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                    {intern.logo}
                  </div>
                  <div>
                    <h3 className="font-semibold">{intern.title}</h3>
                    <p className="text-sm text-muted-foreground">{intern.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  {intern.match}% match
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{intern.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{intern.duration}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {intern.skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{s}</span>
                ))}
              </div>

              <Button
                variant={apps.has(intern.id) ? "secondary" : "hero"}
                size="sm"
                className="w-full"
                disabled={apps.has(intern.id)}
                onClick={() => handleApply(intern.id)}
              >
                {apps.has(intern.id) ? (
                  <><CheckCircle className="w-3 h-3" /> Applied</>
                ) : "Apply Now"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InternshipsPage;
