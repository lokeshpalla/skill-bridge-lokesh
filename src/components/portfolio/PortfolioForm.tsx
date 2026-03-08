import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Github, Globe, User, Trash2, Edit2, ExternalLink, FolderKanban, Eye, Share2, Copy, Check, Sparkles,
} from "lucide-react";

interface Profile {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  xp: number;
  streak: number;
  github_url: string | null;
  portfolio_url: string | null;
}

interface PortfolioProject {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
  image_url: string | null;
  created_at: string;
}

interface PortfolioFormProps {
  profile: Profile | null;
  projects: PortfolioProject[];
  onSave: (form: ProjectForm, editingId: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPreview: () => void;
  onOpenAI?: () => void;
  saving: boolean;
  userId?: string;
}

export interface ProjectForm {
  title: string;
  description: string;
  tech_stack: string;
  github_url: string;
  live_url: string;
}

const PortfolioForm = ({ profile, projects, onSave, onDelete, onPreview, onOpenAI, saving, userId }: PortfolioFormProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<ProjectForm>({
    title: "", description: "", tech_stack: "", github_url: "", live_url: "",
  });

  const handleShareLink = async () => {
    if (!userId) return;
    const url = `${window.location.origin}/portfolio/${userId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", description: "", tech_stack: "", github_url: "", live_url: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: PortfolioProject) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description || "",
      tech_stack: (p.tech_stack || []).join(", "),
      github_url: p.github_url || "",
      live_url: p.live_url || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    await onSave(form, editingId);
    setDialogOpen(false);
  };

  return (
    <>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Portfolio</h1>
            <p className="text-sm text-muted-foreground">Showcase your best work</p>
          </div>
        </div>
        <div className="flex gap-2">
          {userId && projects.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShareLink}>
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share"}
            </Button>
          )}
          {projects.length > 0 && (
            <Button variant="glow" size="sm" className="gap-1.5" onClick={onPreview}>
              <Eye className="w-4 h-4" /> Preview & Download
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onOpenAI}>
            <Sparkles className="w-4 h-4" /> AI Assistant
          </Button>
          <Button variant="default" size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Project
          </Button>
        </div>
      </motion.div>

      {/* Profile card */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 bg-card/60 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{profile.display_name}</h2>
              <p className="text-xs text-muted-foreground">
                {profile.xp} XP • {profile.streak} day streak
                {profile.bio && ` • ${profile.bio}`}
              </p>
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.skills.slice(0, 6).map((s) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{s}</span>
                  ))}
                  {profile.skills.length > 6 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      +{profile.skills.length - 6}
                    </span>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <Github className="w-3 h-3" /> GitHub
                  </a>
                )}
                {profile.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Projects */}
      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-dashed border-border/50 bg-card/30 p-12 text-center"
        >
          <FolderKanban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first project to start building your portfolio
          </p>
          <Button variant="default" size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Your First Project
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="rounded-xl border border-border/50 bg-card/60 p-5 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-xl flex-shrink-0">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{project.title}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(project)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(project.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{project.description}</p>
                  )}
                  {project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {project.tech_stack.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0.5">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-3 gap-1">
                          <Github className="w-3 h-3" /> Code
                        </Button>
                      </a>
                    )}
                    {project.live_url && (
                      <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] px-3 gap-1">
                          <ExternalLink className="w-3 h-3" /> Demo
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                placeholder="e.g. AI Resume Builder"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this project do?"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Tech Stack (comma separated)</Label>
              <Input
                placeholder="e.g. React, Node.js, PostgreSQL"
                value={form.tech_stack}
                onChange={e => setForm({ ...form, tech_stack: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input
                  placeholder="https://github.com/..."
                  value={form.github_url}
                  onChange={e => setForm({ ...form, github_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Live Demo URL</Label>
                <Input
                  placeholder="https://..."
                  value={form.live_url}
                  onChange={e => setForm({ ...form, live_url: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={!form.title.trim() || saving}
            >
              {saving ? "Saving..." : editingId ? "Update Project" : "Add Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PortfolioForm;
