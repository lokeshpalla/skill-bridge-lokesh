import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, Calendar, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const mentors = [
  { id: 1, name: "Sarah Chen", role: "Senior Engineer @ Google", skills: ["React", "System Design", "TypeScript"], rating: 4.9, sessions: 234, price: "$60/hr", avatar: "👩‍💻", available: true },
  { id: 2, name: "James Wilson", role: "Staff Engineer @ Meta", skills: ["Python", "ML", "Data Pipelines"], rating: 4.8, sessions: 189, price: "$75/hr", avatar: "👨‍💼", available: true },
  { id: 3, name: "Priya Sharma", role: "Tech Lead @ Microsoft", skills: ["Cloud", "DevOps", "Kubernetes"], rating: 4.9, sessions: 312, price: "$55/hr", avatar: "👩‍🔬", available: false },
  { id: 4, name: "Alex Kim", role: "CTO @ Startup", skills: ["Full-Stack", "Architecture", "Leadership"], rating: 4.7, sessions: 156, price: "$80/hr", avatar: "🧑‍💻", available: true },
  { id: 5, name: "Maria Garcia", role: "AI Researcher @ DeepMind", skills: ["Deep Learning", "NLP", "PyTorch"], rating: 5.0, sessions: 98, price: "$90/hr", avatar: "👩‍🏫", available: true },
  { id: 6, name: "David Park", role: "Mobile Lead @ Uber", skills: ["React Native", "iOS", "Android"], rating: 4.6, sessions: 145, price: "$50/hr", avatar: "👨‍🎓", available: false },
];

const MentorsPage = () => {
  const [booked, setBooked] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = mentors.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Find a Mentor</h1>
          <p className="text-sm text-muted-foreground">Book 1:1 sessions with industry professionals</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search mentors or skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card/60 border-border/50 h-9 text-sm" />
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((mentor, i) => (
          <motion.div
            key={mentor.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border/50 bg-card/60 p-5 relative hover:border-primary/20 transition-all"
          >
            {mentor.available && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-success font-medium">Online</span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center text-2xl">
                {mentor.avatar}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{mentor.name}</h3>
                <p className="text-[11px] text-muted-foreground">{mentor.role}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {mentor.skills.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{s}</span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{mentor.rating}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{mentor.sessions}</span>
              <span className="font-semibold text-foreground">{mentor.price}</span>
            </div>

            <Button
              variant={booked.has(mentor.id) ? "secondary" : mentor.available ? "hero" : "secondary"}
              className="w-full h-8 text-xs"
              disabled={!mentor.available || booked.has(mentor.id)}
              onClick={() => {
                setBooked(prev => new Set(prev).add(mentor.id));
                toast({ title: "📅 Session Booked!", description: `Your session with ${mentor.name} has been scheduled.` });
              }}
            >
              {booked.has(mentor.id) ? "✓ Booked" : mentor.available ? <><Calendar className="w-3 h-3" /> Book Session</> : "Unavailable"}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MentorsPage;
