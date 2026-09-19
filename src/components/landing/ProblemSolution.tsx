import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

const problems = [
  { text: "Courses teach theory but never real building", highlight: "No real projects" },
  { text: "Certificates mean nothing without proof of skill", highlight: "Empty credentials" },
  { text: "No bridge from learning to landing your first role", highlight: "Career gap" },
];

const solutions = [
  { text: "Build real projects with AI guidance & peer teams", highlight: "Project-based learning" },
  { text: "XP scores, proctored exams & verified portfolios", highlight: "Skill verification" },
  { text: "AI internship matching + recruiter-visible profiles", highlight: "Career pipeline" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function ProblemSolution() {
  return (
    <section className="py-24 bg-background relative" aria-label="Why Skill Bridge">
      <div className="absolute inset-0 bg-grid-subtle" />
      <div className="container relative">
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="text-xs text-primary uppercase tracking-widest font-medium">Why Skill Bridge?</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            The Problem with <span className="text-gradient">Today's EdTech</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Millions of learners finish courses but can't land jobs. The gap isn't knowledge — it's proof of skill, real experience, and career access.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problems */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
            <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-lg">The Old Way</h3>
              </div>
              <ul className="space-y-4">
                {problems.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold shrink-0">✕</span>
                    <div>
                      <span className="text-xs font-medium text-destructive uppercase tracking-wide">{p.highlight}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">{p.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Solutions */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">The Skill Bridge Way</h3>
              </div>
              <ul className="space-y-4">
                {solutions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">✓</span>
                    <div>
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">{s.highlight}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="text-center mt-10">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Skill Bridge is the <strong className="text-foreground">AI-powered builder's academy</strong> — Learn <ArrowRight className="w-3 h-3 inline" /> Build <ArrowRight className="w-3 h-3 inline" /> Launch
          </p>
        </motion.div>
      </div>
    </section>
  );
}
