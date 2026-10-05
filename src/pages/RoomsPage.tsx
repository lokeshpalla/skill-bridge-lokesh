import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Users, Plus, Search, Wifi, Keyboard, Link2, Clock, ArrowRight, Copy, Check, Trash2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Room {
  id: string;
  name: string;
  description: string | null;
  topic: string;
  max_participants: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  meeting_code: string | null;
  ended_at: string | null;
  participant_count?: number;
}

export default function RoomsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "", topic: "general", max_participants: 6 });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchRooms();
    const channel = supabase
      .channel("rooms-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "collaboration_rooms" }, () => fetchRooms())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchRooms = async () => {
    const { data: roomsData } = await supabase
      .from("collaboration_rooms")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (roomsData) {
      const roomsWithCounts = await Promise.all(
        (roomsData as Room[]).map(async (room) => {
          // Presence lists are member-only now; the lobby uses a count-only RPC
          const { data: count } = await (supabase as any)
            .rpc("room_participant_count", { _room_id: room.id });
          return { ...room, participant_count: (count as number) || 0 };
        })
      );
      setRooms(roomsWithCounts);
    }
    setLoading(false);
    fetchHistory();
  };

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("collaboration_rooms")
      .select("*")
      .eq("is_active", false)
      .eq("created_by", user.id)
      .order("ended_at", { ascending: false })
      .limit(20);
    if (data) setHistory(data as Room[]);
  };

  const deleteHistoryRoom = async (roomId: string) => {
    const { error } = await supabase
      .from("collaboration_rooms")
      .delete()
      .eq("id", roomId)
      .eq("created_by", user!.id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete meeting", variant: "destructive" });
      return;
    }
    setHistory((prev) => prev.filter((r) => r.id !== roomId));
    toast({ title: "Meeting deleted", description: "Removed from your history." });
  };

  const createInstantMeeting = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("collaboration_rooms")
      .insert({
        name: `${profile?.display_name || "User"}'s Meeting`,
        description: null,
        topic: "general",
        max_participants: 10,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create meeting", variant: "destructive" });
      return;
    }
    if (data) navigate(`/rooms/${data.id}`);
  };

  const createRoom = async () => {
    if (!user || !newRoom.name.trim()) return;
    const { data, error } = await supabase
      .from("collaboration_rooms")
      .insert({
        name: newRoom.name.trim(),
        description: newRoom.description.trim() || null,
        topic: newRoom.topic,
        max_participants: newRoom.max_participants,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create room", variant: "destructive" });
      return;
    }
    setCreateOpen(false);
    setNewRoom({ name: "", description: "", topic: "general", max_participants: 6 });
    if (data) navigate(`/rooms/${data.id}`);
  };

  const joinWithCode = () => {
    const code = meetingCode.trim().toUpperCase();
    if (!code) return;
    const urlMatch = code.match(/\/rooms\/([^/?#]+)/i);
    const lookup = urlMatch?.[1] || code;

    const query = supabase
      .from("collaboration_rooms")
      .select("id")
      .ilike("meeting_code", lookup)
      .eq("is_active", true)
      .maybeSingle();

    void query.then(async ({ data, error }) => {
        let room = data;
        let lookupError = error;
        if (!room && !lookupError && /^[0-9a-f-]{36}$/i.test(lookup)) {
          const fallback = await supabase
            .from("collaboration_rooms")
            .select("id")
            .eq("id", lookup)
            .eq("is_active", true)
            .maybeSingle();
          room = fallback.data;
          lookupError = fallback.error;
        }
        if (lookupError || !room) {
          toast({ title: "Meeting not found", description: "Check the code and try again.", variant: "destructive" });
          return;
        }
        setMeetingCode("");
        navigate(`/rooms/${room.id}`);
      });
  };

  const copyRoomCode = async (room: Room, event: React.MouseEvent) => {
    event.stopPropagation();
    const code = room.meeting_code;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopiedRoomId(room.id);
    toast({ title: "Meeting code copied", description: code });
    window.setTimeout(() => setCopiedRoomId(null), 2000);
  };

  const endRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("collaboration_rooms")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("id", roomId)
      .eq("created_by", user!.id);
    if (!error) {
      toast({ title: "Room ended", description: "The room has been closed." });
      fetchRooms();
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.topic.toLowerCase().includes(search.toLowerCase())
  );

  const topicColors: Record<string, string> = {
    general: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    frontend: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    backend: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    dsa: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "system-design": "bg-pink-500/10 text-pink-400 border-pink-500/20",
    "code-review": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    study: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero Section — Google Meet style */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-2 gap-8 items-center"
      >
        {/* Left: Actions */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Video calls for everyone</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Create rooms, collaborate with peers, and learn together with live video, audio, screen sharing, and chat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="hero" size="lg" className="gap-2" onClick={createInstantMeeting}>
              <Video className="w-4 h-4" /> New Meeting
            </Button>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <Plus className="w-4 h-4" /> Custom Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Room Name</Label>
                    <Input placeholder="e.g. React Study Group" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="What will you work on?" value={newRoom.description} onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Select value={newRoom.topic} onValueChange={(v) => setNewRoom({ ...newRoom, topic: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="frontend">Frontend</SelectItem>
                          <SelectItem value="backend">Backend</SelectItem>
                          <SelectItem value="dsa">DSA</SelectItem>
                          <SelectItem value="system-design">System Design</SelectItem>
                          <SelectItem value="code-review">Code Review</SelectItem>
                          <SelectItem value="study">Study Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Participants</Label>
                      <Select value={String(newRoom.max_participants)} onValueChange={(v) => setNewRoom({ ...newRoom, max_participants: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[2, 4, 6, 8, 10].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n} people</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={createRoom} className="w-full" disabled={!newRoom.name.trim()}>
                    Create & Join
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Join with code */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter a room code or link"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                className="pl-10 bg-card/60 border-border/50"
                onKeyDown={(e) => e.key === "Enter" && joinWithCode()}
              />
            </div>
            <Button variant="ghost" disabled={!meetingCode.trim()} onClick={joinWithCode} className="text-primary font-medium">
              Join
            </Button>
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="w-80 h-56 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center relative overflow-hidden">
            <div className="grid grid-cols-2 gap-2 p-6 w-full h-full">
              <div className="rounded-xl bg-secondary/60 border border-border/30 flex items-center justify-center text-3xl">👩‍💻</div>
              <div className="rounded-xl bg-secondary/60 border border-border/30 flex items-center justify-center text-3xl">👨‍🎓</div>
              <div className="rounded-xl bg-secondary/60 border border-border/30 flex items-center justify-center text-3xl">🧑‍🏫</div>
              <div className="rounded-xl bg-secondary/60 border border-border/30 flex items-center justify-center text-3xl">👩‍🔬</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Rooms List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wifi className="w-4 h-4 text-success" /> Active Rooms
            <Badge variant="secondary" className="text-[10px]">{rooms.length}</Badge>
          </h2>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-xs bg-card/60 border-border/50" />
          </div>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/30 flex flex-col items-center justify-center py-14 text-center">
            <Video className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-sm font-medium mb-1">No active rooms</h3>
            <p className="text-xs text-muted-foreground mb-4">Start a new meeting or create a custom room</p>
            <Button onClick={createInstantMeeting} size="sm" className="gap-1.5 text-xs">
              <Video className="w-3.5 h-3.5" /> New Meeting
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/rooms/${room.id}`)}
                className="rounded-xl border border-border/50 bg-card/60 p-4 cursor-pointer hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className={`text-[10px] ${topicColors[room.topic] || topicColors.general}`}>
                    {room.topic}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] text-success">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Live
                  </div>
                </div>

                <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors truncate">{room.name}</h3>
                {room.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mb-3">{room.description}</p>
                )}

                <div className="flex items-center justify-between mb-3 text-[11px]">
                  <span className="text-muted-foreground">Code <span className="font-mono text-foreground">{room.meeting_code || "—"}</span></span>
                  {room.meeting_code && (
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={(event) => copyRoomCode(room, event)}>
                      {copiedRoomId === room.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedRoomId === room.id ? "Copied" : "Copy"}
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {room.participant_count}/{room.max_participants}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(room.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {room.created_by === user?.id && (
                      <button
                        onClick={(e) => endRoom(room.id, e)}
                        className="text-[10px] text-destructive hover:underline"
                      >
                        End
                      </button>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Meeting History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" /> Meeting History
            <Badge variant="secondary" className="text-[10px]">{history.length}</Badge>
          </h2>
          <div className="space-y-2">
            {history.map((room) => (
              <div
                key={room.id}
                className="rounded-xl border border-border/50 bg-card/40 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{room.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {room.meeting_code && <span className="font-mono mr-2">{room.meeting_code}</span>}
                    Ended {timeAgo(room.ended_at || room.created_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:text-destructive"
                  onClick={() => deleteHistoryRoom(room.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
