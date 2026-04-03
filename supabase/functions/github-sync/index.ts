import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { username } = await req.json();
    if (!username) throw new Error("GitHub username is required");

    // Fetch profile
    const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "GreXil" },
    });
    if (!profileRes.ok) {
      if (profileRes.status === 404) throw new Error("GitHub user not found");
      throw new Error(`GitHub API error: ${profileRes.status}`);
    }
    const profile = await profileRes.json();

    // Fetch repos (sorted by stars)
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=stars&per_page=20&type=owner`,
      { headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "SkillBridge" } }
    );
    const repos = reposRes.ok ? await reposRes.json() : [];

    // Extract languages from repos
    const languages = [...new Set(repos.map((r: any) => r.language).filter(Boolean))];

    return new Response(JSON.stringify({
      profile: {
        login: profile.login,
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        html_url: profile.html_url,
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
      },
      repos: repos.map((r: any) => ({
        name: r.name,
        description: r.description,
        html_url: r.html_url,
        homepage: r.homepage,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        topics: r.topics || [],
        updated_at: r.updated_at,
      })),
      languages,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("github-sync error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
