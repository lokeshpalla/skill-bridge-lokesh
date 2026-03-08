import { useState } from "react";
import { motion } from "framer-motion";
import { Users, ChevronRight, XCircle, Calendar, Eye, Trophy, Code2, Award, ExternalLink, Brain, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { statusColors, statusLabels, statusFlow } from "@/pages/RecruiterDashboard";
import type { Internship, Application } from "@/pages/RecruiterDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CandidateDetails {
  certificates: any[];
  submissions: { total: number; passed: number };
  projects: any[];
  enrollments: number;
}

interface Props {
  internships: Internship[];
  applications: Application[];
  selectedInternship: string | null;
  onSelectInternship: (id: string | null) => void;
  onUpdateStatus: (appId: string, status: string) => void;
  onScheduleInterview: (app: Application) => void;
}

const RecruiterPipeline = ({ internships, applications, selectedInternship, onSelectInternship, onUpdateStatus, onScheduleInterview }: Props) => {
  const navigate = useNavigate();
  const [viewingCandidate, setViewingCandidate] = useState<Application | null>(null);
  const [candidateDetails, setCandidateDetails] = useState<CandidateDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const filteredApps = selectedInternship
    ? applications.filter(a => a.internship_id === selectedInternship)
    : applications;

  const viewCandidateProfile = async (app: Application) => {
    setViewingCandidate(app);
    setDetailsLoading(true);
    setCandidateDetails(null);

    const [
      { data: certs },
      { data: subs },
      { data: projects },
      { count: enrollCount },
    ] = await Promise.all([
      supabase.from("course_certificates").select("*").eq("user_id", app.user_id).order("issued_at", { ascending: false }),
      supabase.from("coding_submissions").select("status").eq("user_id", app.user_id),
      supabase.from("portfolio_projects").select("*").eq("user_id", app.user_id).order("created_at", { ascending: false }).limit(5),
      supabase.from("course_enrollments").select("*", { count: "exact", head: true }).eq("user_id", app.user_id),
    ]);

    const passed = (subs || []).filter(s => s.status === "passed").length;

    setCandidateDetails({
      certificates: certs || [],
      submissions: { total: (subs || []).length, passed },
      projects: projects || [],
      enrollments: enrollCount || 0,
    });
    setDetailsLoading(false);
  };

  // Calculate skill match score
  const getSkillMatch = (app: Application, internId: string) => {
    const intern = internships.find(i => i.id === internId);
    if (!intern || !intern.skills_required.length || !app.profile?.skills?.length) return null;
    const required = new Set(intern.skills_required.map(s => s.toLowerCase()));
    const has = app.profile.skills.map(s => s.toLowerCase());
    const matched = has.filter(s => required.has(s)).length;
    return { matched, total: required.size, pct: Math.round((matched / required.size) * 100) };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onSelectInternship(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !selectedInternship ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
          }`}>All ({applications.length})</button>
        {internships.map(intern => {
          const count = applications.filter(a => a.internship_id === intern.id).length;
          return (
            <button key={intern.id} onClick={() => onSelectInternship(intern.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedInternship === intern.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
              }`}>{intern.title} ({count})</button>
          );
        })}
      </div>

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
            const skillMatch = getSkillMatch(app, app.internship_id);
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
                        {skillMatch && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                            skillMatch.pct >= 75 ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            skillMatch.pct >= 50 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                            "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                            {skillMatch.pct}% match ({skillMatch.matched}/{skillMatch.total})
                          </span>
                        )}
                        {app.profile?.skills?.slice(0, 3).map(s => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewCandidateProfile(app)} title="View full profile">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${statusColors[app.status] || statusColors.applied}`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground mt-2">
                  Applied for <span className="font-medium text-foreground">{intern?.title}</span> at {intern?.company} • {new Date(app.applied_at).toLocaleDateString()}
                </p>

                {app.cover_letter && (
                  <div className="mt-2 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">Cover Letter:</p>
                    <p className="text-xs text-foreground leading-relaxed line-clamp-3">{app.cover_letter}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {app.portfolio_url && <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" />Portfolio</a>}
                  {app.resume_url && <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" />Resume</a>}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                  <div className="flex items-center gap-1 flex-1 flex-wrap">
                    {statusFlow.map((s, idx) => (
                      <div key={s} className="flex items-center gap-1">
                        <button onClick={() => onUpdateStatus(app.id, s)}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                            app.status === s ? statusColors[s] + " border" : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                          }`}>{statusLabels[s]}</button>
                        {idx < statusFlow.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                    onClick={() => onUpdateStatus(app.id, "rejected")}>
                    <XCircle className="w-3 h-3" /> Reject
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Candidate Detail Dialog */}
      <Dialog open={!!viewingCandidate} onOpenChange={open => { if (!open) setViewingCandidate(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingCandidate?.profile?.avatar_url ? (
                <img src={viewingCandidate.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {viewingCandidate?.profile?.display_name?.charAt(0)}
                </div>
              )}
              {viewingCandidate?.profile?.display_name}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading profile...</p>
          ) : candidateDetails && viewingCandidate ? (
            <div className="space-y-4 mt-2">
              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "XP", value: viewingCandidate.profile?.xp || 0, icon: Trophy },
                  { label: "Problems", value: `${candidateDetails.submissions.passed}/${candidateDetails.submissions.total}`, icon: Code2 },
                  { label: "Certificates", value: candidateDetails.certificates.length, icon: Award },
                  { label: "Courses", value: candidateDetails.enrollments, icon: BookOpen },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="rounded-lg bg-secondary/30 p-2.5 text-center">
                      <Icon className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                      <div className="text-sm font-bold">{s.value}</div>
                      <div className="text-[9px] text-muted-foreground">{s.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Skills */}
              {viewingCandidate.profile?.skills && viewingCandidate.profile.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingCandidate.profile.skills.map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificates */}
              {candidateDetails.certificates.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Certificates ({candidateDetails.certificates.length})</h4>
                  <div className="space-y-1.5">
                    {candidateDetails.certificates.slice(0, 5).map(c => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg bg-secondary/20 px-3 py-2">
                        <div>
                          <span className="text-xs font-medium">{c.course_title}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">Grade: {c.grade} ({c.percentage}%)</span>
                        </div>
                        <Badge variant="outline" className="text-[9px]">{c.certificate_number}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Projects */}
              {candidateDetails.projects.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Portfolio Projects ({candidateDetails.projects.length})</h4>
                  <div className="space-y-1.5">
                    {candidateDetails.projects.map(p => (
                      <div key={p.id} className="rounded-lg bg-secondary/20 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{p.title}</span>
                          <div className="flex gap-1">
                            {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary hover:underline">GitHub</a>}
                            {p.live_url && <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary hover:underline">Live</a>}
                          </div>
                        </div>
                        {p.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
                        {p.tech_stack?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {p.tech_stack.map((t: string) => (
                              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/portfolio/${viewingCandidate.user_id}`)}>
                  View Full Profile
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/messages?to=${viewingCandidate.user_id}`)}>
                  Message Candidate
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecruiterPipeline;
