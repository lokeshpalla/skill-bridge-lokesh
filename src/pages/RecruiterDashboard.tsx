import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, Users, Plus, Eye, Trash2, ChevronRight,
  MapPin, Clock, CheckCircle, XCircle, MessageSquare,
  ArrowRight, Building2, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Internship {
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

interface Application {
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

const statusColors: Record<string, string> = {
  applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  interview: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  offered: "bg-green-500/10 text-green-400 border-green-500/20",
  hired: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  applied: "Applied",
  reviewing: "Reviewing",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
};

const statusFlow = ["applied", "reviewing", "interview", "offered", "hired"];

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [tab, setTab] = useState<"postings" | "pipeline">("postings");

  // New internship form
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
      .from("internships")
      .select("*")
      .eq("posted_by", user.id)
      .order("created_at", { ascending: false });

    if (myInternships) {
      setInternships(myInternships.map((i: any) => ({ ...i, skills_required: i.skills_required || [] })));

      // Fetch applications for all my internships
      const ids = myInternships.map((i: any) => i.id);
      if (ids.length > 0) {
        const { data: apps } = await supabase
          .from("internship_applications")
          .select("*")
          .in("internship_id", ids)
          .order("applied_at", { ascending: false });

        if (apps && apps.length > 0) {
          // Fetch profiles for applicants
          const userIds = [...new Set(apps.map((a: any) => a.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, email, avatar_url, skills, xp")
            .in("user_id", userIds);

          const enriched = apps.map((a: any) => ({
            ...a,
            profile: profiles?.find((p: any) => p.user_id === a.user_id),
          }));
          setApplications(enriched);
        }
      }
    }
    setLoading(false);
  };

  const postInternship = async () => {
    if (!user || !form.title || !form.company) return;
    const { error } = await supabase.from("internships").insert({
      title: form.title,
      company: form.company,
      location: form.location || "Remote",
      duration: form.duration || null,
      description: form.description || null,
      skills_required: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      logo_emoji: form.logo_emoji || "🏢",
      posted_by: user.id,
    });
    if (error) {
      toast.error("Failed to post internship");
      return;
    }
    toast.success("Internship posted!");
    setShowPostDialog(false);
    setForm({ title: "", company: "", location: "Remote", duration: "3 months", description: "", skills: "", logo_emoji: "🏢" });
    fetchData();
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from("internship_applications")
      .update({ status: newStatus })
      .eq("id", appId);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(`Status updated to ${statusLabels[newStatus]}`);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  };

  const deleteInternship = async (id: string) => {
    const { error } = await supabase.from("internships").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Internship removed");
    fetchData();
  };

  const filteredApps = selectedInternship
    ? applications.filter(a => a.internship_id === selectedInternship)
    : applications;

  const stats = {
    total: internships.length,
    applicants: applications.length,
    interviewing: applications.filter(a => a.status === "interview").length,
    hired: applications.filter(a => a.status === "hired").length,
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <p className="text-sm text-muted-foreground text-center py-12">Loading recruiter dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Recruiter Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage postings and review applicants</p>
        </div>
        <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Post Internship
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post New Internship</DialogTitle>
            </DialogHeader>
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
              <Button variant="hero" className="w-full" onClick={postInternship} disabled={!form.title || !form.company}>
                Post Internship
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Postings", value: stats.total, icon: Briefcase, accent: "text-primary" },
          { label: "Total Applicants", value: stats.applicants, icon: Users, accent: "text-accent" },
          { label: "In Interview", value: stats.interviewing, icon: MessageSquare, accent: "text-warning" },
          { label: "Hired", value: stats.hired, icon: CheckCircle, accent: "text-success" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.accent}`} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["postings", "📋 My Postings"], ["pipeline", "👥 Applicant Pipeline"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* My Postings */}
      {tab === "postings" && (
        <div className="space-y-3">
          {internships.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-1">No internships posted yet</h3>
              <p className="text-xs text-muted-foreground mb-4">Start by posting your first internship opportunity.</p>
              <Button variant="hero" size="sm" onClick={() => setShowPostDialog(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Post Internship
              </Button>
            </div>
          ) : (
            internships.map((intern, i) => {
              const appCount = applications.filter(a => a.internship_id === intern.id).length;
              return (
                <motion.div key={intern.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border/50 bg-card/60 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-xl flex-shrink-0">
                      {intern.logo_emoji || "🏢"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{intern.title}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                        <span>{intern.company}</span>
                        {intern.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{intern.location}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">{appCount} applicant{appCount !== 1 ? "s" : ""}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => { setSelectedInternship(intern.id); setTab("pipeline"); }}>
                      <Eye className="w-3 h-3" /> View
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteInternship(intern.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Applicant Pipeline */}
      {tab === "pipeline" && (
        <div className="space-y-4">
          {/* Filter by internship */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedInternship(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !selectedInternship ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
              }`}>
              All ({applications.length})
            </button>
            {internships.map(intern => {
              const count = applications.filter(a => a.internship_id === intern.id).length;
              return (
                <button key={intern.id} onClick={() => setSelectedInternship(intern.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedInternship === intern.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                  }`}>
                  {intern.title} ({count})
                </button>
              );
            })}
          </div>

          {/* Pipeline columns */}
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-1">No applications yet</h3>
              <p className="text-xs text-muted-foreground">Applications will appear here when students apply.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app, i) => {
                const intern = internships.find(it => it.id === app.internship_id);
                const nextStatus = statusFlow[statusFlow.indexOf(app.status) + 1];
                return (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="rounded-xl border border-border/50 bg-card/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {app.profile?.avatar_url ? (
                          <img src={app.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {app.profile?.display_name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold">{app.profile?.display_name || "Unknown"}</h4>
                          <p className="text-[11px] text-muted-foreground">{app.profile?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium text-primary">{app.profile?.xp || 0} XP</span>
                            {app.profile?.skills?.slice(0, 3).map(s => (
                              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${statusColors[app.status] || statusColors.applied}`}>
                          {statusLabels[app.status] || app.status}
                        </span>
                      </div>
                    </div>

                    {/* Applied for */}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Applied for <span className="font-medium text-foreground">{intern?.title}</span> at {intern?.company} • {new Date(app.applied_at).toLocaleDateString()}
                    </p>

                    {/* Cover letter */}
                    {app.cover_letter && (
                      <div className="mt-2 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                        <p className="text-[11px] text-muted-foreground font-medium mb-1">Cover Letter:</p>
                        <p className="text-xs text-foreground leading-relaxed">{app.cover_letter}</p>
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-2 mt-2">
                      {app.portfolio_url && (
                        <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">View Portfolio</a>
                      )}
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">View Resume</a>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                      {/* Pipeline steps */}
                      <div className="flex items-center gap-1 flex-1">
                        {statusFlow.map((s, idx) => (
                          <div key={s} className="flex items-center gap-1">
                            <button
                              onClick={() => updateStatus(app.id, s)}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                                app.status === s ? statusColors[s] + " border" : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                              }`}>
                              {statusLabels[s]}
                            </button>
                            {idx < statusFlow.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                        onClick={() => updateStatus(app.id, "rejected")}>
                        <XCircle className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
