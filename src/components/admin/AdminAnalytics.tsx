import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { TrendingUp, Users, BookOpen, Code2 } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(210,70%,55%)", "hsl(150,60%,45%)", "hsl(340,65%,50%)", "hsl(45,80%,50%)"];
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" };

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    const [
      { data: profiles },
      { data: enrollments },
      { data: submissions },
      { data: bookings },
      { data: posts },
      { data: payments },
    ] = await Promise.all([
      supabase.from("profiles").select("created_at, xp").order("created_at"),
      supabase.from("course_enrollments").select("enrolled_at").order("enrolled_at"),
      supabase.from("coding_submissions").select("submitted_at, status"),
      supabase.from("mentor_bookings").select("created_at, status"),
      supabase.from("forum_posts").select("created_at"),
      supabase.from("mentor_payments").select("amount, status, created_at"),
    ]);

    // Group by month
    const monthlyUsers = groupByMonth(profiles || [], "created_at");
    const monthlyEnrollments = groupByMonth(enrollments || [], "enrolled_at");
    const monthlySubmissions = groupByMonth(submissions || [], "submitted_at");
    const monthlyPosts = groupByMonth(posts || [], "created_at");

    // Submission status distribution
    const statusCounts: Record<string, number> = {};
    (submissions || []).forEach(s => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Booking status distribution
    const bookingCounts: Record<string, number> = {};
    (bookings || []).forEach(b => { bookingCounts[b.status] = (bookingCounts[b.status] || 0) + 1; });
    const bookingData = Object.entries(bookingCounts).map(([name, value]) => ({ name, value }));

    // Revenue over time
    const monthlyRevenue = groupByMonthSum(payments || [], "created_at", "amount");

    // XP distribution
    const xpRanges = [
      { name: "0-100", min: 0, max: 100 },
      { name: "100-500", min: 100, max: 500 },
      { name: "500-1K", min: 500, max: 1000 },
      { name: "1K-5K", min: 1000, max: 5000 },
      { name: "5K+", min: 5000, max: Infinity },
    ];
    const xpDist = xpRanges.map(r => ({
      name: r.name,
      value: (profiles || []).filter(p => p.xp >= r.min && p.xp < r.max).length,
    }));

    setData({ monthlyUsers, monthlyEnrollments, monthlySubmissions, monthlyPosts, statusData, bookingData, monthlyRevenue, xpDist });
    setLoading(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading analytics...</p>;
  if (!data) return null;

  const charts = [
    { title: "User Growth", icon: Users, chart: (
      <AreaChart data={data.monthlyUsers}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="count" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" /></AreaChart>
    )},
    { title: "Course Enrollments", icon: BookOpen, chart: (
      <BarChart data={data.monthlyEnrollments}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
    )},
    { title: "Code Submissions", icon: Code2, chart: (
      <LineChart data={data.monthlySubmissions}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
    )},
    { title: "Revenue Trend (₹)", icon: TrendingUp, chart: (
      <AreaChart data={data.monthlyRevenue}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="total" fill="hsl(150,60%,45%,0.2)" stroke="hsl(150,60%,45%)" /></AreaChart>
    )},
  ];

  const pieCharts = [
    { title: "Submission Status", data: data.statusData },
    { title: "Booking Status", data: data.bookingData },
    { title: "XP Distribution", data: data.xpDist },
  ];

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {charts.map(c => {
          const Icon = c.icon;
          return (
            <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">{c.title}</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>{c.chart}</ResponsiveContainer>
            </motion.div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {pieCharts.map(c => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/50 bg-card/60 p-5">
            <h3 className="text-sm font-semibold mb-3">{c.title}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={c.data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                  {c.data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function groupByMonth(items: any[], dateField: string) {
  const map: Record<string, number> = {};
  items.forEach(item => {
    const d = new Date(item[dateField]);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).sort().slice(-12).map(([month, count]) => ({ month, count }));
}

function groupByMonthSum(items: any[], dateField: string, valueField: string) {
  const map: Record<string, number> = {};
  items.forEach(item => {
    const d = new Date(item[dateField]);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key] = (map[key] || 0) + Number(item[valueField] || 0);
  });
  return Object.entries(map).sort().slice(-12).map(([month, total]) => ({ month, total }));
}
