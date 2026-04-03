import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 1.5,
}));

const SplashScreen = () => {
  const { user, loading, rolesLoading, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"enter" | "zoom" | "exit">("enter");

  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("zoom"), 1800);
    const t2 = setTimeout(() => setAnimationDone(true), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Only exit once both animation is done AND auth has resolved
  useEffect(() => {
    if (animationDone && !loading && !rolesLoading) {
      setPhase("exit");
      const t = setTimeout(() => {
        navigate(user ? getRedirectPath() : "/auth", { replace: true });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [animationDone, loading, rolesLoading, user, navigate, getRedirectPath]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col items-center justify-center"
        >
          {/* Animated grid background */}
          <motion.div
            className="absolute inset-0 bg-grid-subtle"
            animate={{ backgroundPosition: ["0px 0px", "50px 50px"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Floating particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-primary/30"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(p.id) * 15, 0],
                opacity: [0, 0.6, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
            />
          ))}

          {/* Radial glow */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.15), transparent 70%)",
            }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Logo icon — spins in, then pulses on zoom */}
          <motion.div
            initial={{ scale: 0, rotate: -270, opacity: 0 }}
            animate={
              phase === "zoom"
                ? { scale: [1, 1.3, 1.15], rotate: [0, 10, 0], opacity: 1 }
                : { scale: 1, rotate: 0, opacity: 1 }
            }
            transition={
              phase === "zoom"
                ? { duration: 0.8, ease: "easeInOut" }
                : { type: "spring", stiffness: 180, damping: 14, delay: 0.3 }
            }
            className="relative w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-2xl shadow-primary/40 z-10"
          >
            <Sparkles className="w-12 h-12 text-primary-foreground" />

            {/* Ring pulse */}
            <motion.div
              className="absolute inset-0 rounded-3xl border-2 border-primary/40"
              animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className="absolute inset-0 rounded-3xl border border-primary/20"
              animate={{ scale: [1, 2, 2], opacity: [0.4, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
            />
          </motion.div>

          {/* Title — letter by letter */}
          <motion.div className="mt-8 flex overflow-hidden z-10">
            {"GreXil".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: 40, opacity: 0, rotateX: -90 }}
                animate={
                  phase === "zoom"
                    ? { y: 0, opacity: 1, rotateX: 0, scale: [1, 1.15, 1] }
                    : { y: 0, opacity: 1, rotateX: 0 }
                }
                transition={{
                  delay: phase === "zoom" ? 0.05 * i : 0.6 + i * 0.05,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                className="text-5xl font-bold tracking-tight text-gradient"
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={
              phase === "zoom"
                ? { opacity: 1, y: 0, letterSpacing: "0.3em" }
                : { opacity: 1, y: 0 }
            }
            transition={{ delay: phase === "zoom" ? 0.3 : 1.2, duration: 0.6 }}
            className="mt-3 text-sm text-muted-foreground tracking-widest uppercase z-10"
          >
            Learn • Build • Grow
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-10 flex gap-2 z-10"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="exit"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-background"
        />
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
