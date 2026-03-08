import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  duration: string | null;
  image_emoji: string | null;
  created_at: string;
}

const CATEGORIES = ["General", "Web Development", "Data Science", "Mobile", "DevOps", "AI/ML", "Cybersecurity"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "General", difficulty: "Beginner", duration: "", image_emoji: "📚" });

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from("courses").select("id, title, description, category, difficulty, duration, image_emoji, created_at").order("created_at", { ascending: false });
    setCourses(data || []);
    setLoading(false);
  };

  const resetForm = () => setForm({ title: "", description: "", category: "General", difficulty: "Beginner", duration: "", image_emoji: "📚" });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const { error } = await supabase.from("courses").insert({ title: form.title, description: form.description || null, category: form.category, difficulty: form.difficulty, duration: form.duration || null, image_emoji: form.image_emoji || "📚" });
    if (error) { toast.error("Failed to create course"); return; }
    toast.success("Course created");
    setShowCreate(false);
    resetForm();
    fetchCourses();
  };

  const handleEdit = (c: Course) => {
    setEditId(c.id);
    setForm({ title: c.title, description: c.description || "", category: c.category, difficulty: c.difficulty, duration: c.duration || "", image_emoji: c.image_emoji || "📚" });
  };

  const handleUpdate = async () => {
    if (!editId || !form.title.trim()) return;
    const { error } = await supabase.from("courses").update({ title: form.title, description: form.description || null, category: form.category, difficulty: form.difficulty, duration: form.duration || null, image_emoji: form.image_emoji || "📚" }).eq("id", editId);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Course updated");
    setEditId(null);
    resetForm();
    fetchCourses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Course deleted");
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const filtered = courses.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading courses...</p>;

  const FormFields = () => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Emoji" value={form.image_emoji} onChange={e => setForm(f => ({ ...f, image_emoji: e.target.value }))} className="w-16" />
        <Input placeholder="Course title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="flex-1" />
      </div>
      <Textarea placeholder="Description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
      <div className="flex gap-2">
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground flex-1">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground flex-1">
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <Input placeholder="Duration" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="flex-1" />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <span className="text-xs text-muted-foreground">{filtered.length} courses</span>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="ml-auto gap-1"><Plus className="w-3.5 h-3.5" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Course</DialogTitle></DialogHeader>
            <FormFields />
            <Button onClick={handleCreate} className="w-full">Create Course</Button>
          </DialogContent>
        </Dialog>
      </div>

      {editId && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Editing Course</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditId(null); resetForm(); }}><X className="w-4 h-4" /></Button>
          </div>
          <FormFields />
          <Button onClick={handleUpdate} className="gap-1"><Save className="w-3.5 h-3.5" /> Save Changes</Button>
        </motion.div>
      )}

      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-sm"><span className="mr-1">{c.image_emoji}</span>{c.title}</TableCell>
                <TableCell className="text-xs">{c.category}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{c.difficulty}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.duration || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(c)}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">No courses found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
