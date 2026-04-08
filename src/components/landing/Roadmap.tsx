import { motion } from "framer-motion";
import { Rocket, Users, Globe, TrendingUp, Building2, Cpu } from "lucide-react";

const milestones = [
  {
    quarter: "Q2 2026",
    label: "NOW",
    title: "Foundation",
    items: ["200+ free courses live", "AI coding arena", "Portfolio builder", "1:1 mentorship"],
    icon: Rocket,
    active: true,
  },
  {
    quarter: "Q3 2026",
    title: "Growth",
    items: ["Virtual Internship Simulator", "Team project matching", "Mobile app (PWA)", "Community forums v2"],
    icon: Users,
  },
  {
    quarter: "Q4 2026",
    title: "Scale",
    items: ["Startup Builder Mode", "Hiring Challenge Marketplace", "Enterprise partnerships", "Multi-language support"],
    icon: Globe,
  },
  {
    quarter: "Q1 2027",
    title: "Expand",
    items: ["AI teaching assistant v2", "University integrations", "Regional expansion (India, Africa)", "Series A fundraise"],
    icon: TrendingUp,
  },
];

const marketStats = [
  { value: "$400B+", label: "Global EdTech Market by 2028", icon: Building2 },
  { value: "77M+", label: "Students learning online in India alone", icon: Users },
  { value: "3.5M", label: "Tech job openings globally each year", icon: Cpu },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

export default function Roadmap() {
  return (
    <section className="py-24 bg-background relative" aria-label="Roadmap">
      <div className="absolute inset-0 bg-grid-subtle" />
      <div className="container relative">
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="text-xs text-primary uppercase tracking-widest font-medium">Roadmap</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Where We're <span className="text-gradient">Headed</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A clear 18-month plan to build the world's most complete skill-to-career platform.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="grid md:grid-cols-4 gap-6">
            {milestones.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div key={m.quarter} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                  <div className={`rounded-2xl border p-5 h-full transition-all ${m.active ? "border-primary/30 bg-primary/[0.04] shadow-glow" : "border-border/60 bg-card"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.active ? "bg-gradient-primary" : "bg-primary/8"}`}>
                        <Icon className={`w-4 h-4 ${m.active ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <div>
                        <span className="text-xs font-mono font-bold text-primary">{m.quarter}</span>
                        {m.label && <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">{m.label}</span>}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{m.title}</h3>
                    <ul className="space-y-1.5">
                      {m.items.map((item) => (
                        <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Market opportunity */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="text-center mb-10">
          <span className="text-xs text-primary uppercase tracking-widest font-medium">Market Opportunity</span>
          <h3 className="text-2xl font-bold mt-2">The Timing Is <span className="text-gradient">Perfect</span></h3>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {marketStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 + i * 0.1 }} className="text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-3xl font-bold text-gradient mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
