import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(hsl(187 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(187 100% 50%) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4"
      >
        <div className="glass rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" ? "Sign in to continue learning" : "Start your journey today"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-secondary rounded-lg p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Full name"
                  className="w-full bg-secondary rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-secondary rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-secondary rounded-lg pl-10 pr-10 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button variant="hero" className="w-full py-3" type="submit">
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-primary hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
