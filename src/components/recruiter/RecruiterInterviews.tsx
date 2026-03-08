import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Link as LinkIcon, Plus, Video, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Interview, Application, Internship } from "@/pages/RecruiterDashboard";

interface Props {
  interviews: Interview[];
  applications: Application[];
  internships: Internship[];
  onRefresh: () => void;
}

const interviewStatusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const RecruiterInterviews = ({ interviews, applications, internships, onRefresh }: Props) => {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ applicationId: "", date: "", time: "", duration: "30", link: "", notes: "" });

  // Only show candidates in "interview" status
  const interviewCandidates = applications.filter(a => a.status === "interview");

  const scheduleInterview = async () => {
    if (!user || !form.applicationId || !form.date || !form.time) return;
    const app = applications.find(a => a.id === form.applicationId);
    if (!app) return;

    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();

    const { error } = await supabase.from("interview_schedules").insert({
      internship_id: app.internship_id,
      application_id: app.id,
      recruiter_id: user.id,
      candidate_id: app.user_id,
      scheduled_at: scheduledAt,
      duration_min: parseInt(form.duration) || 30,
      meeting_link: form.link || null,
      notes: form.notes || null,
    });

    if (error) { toast.error("Failed to schedule interview"); return; }
    toast.success("Interview scheduled!");
    setShowDialog(false);
    setForm({ applicationId: "", date: "", time: "", duration: "30", link: "", notes: "" });
    onRefresh();
  };

  const updateInterviewStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("interview_schedules").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Interview ${status}`);
    onRefresh();
  };

  const upcoming = interviews.filter(i => i.status === "scheduled" && new Date(i.scheduled_at) >= new Date());
  const past = interviews.filter(i => i.status !== "scheduled" || new Date(i.scheduled_at) < new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Interview Schedule</h3>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm" className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" /> Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <select
                value={form.applicationId}
                onChange={e => setForm(f => ({ ...f, applicationId: e.target.value }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">Select Candidate *</option>
                {interviewCandidates.map(a => {
                  const intern = internships.find(i => i.id === a.internship_id);
                  return (
                    <option key={a.id} value={a.id}>
                      {a.profile?.display_name || "Unknown"} — {intern?.title}
                    </option>
                  );
                })}
              </select>
              {interviewCandidates.length === 0 && (
                <p className="text-[11px] text-muted-foreground">Move candidates to "Interview" status in the pipeline first.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
                <Input placeholder="Meeting link" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
              </div>
              <Textarea placeholder="Notes for the candidate..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              <Button variant="hero" className="w-full" onClick={scheduleInterview}
                disabled={!form.applicationId || !form.date || !form.time}>
                Schedule Interview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {interviews.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-sm font-medium mb-1">No interviews scheduled</h3>
          <p className="text-xs text-muted-foreground">Move candidates to "Interview" status, then schedule here.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming</h4>
              {upcoming.map((intv, i) => (
                <InterviewCard key={intv.id} interview={intv} onUpdate={updateInterviewStatus} index={i} />
              ))}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Past</h4>
              {past.map((intv, i) => (
                <InterviewCard key={intv.id} interview={intv} onUpdate={updateInterviewStatus} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

function InterviewCard({ interview: intv, onUpdate, index }: { interview: Interview; onUpdate: (id: string, status: string) => void; index: number }) {
  const dt = new Date(intv.scheduled_at);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
      className="rounded-xl border border-border/50 bg-card/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{intv.candidate_name}</h4>
          <p className="text-[11px] text-muted-foreground">{intv.internship_title}</p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${interviewStatusColors[intv.status] || interviewStatusColors.scheduled}`}>
          {intv.status}
        </span>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{dt.toLocaleDateString()}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span>{intv.duration_min} min</span>
        {intv.meeting_link && (
          <a href={intv.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
            <Video className="w-3 h-3" /> Join
          </a>
        )}
      </div>
      {intv.notes && <p className="text-[11px] text-muted-foreground mt-2 italic">{intv.notes}</p>}
      {intv.status === "scheduled" && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onUpdate(intv.id, "completed")}>
            <CheckCircle className="w-3 h-3" /> Complete
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1" onClick={() => onUpdate(intv.id, "cancelled")}>
            <XCircle className="w-3 h-3" /> Cancel
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default RecruiterInterviews;
