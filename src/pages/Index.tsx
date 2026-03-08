import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Code2, BookOpen, Users, Trophy, Briefcase, FolderKanban,
  Sparkles, ArrowRight, Zap, Brain, Target, TrendingUp
} from "lucide-react";

const features = [
  { icon: Code2, title: "LeetCode-Style Coding", desc: "500+ problems with real-time code execution and AI hints" },
  { icon: BookOpen, title: "Curated Courses", desc: "Expert-led courses in web dev, AI/ML, cloud, and more" },
  { icon: Users, title: "1:1 Mentorship", desc: "Book sessions with industry professionals" },
  { icon: Trophy, title: "Leaderboards & XP", desc: "Compete, earn XP, climb ranks, unlock badges" },
  { icon: Briefcase, title: "Internship Matcher", desc: "AI-powered matching to top opportunities" },
  { icon: FolderKanban, title: "Portfolio Builder", desc: "Showcase your projects with a stunning portfolio" },
];

const stats = [
  { value: "50K+", label: "Active Learners" },
  { value: "500+", label: "Coding Problems" },
  { value: "200+", label: "Courses" },
  { value: "98%", label: "Placement Rate" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-hero overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(187 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(187 100% 50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8">
                <Sparkles className="w-4 h-4" />
                AI-Powered Learning Platform
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Master Skills.{" "}
                <span className="text-gradient">Build Future.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                An all-in-one platform with coding challenges, courses, mentorship,
                AI assistance, and real internship opportunities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="hero" size="lg" className="text-base px-8">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button variant="glow" size="lg" className="text-base px-8">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-gradient">Level Up</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From coding challenges to career placement — one platform, infinite possibilities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-hover rounded-xl p-6 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It <span className="text-gradient">Works</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Brain, step: "01", title: "Learn", desc: "Take courses, solve problems, earn XP" },
              { icon: Target, step: "02", title: "Practice", desc: "Code daily, get AI feedback, build streaks" },
              { icon: TrendingUp, step: "03", title: "Grow", desc: "Land internships, build portfolio, get hired" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <span className="text-xs text-primary font-mono font-bold">STEP {item.step}</span>
                  <h3 className="text-xl font-bold mt-2 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        <div className="container relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-gradient">Bridge the Gap?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of learners accelerating their careers with AI-powered learning.
          </p>
          <Link to="/auth">
            <Button variant="hero" size="lg" className="text-base px-10">
              Start Learning Now <Zap className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border/50">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">SkillBridge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 SkillBridge Nexus. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
