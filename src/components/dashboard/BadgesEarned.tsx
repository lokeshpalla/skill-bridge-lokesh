import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Badge {
  id: string;
  name: string;
  icon_emoji: string | null;
  description: string | null;
  earned_at: string;
}

export default function BadgesEarned({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: userBadges } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })
        .limit(6);

      if (userBadges && userBadges.length > 0) {
        const badgeIds = userBadges.map(b => b.badge_id);
        const { data: badgeDetails } = await supabase
          .from("badges")
          .select("id, name, icon_emoji, description")
          .in("id", badgeIds);

        setBadges(userBadges.map(ub => {
          const detail = badgeDetails?.find(b => b.id === ub.badge_id);
          return {
            id: ub.badge_id,
            name: detail?.name || "Badge",
            icon_emoji: detail?.icon_emoji || "🏅",
            description: detail?.description || null,
            earned_at: ub.earned_at,
          };
        }));
      }
    };
    fetch();
  }, [userId]);

  if (badges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-warning" />
          <h2 className="text-sm font-semibold">Badges Earned</h2>
        </div>
        <span className="text-[11px] text-muted-foreground">{badges.length} earned</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/5 border border-warning/10 hover:border-warning/30 transition-colors"
            title={badge.description || badge.name}
          >
            <span className="text-lg">{badge.icon_emoji}</span>
            <span className="text-[11px] font-medium">{badge.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
