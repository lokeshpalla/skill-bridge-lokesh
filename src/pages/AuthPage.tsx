import GxIcon from "@/components/ui/GxIcon";
import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Phone, GraduationCap, ArrowRight, Heart, BookOpen, Users, Trophy } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "@/hooks/use-toast";

const greetings = [
  "Welcome back, friend! 👋",
  "Hey there, good to see you! 🌟",
  "We missed you! Ready to learn? ✨",
];

const signupGreetings = [
  "Let's start your journey together 🚀",
  "Welcome to a community that cares 💛",
  "Your future starts here ✨",
];

const AuthPage = forwardRef<HTMLDivElement>((_, ref) => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;
  const [greeting] = useState(() =>
    greetings[Math.floor(Math.random() * greetings.length)]
  );
  const [signupGreeting] = useState(() =>
    signupGreetings[Math.floor(Math.random() * signupGreetings.length)]
  );
  const { signIn, signUp, getRedirectPath } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: "Google sign-in failed", description: result.error.message || "Please try again.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (result.redirected) return; // Full-page redirect
      // Popup flow: session set, navigate
      toast({ title: "Welcome! 🎉" });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Google sign-in failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Oops!", description: "We need your email to continue 📧", variant: "destructive" });
      return;
    }

    if (forgotMode) {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      } else {
        setResetSent(true);
        toast({ title: "Check your inbox 📬", description: "We've sent you a password reset link." });
      }
      setLoading(false);
      return;
    }

    if (!password) {
      toast({ title: "Almost there!", description: "Don't forget your password 🔑", variant: "destructive" });
      return;
    }

    if (mode === "register") {
      if (password.length < 8) {
        toast({ title: "A little longer please", description: "Use at least 8 characters for a strong password 💪", variant: "destructive" });
        return;
      }
      if (!/(?=.*[0-9!@#$%^&*])/.test(password)) {
        toast({ title: "Make it stronger", description: "Add at least one number or special character 🔐", variant: "destructive" });
        return;
      }
    }

    if (isLockedOut) {
      toast({ title: "Too many attempts", description: "Please wait 30 seconds before trying again ⏳", variant: "destructive" });
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { error, roles: userRoles } = await signIn(email, password);
      if (error) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockoutUntil(Date.now() + 30000);
          setTimeout(() => { setLockoutUntil(null); setFailedAttempts(0); }, 30000);
        }
        const msg = error.message.includes("Invalid login")
          ? `Hmm, that doesn't match our records. Try again?${newAttempts >= 3 ? ` (${5 - newAttempts} attempts left)` : ""}`
          : error.message;
        toast({ title: "Couldn't sign you in", description: msg, variant: "destructive" });
      } else {
        setFailedAttempts(0);
        setLockoutUntil(null);
        const redirectPath = getRedirectPath(userRoles);
        toast({ title: "Welcome back! 🎉" });
        navigate(redirectPath, { replace: true });
      }
    } else {
      if (!name.trim()) {
        toast({ title: "What should we call you?", description: "We'd love to know your name! 😊", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name.trim(), phone);
      if (error) {
        toast({ title: "Registration hiccup", description: error.message, variant: "destructive" });
      } else {
        setSignupSuccess(true);
        toast({ title: "Almost there! 📬", description: "Check your email to verify your account." });
      }
    }
    setLoading(false);
  };

  return (
    <div ref={ref} className="min-h-screen flex bg-background overflow-hidden">
      {/* Left panel — bold & professional */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: "linear-gradient(160deg, hsl(217 78% 36%), hsl(210 85% 45%), hsl(220 70% 30%))"
        }}
      >
        {/* Floating shapes for warmth */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] right-[15%] w-32 h-32 rounded-full"
            style={{ background: "rgba(255,255,255,0.1)" }}
          />
          <motion.div
            animate={{ y: [10, -10, 10], rotate: [0, -3, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[25%] left-[10%] w-24 h-24 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.08)", transform: "rotate(15deg)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], y: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[45%] right-[30%] w-16 h-16 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-white tracking-tight">GreXil</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl font-bold text-white leading-[1.15]"
            >
              A warm place<br />
              to grow your<br />
              <span className="inline-flex items-center gap-2">
                skills
                <motion.span
                  animate={{ rotate: [0, 14, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Heart className="w-8 h-8 text-white/80 fill-white/40" />
                </motion.span>
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-white/75 text-base max-w-xs leading-relaxed mt-4"
            >
              Like a friend who's always there — guiding you through every lesson,
              every challenge, every breakthrough moment.
            </motion.p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: BookOpen, text: "Structured courses with certificates" },
              { icon: Users, text: "1-on-1 mentorship from industry experts" },
              { icon: Trophy, text: "Coding challenges & leaderboards" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-white/70" />
                </div>
                <span className="text-sm text-white/80">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">© 2026 GreXil · Made with ❤️</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">GreXil</span>
          </div>

          {/* Warm greeting */}
          <div className="mb-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={forgotMode ? "forgot" : mode}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {forgotMode
                    ? "No worries, we'll help 🤗"
                    : mode === "login"
                    ? greeting
                    : signupGreeting}
                </h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {forgotMode
                    ? "Enter your email and we'll send you a link to get back in."
                    : mode === "login"
                    ? "Sign in and pick up right where you left off."
                    : "It only takes a minute — then the fun begins!"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mode toggle — pill style */}
          {!forgotMode && (
            <div className="flex bg-muted/40 rounded-xl p-1 mb-6 border border-border/50">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`relative flex-1 py-2.5 text-sm font-medium rounded-[10px] transition-all duration-300 ${
                    mode === m
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="auth-tab"
                      className="absolute inset-0 bg-background rounded-[10px] shadow-sm border border-border/50"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">
                    {m === "login" ? "Welcome Back" : "Join Us"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Signup success state */}
          {signupSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-5"
              >
                <Mail className="w-7 h-7 text-green-500" />
              </motion.div>
              <p className="font-semibold text-lg">Check your email 📬</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto leading-relaxed">
                We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                Please verify your email before signing in.
              </p>
              <button
                onClick={() => { setSignupSuccess(false); setMode("login"); }}
                className="text-primary hover:underline text-sm mt-6 inline-flex items-center gap-1.5 font-medium"
              >
                ← Go to sign in
              </button>
            </motion.div>
          ) : forgotMode && resetSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
              >
                <Mail className="w-7 h-7 text-primary" />
              </motion.div>
              <p className="font-semibold text-lg">Check your inbox 📬</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto leading-relaxed">
                We sent a reset link to <span className="font-medium text-foreground">{email}</span>.
                It should arrive within a minute.
              </p>
              <button
                onClick={() => { setForgotMode(false); setResetSent(false); }}
                className="text-primary hover:underline text-sm mt-6 inline-flex items-center gap-1.5 font-medium"
              >
                ← Back to sign in
              </button>
            </motion.div>
          ) : (
            <>
            {!forgotMode && (
              <div className="mb-4 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-medium border-border/70 hover:bg-muted/50"
                  size="lg"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </Button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60">or</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {mode === "register" && !forgotMode && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <InputField
                      label="What's your name?"
                      icon={<User className="w-4 h-4" />}
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={setName}
                    />
                    <InputField
                      label="Phone (optional)"
                      icon={<Phone className="w-4 h-4" />}
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={setPhone}
                      sublabel="We'll only text if it's important"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label={forgotMode ? "Your email address" : "Email"}
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
              />

              {!forgotMode && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-xs text-primary/80 hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary/70 transition-colors" />
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-border bg-muted/20 rounded-xl pl-10 pr-11 py-3 text-sm outline-none focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-muted-foreground/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/60 transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
              {mode === "register" && (
                    <div className="mt-1.5 ml-1">
                      <p className="text-[11px] text-muted-foreground/50">
                        At least 8 characters with a number or special character 🔒
                      </p>
                      {password.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {[
                            password.length >= 8,
                            /[0-9]/.test(password),
                            /[!@#$%^&*]/.test(password),
                          ].map((met, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${met ? "bg-green-500" : "bg-muted-foreground/20"}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <motion.div whileTap={{ scale: 0.985 }}>
                <Button
                  className="w-full py-3 mt-1 font-medium rounded-xl text-sm"
                  type="submit"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      {forgotMode
                        ? "Send Reset Link"
                        : mode === "login"
                        ? "Sign In"
                        : "Create My Account"}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {mode === "register" && !forgotMode && (
                <p className="text-[11px] text-muted-foreground/50 text-center leading-relaxed mt-2">
                  By joining, you agree to our terms of service and privacy policy.
                  We respect your data. Always.
                </p>
              )}
            </form>
          )}

          {/* Bottom links */}
          <div className="mt-6 pt-5 border-t border-border/30">
            <p className="text-center text-sm text-muted-foreground">
              {forgotMode ? (
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false); }}
                  className="text-primary font-medium hover:underline"
                >
                  ← Back to sign in
                </button>
              ) : (
                <>
                  {mode === "login" ? "New here?" : "Already part of the family?"}{" "}
                  <button
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="text-primary font-medium hover:underline"
                  >
                    {mode === "login" ? "Join us →" : "Sign in"}
                  </button>
                </>
              )}
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
});

AuthPage.displayName = "AuthPage";

/* ─── Reusable input with friendly labels ──────────────────────── */
function InputField({
  label,
  sublabel,
  icon,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary/70 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-border bg-muted/20 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-muted-foreground/40"
        />
      </div>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground/40 mt-1 ml-1">{sublabel}</p>
      )}
    </div>
  );
}

export default AuthPage;
