import { useState, useEffect } from "react";
import { Users, Star, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface MentorProfile {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  skills: string[] | null;
  rating: number | null;
  hourly_rate: number | null;
  total_sessions: number | null;
  total_earnings: number | null;
  available: boolean | null;
  created_at: string;
  display_name?: string;
}

interface Booking {
  id: string;
  mentor_id: string;
  student_id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  created_at: string;
  mentor_name?: string;
  student_name?: string;
}

export default function AdminMentorManagement() {
  const [tab, setTab] = useState<"mentors" | "bookings">("mentors");
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: mData }, { data: bData }] = await Promise.all([
      supabase.from("mentor_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("mentor_bookings").select("*").order("scheduled_at", { ascending: false }).limit(50),
    ]);

    const userIds = [...new Set([
      ...(mData || []).map(m => m.user_id),
      ...(bData || []).map(b => b.mentor_id),
      ...(bData || []).map(b => b.student_id),
    ])];

    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
      : { data: [] };

    const getName = (uid: string) => profiles?.find(p => p.user_id === uid)?.display_name || "Unknown";

    setMentors((mData || []).map(m => ({ ...m, display_name: getName(m.user_id) })));
    setBookings((bData || []).map(b => ({ ...b, mentor_name: getName(b.mentor_id), student_name: getName(b.student_id) })));
    setLoading(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("mentor_bookings").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Booking ${status}`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const totalMentors = mentors.length;
  const activeMentors = mentors.filter(m => m.available).length;
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === "pending").length;

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Mentors", value: totalMentors, icon: Users },
          { label: "Active", value: activeMentors, icon: Star },
          { label: "Total Bookings", value: totalBookings, icon: Calendar },
          { label: "Pending", value: pendingBookings, icon: DollarSign },
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

      <div className="flex gap-2">
        {(["mentors", "bookings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
            }`}>{t === "mentors" ? `👨‍🏫 Mentors (${totalMentors})` : `📅 Bookings (${totalBookings})`}</button>
        ))}
      </div>

      {tab === "mentors" && (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentors.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-sm">{m.display_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.title}{m.company ? ` @ ${m.company}` : ""}</TableCell>
                  <TableCell className="text-xs">⭐ {m.rating || 0}</TableCell>
                  <TableCell className="text-xs">₹{m.hourly_rate || 0}/hr</TableCell>
                  <TableCell className="text-xs">{m.total_sessions || 0}</TableCell>
                  <TableCell className="text-xs font-medium">₹{(m.total_earnings || 0).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant={m.available ? "default" : "secondary"} className="text-[10px]">
                      {m.available ? "🟢 Active" : "⚪ Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {mentors.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">No mentors</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "bookings" && (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-sm">{b.mentor_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.student_name}</TableCell>
                  <TableCell className="text-xs">{new Date(b.scheduled_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{b.duration_min} min</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "completed" ? "default" : b.status === "confirmed" ? "secondary" : "outline"} className="text-[10px] capitalize">
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    {b.status === "pending" && (
                      <>
                        <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateBookingStatus(b.id, "confirmed")}>Confirm</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive" onClick={() => updateBookingStatus(b.id, "cancelled")}>Cancel</Button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => updateBookingStatus(b.id, "completed")}>Complete</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">No bookings</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
