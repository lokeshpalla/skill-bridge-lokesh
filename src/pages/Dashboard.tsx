import { motion } from "framer-motion";
import {
  Flame, TrendingUp, BookOpen, Code2, Trophy, Target,
  Calendar, Clock, Award, Zap, ArrowUpRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const xpData = [40, 65, 30, 80, 55, 90, 70];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const maxXp = Math.max(...xpData);

const recentActivity = [
  { icon: Code2, text: "Solved 'Two Sum' — Easy", xp: "+50 XP", time: "2h ago", color: "text-success" },
  { icon: BookOpen, text: "Completed React Hooks Module", xp: "+120 XP", time: "5h ago", color: "text-primary" },
  { icon: Trophy, text: "Earned 'Problem Solver' Badge", xp: "+200 XP", time: "1d ago", color: "text-warning" },
  { icon: Target, text: "Applied to Google Internship", xp: "", time: "2d ago", color: "text-accent" },
];

const activeCourses = [
  { title: "React & TypeScript", progress: 65, emoji: "🚀", modules: "16/24" },
  { title: "System Design", progress: 30, emoji: "🏗️", modules: "6/20" },
  { title: "Full-Stack Node.js", progress: 10, emoji: "🌐", modules: "1/28" },
];

const Dashboard = () => {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good evening, Alex 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Keep up the streak! You're on fire.</p>
        </div>
        <Link to="/coding">
          <Button variant="hero" size="sm" className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Daily Challenge
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Zap, label: "Total XP", value: "0", change: "—", up: false, accent: "text-primary" },
          { icon: Flame, label: "Day Streak", value: "0", change: "—", up: false, accent: "text-warning" },
          { icon: Code2, label: "Solved", value: "0", change: "—", up: false, accent: "text-success" },
          { icon: Award, label: "Rank", value: "#0", change: "—", up: false, accent: "text-accent" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                <div className={`w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${stat.accent}`} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-success" />
                <span className="text-[11px] text-success font-medium">{stat.change}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* XP Chart - wider */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold">Weekly XP</h2>
            <span className="text-xs text-muted-foreground">This week</span>
          </div>
          <div className="flex items-end gap-2 h-36">
            {xpData.map((val, i) => {
              const height = (val / maxXp) * 100;
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">{val}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                    className={`w-full rounded-md min-h-[4px] ${
                      isToday ? "bg-gradient-primary shadow-glow" : "bg-primary/20"
                    }`}
                  />
                  <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {days[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Active Courses */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Active Courses</h2>
            <Link to="/courses" className="text-[11px] text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {activeCourses.map((course) => (
              <div key={course.title} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                <span className="text-xl">{course.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{course.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${course.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{course.modules}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5"
      >
        <h2 className="text-sm font-semibold mb-4">Recent Activity</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {recentActivity.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.text}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    {item.xp && <span className="text-[10px] text-success font-semibold">{item.xp}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Daily Challenge", icon: Target, path: "/coding", accent: "group-hover:text-primary group-hover:bg-primary/10" },
          { label: "Continue Course", icon: BookOpen, path: "/courses", accent: "group-hover:text-accent group-hover:bg-accent/10" },
          { label: "Find Mentor", icon: Calendar, path: "/mentors", accent: "group-hover:text-success group-hover:bg-success/10" },
          { label: "Leaderboard", icon: Trophy, path: "/leaderboard", accent: "group-hover:text-warning group-hover:bg-warning/10" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link to={action.path} key={action.label}>
              <div className="rounded-xl border border-border/50 bg-card/60 p-4 text-center group cursor-pointer hover:border-primary/20 transition-all">
                <div className={`w-9 h-9 rounded-lg bg-secondary/80 mx-auto mb-2 flex items-center justify-center transition-colors ${action.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
