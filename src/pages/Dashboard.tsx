import { motion } from "framer-motion";
import { 
  Flame, TrendingUp, BookOpen, Code2, Trophy, Target,
  Calendar, Clock, Award, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const xpData = [40, 65, 30, 80, 55, 90, 70];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const recentActivity = [
  { icon: Code2, text: "Solved 'Two Sum' — Easy", xp: "+50 XP", time: "2h ago", color: "text-success" },
  { icon: BookOpen, text: "Completed React Hooks Module", xp: "+120 XP", time: "5h ago", color: "text-primary" },
  { icon: Trophy, text: "Earned 'Problem Solver' Badge", xp: "+200 XP", time: "1d ago", color: "text-warning" },
  { icon: Target, text: "Applied to Google Internship", xp: "", time: "2d ago", color: "text-accent" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Good evening, Alex 👋</h1>
          <p className="text-muted-foreground mt-1">Keep up the streak! You're on fire.</p>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Zap, label: "Total XP", value: "4,820", change: "+320 this week" },
            { icon: Flame, label: "Day Streak", value: "12", change: "Personal best!" },
            { icon: Code2, label: "Problems Solved", value: "87", change: "+5 this week" },
            { icon: Award, label: "Rank", value: "#23", change: "Top 5%" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-hover rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-success mt-1">{stat.change}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* XP Chart */}
          <div className="lg:col-span-2 glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Weekly XP Progress</h2>
            <div className="flex items-end gap-3 h-40">
              {xpData.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="w-full bg-gradient-primary rounded-t-md min-h-[4px]"
                  />
                  <span className="text-xs text-muted-foreground">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.text}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                        {item.xp && <span className="text-xs text-success font-medium">{item.xp}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: "Daily Challenge", icon: Target, path: "/coding", color: "bg-primary/10 text-primary" },
            { label: "Continue Course", icon: BookOpen, path: "/courses", color: "bg-accent/10 text-accent" },
            { label: "Find Mentor", icon: Calendar, path: "/mentors", color: "bg-success/10 text-success" },
            { label: "Leaderboard", icon: Trophy, path: "/leaderboard", color: "bg-warning/10 text-warning" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link to={action.path} key={action.label}>
                <div className="glass-hover rounded-xl p-4 text-center group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl ${action.color} mx-auto mb-2 flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
