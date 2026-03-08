import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PortfolioForm, { type ProjectForm } from "@/components/portfolio/PortfolioForm";
import PortfolioPreview from "@/components/portfolio/PortfolioPreview";
import PortfolioAIChat from "@/components/portfolio/PortfolioAIChat";
import ResumeBuilder from "@/components/portfolio/ResumeBuilder";

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

const PortfolioPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("portfolio_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load projects");
    else setProjects(data || []);
    setLoading(false);
  };

  const handleSave = async (form: ProjectForm, editingId: string | null) => {
    if (!user || !form.title.trim()) return;
    setSaving(true);

    const techStack = form.tech_stack.split(",").map(s => s.trim()).filter(Boolean);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      tech_stack: techStack,
      github_url: form.github_url.trim() || null,
      live_url: form.live_url.trim() || null,
      user_id: user.id,
    };

    if (editingId) {
      const { error } = await supabase.from("portfolio_projects").update(payload).eq("id", editingId);
      if (error) toast.error("Failed to update project");
      else toast.success("Project updated!");
    } else {
      const { error } = await supabase.from("portfolio_projects").insert(payload);
      if (error) toast.error("Failed to add project");
      else toast.success("Project added! 🎉");
    }

    setSaving(false);
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("portfolio_projects").delete().eq("id", id);
    if (error) toast.error("Failed to delete project");
    else { toast.success("Project removed"); fetchProjects(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const portfolioContext = {
    display_name: profile?.display_name || "",
    bio: profile?.bio || null,
    skills: profile?.skills || [],
    projects: projects.map(p => ({
      title: p.title,
      description: p.description,
      tech_stack: p.tech_stack,
    })),
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {previewMode && profile ? (
        <PortfolioPreview
          profile={profile}
          projects={projects}
          onBack={() => setPreviewMode(false)}
          shareUserId={user?.id}
        />
      ) : (
        <PortfolioForm
          profile={profile}
          projects={projects}
          onSave={handleSave}
          onDelete={handleDelete}
          onPreview={() => setPreviewMode(true)}
          onOpenAI={() => setAiChatOpen(true)}
          saving={saving}
          userId={user?.id}
        />
      )}
      <PortfolioAIChat
        portfolioContext={portfolioContext}
        externalOpen={aiChatOpen}
        onExternalOpenChange={setAiChatOpen}
      />
    </div>
  );
};

export default PortfolioPage;
