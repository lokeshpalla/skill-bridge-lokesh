import GxIcon from "@/components/ui/GxIcon";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Compass, Clock, ArrowRight, BookOpen, Target,
  Loader2, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  icon_emoji: string;
  difficulty: string;
  estimated_hours: number;
  tags: string[];
}

interface UserPath {
  path_id: string;
  progress: number;
  current_course_index: number;
}

interface Recommendations {
  recommended_paths: string[];
  recommended_courses: string[];
  reasoning: string;
  next_steps: string[];
}

const LearningPathsPage = () => {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [userPaths, setUserPaths] = useState<UserPath[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [tab, setTab] = useState<"browse" | "my-paths" | "ai">("browse");

  useEffect(() => {
    fetchPaths();
    if (user) fetchUserPaths();
  }, [user]);

  const fetchPaths = async () => {
    const { data } = await supabase.from("learning_paths").select("*").order("difficulty").limit(100);
    if (data) setPaths(data as LearningPath[]);
  };

  const fetchUserPaths = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_learning_paths")
      .select("path_id, progress, current_course_index")
      .eq("user_id", user.id);
    if (data) setUserPaths(data);
  };

  const enrollPath = async (pathId: string) => {
    if (!user) return toast.error("Sign in to enroll");
    const { error } = await supabase.from("user_learning_paths").insert({
      user_id: user.id,
      path_id: pathId,
    });
    if (error) {
      if (error.code === "23505") return toast.info("Already enrolled!");
      return toast.error("Failed to enroll");
    }
    toast.success("Enrolled in path!");
    fetchUserPaths();
  };

  const getRecommendations = async () => {
    if (!user) return toast.error("Sign in for AI recommendations");
    setLoadingRec(true);
    setTab("ai");
    try {
      const { data, error } = await supabase.functions.invoke("recommend");
      if (error) throw error;
      setRecommendations(data as Recommendations);
    } catch (e) {
      console.error(e);
      toast.error("Failed to get recommendations");
    }
    setLoadingRec(false);
  };

  const enrolledIds = new Set(userPaths.map((p) => p.path_id));
  const difficultyColor = (d: string) => {
    if (d === "Beginner") return "text-success bg-success/10";
    if (d === "Intermediate") return "text-warning bg-warning/10";
    return "text-destructive bg-destructive/10";
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" /> Learning Paths
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Structured roadmaps to guide your learning journey</p>
        </div>
        <Button variant="hero" size="sm" className="gap-1.5 text-xs" onClick={getRecommendations} disabled={loadingRec}>
          {loadingRec ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GxIcon className="w-3.5 h-3.5" />}
          AI Recommend
        </Button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["browse", "📚 Browse"], ["my-paths", "🎯 My Paths"], ["ai", "✨ AI Picks"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {tab === "browse" && (
        <div className="grid sm:grid-cols-2 gap-3">
          {paths.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 hover:border-primary/20 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{path.icon_emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{path.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${difficultyColor(path.difficulty)}`}>
                      {path.difficulty}
                    </span>
                  </div>
                  {path.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{path.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {path.tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ~{path.estimated_hours}h
                    </span>
                    {enrolledIds.has(path.id) ? (
                      <span className="text-[10px] text-success font-medium">✅ Enrolled</span>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => enrollPath(path.id)}>
                        <ArrowRight className="w-3 h-3" /> Start Path
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* My Paths Tab */}
      {tab === "my-paths" && (
        <div className="space-y-3">
          {userPaths.length === 0 ? (
            <div className="text-center py-12">
              <Compass className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No paths enrolled yet</p>
              <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => setTab("browse")}>
                Browse Paths
              </Button>
            </div>
          ) : (
            userPaths.map((up) => {
              const path = paths.find((p) => p.id === up.path_id);
              if (!path) return null;
              return (
                <motion.div
                  key={up.path_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{path.icon_emoji}</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{path.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${up.progress}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{up.progress}%</span>
                      </div>
                    </div>
                    <Link to="/courses">
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                        Continue <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* AI Recommendations Tab */}
      {tab === "ai" && (
        <div className="space-y-4">
          {loadingRec ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Analyzing your profile...</p>
            </div>
          ) : recommendations ? (
            <>
              {/* Reasoning */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-2">
                  <GxIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground">{recommendations.reasoning}</p>
                </div>
              </motion.div>

              {/* Recommended Paths */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-primary" /> Recommended Paths
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {recommendations.recommended_paths.map((title, i) => {
                    const path = paths.find((p) => p.title === title);
                    return (
                      <motion.div
                        key={title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-lg border border-border/50 bg-card/60 p-3 flex items-center gap-3"
                      >
                        <span className="text-xl">{path?.icon_emoji || "📘"}</span>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{title}</p>
                          {path && <p className="text-[10px] text-muted-foreground">{path.difficulty} • ~{path.estimated_hours}h</p>}
                        </div>
                        {path && !enrolledIds.has(path.id) && (
                          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => enrollPath(path.id)}>
                            Enroll
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Courses */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-accent" /> Recommended Courses
                </h3>
                <div className="grid sm:grid-cols-3 gap-2">
                  {recommendations.recommended_courses.map((title, i) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="rounded-lg border border-border/50 bg-card/60 p-3"
                    >
                      <p className="text-xs font-medium">{title}</p>
                      <Link to="/courses" className="text-[10px] text-primary hover:underline mt-1 inline-block">
                        View course →
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-warning" /> Next Steps
                </h3>
                <div className="space-y-2">
                  {recommendations.next_steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className="flex items-center gap-2 rounded-lg bg-secondary/30 p-3"
                    >
                      <Target className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <p className="text-xs">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <GxIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Click "AI Recommend" to get personalized suggestions</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LearningPathsPage;
