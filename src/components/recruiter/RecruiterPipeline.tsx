import { motion } from "framer-motion";
import { Users, ChevronRight, XCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { statusColors, statusLabels, statusFlow } from "@/pages/RecruiterDashboard";
import type { Internship, Application } from "@/pages/RecruiterDashboard";

interface Props {
  internships: Internship[];
  applications: Application[];
  selectedInternship: string | null;
  onSelectInternship: (id: string | null) => void;
  onUpdateStatus: (appId: string, status: string) => void;
  onScheduleInterview: (app: Application) => void;
}

const RecruiterPipeline = ({ internships, applications, selectedInternship, onSelectInternship, onUpdateStatus, onScheduleInterview }: Props) => {
  const filteredApps = selectedInternship
    ? applications.filter(a => a.internship_id === selectedInternship)
    : applications;

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
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${statusColors[app.status] || statusColors.applied}`}>
                    {statusLabels[app.status] || app.status}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground mt-2">
                  Applied for <span className="font-medium text-foreground">{intern?.title}</span> at {intern?.company} • {new Date(app.applied_at).toLocaleDateString()}
                </p>

                {app.cover_letter && (
                  <div className="mt-2 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                    <p className="text-[11px] text-muted-foreground font-medium mb-1">Cover Letter:</p>
                    <p className="text-xs text-foreground leading-relaxed">{app.cover_letter}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  {app.portfolio_url && <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">View Portfolio</a>}
                  {app.resume_url && <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">View Resume</a>}
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
    </div>
  );
};

export default RecruiterPipeline;
