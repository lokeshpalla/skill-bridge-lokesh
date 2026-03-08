import { motion } from "framer-motion";
import { Trophy, Medal, Flame, TrendingUp, Crown } from "lucide-react";

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

const rankColor = (rank: number) => {
  if (rank === 1) return "text-warning";
  if (rank === 2) return "text-muted-foreground";
  if (rank === 3) return "text-warning/70";
  return "text-foreground";
};

const LeaderboardPage = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground mb-8">Top performers ranked by XP</p>
        </motion.div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((user, i) => {
            const order = [2, 1, 3][i];
            const heights = ["h-28", "h-36", "h-24"];
            return (
              <motion.div
                key={user.rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center"
              >
                <div className="text-3xl mb-2">{user.avatar}</div>
                <p className="text-sm font-semibold text-center truncate w-full">{user.name}</p>
                <p className="text-xs text-primary font-mono">{user.xp.toLocaleString()} XP</p>
                <div className={`${heights[i]} w-full mt-3 rounded-t-xl bg-gradient-primary opacity-${order === 1 ? "100" : order === 2 ? "70" : "50"} flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-primary-foreground">#{order}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs text-muted-foreground font-medium border-b border-border/50">
            <span className="col-span-1">Rank</span>
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
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-12 gap-4 px-5 py-3 items-center border-b border-border/30 last:border-0 hover:bg-secondary/50 transition-colors"
            >
              <span className={`col-span-1 font-bold ${rankColor(user.rank)}`}>#{user.rank}</span>
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-lg">{user.avatar}</span>
                <span className="text-sm font-medium truncate">{user.name}</span>
              </div>
              <span className="col-span-2 text-right text-sm font-mono text-primary">{user.xp.toLocaleString()}</span>
              <span className="col-span-2 text-right text-sm text-muted-foreground">{user.solved}</span>
              <span className="col-span-1 text-right text-sm flex items-center justify-end gap-1">
                <Flame className="w-3 h-3 text-warning" />{user.streak}
              </span>
              <span className="col-span-2 text-right text-xs text-muted-foreground">{user.level}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
