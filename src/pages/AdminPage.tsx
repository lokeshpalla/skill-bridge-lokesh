import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, Code2, Briefcase, MessageSquare, Brain, Trophy, TrendingUp, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AdminStats {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalProblems: number;
    totalSubmissions: number;
    totalEnrollments: number;
    totalInternships: number;
    totalForumPosts: number;
    totalInterviews: number;
  };
  recentUsers: Array<{
    id: string;
    user_id: string;
    display_name: string;
    email: string | null;
    xp: number;
    streak: number;
    created_at: string;
  }>;
  topUsers: Array<{
    id: string;
    user_id: string;
    display_name: string;
    xp: number;
    streak: number;
  }>;
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
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      
      if (!data || data.length === 0) {
        setError("Admin access required");
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      fetchStats();
    };

    checkAdmin();
  }, [user]);

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-destructive/50" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">{error || "You need admin privileges to access this page."}</p>
      </div>
    );
  }

  if (!stats) return null;

  const overviewCards = [
    { label: "Users", value: stats.overview.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Courses", value: stats.overview.totalCourses, icon: BookOpen, color: "text-emerald-500" },
    { label: "Problems", value: stats.overview.totalProblems, icon: Code2, color: "text-orange-500" },
    { label: "Submissions", value: stats.overview.totalSubmissions, icon: TrendingUp, color: "text-purple-500" },
    { label: "Enrollments", value: stats.overview.totalEnrollments, icon: Trophy, color: "text-amber-500" },
    { label: "Internships", value: stats.overview.totalInternships, icon: Briefcase, color: "text-pink-500" },
    { label: "Forum Posts", value: stats.overview.totalForumPosts, icon: MessageSquare, color: "text-cyan-500" },
    { label: "Interviews", value: stats.overview.totalInterviews, icon: Brain, color: "text-red-500" },
  ];

  const barData = overviewCards.map((c) => ({ name: c.label, value: c.value }));
  const pieData = overviewCards.filter((c) => c.value > 0).map((c) => ({ name: c.label, value: c.value }));

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform analytics & user management</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <Card key={card.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <card.icon className={`w-8 h-8 ${card.color} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="leaderboard">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Platform Activity</CardTitle>
                <CardDescription>Content & engagement breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Distribution</CardTitle>
                <CardDescription>Content type distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Recent Users</CardTitle>
              <CardDescription>Latest registered users on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Streak</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.display_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.xp} XP</Badge>
                      </TableCell>
                      <TableCell>{u.streak}🔥</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {stats.recentUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Top Performers</CardTitle>
              <CardDescription>Users with highest XP on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Streak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topUsers.map((u, i) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{u.display_name}</TableCell>
                      <TableCell>
                        <Badge variant={i < 3 ? "default" : "secondary"}>{u.xp} XP</Badge>
                      </TableCell>
                      <TableCell>{u.streak}🔥</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
