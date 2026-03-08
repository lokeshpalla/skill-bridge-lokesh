import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Video, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow } from "date-fns";

interface Session {
  id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  notes: string | null;
  mentor_name: string;
  mentor_title: string;
}

interface UpcomingInterview {
  id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  meeting_link: string | null;
  internship_title: string;
  company: string;
}

export default function UpcomingSessions({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interviews, setInterviews] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const now = new Date().toISOString();

      // Fetch upcoming mentor bookings
      const { data: bookings } = await supabase
        .from("mentor_bookings")
        .select("id, scheduled_at, duration_min, status, notes, mentor_id")
        .eq("student_id", userId)
        .in("status", ["pending", "confirmed"])
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(3);

      if (bookings && bookings.length > 0) {
        const mentorIds = [...new Set(bookings.map(b => b.mentor_id))];
        const { data: mentorProfiles } = await supabase
          .from("mentor_profiles")
          .select("user_id, title")
          .in("user_id", mentorIds);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", mentorIds);

        setSessions(bookings.map(b => ({
          ...b,
          mentor_name: profiles?.find(p => p.user_id === b.mentor_id)?.display_name || "Mentor",
          mentor_title: mentorProfiles?.find(m => m.user_id === b.mentor_id)?.title || "",
        })));
      }

      // Fetch upcoming interviews
      const { data: intv } = await supabase
        .from("interview_schedules")
        .select("id, scheduled_at, duration_min, status, meeting_link, internship_id")
        .eq("candidate_id", userId)
        .eq("status", "scheduled")
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(2);

      if (intv && intv.length > 0) {
        const iIds = [...new Set(intv.map(i => i.internship_id))];
        const { data: internships } = await supabase
          .from("internships")
          .select("id, title, company")
          .in("id", iIds);

        setInterviews(intv.map(i => {
          const intern = internships?.find(x => x.id === i.internship_id);
          return {
            ...i,
            internship_title: intern?.title || "Interview",
            company: intern?.company || "",
          };
        }));
      }

      setLoading(false);
    };
    fetch();
  }, [userId]);

  const allEvents = [
    ...sessions.map(s => ({ type: "mentor" as const, date: s.scheduled_at, ...s })),
    ...interviews.map(i => ({ type: "interview" as const, date: i.scheduled_at, ...i })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (loading) return null;
  if (allEvents.length === 0) return null;

  const formatDate = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-xl border border-primary/20 bg-card/60 backdrop-blur-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Upcoming Sessions</h2>
        </div>
        <Link to="/mentors" className="text-[11px] text-primary hover:underline">View all</Link>
      </div>
      <div className="space-y-2.5">
        {allEvents.slice(0, 4).map((event) => (
          <div
            key={event.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              event.type === "mentor"
                ? "bg-primary/5 hover:bg-primary/10 border border-primary/10"
                : "bg-accent/5 hover:bg-accent/10 border border-accent/10"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              event.type === "mentor" ? "bg-primary/10" : "bg-accent/10"
            }`}>
              {event.type === "mentor" ? (
                <User className="w-4 h-4 text-primary" />
              ) : (
                <Video className="w-4 h-4 text-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {event.type === "mentor"
                  ? `Session with ${(event as any).mentor_name}`
                  : `Interview: ${(event as any).internship_title}`}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(event.date)} • {format(new Date(event.date), "h:mm a")} • {event.duration_min}min
                </span>
              </div>
            </div>
            {isToday(new Date(event.date)) && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
