import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MessageSquare, Trophy, Code2, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TalentProfile {
  user_id: string;
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

const TalentBrowsePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  const [filtered, setFiltered] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [minXp, setMinXp] = useState(0);
  const [allSkills, setAllSkills] = useState<string[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    let result = profiles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.display_name.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    if (skillFilter) {
      result = result.filter(p => p.skills.some(s => s.toLowerCase() === skillFilter.toLowerCase()));
    }
    if (minXp > 0) {
      result = result.filter(p => p.xp >= minXp);
    }
    setFiltered(result);
  }, [search, skillFilter, minXp, profiles]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, avatar_url, bio, skills, xp, streak, github_url, linkedin_url, portfolio_url")
      .order("xp", { ascending: false });

    if (data) {
      const mapped = data.map((p: any) => ({ ...p, skills: p.skills || [] }));
      setProfiles(mapped);
      // Extract all unique skills
      const skills = new Set<string>();
      mapped.forEach(p => p.skills.forEach((s: string) => skills.add(s)));
      setAllSkills(Array.from(skills).sort());
    }
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" /> Browse Talent
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Discover and connect with top students</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name, skill, or bio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={skillFilter}
          onChange={e => setSkillFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">All Skills</option>
          {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={minXp}
          onChange={e => setMinXp(Number(e.target.value))}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value={0}>Any XP</option>
          <option value={100}>100+ XP</option>
          <option value={500}>500+ XP</option>
          <option value={1000}>1000+ XP</option>
          <option value={5000}>5000+ XP</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading talent...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-sm font-medium mb-1">No students found</h3>
          <p className="text-xs text-muted-foreground">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.user_id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {p.display_name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{p.display_name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Trophy className="w-3 h-3 text-primary" />{p.xp} XP</span>
                    <span>🔥 {p.streak}d streak</span>
                  </div>
                </div>
              </div>

              {p.bio && <p className="text-xs text-muted-foreground line-clamp-2">{p.bio}</p>}

              {p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.skills.slice(0, 5).map(s => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">{s}</span>
                  ))}
                  {p.skills.length > 5 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/80 text-muted-foreground">+{p.skills.length - 5}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {user && user.id !== p.user_id && (
                  <Button
                    variant="hero"
                    size="sm"
                    className="h-7 text-xs gap-1 flex-1"
                    onClick={() => navigate(`/messages?to=${p.user_id}`)}
                  >
                    <MessageSquare className="w-3 h-3" /> Message
                  </Button>
                )}
                {p.portfolio_url && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <a href={p.portfolio_url} target="_blank" rel="noopener noreferrer">Portfolio</a>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => navigate(`/portfolio/${p.user_id}`)}>
                  Profile
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TalentBrowsePage;
