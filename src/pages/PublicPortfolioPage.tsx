import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PortfolioPreview from "@/components/portfolio/PortfolioPreview";

interface Profile {
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  xp: number;
  streak: number;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
}
// Note: email is intentionally never populated from public_profiles view (PII protection).

interface Project {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
  image_url: string | null;
  created_at: string;
}

const PublicPortfolioPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) { setNotFound(true); setLoading(false); return; }

    const fetchData = async () => {
      const [profileRes, projectsRes] = await Promise.all([
        supabase.from("public_profiles" as any).select("*").eq("user_id", userId).single(),
        supabase.from("portfolio_projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      if (profileRes.error || !profileRes.data) {
        setNotFound(true);
      } else {
        setProfile(profileRes.data as Profile);
        setProjects(projectsRes.data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Portfolio Not Found</h1>
        <p className="text-sm text-muted-foreground">This portfolio doesn't exist or the user hasn't created one yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <PortfolioPreview profile={profile} projects={projects} />
    </div>
  );
};

export default PublicPortfolioPage;
