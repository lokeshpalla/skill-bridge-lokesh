import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2, Phone, GraduationCap, Briefcase, Search, Shield, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const roles = [
  { key: "student", label: "Student", icon: GraduationCap, desc: "Learn, code & grow", color: "hsl(var(--primary))" },
  { key: "mentor", label: "Mentor", icon: Briefcase, desc: "Guide & teach", color: "hsl(187 100% 42%)" },
  { key: "recruiter", label: "Recruiter", icon: Search, desc: "Hire talent", color: "hsl(262 80% 55%)" },
  { key: "admin", label: "Admin", icon: Shield, desc: "Manage platform", color: "hsl(0 72% 55%)" },
] as const;

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<string>("student");
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, getRedirectPath } = useAuth();
  const navigate = useNavigate();

  const activeRole = roles.find(r => r.key === selectedRole)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Missing email", description: "Please enter your email", variant: "destructive" });
      return;
    }

    if (forgotMode) {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      } else {
        setResetSent(true);
        toast({ title: "Reset email sent! 📧", description: "Check your inbox for a password reset link." });
      }
      setLoading(false);
      return;
    }

    if (!password) {
      toast({ title: "Missing password", description: "Please enter your password", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `Welcome back, ${activeRole.label}! 👋` });
        setTimeout(() => {
          navigate(getRedirectPath());
        }, 500);
      }
    } else {
      if (!name) {
        toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name, phone);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created! 🎉", description: "Check your email to verify your account." });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(hsl(187 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(187 100% 50%) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-4"
      >
        <div className="glass rounded-2xl p-8 shadow-card">
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold">
              {forgotMode ? "Reset Password" : mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {forgotMode ? "We'll send you a reset link" : mode === "login" ? "Select your role and sign in" : "Start your journey today"}
            </p>
          </div>

          {/* Role Selector — visible on login */}
          {mode === "login" && !forgotMode && (
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-3 text-center uppercase tracking-wider">I am a</p>
              <div className="grid grid-cols-4 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isActive = selectedRole === role.key;
                  return (
                    <motion.button
                      key={role.key}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedRole(role.key)}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                        isActive
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-secondary"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {role.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="roleIndicator"
                          className="absolute -bottom-px left-2 right-2 h-0.5 bg-primary rounded-full"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {/* Info note */}
              <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-muted/50 border border-border/30">
                <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  All roles use the <strong>same login</strong>. Your dashboard will match your assigned role automatically. New users start as Students.
                </p>
              </div>
            </div>
          )}

          {/* Sign In / Sign Up toggle */}
          {!forgotMode && (
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
          )}

          {forgotMode && resetSent ? (
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="font-semibold">Check your email</p>
              <p className="text-sm text-muted-foreground mt-1">We sent a reset link to <strong>{email}</strong></p>
              <button
                onClick={() => { setForgotMode(false); setResetSent(false); }}
                className="text-primary hover:underline text-sm mt-4 inline-block"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "register" && !forgotMode && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-secondary rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="Mobile number (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-secondary rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {!forgotMode && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              )}

              {mode === "login" && !forgotMode && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button variant="hero" className="w-full py-3" type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : forgotMode ? (
                  "Send Reset Link"
                ) : mode === "login" ? (
                  <span className="flex items-center gap-2">
                    Sign In as {activeRole.label}
                    <activeRole.icon className="w-4 h-4" />
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>

              {mode === "register" && !forgotMode && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/30">
                  <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    All new accounts start as <strong>Student</strong>. You can become a Mentor from the Mentors page. Recruiter & Admin roles are assigned by admins.
                  </p>
                </div>
              )}
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            {forgotMode ? (
              <button onClick={() => { setForgotMode(false); setResetSent(false); }} className="text-primary hover:underline">
                Back to Sign In
              </button>
            ) : (
              <>
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="text-primary hover:underline"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
