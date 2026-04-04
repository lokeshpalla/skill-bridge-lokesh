import GxIcon from "@/components/ui/GxIcon";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Search, Trophy, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { Internship, Application } from "@/pages/RecruiterDashboard";

interface Props {
  internships: Internship[];
  applications: Application[];
}

interface MatchResult {
  user_id: string;
  display_name: string;
  xp: number;
  skills: string[];
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reason: string;
}

const RecruiterAIMatch = ({ internships, applications }: Props) => {
  const navigate = useNavigate();
  const [selectedInternship, setSelectedInternship] = useState<string>("");
  const [customQuery, setCustomQuery] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");

  const runAIMatch = async () => {
    const intern = internships.find(i => i.id === selectedInternship);
    if (!intern && !customQuery) return;

    setLoading(true);
    setResults([]);
    setAiInsight("");

    try {
      // Fetch all candidate profiles with their stats
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, skills, xp, bio")
        .order("xp", { ascending: false })
        .limit(100);

      if (!profiles || profiles.length === 0) {
        setAiInsight("No candidate profiles found in the database.");
        setLoading(false);
        return;
      }

      // Get submission stats for top candidates
      const userIds = profiles.map(p => p.user_id);
      const { data: certs } = await supabase
        .from("course_certificates")
        .select("user_id")
        .in("user_id", userIds);

      const certCounts: Record<string, number> = {};
      (certs || []).forEach(c => { certCounts[c.user_id] = (certCounts[c.user_id] || 0) + 1; });

      // Already applied user_ids for this internship
      const appliedIds = new Set(applications.filter(a => a.internship_id === selectedInternship).map(a => a.user_id));

      const requiredSkills = intern?.skills_required?.map(s => s.toLowerCase()) || [];
      const querySkills = customQuery
        ? customQuery.toLowerCase().split(/[,\s]+/).filter(Boolean)
        : [];
      const targetSkills = [...new Set([...requiredSkills, ...querySkills])];

      // Score candidates
      const scored: MatchResult[] = profiles
        .filter(p => !appliedIds.has(p.user_id)) // Exclude already applied
        .map(p => {
          const candidateSkills = (p.skills || []).map(s => s.toLowerCase());
          const matchedSkills = targetSkills.filter(s => candidateSkills.includes(s));
          const missingSkills = targetSkills.filter(s => !candidateSkills.includes(s));

          // Scoring: skill match (50%) + XP (30%) + certs (20%)
          const skillScore = targetSkills.length > 0 ? (matchedSkills.length / targetSkills.length) * 50 : 25;
          const xpScore = Math.min((p.xp / 5000) * 30, 30);
          const certScore = Math.min(((certCounts[p.user_id] || 0) / 3) * 20, 20);
          const totalScore = Math.round(skillScore + xpScore + certScore);

          let reason = "";
          if (matchedSkills.length > 0) reason += `Matches ${matchedSkills.length}/${targetSkills.length} required skills. `;
          if (p.xp >= 1000) reason += `Strong XP (${p.xp}). `;
          if (certCounts[p.user_id]) reason += `${certCounts[p.user_id]} certificate(s). `;
          if (missingSkills.length > 0) reason += `Missing: ${missingSkills.join(", ")}. `;

          return {
            user_id: p.user_id,
            display_name: p.display_name,
            xp: p.xp,
            skills: p.skills || [],
            matchScore: totalScore,
            matchedSkills: matchedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            missingSkills: missingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            reason: reason.trim(),
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 15);

      setResults(scored);

      // Generate AI insight
      const topCount = scored.filter(s => s.matchScore >= 60).length;
      const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.matchScore, 0) / scored.length) : 0;
      setAiInsight(
        `Found ${scored.length} potential candidates. ${topCount} are strong matches (60%+). ` +
        `Average match score: ${avgScore}%. ` +
        (targetSkills.length > 0 ? `Searched for: ${targetSkills.join(", ")}.` : "")
      );
    } catch (e) {
      setAiInsight("Failed to run matching. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* AI Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold">AI Candidate Matching</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Select a job posting or describe your ideal candidate. The AI will rank students by skill match, XP, and certifications.
        </p>

        <div className="space-y-3">
          <select value={selectedInternship} onChange={e => setSelectedInternship(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
            <option value="">Select a job posting (optional)</option>
            {internships.map(i => (
              <option key={i.id} value={i.id}>{i.title} — {i.company}</option>
            ))}
          </select>

          <Textarea
            placeholder="Or describe skills you're looking for: React, Python, Machine Learning..."
            value={customQuery}
            onChange={e => setCustomQuery(e.target.value)}
            rows={2}
          />

          <Button variant="hero" className="gap-2" onClick={runAIMatch}
            disabled={loading || (!selectedInternship && !customQuery)}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GxIcon className="w-4 h-4" />}
            {loading ? "Analyzing candidates..." : "Find Best Matches"}
          </Button>
        </div>
      </motion.div>

      {/* AI Insight */}
      {aiInsight && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-lg bg-secondary/30 border border-border/30 px-4 py-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            {aiInsight}
          </p>
        </motion.div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Top Candidates ({results.length})
          </h4>
          {results.map((r, i) => (
            <motion.div key={r.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {r.display_name.charAt(0)}
                    </div>
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                      i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-600" : "bg-secondary text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{r.display_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                        <Trophy className="w-3 h-3" /> {r.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    r.matchScore >= 75 ? "text-green-400" : r.matchScore >= 50 ? "text-yellow-400" : "text-muted-foreground"
                  }`}>
                    {r.matchScore}%
                  </div>
                  <span className="text-[9px] text-muted-foreground">match</span>
                </div>
              </div>

              {/* Matched & Missing Skills */}
              <div className="mt-3 space-y-1.5">
                {r.matchedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.matchedSkills.map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">✓ {s}</span>
                    ))}
                  </div>
                )}
                {r.missingSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.missingSkills.map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">✗ {s}</span>
                    ))}
                  </div>
                )}
              </div>

              {r.reason && <p className="text-[10px] text-muted-foreground mt-2">{r.reason}</p>}

              <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
                <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => navigate(`/portfolio/${r.user_id}`)}>
                  View Profile
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => navigate(`/messages?to=${r.user_id}`)}>
                  Message
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !aiInsight && (
        <div className="text-center py-12 rounded-xl border border-border/50 bg-card/60">
          <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a posting or enter skills to find matching candidates</p>
        </div>
      )}
    </div>
  );
};

export default RecruiterAIMatch;
