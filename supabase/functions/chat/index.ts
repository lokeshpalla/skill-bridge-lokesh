import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const LANG_NAMES: Record<string, string> = {
      "hi-IN": "Hindi (हिन्दी)", "bn-IN": "Bengali (বাংলা)", "ta-IN": "Tamil (தமிழ்)",
      "te-IN": "Telugu (తెలుగు)", "mr-IN": "Marathi (मराठी)", "gu-IN": "Gujarati (ગુજરાતી)",
      "kn-IN": "Kannada (ಕನ್ನಡ)", "ml-IN": "Malayalam (മലയാളം)", "pa-IN": "Punjabi (ਪੰਜਾਬੀ)",
      "or-IN": "Odia (ଓଡ଼ିଆ)", "as-IN": "Assamese (অসমীয়া)", "ur-IN": "Urdu (اردو)",
      "ne-IN": "Nepali (नेपाली)", "sa-IN": "Sanskrit (संस्कृतम्)",
    };
    const langName = language ? LANG_NAMES[language] : null;
    const languageInstruction = langName
      ? `\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in ${langName}. Do NOT respond in English. Every single word of your response must be in ${langName}. Use the ${langName} script/alphabet. This is mandatory and non-negotiable. Even code explanations should have surrounding text in ${langName}.`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are SkillBridge Nexus AI Assistant — a helpful, encouraging learning companion for developers. You help with:
- Coding questions (algorithms, data structures, system design)
- Career advice (resume tips, interview prep, job search)
- Course recommendations and learning paths
- Portfolio and project guidance
- Debugging help and code review

Keep responses concise, friendly, and actionable. Use code examples when helpful. Use emojis sparingly for encouragement.
${languageInstruction}`,
          },
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
