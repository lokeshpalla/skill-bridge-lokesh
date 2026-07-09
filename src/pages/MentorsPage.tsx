import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, Calendar, Search, Clock, IndianRupee, VideoIcon, Plus, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import MentorAvailabilityCalendar, { AvailabilitySlot, stringsToSlots, slotsToStrings, WeeklyPattern, weeklyPatternToString, generateSlotsFromPattern } from "@/components/mentors/MentorAvailabilityCalendar";
import { format } from "date-fns";

interface MentorProfile {
  id: string;
  user_id: string;
  title: string;
  bio: string | null;
  company: string | null;
  skills: string[];
  rating: number;
  total_sessions: number;
  hourly_rate: number | null;
  available: boolean;
  availability_slots: string[];
  display_name?: string;
  avatar_url?: string | null;
}

const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const MentorsPage = () => {
  const navigate = useNavigate();
  const { user, profile, roles } = useAuth();
  const isStudentOnly = roles.length > 0 && roles.every(r => r === 'student');
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [regForm, setRegForm] = useState({
    title: "", bio: "", company: "", skills: "", hourly_rate: "3000",
  });
  const [regSlots, setRegSlots] = useState<AvailabilitySlot[]>([]);
  const [regWeeklyPattern, setRegWeeklyPattern] = useState<WeeklyPattern>({});

  useEffect(() => {
    fetchMentors();
    if (user) checkIsMentor();
  }, [user]);

  const checkIsMentor = async () => {
    if (!user) return;
    const { data } = await supabase.from("mentor_profiles").select("id").eq("user_id", user.id).maybeSingle();
    setIsMentor(!!data);
  };

  const fetchMentors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("public_mentor_profiles" as any)
      .select("*")
      .order("rating", { ascending: false });

    if (data && data.length > 0) {
      const userIds = data.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("public_profiles" as any)
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      setMentors(data.map((m: any) => ({
        ...m,
        skills: m.skills || [],
        availability_slots: m.availability_slots || [],
        display_name: (profiles as any[])?.find((p: any) => p.user_id === m.user_id)?.display_name || "Mentor",
        avatar_url: (profiles as any[])?.find((p: any) => p.user_id === m.user_id)?.avatar_url || null,
      })));
    } else {
      setMentors([]);
    }
    setLoading(false);
  };

  const registerAsMentor = async () => {
    if (!user || !regForm.title) return;
    const { error } = await supabase.from("mentor_profiles").insert({
      user_id: user.id,
      title: regForm.title,
      bio: regForm.bio || null,
      company: regForm.company || null,
      skills: regForm.skills.split(",").map(s => s.trim()).filter(Boolean),
      hourly_rate: parseInt(regForm.hourly_rate) || 3000,
      availability_slots: slotsToStrings(regSlots),
      available: true,
    });
    if (error) { toast.error("Failed to register"); return; }

    // Assign mentor role via secure DB function
    await supabase.rpc("register_as_mentor", { _user_id: user.id });

    toast.success("You're now a mentor! 🎉");
    setShowRegister(false);
    setIsMentor(true);
    fetchMentors();
  };

  const bookSession = async () => {
    if (!user || !selectedMentor || !selectedSlot) return;
    // Parse the calendar slot into a proper date
    const timeStr = selectedSlot.time;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    let hours = match ? parseInt(match[1]) : 18;
    const minutes = match ? parseInt(match[2]) : 0;
    const ampm = match ? match[3].toUpperCase() : "PM";
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    const scheduledAt = new Date(selectedSlot.date + "T00:00:00");
    scheduledAt.setHours(hours, minutes, 0, 0);

    const { error } = await supabase.from("mentor_bookings").insert({
      mentor_id: selectedMentor.user_id,
      student_id: user.id,
      scheduled_at: scheduledAt.toISOString(),
      duration_min: 60,
      notes: bookingNotes || null,
      status: "pending",
    });
    if (error) { toast.error("Failed to book session"); return; }
    toast.success(`Session booked with ${selectedMentor.display_name}! 📅`);
    setSelectedMentor(null);
    setBookingNotes("");
    setSelectedSlot(null);
  };

  const mentorsWithSlots = useMemo(
    () => mentors.map(m => ({ ...m, _slots: stringsToSlots(m.availability_slots) })),
    [mentors]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return mentorsWithSlots;
    return mentorsWithSlots.filter(m =>
      m.display_name?.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.skills.some(s => s.toLowerCase().includes(q))
    );
  }, [mentorsWithSlots, search]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Find a Mentor</h1>
          <p className="text-sm text-muted-foreground">Book 1:1 sessions with industry professionals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search mentors or skills..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card/60 border-border/50 h-9 text-sm" />
          </div>
          {user && !isMentor && !isStudentOnly && (
            <Dialog open={showRegister} onOpenChange={setShowRegister}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-9 whitespace-nowrap">
                  <Plus className="w-3.5 h-3.5" /> Become a Mentor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Register as Mentor</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input placeholder="Your title (e.g. Senior Engineer @ Google) *" value={regForm.title} onChange={e => setRegForm(f => ({ ...f, title: e.target.value }))} />
                  <Input placeholder="Company" value={regForm.company} onChange={e => setRegForm(f => ({ ...f, company: e.target.value }))} />
                  <Textarea placeholder="Bio - Tell students about your expertise..." value={regForm.bio} onChange={e => setRegForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
                  <Input placeholder="Skills (comma separated)" value={regForm.skills} onChange={e => setRegForm(f => ({ ...f, skills: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Hourly rate (₹)" type="number" value={regForm.hourly_rate} onChange={e => setRegForm(f => ({ ...f, hourly_rate: e.target.value }))} />
                  </div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Set your availability:</div>
                  <MentorAvailabilityCalendar
                    slots={regSlots}
                    onChange={setRegSlots}
                    weeklyPattern={regWeeklyPattern}
                    onWeeklyPatternChange={setRegWeeklyPattern}
                  />
                  <Button variant="hero" className="w-full" onClick={registerAsMentor} disabled={!regForm.title}>
                    Register as Mentor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {isMentor && (
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => navigate("/mentor-dashboard")}>
              My Dashboard
            </Button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading mentors...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-sm font-medium mb-1">No mentors found</h3>
          <p className="text-xs text-muted-foreground mb-4">Be the first to register as a mentor!</p>
          {user && !isMentor && !isStudentOnly && (
            <Button variant="hero" size="sm" onClick={() => setShowRegister(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Become a Mentor
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((mentor, i) => (
            <motion.div key={mentor.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border/50 bg-card/60 p-5 relative hover:border-primary/20 transition-all">
              {mentor.available && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-success font-medium">Available</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                {mentor.avatar_url ? (
                  <img src={mentor.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                    {mentor.display_name?.charAt(0) || "M"}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold">{mentor.display_name}</h3>
                  <p className="text-[11px] text-muted-foreground">{mentor.title}</p>
                  {mentor.company && <p className="text-[10px] text-muted-foreground">@ {mentor.company}</p>}
                </div>
              </div>

              {mentor.bio && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{mentor.bio}</p>}

              <div className="flex flex-wrap gap-1 mb-3">
                {mentor.skills.slice(0, 4).map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{s}</span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{mentor.rating || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{mentor.total_sessions || 0} sessions</span>
                {mentor.hourly_rate && (
                  <span className="flex items-center gap-0.5 font-semibold text-foreground">
                    <IndianRupee className="w-3 h-3" />{formatRupees(mentor.hourly_rate)}/hr
                  </span>
                )}
              </div>

              {mentor._slots.length > 0 && (
                <div className="mb-4 p-2.5 rounded-lg bg-secondary/40 border border-border/30">
                  <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                    <Clock className="w-3 h-3" /> Available Slots
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {mentor._slots.slice(0, 6).map(slot => (
                      <span key={`${slot.date}-${slot.time}`} className="text-[10px] px-2 py-0.5 rounded-md bg-background/80 border border-border/40 text-foreground">
                        {format(new Date(slot.date + "T00:00:00"), "MMM d")} · {slot.time}
                      </span>
                    ))}
                    {mentor._slots.length > 6 && (
                      <span className="text-[10px] px-2 py-0.5 text-muted-foreground">+{mentor._slots.length - 6} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant={mentor.available ? "hero" : "secondary"} className="flex-1 h-8 text-xs"
                  disabled={!mentor.available || mentor.user_id === user?.id}
                  onClick={() => { setSelectedMentor(mentor); setSelectedSlot(null); setBookingNotes(""); }}>
                  {mentor.user_id === user?.id ? "Your Profile" : mentor.available ? <><Calendar className="w-3 h-3" /> Book Session</> : "Unavailable"}
                </Button>
                {user && mentor.user_id !== user.id && (
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1 px-3"
                    onClick={() => navigate(`/messages?to=${mentor.user_id}`)}>
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={!!selectedMentor} onOpenChange={open => { if (!open) setSelectedMentor(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Session with {selectedMentor?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {selectedMentor?.hourly_rate && (
              <p className="text-xs text-muted-foreground">Rate: <span className="font-semibold text-foreground">{formatRupees(selectedMentor.hourly_rate)}/hr</span></p>
            )}
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Choose a date & time slot</p>
            <MentorAvailabilityCalendar
              slots={stringsToSlots(selectedMentor?.availability_slots || [])}
              onChange={() => {}}
              readOnly
              onSlotSelect={(slot) => setSelectedSlot(slot)}
              selectedSlot={selectedSlot}
            />
            {selectedSlot && (
              <p className="text-xs text-primary font-medium">
                Selected: {format(new Date(selectedSlot.date + "T00:00:00"), "MMM d, yyyy")} at {selectedSlot.time}
              </p>
            )}
            <Textarea placeholder="Notes for the mentor (optional)..." value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedMentor(null)}>Cancel</Button>
              <Button variant="hero" className="flex-1 gap-1" disabled={!selectedSlot} onClick={bookSession}>
                <Calendar className="w-4 h-4" /> Confirm Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentorsPage;
