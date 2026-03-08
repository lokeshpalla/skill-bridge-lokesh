import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(topic: string, skills: string[]): string {
  const stackInfo = skills.length > 0
    ? `\n\nThe candidate's tech stack/skills: ${skills.join(", ")}. Tailor your questions to their specific technologies and experience level. Ask questions relevant to these technologies.`
    : "";

  const base: Record<string, string> = {
    general: `You are a senior tech interviewer conducting a mock interview. Ask one question at a time. Topics: data structures, algorithms, system design, behavioral. After the candidate answers, give brief feedback (strengths, improvements) then ask the next question. Be encouraging but honest. When the user says "end interview", provide a final score out of 100 and detailed feedback on: Technical Knowledge, Problem Solving, Communication, and Areas to Improve.`,
    frontend: `You are a senior frontend engineer interviewer. Focus on: React, TypeScript, CSS, browser APIs, performance optimization, accessibility. Ask one question at a time, give feedback after each answer. When told "end interview", score out of 100.`,
    backend: `You are a senior backend engineer interviewer. Focus on: APIs, databases, system design, scalability, security, microservices. Ask one question at a time, give feedback. When told "end interview", score out of 100.`,
    dsa: `You are a DSA interview expert. Present coding problems one at a time (Easy→Hard progression). Ask the candidate to explain their approach before coding. Evaluate: time/space complexity, edge cases, code quality. When told "end interview", score out of 100.`,
    behavioral: `You are an HR interviewer focusing on behavioral questions using the STAR method. Ask about: teamwork, leadership, conflict resolution, problem-solving experiences. Give feedback on answer structure and impact. When told "end interview", score out of 100.`,
  };

  return (base[topic] || base.general) + stackInfo;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, topic = "general", skills = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
