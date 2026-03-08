import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Briefcase, Clock } from "lucide-react";
import { statusLabels, statusColors } from "@/pages/RecruiterDashboard";
import type { Internship, Application, Interview } from "@/pages/RecruiterDashboard";

interface Props {
  internships: Internship[];
  applications: Application[];
  interviews: Interview[];
}

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

  // Average time to hire (rough: days between first app and hired)
  const hiredApps = applications.filter(a => a.status === "hired");
  const avgDays = hiredApps.length > 0
    ? Math.round(hiredApps.reduce((sum, a) => {
        const days = (Date.now() - new Date(a.applied_at).getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / hiredApps.length)
    : null;

  // Top skills demanded
  const skillCount = new Map<string, number>();
  internships.forEach(i => i.skills_required.forEach(s => skillCount.set(s, (skillCount.get(s) || 0) + 1)));
  const topSkills = Array.from(skillCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const maxFunnel = Math.max(...funnelSteps.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Conversion Rate", value: applications.length > 0 ? `${Math.round((hiredApps.length / applications.length) * 100)}%` : "—", sub: "Applied → Hired", icon: TrendingUp },
          { label: "Avg. Pipeline Days", value: avgDays !== null ? `${avgDays}d` : "—", sub: "Application to hire", icon: Clock },
          { label: "Rejection Rate", value: applications.length > 0 ? `${Math.round((rejected / applications.length) * 100)}%` : "—", sub: `${rejected} rejected`, icon: Users },
          { label: "Interviews Scheduled", value: interviews.length.toString(), sub: `${interviews.filter(i => i.status === "completed").length} completed`, icon: Briefcase },
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

      {/* Hiring Funnel */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card/60 p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Hiring Funnel
        </h3>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const pct = maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 text-right text-muted-foreground">{step.label}</span>
                <div className="flex-1 h-7 rounded-lg bg-secondary/30 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className={`h-full rounded-lg ${
                      i === 0 ? "bg-blue-500/30" :
                      i === 1 ? "bg-yellow-500/30" :
                      i === 2 ? "bg-purple-500/30" :
                      i === 3 ? "bg-green-500/30" :
                      "bg-emerald-500/30"
                    }`}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold">{step.count}</span>
                </div>
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
