import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(authHeader.replace("Bearer ", ""));
    
    if (authError || !user) throw new Error("Unauthorized");
    
    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    
    if (!roleCheck) throw new Error("Admin access required");

    // Gather stats in parallel
    const [
      { count: totalUsers },
      { count: totalCourses },
      { count: totalProblems },
      { count: totalSubmissions },
      { count: totalEnrollments },
      { count: totalInternships },
      { count: totalForumPosts },
      { count: totalInterviews },
      { data: recentUsers },
      { data: topUsers },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("coding_problems").select("*", { count: "exact", head: true }),
      supabase.from("coding_submissions").select("*", { count: "exact", head: true }),
      supabase.from("course_enrollments").select("*", { count: "exact", head: true }),
      supabase.from("internships").select("*", { count: "exact", head: true }),
      supabase.from("forum_posts").select("*", { count: "exact", head: true }),
      supabase.from("mock_interviews").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("id, user_id, display_name, email, xp, streak, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("id, user_id, display_name, xp, streak").order("xp", { ascending: false }).limit(10),
    ]);

    return new Response(JSON.stringify({
      overview: {
        totalUsers: totalUsers || 0,
        totalCourses: totalCourses || 0,
        totalProblems: totalProblems || 0,
        totalSubmissions: totalSubmissions || 0,
        totalEnrollments: totalEnrollments || 0,
        totalInternships: totalInternships || 0,
        totalForumPosts: totalForumPosts || 0,
        totalInterviews: totalInterviews || 0,
      },
      recentUsers: recentUsers || [],
      topUsers: topUsers || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-stats error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
