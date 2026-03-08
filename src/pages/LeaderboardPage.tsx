import { motion } from "framer-motion";
import { Flame, Crown } from "lucide-react";

const leaderboard = [
  { rank: 1, name: "Arjun Patel", xp: 12450, solved: 342, streak: 45, level: "Grandmaster", avatar: "🏆" },
  { rank: 2, name: "Emily Zhang", xp: 11200, solved: 310, streak: 38, level: "Master", avatar: "🥈" },
  { rank: 3, name: "Carlos Ruiz", xp: 10800, solved: 298, streak: 32, level: "Master", avatar: "🥉" },
  { rank: 4, name: "Aisha Khan", xp: 9650, solved: 275, streak: 28, level: "Expert", avatar: "⭐" },
  { rank: 5, name: "Liam O'Brien", xp: 9200, solved: 260, streak: 24, level: "Expert", avatar: "⭐" },
  { rank: 6, name: "Yuki Tanaka", xp: 8800, solved: 248, streak: 20, level: "Expert", avatar: "💎" },
  { rank: 7, name: "Sofia Andersson", xp: 8100, solved: 230, streak: 18, level: "Advanced", avatar: "💎" },
  { rank: 8, name: "Raj Krishnan", xp: 7500, solved: 215, streak: 15, level: "Advanced", avatar: "🔥" },
  { rank: 9, name: "Maya Johnson", xp: 7200, solved: 205, streak: 12, level: "Advanced", avatar: "🔥" },
  { rank: 10, name: "Tom Fischer", xp: 6800, solved: 195, streak: 10, level: "Intermediate", avatar: "🔥" },
];

const rankStyle = (rank: number) => {
  if (rank === 1) return "text-warning font-bold";
  if (rank === 2) return "text-muted-foreground font-bold";
  if (rank === 3) return "text-warning/70 font-bold";
  return "text-foreground";
};

const LeaderboardPage = () => {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Top performers ranked by XP</p>
      </motion.div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3 mb-2">
        {[leaderboard[1], leaderboard[0], leaderboard[2]].map((user, i) => {
          const order = [2, 1, 3][i];
          const heights = ["h-24", "h-32", "h-20"];
          const isFirst = order === 1;
          return (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                {isFirst && <Crown className="w-4 h-4 text-warning absolute -top-5 left-1/2 -translate-x-1/2" />}
                <span className="text-2xl">{user.avatar}</span>
              </div>
              <p className="text-xs font-semibold text-center truncate w-full mt-1">{user.name}</p>
              <p className="text-[10px] text-primary font-mono">{user.xp.toLocaleString()} XP</p>
              <div className={`${heights[i]} w-full mt-2 rounded-t-lg ${isFirst ? "bg-gradient-primary shadow-glow" : "bg-primary/15"} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${isFirst ? "text-primary-foreground" : "text-primary"}`}>#{order}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider border-b border-border/40">
          <span className="col-span-1">#</span>
          <span className="col-span-4">User</span>
          <span className="col-span-2 text-right">XP</span>
          <span className="col-span-2 text-right">Solved</span>
          <span className="col-span-1 text-right">Streak</span>
          <span className="col-span-2 text-right">Level</span>
        </div>
        {leaderboard.map((user, i) => (
          <motion.div
            key={user.rank}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.03 }}
            className="grid grid-cols-12 gap-3 px-4 py-2.5 items-center border-b border-border/20 last:border-0 hover:bg-secondary/30 transition-colors"
          >
            <span className={`col-span-1 text-sm ${rankStyle(user.rank)}`}>{user.rank}</span>
            <div className="col-span-4 flex items-center gap-2">
              <span className="text-base">{user.avatar}</span>
              <span className="text-xs font-medium truncate">{user.name}</span>
            </div>
            <span className="col-span-2 text-right text-xs font-mono text-primary">{user.xp.toLocaleString()}</span>
            <span className="col-span-2 text-right text-xs text-muted-foreground">{user.solved}</span>
            <span className="col-span-1 text-right text-xs flex items-center justify-end gap-1">
              <Flame className="w-3 h-3 text-warning" />{user.streak}
            </span>
            <span className="col-span-2 text-right text-[11px] text-muted-foreground">{user.level}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardPage;
