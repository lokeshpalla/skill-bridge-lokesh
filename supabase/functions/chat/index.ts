import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build personalized system prompt with user context
    let contextBlock = "";
    if (userContext) {
      const parts: string[] = [];
      if (userContext.displayName) parts.push(`User: ${userContext.displayName}`);
      if (userContext.xp !== undefined) parts.push(`XP: ${userContext.xp}`);
      if (userContext.streak !== undefined) parts.push(`Current streak: ${userContext.streak} days`);
      if (userContext.skills?.length) parts.push(`Skills: ${userContext.skills.join(", ")}`);
      if (userContext.enrolledCourses?.length) parts.push(`Enrolled courses: ${userContext.enrolledCourses.join(", ")}`);
      if (userContext.solvedCount !== undefined) parts.push(`Problems solved: ${userContext.solvedCount}`);
      if (parts.length > 0) {
        contextBlock = `\n\nCURRENT USER PROFILE:\n${parts.join("\n")}\n\nUse this information to personalize your responses. Reference their skills, progress, and enrolled courses when relevant. Encourage them based on their streak and XP.`;
      }
    }

    const systemPrompt = `You are GreXil Nexus AI Assistant — a helpful, encouraging learning companion for developers. You help with:
- Coding questions (algorithms, data structures, system design)
- Career advice (resume tips, interview prep, job search)
- Course recommendations and learning paths
- Portfolio and project guidance
- Debugging help and code review

Keep responses concise, friendly, and actionable. Use code examples when helpful. Use emojis sparingly for encouragement.${contextBlock}

CRITICAL LANGUAGE INSTRUCTION: Automatically detect what language the user is writing in. Reply ENTIRELY in the SAME language and script the user used. If they write in Hindi (Devanagari), reply in Hindi. If in Tamil script, reply in Tamil. If in Bengali, reply in Bengali. If in English, reply in English. Match the user's language exactly — do not default to English unless the user writes in English. Even code explanations should have surrounding text in the user's language.

At the very end of your response, on a new line, add a language tag in the format: [LANG:xx-XX] where xx-XX is the BCP-47 code of the language you responded in. Examples: [LANG:en-IN], [LANG:hi-IN], [LANG:ta-IN], [LANG:bn-IN], [LANG:te-IN], [LANG:mr-IN], [LANG:gu-IN], [LANG:kn-IN], [LANG:ml-IN], [LANG:pa-IN], [LANG:or-IN], [LANG:ur-IN], [LANG:ne-IN], [LANG:sa-IN]. This tag is used for text-to-speech and must always be present.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
