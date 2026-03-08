import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Briefcase, Clock, Calendar, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { statusLabels, statusColors } from "@/pages/RecruiterDashboard";
import type { Internship, Application, Interview } from "@/pages/RecruiterDashboard";

interface Props {
  internships: Internship[];
  applications: Application[];
  interviews: Interview[];
}

const COLORS = ["hsl(var(--primary))", "hsl(210,70%,55%)", "hsl(280,55%,55%)", "hsl(150,60%,45%)", "hsl(340,65%,50%)", "hsl(45,80%,50%)"];
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" };

const RecruiterAnalytics = ({ internships, applications, interviews }: Props) => {
  // Funnel data
  const funnelSteps = [
    { key: "applied", label: "Applied", count: applications.length },
    { key: "reviewing", label: "Reviewing", count: applications.filter(a => ["reviewing", "interview", "offered", "hired"].includes(a.status)).length },
    { key: "interview", label: "Interview", count: applications.filter(a => ["interview", "offered", "hired"].includes(a.status)).length },
    { key: "offered", label: "Offered", count: applications.filter(a => ["offered", "hired"].includes(a.status)).length },
    { key: "hired", label: "Hired", count: applications.filter(a => a.status === "hired").length },
  ];

  const rejected = applications.filter(a => a.status === "rejected").length;
  const hiredApps = applications.filter(a => a.status === "hired");

  const avgDays = hiredApps.length > 0
    ? Math.round(hiredApps.reduce((sum, a) => {
        return sum + (Date.now() - new Date(a.applied_at).getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / hiredApps.length)
    : null;

  // Per-internship breakdown
  const perInternship = internships.map(intern => {
    const apps = applications.filter(a => a.internship_id === intern.id);
    return {
      title: intern.title,
      company: intern.company,
      total: apps.length,
      hired: apps.filter(a => a.status === "hired").length,
      interviewing: apps.filter(a => a.status === "interview").length,
      rejected: apps.filter(a => a.status === "rejected").length,
    };
  });

  // Applications over time (group by week)
  const appsByWeek: Record<string, number> = {};
  applications.forEach(a => {
    const d = new Date(a.applied_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split("T")[0];
    appsByWeek[key] = (appsByWeek[key] || 0) + 1;
  });
  const timelineData = Object.entries(appsByWeek).sort().slice(-12).map(([week, count]) => ({
    week: new Date(week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count,
  }));

  // Status distribution for pie chart
  const statusDist = Object.entries(
    applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: statusLabels[name] || name, value }));

  // Top skills demanded
  const skillCount = new Map<string, number>();
  internships.forEach(i => i.skills_required.forEach(s => skillCount.set(s, (skillCount.get(s) || 0) + 1)));
  const topSkills = Array.from(skillCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Avg candidate XP
  const avgXp = applications.length > 0
    ? Math.round(applications.reduce((s, a) => s + (a.profile?.xp || 0), 0) / applications.length)
    : 0;

  // Interview completion rate
  const completedInterviews = interviews.filter(i => i.status === "completed").length;
  const interviewCompletionRate = interviews.length > 0 ? Math.round((completedInterviews / interviews.length) * 100) : 0;

  const maxFunnel = Math.max(...funnelSteps.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Conversion Rate", value: applications.length > 0 ? `${Math.round((hiredApps.length / applications.length) * 100)}%` : "—", sub: "Applied → Hired", icon: TrendingUp },
          { label: "Avg. Pipeline Days", value: avgDays !== null ? `${avgDays}d` : "—", sub: "Application to hire", icon: Clock },
          { label: "Avg. Candidate XP", value: `${avgXp}`, sub: "Across all applicants", icon: Target },
          { label: "Interview Rate", value: `${interviewCompletionRate}%`, sub: `${completedInterviews}/${interviews.length} completed`, icon: Zap },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{m.label}</span>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Application Timeline */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/50 bg-card/60 p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Applications Over Time
          </h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-8">No data yet</p>}
        </motion.div>

        {/* Status Distribution Pie */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/50 bg-card/60 p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Application Status Distribution
          </h3>
          {statusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                  {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground text-center py-8">No data yet</p>}
        </motion.div>
      </div>

      {/* Hiring Funnel */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card/60 p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Hiring Funnel
        </h3>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const pct = maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0;
            const dropOff = i > 0 && funnelSteps[i - 1].count > 0
              ? Math.round(((funnelSteps[i - 1].count - step.count) / funnelSteps[i - 1].count) * 100)
              : null;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 text-right text-muted-foreground">{step.label}</span>
                <div className="flex-1 h-7 rounded-lg bg-secondary/30 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`h-full rounded-lg ${
                      i === 0 ? "bg-blue-500/30" : i === 1 ? "bg-yellow-500/30" : i === 2 ? "bg-purple-500/30" : i === 3 ? "bg-green-500/30" : "bg-emerald-500/30"
                    }`}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold">{step.count}</span>
                </div>
                {dropOff !== null && dropOff > 0 && (
                  <span className="text-[10px] text-destructive/70 w-12">-{dropOff}%</span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Per Internship Breakdown */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/50 bg-card/60 p-5">
          <h3 className="text-sm font-semibold mb-3">Per Posting Breakdown</h3>
          {perInternship.length === 0 ? (
            <p className="text-xs text-muted-foreground">No postings yet.</p>
          ) : (
            <div className="space-y-3">
              {perInternship.map(p => (
                <div key={p.title} className="flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground">{p.company}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-muted-foreground">{p.total} apps</span>
                    <span className="text-purple-400">{p.interviewing} intv</span>
                    <span className="text-emerald-400">{p.hired} hired</span>
                    <span className="text-red-400">{p.rejected} rej</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Skills */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/50 bg-card/60 p-5">
          <h3 className="text-sm font-semibold mb-3">Most Demanded Skills</h3>
          {topSkills.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add skills to your postings to see trends.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topSkills.map(([skill, count]) => (
                <span key={skill} className="px-2.5 py-1 rounded-lg bg-secondary/60 text-xs font-medium text-foreground">
                  {skill} <span className="text-muted-foreground ml-1">×{count}</span>
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RecruiterAnalytics;
