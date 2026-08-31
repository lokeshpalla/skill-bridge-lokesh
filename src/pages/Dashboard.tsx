import GxIcon from "@/components/ui/GxIcon";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame, BookOpen, Code2, Trophy, Target,
  Calendar, Award, Zap, ArrowUpRight, Clock, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { DashboardSkeleton } from "@/components/ui/loading-skeletons";
import UpcomingSessions from "@/components/dashboard/UpcomingSessions";
import StudentRecommendations from "@/components/dashboard/StudentRecommendations";
import BadgesEarned from "@/components/dashboard/BadgesEarned";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CourseWithEnrollment {
  title: string;
  progress: number;
  emoji: string;
  totalModules: number;
  completedModules: number;
}

interface RecentItem {
  icon: typeof Code2;
  text: string;
  xp: string;
  time: string;
  color: string;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [solvedCount, setSolvedCount] = useState(0);
  const [rank, setRank] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithEnrollment[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentItem[]>([]);
  const [weeklyXp, setWeeklyXp] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [hasCompletedActivity, setHasCompletedActivity] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [restoringStreak, setRestoringStreak] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if user needs onboarding (no skills set yet)
  useEffect(() => {
    if (profile && (!profile.skills || profile.skills.length === 0) && !profile.bio) {
      setShowOnboarding(true);
    }
  }, [profile]);

  const storedXp = profile?.xp ?? 0;
  const xp = hasCompletedActivity ? storedXp : 0;

  // Streak is only alive if the user was active today or yesterday — missing a day breaks it.
  const isStreakAlive = (() => {
    if (!profile?.last_active_date) return false;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    return profile.last_active_date === todayStr || profile.last_active_date === yesterdayStr;
  })();
  const streak = hasCompletedActivity && isStreakAlive ? (profile?.streak ?? 0) : 0;
  const displayName = profile?.display_name || "there";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {

      // Only completed learning activity should contribute to dashboard stats.
      // Keep the activity check tied to persisted completion records, not profile defaults.
      const [
        { count: dbSolved },
        { count: persistedSolves },
        { data: activityEnrollments },
        { count: completedChallenges },
      ] = await Promise.all([
        supabase
          .from("coding_submissions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "accepted"),
        supabase
          .from("problem_solves")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("course_enrollments")
          .select("progress, completed_modules, course_id")
          .eq("user_id", user.id)
          .limit(3),
        supabase
          .from("challenge_participation")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true),
      ]);
      const localSolved: number[] = JSON.parse(localStorage.getItem(`solved_problems_${user.id}`) || "[]");
      setSolvedCount((dbSolved ?? 0) + localSolved.length);

      const completedModules = (activityEnrollments ?? []).reduce((total, enrollment) => {
        return total + (Array.isArray(enrollment.completed_modules) ? enrollment.completed_modules.length : 0);
      }, 0);
      const hasActivity =
        (dbSolved ?? 0) > 0 ||
        (persistedSolves ?? 0) > 0 ||
        localSolved.length > 0 ||
        completedModules > 0 ||
        (completedChallenges ?? 0) > 0;
      setHasCompletedActivity(hasActivity);

      // Users without completed activity do not have a leaderboard rank.
      if (hasActivity) {
        const { count: above } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gt("xp", storedXp);
        setRank((above ?? 0) + 1);
      } else {
        setRank(0);
      }

      // Fetch enrolled courses with course details
      const enrollments = activityEnrollments;

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map((e) => e.course_id);
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title, image_emoji, modules")
          .in("id", courseIds);

        const mapped: CourseWithEnrollment[] = enrollments.map((e) => {
          const course = courses?.find((c) => c.id === e.course_id);
          const totalModules = Array.isArray(course?.modules) ? course.modules.length : 0;
          const completedModules = Array.isArray(e.completed_modules) ? (e.completed_modules as string[]).length : 0;
          return {
            title: course?.title ?? "Unknown Course",
            progress: e.progress,
            emoji: course?.image_emoji ?? "📚",
            totalModules,
            completedModules,
          };
        });
        setEnrolledCourses(mapped);
      } else {
        setEnrolledCourses([]);
      }

      // Fetch recent submissions for activity
      const { data: recentSubs } = await supabase
        .from("coding_submissions")
        .select("status, xp_earned, submitted_at, problem_id")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(4);

      if (recentSubs && recentSubs.length > 0) {
        const problemIds = recentSubs.map((s) => s.problem_id);
        // Read the solution-free public view (base table is admin-only)
        const { data: problems } = await (supabase as any)
          .from("coding_problems_public")
          .select("id, title, difficulty")
          .in("id", problemIds);

        const items: RecentItem[] = recentSubs.map((s) => {
          const problem = problems?.find((p) => p.id === s.problem_id);
          const ago = getTimeAgo(s.submitted_at);
          return {
            icon: Code2,
            text: `${s.status === "accepted" ? "Solved" : "Attempted"} '${problem?.title ?? "Problem"}' — ${problem?.difficulty ?? ""}`,
            xp: s.xp_earned ? `+${s.xp_earned} XP` : "",
            time: ago,
            color: s.status === "accepted" ? "text-success" : "text-muted-foreground",
          };
        });
        setRecentActivity(items);
      } else {
        setRecentActivity([]);
      }

      // Weekly XP from submissions (last 7 days)
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const { data: weekSubs } = await supabase
        .from("coding_submissions")
        .select("xp_earned, submitted_at")
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .gte("submitted_at", weekStart.toISOString());

      const xpByDay = [0, 0, 0, 0, 0, 0, 0];
      weekSubs?.forEach((s) => {
        const day = new Date(s.submitted_at).getDay();
        const idx = day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
        xpByDay[idx] += s.xp_earned ?? 0;
      });
        if (!cancelled) setWeeklyXp(xpByDay);
      } catch (error) {
        console.error("Dashboard data failed to load", error);
        toast.error("Dashboard data took too long to load", { description: "Showing your dashboard with available data." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [user, storedXp]);

  const maxXp = Math.max(...weeklyXp, 1);
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleRestoreStreak = async () => {
    if (!user || restoringStreak) return;
    if (xp < 1000) {
      toast.error("Not enough XP", { description: "You need at least 1,000 XP to restore your streak." });
      return;
    }
    setRestoringStreak(true);
    const { data, error } = await supabase.rpc("restore_streak", { _user_id: user.id });
    setRestoringStreak(false);
    if (error) {
      toast.error("Failed to restore streak");
      return;
    }
    const result = data as { success: boolean; error?: string };
    if (result.success) {
      toast.success("Streak Restored! 🔥", { description: "1,000 XP deducted. Your streak is back to 1!" });
      window.location.reload();
    } else {
      toast.error(result.error || "Could not restore streak");
    }
  };

  const stats = [
    { icon: Zap, label: "Total XP", value: xp.toLocaleString(), change: xp > 0 ? `${xp}` : "—", up: xp > 0, accent: "text-primary" },
    { icon: Flame, label: "Day Streak", value: String(streak), change: streak > 0 ? `${streak}d` : "—", up: streak > 0, accent: "text-warning" },
    { icon: Code2, label: "Solved", value: String(solvedCount), change: solvedCount > 0 ? `${solvedCount}` : "—", up: solvedCount > 0, accent: "text-success" },
    { icon: Award, label: "Rank", value: rank > 0 ? `#${rank}` : "0", change: rank > 0 ? `#${rank}` : "—", up: rank > 0, accent: "text-accent" },
  ];

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Student Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(22 90% 52% / 0.08), hsl(32 95% 55% / 0.05))" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <GxIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">Student Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{greeting()}, {displayName} 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {streak > 0 ? "Keep up the streak! You're on fire." : "Start solving problems to build your streak!"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-card/60 backdrop-blur-sm px-4 py-2">
              <Clock className="w-4 h-4 text-primary" />
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <Link to="/coding">
              <Button variant="hero" size="sm" className="gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Daily Challenge
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
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
                <div className="w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center">
                  <Icon className={`w-3.5 h-3.5 ${stat.accent}`} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              {stat.up && (
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-success" />
                  <span className="text-[11px] text-success font-medium">{stat.change}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Restore Streak Banner */}
      {streak === 0 && xp >= 1000 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-warning/30 bg-warning/5 backdrop-blur-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold">Your streak was broken! 😢</p>
              <p className="text-xs text-muted-foreground">Spend <strong>1,000 XP</strong> to restore your streak back to 1 day.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning flex-shrink-0"
            onClick={handleRestoreStreak}
            disabled={restoringStreak}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${restoringStreak ? "animate-spin" : ""}`} />
            {restoringStreak ? "Restoring..." : "Restore Streak (1000 XP)"}
          </Button>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        {/* XP Chart */}
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
            {weeklyXp.map((val, i) => {
              const height = maxXp > 0 ? (val / maxXp) * 100 : 0;
              const isToday = i === todayIdx;
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
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No courses enrolled yet</p>
                <Link to="/courses">
                  <Button variant="outline" size="sm" className="mt-2 text-xs">Browse Courses</Button>
                </Link>
              </div>
            ) : (
              enrolledCourses.map((course) => (
                <div key={course.title} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                  <span className="text-xl">{course.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${course.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{course.completedModules}/{course.totalModules}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
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
        {recentActivity.length === 0 ? (
          <div className="text-center py-6">
            <GxIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No activity yet. Start solving problems!</p>
          </div>
        ) : (
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
        )}
      </motion.div>

      {/* Upcoming Sessions & Recommendations */}
      {user && (
        <div className="grid lg:grid-cols-2 gap-4">
          <UpcomingSessions userId={user.id} />
          <StudentRecommendations userId={user.id} skills={profile?.skills || []} />
        </div>
      )}

      {/* Badges */}
      {user && <BadgesEarned userId={user.id} />}

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

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const d = Math.floor(hrs / 24);
  return `${d}d ago`;
}

export default Dashboard;
