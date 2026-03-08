import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, Code2, Briefcase, MessageSquare, Brain, Trophy, TrendingUp, Shield, UserCog, AlertTriangle, Settings, Mail, IndianRupee, Megaphone, GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminModeration from "@/components/admin/AdminModeration";
import AdminPayouts from "@/components/admin/AdminPayouts";
import AdminCourseManagement from "@/components/admin/AdminCourseManagement";
import AdminMentorManagement from "@/components/admin/AdminMentorManagement";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminAnnouncements from "@/components/admin/AdminAnnouncements";
import AdminRecruiterManagement from "@/components/admin/AdminRecruiterManagement";
import AdminSubscriptions from "@/components/admin/AdminSubscriptions";

interface AdminStats {
  overview: Record<string, number>;
  roleCounts: Record<string, number>;
  recentUsers: any[];
  topUsers: any[];
  allUsers: any[];
  recentPosts: any[];
  recentComments: any[];
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(340, 65%, 50%)",
  "hsl(45, 80%, 50%)",
  "hsl(280, 55%, 55%)",
  "hsl(20, 70%, 50%)",
];

export default function AdminPage() {
  const { user, session, roles } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = roles.includes("admin");
  const [tab, setTab] = useState<"overview" | "users" | "moderation" | "analytics" | "payouts" | "courses" | "mentors" | "announcements" | "recruiters" | "subscriptions">("overview");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!isAdmin) { setError("Admin access required"); setLoading(false); return; }
    fetchStats();
  }, [user, isAdmin]);

  const fetchStats = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("admin-stats", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (fnError) throw fnError;
      setStats(data);
    } catch (e: any) {
      setError(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (error || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-destructive/50" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">{error || "Admin privileges required."}</p>
      </div>
    );
  }

  if (!stats) return null;

  const ov = stats.overview;
  const overviewCards = [
    { label: "Users", value: ov.totalUsers, icon: Users, accent: "text-primary" },
    { label: "Courses", value: ov.totalCourses, icon: BookOpen, accent: "text-primary" },
    { label: "Problems", value: ov.totalProblems, icon: Code2, accent: "text-primary" },
    { label: "Submissions", value: ov.totalSubmissions, icon: TrendingUp, accent: "text-primary" },
    { label: "Enrollments", value: ov.totalEnrollments, icon: Trophy, accent: "text-primary" },
    { label: "Internships", value: ov.totalInternships, icon: Briefcase, accent: "text-primary" },
    { label: "Forum Posts", value: ov.totalForumPosts, icon: MessageSquare, accent: "text-primary" },
    { label: "Interviews", value: ov.totalInterviews, icon: Brain, accent: "text-primary" },
    { label: "Applications", value: ov.totalApplications || 0, icon: Mail, accent: "text-primary" },
    { label: "Messages", value: ov.totalMessages || 0, icon: MessageSquare, accent: "text-primary" },
  ];

  const barData = overviewCards.filter(c => c.value > 0).map(c => ({ name: c.label, value: c.value }));
  const roleData = Object.entries(stats.roleCounts || {}).map(([name, value]) => ({ name, value }));

  const tabs = [
    ["overview", "📊 Overview", Shield],
    ["users", "👥 Users", UserCog],
    ["courses", "📚 Courses", GraduationCap],
    ["mentors", "👨‍🏫 Mentors", Users],
    ["recruiters", "💼 Recruiters", Briefcase],
    ["subscriptions", "💳 Subscriptions", IndianRupee],
    ["moderation", "🛡️ Moderation", AlertTriangle],
    ["payouts", "💰 Payouts", IndianRupee],
    ["analytics", "📈 Analytics", TrendingUp],
    ["announcements", "📢 Announcements", Megaphone],
  ] as const;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Admin Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(0 72% 51% / 0.12), hsl(350 65% 45% / 0.08))" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-destructive/3 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-destructive/80">Admin Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Control Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform management, user oversight & content moderation</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {overviewCards.slice(0, 5).map(card => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-destructive/20 bg-card/60 p-4 hover:border-destructive/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
                <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-destructive" />
                </div>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-destructive text-destructive-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}>{label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Activity Bar Chart */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-5">
              <h3 className="text-sm font-semibold mb-4">Platform Activity</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Role Distribution Pie */}
            <div className="rounded-xl border border-border/50 bg-card/60 p-5">
              <h3 className="text-sm font-semibold mb-4">Role Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-5">
            <h3 className="text-sm font-semibold mb-3">Top Performers</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {stats.topUsers.slice(0, 5).map((u, i) => (
                <div key={u.id} className="rounded-lg bg-secondary/30 p-3 text-center">
                  <div className="text-lg font-bold">{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</div>
                  <p className="text-xs font-medium truncate mt-1">{u.display_name}</p>
                  <p className="text-[10px] text-primary font-semibold">{u.xp} XP</p>
                  <p className="text-[10px] text-muted-foreground">{u.streak}🔥</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === "users" && (
        <AdminUserManagement users={stats.allUsers} onRefresh={fetchStats} />
      )}

      {/* Moderation Tab */}
      {tab === "moderation" && (
        <AdminModeration posts={stats.recentPosts} comments={stats.recentComments} onRefresh={fetchStats} />
      )}

      {/* Courses Tab */}
      {tab === "courses" && <AdminCourseManagement />}

      {/* Mentors Tab */}
      {tab === "mentors" && <AdminMentorManagement />}

      {/* Recruiters Tab */}
      {tab === "recruiters" && <AdminRecruiterManagement />}

      {/* Payouts Tab */}
      {tab === "payouts" && <AdminPayouts />}

      {/* Announcements Tab */}
      {tab === "announcements" && <AdminAnnouncements />}

      {/* Analytics Tab */}
      {tab === "analytics" && <AdminAnalytics />}

      {/* Subscriptions Tab */}
      {tab === "subscriptions" && <AdminSubscriptions />}
    </div>
  );
}
