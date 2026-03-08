import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, Plus, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CourseNotesProps {
  courseId: number;
  moduleIndex: number;
}

interface Note {
  id: string;
  timestamp_seconds: number;
  note: string;
  created_at: string;
}

const formatTimestamp = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const CourseNotes = ({ courseId, moduleIndex }: CourseNotesProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotes();
  }, [user, courseId, moduleIndex]);

  const fetchNotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("course_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("module_index", moduleIndex)
      .order("timestamp_seconds", { ascending: true });
    setNotes((data as Note[]) || []);
    setLoading(false);
  };

  const parseTimestamp = (t: string): number => {
    const parts = t.split(":").map(Number);
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    return 0;
  };

  const handleAdd = async () => {
    if (!user || !newNote.trim()) return;
    const seconds = parseTimestamp(timestamp);
    const { error } = await supabase.from("course_notes").insert({
      user_id: user.id,
      course_id: courseId,
      module_index: moduleIndex,
      timestamp_seconds: seconds,
      note: newNote.trim(),
    });
    if (error) toast.error("Failed to save note");
    else {
      setNewNote("");
      setTimestamp("");
      fetchNotes();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("course_notes").delete().eq("id", id);
    fetchNotes();
  };

  if (!user) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40">
        <Bookmark className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Notes & Bookmarks</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{notes.length} saved</span>
      </div>

      {/* Add note form */}
      <div className="px-4 py-3 border-b border-border/20 flex gap-2">
        <Input
          placeholder="0:00"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          className="w-16 text-xs text-center h-8"
        />
        <Input
          placeholder="Add a note at this timestamp..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 h-8 text-xs"
        />
        <Button variant="default" size="sm" className="h-8 gap-1" onClick={handleAdd} disabled={!newNote.trim()}>
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      {/* Notes list */}
      <div className="max-h-48 overflow-y-auto divide-y divide-border/10">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No notes yet. Add timestamps and notes while watching!
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-secondary/20 transition-colors group">
              <span className="flex items-center gap-1 text-[11px] text-primary font-mono mt-0.5 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {formatTimestamp(n.timestamp_seconds)}
              </span>
              <p className="text-xs text-foreground flex-1 leading-relaxed">{n.note}</p>
              <button
                onClick={() => handleDelete(n.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseNotes;
