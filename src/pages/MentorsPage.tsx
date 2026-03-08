import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Calendar, MessageCircle } from "lucide-react";
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
  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Find a Mentor</h1>
          <p className="text-muted-foreground mb-8">Book 1:1 sessions with industry professionals</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor, i) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-hover rounded-xl p-6 relative"
            >
              {mentor.available && (
                <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-3xl">
                  {mentor.avatar}
                </div>
                <div>
                  <h3 className="font-semibold">{mentor.name}</h3>
                  <p className="text-xs text-muted-foreground">{mentor.role}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {mentor.skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{mentor.rating}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{mentor.sessions} sessions</span>
                <span className="font-semibold text-foreground">{mentor.price}</span>
              </div>

              <Button
                variant={booked.has(mentor.id) ? "secondary" : mentor.available ? "hero" : "secondary"}
                className="w-full"
                size="sm"
                disabled={!mentor.available || booked.has(mentor.id)}
                onClick={() => {
                  setBooked(prev => new Set(prev).add(mentor.id));
                  toast({ title: "📅 Session Booked!", description: `Your session with ${mentor.name} has been scheduled.` });
                }}
              >
                {booked.has(mentor.id) ? "✓ Booked" : mentor.available ? (
                  <><Calendar className="w-3 h-3" /> Book Session</>
                ) : "Unavailable"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentorsPage;
