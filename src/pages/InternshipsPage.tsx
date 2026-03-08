import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Sparkles, CheckCircle, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");

  const filtered = internships.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Internships</h1>
          <p className="text-sm text-muted-foreground">AI-matched opportunities based on your skills</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search internships..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card/60 border-border/50 h-9 text-sm" />
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((intern, i) => (
          <motion.div
            key={intern.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border/50 bg-card/60 p-5 hover:border-primary/20 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-xl">
                  {intern.logo}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{intern.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{intern.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
                <Sparkles className="w-2.5 h-2.5" />
                {intern.match}%
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{intern.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{intern.duration}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {intern.skills.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground">{s}</span>
              ))}
            </div>

            <Button
              variant={apps.has(intern.id) ? "secondary" : "hero"}
              className="w-full h-8 text-xs"
              disabled={apps.has(intern.id)}
              onClick={() => {
                setApps(prev => new Set(prev).add(intern.id));
                toast({ title: "🚀 Application Submitted!", description: `Your application to ${intern.company} has been sent.` });
              }}
            >
              {apps.has(intern.id) ? <><CheckCircle className="w-3 h-3" /> Applied</> : "Apply Now"}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default InternshipsPage;
