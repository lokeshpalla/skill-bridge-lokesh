import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather user context
    const [profileRes, enrollmentsRes, submissionsRes, pathsRes, coursesRes] = await Promise.all([
      supabase.from("profiles").select("skills, xp, streak").eq("user_id", user.id).single(),
      supabase.from("course_enrollments").select("course_id, progress").eq("user_id", user.id),
      supabase.from("coding_submissions").select("problem_id, status, language").eq("user_id", user.id).eq("status", "accepted"),
      supabase.from("learning_paths").select("id, title, tags, difficulty"),
      supabase.from("courses").select("id, title, category, difficulty"),
    ]);

    const profile = profileRes.data;
    const enrollments = enrollmentsRes.data || [];
    const submissions = submissionsRes.data || [];
    const paths = pathsRes.data || [];
    const courses = coursesRes.data || [];

    const prompt = `You are a learning advisor for a coding education platform. Based on the user's profile, recommend the best learning paths and courses.

User Profile:
- Skills: ${JSON.stringify(profile?.skills || [])}
- XP: ${profile?.xp || 0}
- Streak: ${profile?.streak || 0} days
- Enrolled courses: ${enrollments.length} (completed ${enrollments.filter(e => e.progress >= 100).length})
- Problems solved: ${submissions.length}
- Languages used: ${[...new Set(submissions.map(s => s.language))].join(", ") || "none"}

Available Learning Paths:
${paths.map(p => `- ${p.title} (${p.difficulty}) [tags: ${(p.tags as string[]).join(", ")}]`).join("\n")}

Available Courses:
${courses.map(c => `- ${c.title} (${c.difficulty}, ${c.category})`).join("\n")}

Provide recommendations as JSON with this structure:
{
  "recommended_paths": ["path title 1", "path title 2", "path title 3"],
  "recommended_courses": ["course title 1", "course title 2", "course title 3"],
  "reasoning": "Brief explanation of why these were recommended",
  "next_steps": ["Actionable step 1", "Actionable step 2", "Actionable step 3"]
}

Return ONLY valid JSON, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    // Parse JSON from response (handle possible markdown wrapping)
    let recommendations;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      recommendations = JSON.parse(cleaned);
    } catch {
      recommendations = {
        recommended_paths: paths.slice(0, 3).map((p: any) => p.title),
        recommended_courses: courses.slice(0, 3).map((c: any) => c.title),
        reasoning: "Based on your current progress, here are some suggestions to continue your learning journey.",
        next_steps: ["Complete your current courses", "Try a new coding challenge", "Explore a new topic"],
      };
    }

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
