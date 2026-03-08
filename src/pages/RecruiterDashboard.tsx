import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, Users, Plus, Eye, Trash2, ChevronRight,
  MapPin, CheckCircle, XCircle, MessageSquare,
  Building2, Calendar, BarChart3, Clock, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RecruiterPostings from "@/components/recruiter/RecruiterPostings";
import RecruiterPipeline from "@/components/recruiter/RecruiterPipeline";
import RecruiterInterviews from "@/components/recruiter/RecruiterInterviews";
import RecruiterAnalytics from "@/components/recruiter/RecruiterAnalytics";

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string | null;
  duration: string | null;
  description: string | null;
  skills_required: string[];
  logo_emoji: string | null;
  created_at: string;
  apply_url: string | null;
}

export interface Application {
  id: string;
  internship_id: string;
  user_id: string;
  status: string;
  cover_letter: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  applied_at: string;
  profile?: {
    display_name: string;
    email: string | null;
    avatar_url: string | null;
    skills: string[];
    xp: number;
  };
}

export interface Interview {
  id: string;
  internship_id: string;
  application_id: string;
  recruiter_id: string;
  candidate_id: string;
  scheduled_at: string;
  duration_min: number;
  meeting_link: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  candidate_name?: string;
  internship_title?: string;
}

export const statusColors: Record<string, string> = {
  applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  interview: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  offered: "bg-green-500/10 text-green-400 border-green-500/20",
  hired: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const statusLabels: Record<string, string> = {
  applied: "Applied",
  reviewing: "Reviewing",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
};

export const statusFlow = ["applied", "reviewing", "interview", "offered", "hired"];

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [tab, setTab] = useState<"postings" | "pipeline" | "interviews" | "analytics">("postings");

  const [form, setForm] = useState({
    title: "", company: "", location: "Remote", duration: "3 months",
    description: "", skills: "", logo_emoji: "🏢",
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: myInternships } = await supabase
      .from("internships").select("*")
      .eq("posted_by", user.id)
      .order("created_at", { ascending: false });

    if (myInternships) {
      setInternships(myInternships.map((i: any) => ({ ...i, skills_required: i.skills_required || [] })));

      const ids = myInternships.map((i: any) => i.id);
      if (ids.length > 0) {
        const { data: apps } = await supabase
          .from("internship_applications").select("*")
          .in("internship_id", ids)
          .order("applied_at", { ascending: false });

        if (apps && apps.length > 0) {
          const userIds = [...new Set(apps.map((a: any) => a.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, email, avatar_url, skills, xp")
            .in("user_id", userIds);

          setApplications(apps.map((a: any) => ({
            ...a,
            profile: profiles?.find((p: any) => p.user_id === a.user_id),
          })));
        } else {
          setApplications([]);
        }

        // Fetch interviews
        const { data: intv } = await supabase
          .from("interview_schedules").select("*")
          .eq("recruiter_id", user.id)
          .order("scheduled_at", { ascending: true });

        if (intv) {
          const candidateIds = [...new Set(intv.map((i: any) => i.candidate_id))];
          const { data: cProfiles } = candidateIds.length > 0
            ? await supabase.from("profiles").select("user_id, display_name").in("user_id", candidateIds)
            : { data: [] };

          setInterviews(intv.map((i: any) => ({
            ...i,
            candidate_name: cProfiles?.find((p: any) => p.user_id === i.candidate_id)?.display_name || "Unknown",
            internship_title: myInternships.find((it: any) => it.id === i.internship_id)?.title || "Unknown",
          })));
        }
      }
    }
    setLoading(false);
  };

  const postInternship = async () => {
    if (!user || !form.title || !form.company) return;
    const { error } = await supabase.from("internships").insert({
      title: form.title, company: form.company, location: form.location || "Remote",
      duration: form.duration || null, description: form.description || null,
      skills_required: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      logo_emoji: form.logo_emoji || "🏢", posted_by: user.id,
    });
    if (error) { toast.error("Failed to post internship"); return; }
    toast.success("Internship posted!");
    setShowPostDialog(false);
    setForm({ title: "", company: "", location: "Remote", duration: "3 months", description: "", skills: "", logo_emoji: "🏢" });
    fetchData();
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase.from("internship_applications").update({ status: newStatus }).eq("id", appId);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Status updated to ${statusLabels[newStatus]}`);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  };

  const deleteInternship = async (id: string) => {
    const { error } = await supabase.from("internships").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Internship removed");
    fetchData();
  };

  const stats = {
    total: internships.length,
    applicants: applications.length,
    interviewing: applications.filter(a => a.status === "interview").length,
    hired: applications.filter(a => a.status === "hired").length,
  };

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-7xl mx-auto"><p className="text-sm text-muted-foreground text-center py-12">Loading recruiter dashboard...</p></div>;
  }

  const tabs = [
    ["postings", "📋 Postings"],
    ["pipeline", "👥 Pipeline"],
    ["interviews", "📅 Interviews"],
    ["analytics", "📊 Analytics"],
  ] as const;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Recruiter Header Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(152 69% 45% / 0.12), hsl(170 60% 40% / 0.08))" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-success/3 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-success/80">Recruiter Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Talent Acquisition Hub</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage postings, pipeline, interviews & analytics</p>
          </div>
          <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-success text-success-foreground hover:bg-success/90"><Plus className="w-3.5 h-3.5" /> Post Internship</Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Post New Internship</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Job Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Input placeholder="Company Name *" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                <Input placeholder="Duration" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <Textarea placeholder="Job Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
              <Input placeholder="Skills (comma separated)" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
              <Input placeholder="Logo Emoji (e.g. 🏢)" value={form.logo_emoji} onChange={e => setForm(f => ({ ...f, logo_emoji: e.target.value }))} className="w-20" />
              <Button variant="hero" className="w-full" onClick={postInternship} disabled={!form.title || !form.company}>Post Internship</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Postings", value: stats.total, icon: Briefcase, accent: "text-success" },
          { label: "Total Applicants", value: stats.applicants, icon: Users, accent: "text-success" },
          { label: "In Interview", value: stats.interviewing, icon: MessageSquare, accent: "text-warning" },
          { label: "Hired", value: stats.hired, icon: CheckCircle, accent: "text-success" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-success/20 bg-card/60 p-4 hover:border-success/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                  <Icon className={`w-3.5 h-3.5 ${s.accent}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-success text-success-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}>{label}</button>
        ))}
      </div>

      {tab === "postings" && (
        <RecruiterPostings
          internships={internships}
          applications={applications}
          onViewApplicants={(id) => { setSelectedInternship(id); setTab("pipeline"); }}
          onDelete={deleteInternship}
          onPost={() => setShowPostDialog(true)}
        />
      )}
      {tab === "pipeline" && (
        <RecruiterPipeline
          internships={internships}
          applications={applications}
          selectedInternship={selectedInternship}
          onSelectInternship={setSelectedInternship}
          onUpdateStatus={updateStatus}
          onScheduleInterview={(app) => setTab("interviews")}
        />
      )}
      {tab === "interviews" && (
        <RecruiterInterviews
          interviews={interviews}
          applications={applications}
          internships={internships}
          onRefresh={fetchData}
        />
      )}
      {tab === "analytics" && (
        <RecruiterAnalytics
          internships={internships}
          applications={applications}
          interviews={interviews}
        />
      )}
    </div>
  );
};

export default RecruiterDashboard;
