import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Share2, Clock, Target, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon_emoji: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  starts_at: string;
  ends_at: string;
}

interface Participation {
  challenge_id: string;
  progress: number;
  completed: boolean;
}

const categories = ["all", "coding", "streak", "learning", "xp", "social", "mentorship", "career"];

const AchievementsPage = () => {
  const { user, profile } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earned, setEarned] = useState<UserBadge[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [tab, setTab] = useState<"badges" | "challenges">("badges");

  useEffect(() => {
    const fetchBadges = async () => {
      const { data } = await supabase.from("badges").select("*").order("category");
      if (data) setBadges(data as Badge[]);
    };
    const fetchEarned = async () => {
      if (!user) return;
      const { data } = await supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", user.id);
      if (data) setEarned(data);
    };
    const fetchChallenges = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("seasonal_challenges")
        .select("*")
        .gte("ends_at", now)
        .order("ends_at");
      if (data) setChallenges(data as Challenge[]);
    };
    const fetchParticipations = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("challenge_participation")
        .select("challenge_id, progress, completed")
        .eq("user_id", user.id);
      if (data) setParticipations(data);
    };
    fetchBadges();
    fetchEarned();
    fetchChallenges();
    fetchParticipations();
  }, [user]);

  const earnedIds = new Set(earned.map((e) => e.badge_id));
  const filtered = selectedCat === "all" ? badges : badges.filter((b) => b.category === selectedCat);
  const earnedCount = badges.filter((b) => earnedIds.has(b.id)).length;

  const joinChallenge = async (challengeId: string) => {
    if (!user) return toast.error("Sign in to join challenges");
    const { error } = await supabase.from("challenge_participation").insert({
      user_id: user.id,
      challenge_id: challengeId,
    });
    if (error) {
      if (error.code === "23505") return toast.info("Already joined!");
      return toast.error("Failed to join");
    }
    setParticipations((p) => [...p, { challenge_id: challengeId, progress: 0, completed: false }]);
    toast.success("Joined challenge!");
  };

  const shareBadge = (badge: Badge) => {
    const text = `I just earned the "${badge.name}" badge on SkillBridge! ${badge.icon_emoji} #SkillBridge #Coding`;
    if (navigator.share) {
      navigator.share({ title: "SkillBridge Achievement", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const daysLeft = (end: string) => {
    const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
    return d > 0 ? `${d}d left` : "Ended";
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-warning" /> Achievements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {earnedCount}/{badges.length} badges earned • {profile?.xp ?? 0} XP total
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["badges", "challenges"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "badges" ? "🏅 Badges" : "🎯 Challenges"}
          </button>
        ))}
      </div>

      {tab === "badges" && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCat === cat
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((badge, i) => {
              const isEarned = earnedIds.has(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    isEarned
                      ? "border-warning/40 bg-warning/5 hover:border-warning/60"
                      : "border-border/50 bg-card/60 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="text-3xl mb-2">{badge.icon_emoji}</div>
                  <h3 className="text-sm font-semibold">{badge.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium">+{badge.xp_reward} XP</span>
                  </div>
                  {isEarned ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-[10px] gap-1 h-7"
                      onClick={() => shareBadge(badge)}
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </Button>
                  ) : (
                    <div className="mt-2 flex items-center justify-center gap-1 text-muted-foreground">
                      <Lock className="w-3 h-3" />
                      <span className="text-[10px]">Locked</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {tab === "challenges" && (
        <div className="space-y-3">
          {challenges.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No active challenges right now</p>
            </div>
          ) : (
            challenges.map((ch, i) => {
              const participation = participations.find((p) => p.challenge_id === ch.id);
              const joined = !!participation;
              const progress = participation ? Math.min((participation.progress / ch.target_value) * 100, 100) : 0;

              return (
                <motion.div
                  key={ch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{ch.icon_emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">{ch.title}</h3>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" /> {daysLeft(ch.ends_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{ch.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {participation?.progress ?? 0}/{ch.target_value}
                        </span>
                        <span className="text-[10px] text-primary font-medium">+{ch.xp_reward} XP</span>
                      </div>
                      {!joined && (
                        <Button
                          variant="hero"
                          size="sm"
                          className="mt-3 text-xs gap-1"
                          onClick={() => joinChallenge(ch.id)}
                        >
                          <Flame className="w-3 h-3" /> Join Challenge
                        </Button>
                      )}
                      {participation?.completed && (
                        <span className="inline-flex items-center gap-1 mt-3 text-xs text-success font-medium">
                          ✅ Completed!
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
