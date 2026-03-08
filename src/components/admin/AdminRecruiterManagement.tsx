import { useState, useEffect } from "react";
import { Briefcase, Users, FileText, Eye, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Recruiter {
  user_id: string;
  display_name: string;
  email: string | null;
  created_at: string;
  postings_count: number;
}

interface Posting {
  id: string;
  title: string;
  company: string;
  location: string | null;
  duration: string | null;
  created_at: string;
  posted_by: string | null;
  applications_count?: number;
}

interface Application {
  id: string;
  user_id: string;
  status: string;
  applied_at: string;
  cover_letter: string | null;
  applicant_name?: string;
}

export default function AdminRecruiterManagement() {
  const { session } = useAuth();
  const [tab, setTab] = useState<"recruiters" | "postings">("recruiters");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewApps, setViewApps] = useState<{ posting: Posting; apps: Application[] } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);

    // Get all recruiter user_ids
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "recruiter");

    const recruiterIds = (roleData || []).map(r => r.user_id);

    // Get profiles for recruiters
    const { data: profiles } = recruiterIds.length > 0
      ? await supabase.from("profiles").select("user_id, display_name, email, created_at").in("user_id", recruiterIds)
      : { data: [] };

    // Get all internships
    const { data: internships } = await supabase
      .from("internships")
      .select("id, title, company, location, duration, created_at, posted_by")
      .order("created_at", { ascending: false });

    // Get application counts per internship
    const internshipIds = (internships || []).map(i => i.id);
    const { data: appCounts } = internshipIds.length > 0
      ? await supabase.from("internship_applications").select("internship_id").in("internship_id", internshipIds)
      : { data: [] };

    const countMap: Record<string, number> = {};
    (appCounts || []).forEach(a => { countMap[a.internship_id] = (countMap[a.internship_id] || 0) + 1; });

    // Count postings per recruiter
    const postingCountMap: Record<string, number> = {};
    (internships || []).forEach(i => {
      if (i.posted_by) postingCountMap[i.posted_by] = (postingCountMap[i.posted_by] || 0) + 1;
    });

    setRecruiters((profiles || []).map(p => ({
      ...p,
      postings_count: postingCountMap[p.user_id] || 0,
    })));

    setPostings((internships || []).map(i => ({
      ...i,
      applications_count: countMap[i.id] || 0,
    })));

    setLoading(false);
  };

  const viewApplications = async (posting: Posting) => {
    const { data: apps } = await supabase
      .from("internship_applications")
      .select("*")
      .eq("internship_id", posting.id)
      .order("applied_at", { ascending: false });

    const userIds = [...new Set((apps || []).map(a => a.user_id))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
      : { data: [] };

    setViewApps({
      posting,
      apps: (apps || []).map(a => ({
        ...a,
        applicant_name: profiles?.find(p => p.user_id === a.user_id)?.display_name || "Unknown",
      })),
    });
  };

  const deletePosting = async (id: string) => {
    const { error } = await supabase.functions.invoke("admin-stats", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: { action: "delete_internship", internship_id: id },
    });
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Posting deleted");
    setPostings(prev => prev.filter(p => p.id !== id));
  };

  const updateAppStatus = async (appId: string, status: string) => {
    const { error } = await supabase.functions.invoke("admin-stats", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: { action: "update_application_status", application_id: appId, new_status: status },
    });
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Application ${status}`);
    if (viewApps) {
      setViewApps({
        ...viewApps,
        apps: viewApps.apps.map(a => a.id === appId ? { ...a, status } : a),
      });
    }
  };

  const filteredRecruiters = recruiters.filter(r => !search || r.display_name.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()));
  const filteredPostings = postings.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.company.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Recruiters", value: recruiters.length, icon: Users },
          { label: "Job Postings", value: postings.length, icon: Briefcase },
          { label: "Total Applications", value: postings.reduce((s, p) => s + (p.applications_count || 0), 0), icon: FileText },
        ].map(s => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="text-xl font-bold">{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {(["recruiters", "postings"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
              }`}>{t === "recruiters" ? `👤 Recruiters (${recruiters.length})` : `📋 Postings (${postings.length})`}</button>
          ))}
        </div>
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs h-8 text-xs" />
      </div>

      {tab === "recruiters" && (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Postings</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecruiters.map(r => (
                <TableRow key={r.user_id}>
                  <TableCell className="font-medium text-sm">{r.display_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.email || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{r.postings_count}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {filteredRecruiters.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">No recruiters found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "postings" && (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPostings.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.title}</TableCell>
                  <TableCell className="text-xs">{p.company}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.location || "Remote"}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{p.applications_count || 0}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewApplications(p)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePosting(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPostings.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">No postings</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Applications Dialog */}
      <Dialog open={!!viewApps} onOpenChange={open => { if (!open) setViewApps(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applications: {viewApps?.posting.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {viewApps?.apps.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No applications</p>}
            {viewApps?.apps.map(a => (
              <div key={a.id} className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{a.applicant_name}</span>
                  <Badge variant={a.status === "accepted" ? "default" : a.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] capitalize">{a.status}</Badge>
                </div>
                {a.cover_letter && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">"{a.cover_letter}"</p>}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{new Date(a.applied_at).toLocaleDateString()}</span>
                  {a.status === "applied" && (
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateAppStatus(a.id, "shortlisted")}>Shortlist</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateAppStatus(a.id, "accepted")}>Accept</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive" onClick={() => updateAppStatus(a.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
