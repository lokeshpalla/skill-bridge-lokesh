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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle specific admin actions
    if (req.method === "POST") {
      const body = await req.json();

      if (body.action === "update_role") {
        const { target_user_id, new_role } = body;
        // Delete existing role, insert new one
        await supabase.from("user_roles").delete().eq("user_id", target_user_id);
        const { error } = await supabase.from("user_roles").insert({ user_id: target_user_id, role: new_role });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "delete_post") {
        const { error } = await supabase.from("forum_posts").delete().eq("id", body.post_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "delete_comment") {
        const { error } = await supabase.from("forum_comments").delete().eq("id", body.comment_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "delete_internship") {
        // Delete applications first, then the internship
        await supabase.from("internship_applications").delete().eq("internship_id", body.internship_id);
        const { error } = await supabase.from("internships").delete().eq("id", body.internship_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "update_application_status") {
        const { error } = await supabase.from("internship_applications").update({ status: body.new_status }).eq("id", body.application_id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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
      { count: totalApplications },
      { count: totalMessages },
      { data: recentUsers },
      { data: topUsers },
      { data: allUsersWithRoles },
      { data: recentPosts },
      { data: recentComments },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("coding_problems").select("*", { count: "exact", head: true }),
      supabase.from("coding_submissions").select("*", { count: "exact", head: true }),
      supabase.from("course_enrollments").select("*", { count: "exact", head: true }),
      supabase.from("internships").select("*", { count: "exact", head: true }),
      supabase.from("forum_posts").select("*", { count: "exact", head: true }),
      supabase.from("mock_interviews").select("*", { count: "exact", head: true }),
      supabase.from("internship_applications").select("*", { count: "exact", head: true }),
      supabase.from("direct_messages").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("id, user_id, display_name, email, xp, streak, created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("id, user_id, display_name, xp, streak").order("xp", { ascending: false }).limit(10),
      supabase.from("profiles").select("id, user_id, display_name, email, xp, streak, skills, created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("forum_posts").select("id, title, content, category, user_id, upvotes, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("forum_comments").select("id, content, user_id, post_id, upvotes, created_at").order("created_at", { ascending: false }).limit(50),
    ]);

    // Fetch roles for all users
    const userIds = (allUsersWithRoles || []).map((u: any) => u.user_id);
    const { data: userRoles } = userIds.length > 0
      ? await supabase.from("user_roles").select("user_id, role").in("user_id", userIds)
      : { data: [] };

    // Enrich users with roles
    const usersEnriched = (allUsersWithRoles || []).map((u: any) => ({
      ...u,
      role: (userRoles || []).find((r: any) => r.user_id === u.user_id)?.role || "student",
    }));

    // Enrich posts with user names
    const postUserIds = [...new Set((recentPosts || []).map((p: any) => p.user_id))];
    const { data: postProfiles } = postUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, display_name").in("user_id", postUserIds)
      : { data: [] };

    const postsEnriched = (recentPosts || []).map((p: any) => ({
      ...p,
      display_name: (postProfiles || []).find((pr: any) => pr.user_id === p.user_id)?.display_name || "Unknown",
    }));

    // Role distribution
    const roleCounts: Record<string, number> = { student: 0, mentor: 0, recruiter: 0, admin: 0 };
    (userRoles || []).forEach((r: any) => {
      if (roleCounts[r.role] !== undefined) roleCounts[r.role]++;
    });

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
        totalApplications: totalApplications || 0,
        totalMessages: totalMessages || 0,
      },
      roleCounts,
      recentUsers: recentUsers || [],
      topUsers: topUsers || [],
      allUsers: usersEnriched,
      recentPosts: postsEnriched,
      recentComments: recentComments || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-stats error:", e);
    console.error("admin-stats error:", e); return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
