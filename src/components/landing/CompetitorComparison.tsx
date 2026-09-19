import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

type Status = "yes" | "no" | "partial";

const features = [
  { name: "Free forever tier", grexil: "yes" as Status, coursera: "partial" as Status, udemy: "no" as Status, nxtwave: "no" as Status },
  { name: "AI-powered learning paths", grexil: "yes" as Status, coursera: "no" as Status, udemy: "no" as Status, nxtwave: "partial" as Status },
  { name: "LeetCode-style coding arena", grexil: "yes" as Status, coursera: "no" as Status, udemy: "no" as Status, nxtwave: "yes" as Status },
  { name: "Team project builder", grexil: "yes" as Status, coursera: "no" as Status, udemy: "no" as Status, nxtwave: "no" as Status },
  { name: "Portfolio & resume builder", grexil: "yes" as Status, coursera: "no" as Status, udemy: "no" as Status, nxtwave: "partial" as Status },
  { name: "AI mock interviews", grexil: "yes" as Status, coursera: "no" as Status, udemy: "no" as Status, nxtwave: "no" as Status },
  { name: "Recruiter talent pipeline", grexil: "yes" as Status, coursera: "no" as Status, udemy: "no" as Status, nxtwave: "yes" as Status },
  { name: "Gamified XP & leaderboards", grexil: "yes" as Status, coursera: "no" as Status, udemy: "no" as Status, nxtwave: "partial" as Status },
  { name: "1:1 mentor sessions", grexil: "yes" as Status, coursera: "partial" as Status, udemy: "no" as Status, nxtwave: "yes" as Status },
];

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "yes") return <Check className="w-4 h-4 text-primary" />;
  if (status === "partial") return <Minus className="w-4 h-4 text-warning" />;
  return <X className="w-4 h-4 text-muted-foreground/40" />;
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function CompetitorComparison() {
  return (
    <section className="py-24 bg-muted/30 border-y border-border/50 relative" aria-label="Comparison">
      <div className="absolute inset-0 bg-dot-grid opacity-40" />
      <div className="container relative">
        <motion.div {...fadeUp} className="text-center mb-12">
          <span className="text-xs text-primary uppercase tracking-widest font-medium">Comparison</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Why Skill Bridge <span className="text-gradient">Stands Apart</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We're not just another course platform. We're the full skill-to-career pipeline.
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Feature</th>
                <th className="py-3 px-4 text-center font-bold text-primary">Skill Bridge</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Coursera</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">Udemy</th>
                <th className="py-3 px-4 text-center font-medium text-muted-foreground">NxtWave</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 pr-4 text-foreground">{f.name}</td>
                  <td className="py-3 px-4 text-center"><div className="flex justify-center"><StatusIcon status={f.grexil} /></div></td>
                  <td className="py-3 px-4 text-center"><div className="flex justify-center"><StatusIcon status={f.coursera} /></div></td>
                  <td className="py-3 px-4 text-center"><div className="flex justify-center"><StatusIcon status={f.udemy} /></div></td>
                  <td className="py-3 px-4 text-center"><div className="flex justify-center"><StatusIcon status={f.nxtwave} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
