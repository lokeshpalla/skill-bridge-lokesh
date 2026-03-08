import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Users, Plus, Search, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  name: string;
  description: string | null;
  topic: string;
  max_participants: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  participant_count?: number;
}

export default function RoomsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
      // Get participant counts
      const roomsWithCounts = await Promise.all(
        (roomsData as Room[]).map(async (room) => {
          const { count } = await supabase
            .from("room_participants")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id)
            .is("left_at", null);
          return { ...room, participant_count: count || 0 };
        })
      );
      setRooms(roomsWithCounts);
    }
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Collaboration Rooms</h1>
            <p className="text-sm text-muted-foreground">Join live sessions with video, audio & screen sharing</p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2">
              <Plus className="w-4 h-4" /> Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Collaboration Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Room Name</Label>
                <Input
                  placeholder="e.g. React Study Group"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="What will you work on?"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  rows={2}
                />
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
                  <Select
                    value={String(newRoom.max_participants)}
                    onValueChange={(v) => setNewRoom({ ...newRoom, max_participants: parseInt(v) })}
                  >
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
                Create & Join Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search rooms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredRooms.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Video className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No active rooms</h3>
            <p className="text-sm text-muted-foreground mb-4">Create a room to start collaborating with others</p>
            <Button onClick={() => setCreateOpen(true)} variant="default" className="gap-2">
              <Plus className="w-4 h-4" /> Create First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <Card
              key={room.id}
              className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className={topicColors[room.topic] || topicColors.general}>
                    {room.topic}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Wifi className="w-3 h-3 text-green-400" />
                    Live
                  </div>
                </div>
                <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors">
                  {room.name}
                </CardTitle>
                {room.description && (
                  <CardDescription className="text-xs line-clamp-2">{room.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {room.participant_count}/{room.max_participants}
                  </div>
                  <Button size="sm" variant="secondary" className="text-xs">
                    Join Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
