import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  BarChart3, TrendingUp, Flame, Code2, BookOpen, Target,
  Calendar, Zap, Award, Brain, Clock, CheckCircle2
} from "lucide-react";

const COLORS = [
  "hsl(187, 100%, 50%)", "hsl(262, 80%, 60%)", "hsl(152, 69%, 45%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(210, 70%, 55%)",
];

interface WeeklyData { day: string; xp: number; problems: number; }
interface MonthlyData { month: string; xp: number; courses: number; problems: number; }
interface SkillData { skill: string; level: number; }
interface HeatmapDay { date: string; count: number; dayOfWeek: number; week: number; }

export default function AnalyticsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [skillData, setSkillData] = useState<SkillData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [difficultyBreakdown, setDifficultyBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [stats, setStats] = useState({
    totalProblems: 0, totalCourses: 0, totalXp: 0, avgDaily: 0,
    currentStreak: 0, longestStreak: 0, totalHours: 0, badgeCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    // Parallel fetches
    const [
      { data: submissions },
      { data: enrollments },
      { count: badgeCount },
      { data: problems },
    ] = await Promise.all([
      supabase.from("coding_submissions").select("*").eq("user_id", user.id).order("submitted_at", { ascending: true }),
      supabase.from("course_enrollments").select("*, courses(title, category)").eq("user_id", user.id),
      supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("coding_problems").select("id, difficulty, category"),
    ]);

    const acceptedSubs = (submissions || []).filter((s) => s.status === "accepted");

    // Stats
    const totalXp = profile?.xp || 0;
    const totalProblems = acceptedSubs.length;
    const totalCourses = (enrollments || []).filter((e) => e.completed_at).length;
    const totalHours = Math.round(totalProblems * 0.4 + (enrollments || []).length * 3);

    // Average daily XP (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubs = acceptedSubs.filter((s) => new Date(s.submitted_at) >= thirtyDaysAgo);
    const avgDaily = recentSubs.length > 0 ? Math.round(recentSubs.reduce((a, s) => a + (s.xp_earned || 0), 0) / 30) : 0;

    setStats({
      totalProblems, totalCourses, totalXp, avgDaily,
      currentStreak: profile?.streak || 0, longestStreak: profile?.streak || 0,
      totalHours, badgeCount: badgeCount || 0,
    });

    // Weekly data (last 7 days)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekly: WeeklyData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const daySubs = acceptedSubs.filter((s) => s.submitted_at.startsWith(dayStr));
      weekly.push({
        day: dayNames[d.getDay()],
        xp: daySubs.reduce((a, s) => a + (s.xp_earned || 0), 0),
        problems: daySubs.length,
      });
    }
    setWeeklyData(weekly);

    // Monthly data (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthly: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthSubs = acceptedSubs.filter((s) => {
        const sd = new Date(s.submitted_at);
        return sd.getMonth() === m && sd.getFullYear() === y;
      });
      const monthEnrollments = (enrollments || []).filter((e) => {
        if (!e.completed_at) return false;
        const cd = new Date(e.completed_at);
        return cd.getMonth() === m && cd.getFullYear() === y;
      });
      monthly.push({
        month: monthNames[m],
        xp: monthSubs.reduce((a, s) => a + (s.xp_earned || 0), 0),
        courses: monthEnrollments.length,
        problems: monthSubs.length,
      });
    }
    setMonthlyData(monthly);

    // Skill radar from problem categories solved
    const categoryMap = new Map<string, number>();
    acceptedSubs.forEach((s) => {
      const problem = (problems || []).find((p) => p.id === s.problem_id);
      if (problem) {
        const cat = problem.category || "General";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      }
    });
    const skills: SkillData[] = Array.from(categoryMap.entries())
      .map(([skill, count]) => ({ skill, level: Math.min(count * 15, 100) }))
      .slice(0, 8);
    if (skills.length === 0) {
      ["Arrays", "Strings", "Trees", "Graphs", "DP", "Math"].forEach((s) =>
        skills.push({ skill: s, level: 0 })
      );
    }
    setSkillData(skills);

    // Difficulty breakdown
    const diffMap = new Map<string, number>();
    acceptedSubs.forEach((s) => {
      const problem = (problems || []).find((p) => p.id === s.problem_id);
      if (problem) {
        const diff = problem.difficulty || "Easy";
        diffMap.set(diff, (diffMap.get(diff) || 0) + 1);
      }
    });
    setDifficultyBreakdown(Array.from(diffMap.entries()).map(([name, value]) => ({ name, value })));

    // Category breakdown for pie chart
    setCategoryBreakdown(
      Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).slice(0, 6)
    );

    // Heatmap data (last 52 weeks)
    const heatmap: HeatmapDay[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = (submissions || []).filter((s) => s.submitted_at.startsWith(dateStr)).length;
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.floor(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay()) / 7);
      heatmap.push({ date: dateStr, count, dayOfWeek: d.getDay(), week: Math.floor(i / 7) });
    }
    setHeatmapData(heatmap);

    setLoading(false);
  };

  const chartTooltipStyle = {
    contentStyle: {
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: 8,
      color: "hsl(var(--foreground))",
      fontSize: 12,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const overviewCards = [
    { icon: Code2, label: "Problems Solved", value: stats.totalProblems, color: "text-primary" },
    { icon: BookOpen, label: "Courses Done", value: stats.totalCourses, color: "text-emerald-400" },
    { icon: Zap, label: "Total XP", value: stats.totalXp.toLocaleString(), color: "text-amber-400" },
    { icon: TrendingUp, label: "Daily Avg XP", value: stats.avgDaily, color: "text-blue-400" },
    { icon: Flame, label: "Current Streak", value: `${stats.currentStreak}d`, color: "text-orange-400" },
    { icon: Clock, label: "Hours Invested", value: `${stats.totalHours}h`, color: "text-purple-400" },
    { icon: Award, label: "Badges Earned", value: stats.badgeCount, color: "text-pink-400" },
    { icon: Target, label: "Accuracy", value: stats.totalProblems > 0 ? "—" : "—", color: "text-cyan-400" },
  ];

  // Heatmap rendering
  const heatmapWeeks = 53;
  const reversedHeatmap = [...heatmapData].reverse();

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Your learning journey at a glance</p>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {overviewCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <card.icon className={`w-7 h-7 ${card.color} flex-shrink-0`} />
                <div>
                  <p className="text-xl font-bold text-foreground">{card.value}</p>
                  <p className="text-[11px] text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Coding Activity Heatmap */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Coding Activity
            </CardTitle>
            <CardDescription>Submissions over the last year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-[3px] min-w-[700px]">
                {Array.from({ length: heatmapWeeks }, (_, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }, (_, dayIdx) => {
                      const idx = weekIdx * 7 + dayIdx;
                      const cell = reversedHeatmap[idx];
                      if (!cell) return <div key={dayIdx} className="w-[11px] h-[11px]" />;

                      const intensity =
                        cell.count === 0 ? "bg-secondary/40" :
                        cell.count <= 1 ? "bg-primary/25" :
                        cell.count <= 3 ? "bg-primary/50" :
                        cell.count <= 5 ? "bg-primary/75" :
                        "bg-primary";

                      return (
                        <div
                          key={dayIdx}
                          className={`w-[11px] h-[11px] rounded-[2px] ${intensity} transition-colors`}
                          title={`${cell.date}: ${cell.count} submission${cell.count !== 1 ? "s" : ""}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                <span>Less</span>
                {["bg-secondary/40", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"].map((c, i) => (
                  <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
                ))}
                <span>More</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        {/* Weekly Tab */}
        <TabsContent value="weekly" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">XP Earned This Week</CardTitle>
                <CardDescription>Daily experience points</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip {...chartTooltipStyle} />
                    <Bar dataKey="xp" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="XP" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Problems Solved This Week</CardTitle>
                <CardDescription>Daily problem count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip {...chartTooltipStyle} />
                    <Area type="monotone" dataKey="problems" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" name="Problems" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly Tab */}
        <TabsContent value="monthly" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">XP Growth</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip {...chartTooltipStyle} />
                    <Line type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} name="XP" />
                    <Line type="monotone" dataKey="problems" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--accent))" }} name="Problems" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Course Completions</CardTitle>
                <CardDescription>Monthly trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <ReTooltip {...chartTooltipStyle} />
                    <Bar dataKey="courses" fill="hsl(152, 69%, 45%)" radius={[4, 4, 0, 0]} name="Courses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Skill Radar
                </CardTitle>
                <CardDescription>Proficiency by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Radar name="Level" dataKey="level" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Difficulty Distribution</CardTitle>
                  <CardDescription>Problems solved by difficulty</CardDescription>
                </CardHeader>
                <CardContent>
                  {difficultyBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={difficultyBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {difficultyBreakdown.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip {...chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Solve problems to see stats</p>
                  ) : (
                    <div className="space-y-2">
                      {categoryBreakdown.map((cat, i) => {
                        const max = Math.max(...categoryBreakdown.map((c) => c.value));
                        const pct = max > 0 ? (cat.value / max) * 100 : 0;
                        return (
                          <div key={cat.name} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16 truncate">{cat.name}</span>
                            <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              />
                            </div>
                            <span className="text-xs font-mono text-foreground w-6 text-right">{cat.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
