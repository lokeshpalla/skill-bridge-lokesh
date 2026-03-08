import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardUser {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  level: string;
  avatar: string;
  avatar_url: string | null;
  user_id: string;
}

const getLevel = (xp: number): string => {
  if (xp >= 10000) return "Grandmaster";
  if (xp >= 7000) return "Master";
  if (xp >= 4000) return "Expert";
  if (xp >= 2000) return "Advanced";
  if (xp >= 500) return "Intermediate";
  return "Beginner";
};

const getAvatar = (rank: number): string => {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  if (rank <= 5) return "⭐";
  if (rank <= 7) return "💎";
  return "🔥";
};

const rankStyle = (rank: number) => {
  if (rank === 1) return "text-warning font-bold";
  if (rank === 2) return "text-muted-foreground font-bold";
  if (rank === 3) return "text-warning/70 font-bold";
  return "text-foreground";
};

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, xp, streak, avatar_url")
        .order("xp", { ascending: false })
        .limit(50);

      if (data) {
        const mapped: LeaderboardUser[] = data.map((p, i) => ({
          rank: i + 1,
          name: p.display_name || "Anonymous",
          xp: p.xp ?? 0,
          streak: p.streak ?? 0,
          level: getLevel(p.xp ?? 0),
          avatar: getAvatar(i + 1),
          avatar_url: p.avatar_url ?? null,
          user_id: p.user_id,
        }));
        setLeaderboard(mapped);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Top performers ranked by XP</p>
      </motion.div>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-2">
          {podiumOrder.map((u, i) => {
            const order = [2, 1, 3][i];
            const heights = ["h-24", "h-32", "h-20"];
            const isFirst = order === 1;
            const isMe = u.user_id === user?.id;
            return (
              <motion.div
                key={u.rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  {isFirst && <Crown className="w-4 h-4 text-warning absolute -top-5 left-1/2 -translate-x-1/2" />}
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.name} className="w-8 h-8 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <span className="text-2xl">{u.avatar}</span>
                  )}
                </div>
                <p className={`text-xs font-semibold text-center truncate w-full mt-1 ${isMe ? "text-primary" : ""}`}>
                  {u.name}{isMe ? " (You)" : ""}
                </p>
                <p className="text-[10px] text-primary font-mono">{u.xp.toLocaleString()} XP</p>
                <div className={`${heights[i]} w-full mt-2 rounded-t-lg ${isFirst ? "bg-gradient-primary shadow-glow" : "bg-primary/15"} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${isFirst ? "text-primary-foreground" : "text-primary"}`}>#{order}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider border-b border-border/40">
          <span className="col-span-1">#</span>
          <span className="col-span-5">User</span>
          <span className="col-span-2 text-right">XP</span>
          <span className="col-span-2 text-right">Streak</span>
          <span className="col-span-2 text-right">Level</span>
        </div>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No users yet. Be the first!</div>
        ) : (
          leaderboard.map((u, i) => {
            const isMe = u.user_id === user?.id;
            return (
              <motion.div
                key={u.user_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                className={`grid grid-cols-12 gap-3 px-4 py-2.5 items-center border-b border-border/20 last:border-0 transition-colors ${
                  isMe ? "bg-primary/5 border-primary/20" : "hover:bg-secondary/30"
                }`}
              >
                <span className={`col-span-1 text-sm ${rankStyle(u.rank)}`}>{u.rank}</span>
                <div className="col-span-5 flex items-center gap-2">
                  <span className="text-base">{u.avatar}</span>
                  <span className={`text-xs font-medium truncate ${isMe ? "text-primary font-semibold" : ""}`}>
                    {u.name}{isMe ? " (You)" : ""}
                  </span>
                </div>
                <span className="col-span-2 text-right text-xs font-mono text-primary">{u.xp.toLocaleString()}</span>
                <span className="col-span-2 text-right text-xs flex items-center justify-end gap-1">
                  <Flame className="w-3 h-3 text-warning" />{u.streak}
                </span>
                <span className="col-span-2 text-right text-[11px] text-muted-foreground">{u.level}</span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
