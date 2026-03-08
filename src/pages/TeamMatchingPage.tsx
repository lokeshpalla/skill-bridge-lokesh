import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Search, UserPlus, Sparkles, Zap,
  HandshakeIcon, Plus, Trash2, UserMinus, Eye, Link, Check
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface GroupProject {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  tech_stack: string[];
  max_members: number;
  status: string;
  created_at: string;
  owner_name?: string;
  member_count?: number;
  skill_match?: number;
  is_member?: boolean;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name?: string;
}

export default function TeamMatchingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<GroupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "best-match" | "needs-you">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "", description: "", tech_stack: "", max_members: 4,
  });
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [deleteProject, setDeleteProject] = useState<GroupProject | null>(null);
  const [membersProject, setMembersProject] = useState<GroupProject | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const userSkills = (profile?.skills || []).map(s => s.toLowerCase());

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data: projectsData } = await supabase
      .from("group_projects")
      .select("*")
      .eq("status", "recruiting")
      .order("created_at", { ascending: false });

    if (!projectsData) { setLoading(false); return; }

    const enriched = await Promise.all(
      projectsData.map(async (p) => {
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", p.owner_id)
          .single();

        const { count } = await supabase
          .from("group_project_members")
          .select("*", { count: "exact", head: true })
          .eq("project_id", p.id);

        // Check if current user is already a member
        let isMember = false;
        if (user) {
          const { count: memberCount } = await supabase
            .from("group_project_members")
            .select("*", { count: "exact", head: true })
            .eq("project_id", p.id)
            .eq("user_id", user.id);
          isMember = (memberCount || 0) > 0;
        }

        const techLower = (p.tech_stack || []).map((t: string) => t.toLowerCase());
        const matchCount = userSkills.filter(s => techLower.includes(s)).length;
        const skillMatch = techLower.length > 0
          ? Math.round((matchCount / techLower.length) * 100)
          : 0;

        return {
          ...p,
          tech_stack: p.tech_stack || [],
          owner_name: ownerProfile?.display_name || "Unknown",
          member_count: (count || 0) + 1,
          skill_match: skillMatch,
          is_member: isMember,
        };
      })
    );

    setProjects(enriched);
    setLoading(false);
  };

  const handleJoin = async (projectId: string) => {
    if (!user) return;
    setJoiningId(projectId);
    const { error } = await supabase
      .from("group_project_members")
      .insert({ project_id: projectId, user_id: user.id, role: "member" });

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already joined this team!");
      } else {
        toast.error("Failed to join team");
      }
    } else {
      toast.success("You've joined the team! 🎉");
      fetchProjects();
    }
    setJoiningId(null);
  };

  const handleLeave = async (projectId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("group_project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to leave team");
    } else {
      toast.success("You've left the team");
      fetchProjects();
    }
  };

  const handleDelete = async () => {
    if (!deleteProject || !user) return;
    // Delete all members first, then the project
    await supabase
      .from("group_project_members")
      .delete()
      .eq("project_id", deleteProject.id);

    const { error } = await supabase
      .from("group_projects")
      .delete()
      .eq("id", deleteProject.id)
      .eq("owner_id", user.id);

    if (error) {
      toast.error("Failed to delete project");
    } else {
      toast.success("Project deleted");
      fetchProjects();
    }
    setDeleteProject(null);
  };

  const handleCreate = async () => {
    if (!user || !newProject.title.trim()) return;
    const techStack = newProject.tech_stack
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("group_projects")
      .insert({
        title: newProject.title.trim(),
        description: newProject.description.trim() || null,
        tech_stack: techStack,
        max_members: newProject.max_members,
        owner_id: user.id,
        status: "recruiting",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create project");
      return;
    }
    toast.success("Project created! Others can now find & join your team.");
    setCreateOpen(false);
    setNewProject({ title: "", description: "", tech_stack: "", max_members: 4 });
    fetchProjects();
  };

  const fetchMembers = async (project: GroupProject) => {
    setMembersProject(project);
    setMembersLoading(true);
    const { data } = await supabase
      .from("group_project_members")
      .select("*")
      .eq("project_id", project.id);

    if (data) {
      const enriched = await Promise.all(
        data.map(async (m) => {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", m.user_id)
            .single();
          return { ...m, display_name: prof?.display_name || "Unknown" };
        })
      );
      setMembers(enriched);
    }
    setMembersLoading(false);
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    setRemovingMemberId(memberId);
    const { error } = await supabase
      .from("group_project_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast.error("Failed to remove member");
    } else {
      toast.success("Member removed from team");
      setMembers(prev => prev.filter(m => m.id !== memberId));
      fetchProjects();
    }
    setRemovingMemberId(null);
  };

  const filtered = projects
    .filter(p => {
      if (search) {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) ||
          p.tech_stack.some(t => t.toLowerCase().includes(q)) ||
          (p.description || "").toLowerCase().includes(q);
      }
      return true;
    })
    .filter(p => {
      if (filter === "best-match") return (p.skill_match || 0) >= 50;
      if (filter === "needs-you") return (p.skill_match || 0) > 0 && p.member_count! < p.max_members;
      return true;
    })
    .sort((a, b) => {
      if (filter === "best-match" || filter === "needs-you") {
        return (b.skill_match || 0) - (a.skill_match || 0);
      }
      return 0;
    });

  const getMatchColor = (match: number) => {
    if (match >= 75) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (match >= 50) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (match > 0) return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    return "text-muted-foreground bg-muted/50 border-border";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <HandshakeIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Find a Team</h1>
            <p className="text-sm text-muted-foreground">
              Match with teams that need your skills for projects & hackathons
            </p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2">
              <Plus className="w-4 h-4" /> Post a Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Team Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Project / Hackathon Name</Label>
                <Input
                  placeholder="e.g. AI Resume Builder for HackFest 2026"
                  value={newProject.title}
                  onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="What are you building? What kind of teammates do you need?"
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Required Skills (comma separated)</Label>
                <Input
                  placeholder="e.g. React, Node.js, Python, Figma"
                  value={newProject.tech_stack}
                  onChange={e => setNewProject({ ...newProject, tech_stack: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Team Size</Label>
                <Select
                  value={String(newProject.max_members)}
                  onValueChange={v => setNewProject({ ...newProject, max_members: parseInt(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 8].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} members</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!newProject.title.trim()}>
                Create & Start Recruiting
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skill Match Banner */}
      {userSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4 flex-wrap"
        >
          <Zap className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Smart Match active — your skills: {" "}
              {userSkills.slice(0, 5).map(s => (
                <Badge key={s} variant="secondary" className="mr-1 text-xs">{s}</Badge>
              ))}
              {userSkills.length > 5 && (
                <span className="text-xs text-muted-foreground">+{userSkills.length - 5} more</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Teams are ranked by how well your skills match their needs
            </p>
          </div>
        </motion.div>
      )}

      {userSkills.length === 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Add your skills for smart matching</p>
            <p className="text-xs text-muted-foreground">
              Go to{" "}
              <button onClick={() => navigate("/settings")} className="text-primary underline">
                Settings
              </button>{" "}
              to add skills and get personalized team recommendations.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by project, skill, or tech..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "best-match", "needs-you"] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="text-xs"
            >
              {f === "all" ? "All Teams" : f === "best-match" ? "Best Match" : "Needs You"}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No teams found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Try a different search" : "Be the first to post a project!"}
            </p>
            <Button onClick={() => setCreateOpen(true)} variant="default" className="gap-2">
              <Plus className="w-4 h-4" /> Post a Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, i) => {
            const isFull = project.member_count! >= project.max_members;
            const isOwner = project.owner_id === user?.id;
            const isMember = project.is_member;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/50 hover:border-primary/30 transition-all h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={getMatchColor(project.skill_match || 0)}
                      >
                        {(project.skill_match || 0) > 0
                          ? `${project.skill_match}% match`
                          : "No match data"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {isMember && (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Joined</Badge>
                        )}
                        {isFull && (
                          <Badge variant="secondary" className="text-xs">Full</Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base mt-2">{project.title}</CardTitle>
                    {project.description && (
                      <CardDescription className="text-xs line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-3">
                      {/* Tech stack */}
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech_stack.map(tech => {
                          const isMatch = userSkills.includes(tech.toLowerCase());
                          return (
                            <Badge
                              key={tech}
                              variant="outline"
                              className={`text-[10px] ${
                                isMatch
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-muted/50 text-muted-foreground"
                              }`}
                            >
                              {isMatch && <Sparkles className="w-2.5 h-2.5 mr-1" />}
                              {tech}
                            </Badge>
                          );
                        })}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {project.member_count}/{project.max_members} members
                        </div>
                        <span>by {project.owner_name}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {isOwner ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full text-xs gap-1.5"
                            onClick={() => fetchMembers(project)}
                          >
                            <Eye className="w-3.5 h-3.5" /> View & Manage Members
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs gap-1.5"
                            onClick={() => {
                              const joinUrl = `${window.location.origin}/teams?join=${project.id}`;
                              navigator.clipboard.writeText(joinUrl);
                              toast.success("Join link copied to clipboard!", { icon: "🔗" });
                            }}
                          >
                            <Link className="w-3.5 h-3.5" /> Share Join Link
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full text-xs gap-1.5"
                            onClick={() => setDeleteProject(project)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Project
                          </Button>
                        </>
                      ) : isMember ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleLeave(project.id)}
                        >
                          <UserMinus className="w-3.5 h-3.5" /> Leave Team
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full text-xs gap-1.5"
                          disabled={isFull || joiningId === project.id}
                          onClick={() => handleJoin(project.id)}
                        >
                          {isFull ? (
                            "Team Full"
                          ) : joiningId === project.id ? (
                            "Joining..."
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" /> Join Team
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProject} onOpenChange={(open) => !open && setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProject?.title}"? This will remove all team members and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Management Dialog */}
      <Dialog open={!!membersProject} onOpenChange={(open) => !open && setMembersProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Members — {membersProject?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {/* Owner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  👑
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{membersProject?.owner_name}</p>
                  <p className="text-xs text-muted-foreground">Team Leader</p>
                </div>
              </div>
            </div>

            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No members have joined yet</p>
            ) : (
              members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {member.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.display_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 text-xs"
                    disabled={removingMemberId === member.id}
                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    {removingMemberId === member.id ? "Removing..." : "Remove"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
