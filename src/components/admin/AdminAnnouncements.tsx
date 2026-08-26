import { useState, useEffect } from "react";
import { Megaphone, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  active: boolean;
  created_at: string;
}

const PRIORITIES = ["normal", "important", "urgent"];
const priorityColors: Record<string, string> = {
  normal: "bg-secondary text-secondary-foreground",
  important: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "normal" });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(100);
    setAnnouncements((data as Announcement[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error("Title and content required"); return; }
    const { error } = await supabase.from("announcements").insert({
      title: form.title,
      content: form.content,
      priority: form.priority,
      created_by: user?.id,
    } as any);
    if (error) { toast.error("Failed to create"); return; }
    toast.success("Announcement published");
    setShowCreate(false);
    setForm({ title: "", content: "", priority: "normal" });
    fetchAnnouncements();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("announcements").update({ active: !current } as any).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !current } : a));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted");
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{announcements.length} announcements</span>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="w-3.5 h-3.5" /> New Announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Announcement title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Textarea placeholder="Content..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground">
                {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
              <Button onClick={handleCreate} className="w-full gap-1"><Megaphone className="w-4 h-4" /> Publish</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-border/50 bg-card/60">
          <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border p-4 ${a.active ? "border-border/50 bg-card/60" : "border-border/30 bg-card/30 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold">{a.title}</h4>
                    <Badge className={`text-[10px] ${priorityColors[a.priority] || ""}`}>{a.priority}</Badge>
                    {!a.active && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{a.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(a.id, a.active)}>
                    {a.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
