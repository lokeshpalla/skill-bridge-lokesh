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
        setProfile(profileRes.data as unknown as Profile);
        setProjects(projectsRes.data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // Inject ProfilePage / Person JSON-LD structured data
  useEffect(() => {
    if (!profile || !userId) return;
    const existing = document.getElementById("portfolio-json-ld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "portfolio-json-ld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: profile.display_name,
        description: profile.bio || `${profile.display_name}'s developer portfolio on Skill Bridge.`,
        image: profile.avatar_url || undefined,
        knowsAbout: profile.skills,
        url: `https://grexil-lokesh01.lovable.app/portfolio/${userId}`,
        sameAs: [profile.github_url, profile.linkedin_url, profile.portfolio_url].filter(Boolean),
      },
    });
    document.head.appendChild(script);

    // Per-route title + description
    const pageTitle = `${profile.display_name} — Developer Portfolio | Skill Bridge`;
    const pageDesc = (profile.bio || `${profile.display_name}'s developer portfolio with projects and skills on Skill Bridge.`).slice(0, 160);
    document.title = pageTitle;
    const setMeta = (attr: string, key: string, val: string) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, key); document.head.appendChild(tag); }
      tag.setAttribute("content", val);
    };
    setMeta("name", "description", pageDesc);
    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", pageDesc);

    return () => { script.remove(); };
  }, [profile, userId]);

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
