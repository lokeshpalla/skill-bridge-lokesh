import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Clock, Star, IndianRupee, Users, CheckCircle,
  XCircle, MessageSquare, BarChart3, Settings, TrendingUp, Video as VideoIcon
} from "lucide-react";
import MentorAvailabilityCalendar, { AvailabilitySlot, slotsToStrings, stringsToSlots, WeeklyPattern, stringToWeeklyPattern, weeklyPatternToString, generateSlotsFromPattern } from "@/components/mentors/MentorAvailabilityCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Booking {
  id: string;
  student_id: string;
  scheduled_at: string;
  duration_min: number;
  notes: string | null;
  status: string;
  created_at: string;
  student_name?: string;
  student_avatar?: string | null;
}

interface Review {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  student_name?: string;
}

const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const MentorDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"bookings" | "reviews" | "earnings" | "analytics" | "settings">("bookings");
  const [editForm, setEditForm] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch mentor profile
    const { data: mp } = await supabase
      .from("mentor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!mp) {
      setLoading(false);
      return;
    }
    setMentorProfile(mp);

    // Fetch bookings
    const { data: bks } = await supabase
      .from("mentor_bookings")
      .select("*")
      .eq("mentor_id", user.id)
      .order("scheduled_at", { ascending: false });

    if (bks && bks.length > 0) {
      const studentIds = [...new Set(bks.map((b: any) => b.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", studentIds);

      setBookings(bks.map((b: any) => ({
        ...b,
        student_name: profiles?.find((p: any) => p.user_id === b.student_id)?.display_name || "Student",
        student_avatar: profiles?.find((p: any) => p.user_id === b.student_id)?.avatar_url || null,
      })));
    }

    // Fetch reviews
    const { data: rvs } = await supabase
      .from("mentor_reviews")
      .select("*")
      .eq("mentor_id", mp.id)
      .order("created_at", { ascending: false });

    if (rvs && rvs.length > 0) {
      const sIds = [...new Set(rvs.map((r: any) => r.student_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", sIds);
      setReviews(rvs.map((r: any) => ({
        ...r,
        student_name: profs?.find((p: any) => p.user_id === r.student_id)?.display_name || "Student",
      })));
    }

    // Fetch payments
    const { data: pays } = await supabase
      .from("mentor_payments")
      .select("*")
      .eq("mentor_id", user.id)
      .order("created_at", { ascending: false });
    if (pays) setPayments(pays);

    setLoading(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("mentor_bookings").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Booking ${status}`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const saveProfile = async () => {
    if (!editForm || !user) return;
    const updateData: any = {
      title: editForm.title,
      bio: editForm.bio,
      company: editForm.company,
      skills: editForm.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
      hourly_rate: parseInt(editForm.hourly_rate) || 0,
      availability_slots: slotsToStrings(editForm.calendarSlots || []),
      available: editForm.available,
    };
    if (editForm.weeklyPattern) {
      updateData.weekly_pattern = weeklyPatternToString(editForm.weeklyPattern);
    }
    const { error } = await supabase.from("mentor_profiles").update(updateData).eq("user_id", user.id);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Profile updated!");
    setEditForm(null);
    fetchData();
  };

  if (loading) {
    return <div className="p-6 lg:p-8 max-w-7xl mx-auto"><p className="text-sm text-muted-foreground text-center py-12">Loading...</p></div>;
  }

  if (!mentorProfile) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto text-center py-20">
        <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-sm font-medium mb-2">Not registered as a mentor</h3>
        <Button variant="hero" size="sm" onClick={() => navigate("/mentors")}>Go to Mentors Page</Button>
      </div>
    );
  }

  const pending = bookings.filter(b => b.status === "pending");
  const confirmed = bookings.filter(b => b.status === "confirmed");
  const completed = bookings.filter(b => b.status === "completed");
  const totalEarnings = mentorProfile.total_earnings || 0;
  const paidEarnings = payments.filter(p => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const pendingEarnings = payments.filter(p => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  const tabs = [
    ["bookings", `📅 Bookings (${pending.length} pending)`],
    ["reviews", `⭐ Reviews (${reviews.length})`],
    ["earnings", `💰 Earnings (${payments.length})`],
    ["analytics", "📊 Analytics"],
    ["settings", "⚙️ Settings"],
  ] as const;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Mentor Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(38 92% 50% / 0.12), hsl(25 80% 45% / 0.08))" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-warning/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-warning/3 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-warning" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-warning/80">Mentor Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Your Mentoring Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage sessions, track reviews & grow your impact</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Sessions", value: mentorProfile.total_sessions || 0, icon: Calendar, accent: "text-warning" },
          { label: "Avg Rating", value: avgRating, icon: Star, accent: "text-warning" },
          { label: "Pending Bookings", value: pending.length, icon: Clock, accent: "text-warning" },
          { label: "Estimated Earnings", value: formatRupees(totalEarnings), icon: IndianRupee, accent: "text-warning" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-warning/20 bg-card/60 p-4 hover:border-warning/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
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
              tab === t ? "bg-warning text-warning-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}>{label}</button>
        ))}
      </div>

      {/* Bookings Tab */}
      {tab === "bookings" && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-1">No bookings yet</h3>
              <p className="text-xs text-muted-foreground">Students will appear here when they book sessions.</p>
            </div>
          ) : (
            bookings.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border/50 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {b.student_avatar ? (
                      <img src={b.student_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {b.student_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold">{b.student_name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.scheduled_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>{b.duration_min}min</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={b.status === "pending" ? "secondary" : b.status === "confirmed" ? "default" : "outline"} className="text-[10px]">
                    {b.status}
                  </Badge>
                </div>
                {b.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{b.notes}"</p>}
                {b.status === "pending" && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
                    <Button variant="hero" size="sm" className="h-7 text-xs gap-1" onClick={() => updateBookingStatus(b.id, "confirmed")}>
                      <CheckCircle className="w-3 h-3" /> Accept
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1" onClick={() => updateBookingStatus(b.id, "cancelled")}>
                      <XCircle className="w-3 h-3" /> Decline
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={() => navigate(`/messages?to=${b.student_id}`)}>
                      <MessageSquare className="w-3 h-3" /> Message
                    </Button>
                  </div>
                )}
                {b.status === "confirmed" && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                      onClick={() => navigate(`/mentor-session?mentor=You&slot=${new Date(b.scheduled_at).toLocaleString()}&booking=${b.id}`)}>
                      <VideoIcon className="w-3 h-3" /> Start Session
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => updateBookingStatus(b.id, "completed")}>
                      <CheckCircle className="w-3 h-3" /> Mark Completed
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={() => navigate(`/messages?to=${b.student_id}`)}>
                      <MessageSquare className="w-3 h-3" /> Message
                    </Button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
              <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-1">No reviews yet</h3>
              <p className="text-xs text-muted-foreground">Reviews will appear after completed sessions.</p>
            </div>
          ) : (
            reviews.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border/50 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.student_name}</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`w-3 h-3 ${idx < r.rating ? "text-warning fill-warning" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </div>
                {r.review && <p className="text-xs text-muted-foreground mt-2">"{r.review}"</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Earnings Tab */}
      {tab === "earnings" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Earnings", value: formatRupees(totalEarnings), color: "text-warning" },
              { label: "Paid Out", value: formatRupees(paidEarnings), color: "text-green-500" },
              { label: "Pending Payout", value: formatRupees(pendingEarnings), color: "text-yellow-500" },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-border/50 bg-card/60 p-4">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
          {payments.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
              <IndianRupee className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-1">No earnings yet</h3>
              <p className="text-xs text-muted-foreground">Complete sessions to start earning.</p>
            </div>
          ) : (
            payments.map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border/50 bg-card/60 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{formatRupees(Number(p.amount))}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
                <Badge variant={p.status === "paid" ? "default" : "secondary"} className="text-[10px]">
                  {p.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                </Badge>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Session Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: "Pending", count: pending.length, color: "bg-yellow-500/30" },
                { label: "Confirmed", count: confirmed.length, color: "bg-blue-500/30" },
                { label: "Completed", count: completed.length, color: "bg-green-500/30" },
                { label: "Cancelled", count: bookings.filter(b => b.status === "cancelled").length, color: "bg-red-500/30" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs w-20 text-right text-muted-foreground">{s.label}</span>
                  <div className="flex-1 h-6 rounded bg-secondary/30 overflow-hidden">
                    <div className={`h-full rounded ${s.color}`} style={{ width: `${bookings.length > 0 ? (s.count / bookings.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-8">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total bookings</span><span className="font-semibold">{bookings.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Completion rate</span><span className="font-semibold">{bookings.length > 0 ? Math.round((completed.length / bookings.length) * 100) : 0}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg rating</span><span className="font-semibold">{avgRating} ⭐</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total reviews</span><span className="font-semibold">{reviews.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Est. earnings</span><span className="font-semibold">{formatRupees(totalEarnings)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-5 max-w-lg">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> Edit Profile</h3>
            {!editForm ? (
              <div className="space-y-3">
                <div className="text-sm"><span className="text-muted-foreground">Title:</span> <span className="font-medium">{mentorProfile.title}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Company:</span> <span className="font-medium">{mentorProfile.company || "—"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Rate:</span> <span className="font-medium">{formatRupees(mentorProfile.hourly_rate || 0)}/hr</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Available:</span> <span className="font-medium">{mentorProfile.available ? "Yes ✅" : "No ❌"}</span></div>
                <div className="text-sm"><span className="text-muted-foreground">Skills:</span> <span className="font-medium">{(mentorProfile.skills || []).join(", ")}</span></div>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditForm({
                  title: mentorProfile.title,
                  bio: mentorProfile.bio || "",
                  company: mentorProfile.company || "",
                  skills: (mentorProfile.skills || []).join(", "),
                  hourly_rate: String(mentorProfile.hourly_rate || 0),
                  calendarSlots: stringsToSlots(mentorProfile.availability_slots || []),
                  weeklyPattern: stringToWeeklyPattern(mentorProfile.weekly_pattern || null),
                  available: mentorProfile.available,
                })}>Edit Profile</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input placeholder="Title *" value={editForm.title} onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))} />
                <Input placeholder="Company" value={editForm.company} onChange={e => setEditForm((f: any) => ({ ...f, company: e.target.value }))} />
                <Textarea placeholder="Bio" value={editForm.bio} onChange={e => setEditForm((f: any) => ({ ...f, bio: e.target.value }))} rows={3} />
                <Input placeholder="Skills (comma separated)" value={editForm.skills} onChange={e => setEditForm((f: any) => ({ ...f, skills: e.target.value }))} />
                <Input placeholder="Hourly rate (₹)" type="number" value={editForm.hourly_rate} onChange={e => setEditForm((f: any) => ({ ...f, hourly_rate: e.target.value }))} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.available} onChange={e => setEditForm((f: any) => ({ ...f, available: e.target.checked }))} />
                  Available for bookings
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditForm(null)}>Cancel</Button>
                  <Button variant="hero" size="sm" onClick={saveProfile}>Save Changes</Button>
                </div>
              </div>
            )}
          </div>

          {/* Availability Calendar */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-warning" /> Availability Calendar</h3>
            {editForm ? (
              <MentorAvailabilityCalendar
                slots={editForm.calendarSlots || []}
                onChange={(slots) => setEditForm((f: any) => ({ ...f, calendarSlots: slots }))}
                weeklyPattern={editForm.weeklyPattern || {}}
                onWeeklyPatternChange={(pattern) => setEditForm((f: any) => ({ ...f, weeklyPattern: pattern }))}
              />
            ) : (
              <MentorAvailabilityCalendar
                slots={stringsToSlots(mentorProfile.availability_slots || [])}
                onChange={() => {}}
                readOnly
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboardPage;
