import GxIcon from "@/components/ui/GxIcon";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Code2, BookOpen, Users, Trophy, Briefcase, FolderKanban,
  ArrowRight, Zap, Brain, Target, TrendingUp,
  Github, Twitter, Linkedin, Mail, Shield, Globe, Clock
} from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";
import grexilLogo from "@/assets/grexil-logo.png";

const features = [
  { icon: Code2, title: "LeetCode-Style Coding", desc: "500+ problems with real-time execution, AI hints, and complexity analysis" },
  { icon: BookOpen, title: "Curated Courses", desc: "Expert-led courses in web dev, AI/ML, cloud, and system design" },
  { icon: Users, title: "1:1 Mentorship", desc: "Book sessions with engineers from Google, Meta, and top startups" },
  { icon: Trophy, title: "Leaderboards & XP", desc: "Compete globally, earn XP, climb ranks, and unlock badges" },
  { icon: Briefcase, title: "AI Internship Matcher", desc: "ML-powered matching to top opportunities based on your skill profile" },
  { icon: FolderKanban, title: "Portfolio Builder", desc: "Showcase projects with a stunning, shareable portfolio page" },
];

const stats = [
  { value: "10K+", label: "HAPPY LEARNERS", icon: Users },
  { value: "200+", label: "FREE COURSES", icon: BookOpen },
  { value: "95%", label: "LOVE IT", icon: Trophy },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const Index = () => {
  return (
    <div className="min-h-screen" role="document">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] flex items-center bg-background overflow-hidden" aria-label="Hero">
        {/* BlezeX-style subtle grid background */}
        <div className="absolute inset-0 bg-grid-subtle" />
        
        {/* Warm radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[100px]" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-medium mb-8">
                <GxIcon className="w-4 h-4" />
                AI-Powered Learning Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                Master Skills.
                <br />
                <span className="text-gradient">Build Your Future.</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                The all-in-one platform where developers learn, practice, compete,
                and land their dream roles — powered by AI.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/auth">
                  <Button size="lg" className="text-base px-8 h-12 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow rounded-xl gap-2">
                    Start Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button variant="outline" size="lg" className="text-base px-8 h-12 rounded-xl border-border hover:border-primary/30 hover:bg-primary/5">
                    Explore Courses
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-success" />Free forever tier</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" />Setup in 30s</span>
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary/70" />120+ countries</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <img
                src={heroIllustration}
                alt="GreXil platform dashboard preview"
                className="w-full max-w-lg mx-auto animate-float drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-16 bg-background relative" aria-label="Platform statistics">
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="container relative">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="text-center">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-4xl md:text-5xl font-bold text-gradient mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 bg-background" aria-label="Platform features">
        <div className="container">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-xs text-primary uppercase tracking-widest font-medium">Platform</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
              Everything to <span className="text-gradient">Level Up</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From your first line of code to your dream job — one platform, zero friction.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                  className="rounded-2xl border border-border/60 bg-card p-6 group cursor-pointer hover:border-primary/25 hover:shadow-lg hover:shadow-primary/[0.04] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 bg-muted/30 border-y border-border/50 relative" aria-label="How it works">
        <div className="absolute inset-0 bg-grid-subtle" />
        <div className="container relative">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="text-xs text-primary uppercase tracking-widest font-medium">Process</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Three Steps to <span className="text-gradient">Success</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Brain, step: "01", title: "Learn", desc: "Take expert courses, watch tutorials, and absorb industry knowledge" },
              { icon: Target, step: "02", title: "Practice", desc: "Solve 500+ coding challenges, get AI feedback, build daily streaks" },
              { icon: TrendingUp, step: "03", title: "Grow", desc: "Land internships, build your portfolio, and launch your career" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.step} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.15 }} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary mx-auto mb-5 flex items-center justify-center shadow-glow">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <span className="text-xs text-primary font-mono font-bold tracking-wider">STEP {item.step}</span>
                  <h3 className="text-xl font-bold mt-2 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-muted/20 relative overflow-hidden border-t border-border/50" aria-label="Call to action">
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[80px]" />
        <div className="container relative z-10 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to <span className="text-gradient">Bridge the Gap?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join thousands of developers who chose GreXil to accelerate their careers.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-base px-10 h-12 bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow rounded-xl gap-2">
                Get Started — It's Free <Zap className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">No credit card required • Free forever tier</p>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 border-t border-border/50 bg-card/50" role="contentinfo">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src={grexilLogo} alt="GreXil" className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-bold text-lg">GreXil</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                AI-powered learning platform for the next generation of developers.
              </p>
              <div className="flex items-center gap-3" role="list" aria-label="Social links">
                {[
                  { Icon: Twitter, label: "Twitter" },
                  { Icon: Github, label: "GitHub" },
                  { Icon: Linkedin, label: "LinkedIn" },
                  { Icon: Mail, label: "Email" },
                ].map(({ Icon, label }) => (
                  <a key={label} href="#" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label={label} role="listitem">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: "Product", links: [
                { label: "Courses", href: "/courses" },
                { label: "Coding", href: "/coding" },
                { label: "Mentors", href: "/mentors" },
                { label: "Internships", href: "/internships" },
                { label: "Leaderboard", href: "/leaderboard" },
              ]},
              { title: "Resources", links: [
                { label: "Community", href: "/community" },
                { label: "AI Assistant", href: "/dashboard" },
                { label: "Portfolio Builder", href: "/portfolio" },
              ]},
            ].map((group) => (
              <div key={group.title}>
                <h4 className="font-semibold text-sm mb-4">{group.title}</h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 GreXil Technologies, Inc. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Built with ❤️ for developers worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
