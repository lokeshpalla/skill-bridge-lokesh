import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(topic: string, skills: string[]): string {
  const stackInfo = skills.length > 0
    ? `\n\nThe candidate's tech stack/skills: ${skills.join(", ")}. Tailor your questions to their specific technologies and experience level.`
    : "";

  const base: Record<string, string> = {
    general: `You are a senior tech interviewer conducting a mock interview. Ask one question at a time. Topics: data structures, algorithms, system design, behavioral. After the candidate answers, give brief feedback (strengths, improvements) then ask the next question. Be encouraging but honest.`,
    frontend: `You are a senior frontend engineer interviewer. Focus on: React, TypeScript, CSS, browser APIs, performance optimization, accessibility. Ask one question at a time, give feedback after each answer.`,
    backend: `You are a senior backend engineer interviewer. Focus on: APIs, databases, system design, scalability, security, microservices. Ask one question at a time, give feedback.`,
    dsa: `You are a DSA interview expert. Present coding problems one at a time (Easy→Hard progression). Ask the candidate to explain their approach before coding. Evaluate: time/space complexity, edge cases, code quality.`,
    behavioral: `You are an HR interviewer focusing on behavioral questions using the STAR method. Ask about: teamwork, leadership, conflict resolution, problem-solving experiences. Give feedback on answer structure and impact.`,
  };

  const scoringInstruction = `

IMPORTANT: When the user says "end interview" or asks for final feedback, you MUST respond with a structured JSON scoring block wrapped in \`\`\`json code fence, followed by detailed text feedback.

The JSON block MUST have this exact structure:
\`\`\`json
{
  "scores": {
    "technical_knowledge": <0-100>,
    "problem_solving": <0-100>,
    "communication": <0-100>,
    "code_quality": <0-100>,
    "overall": <0-100>
  },
  "summary": "<one-line summary>"
}
\`\`\`

After the JSON block, provide detailed written feedback covering:
1. **Strengths** — what the candidate did well
2. **Areas to Improve** — specific actionable advice
3. **Recommended Resources** — topics or skills to study next

The "overall" score should be a weighted average: Technical (30%), Problem Solving (30%), Communication (20%), Code Quality (20%).`;

  return (base[topic] || base.general) + stackInfo + scoringInstruction;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, topic = "general", skills = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: allowed } = await adminClient.rpc("check_ai_rate_limit", {
      _user_id: user.id, _endpoint: "mock-interview", _max_requests: 20, _window_minutes: 60,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 20 interview messages per hour." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(topic, skills);

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
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
