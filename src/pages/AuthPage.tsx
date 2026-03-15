import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Phone, GraduationCap, Briefcase, Search, Shield, ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const roles = [
  { key: "student", label: "Student", icon: GraduationCap, desc: "Learn & grow" },
  { key: "mentor", label: "Mentor", icon: Briefcase, desc: "Guide others" },
  { key: "recruiter", label: "Recruiter", icon: Search, desc: "Find talent" },
  { key: "admin", label: "Admin", icon: Shield, desc: "Manage platform" },
] as const;

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const showRoleSelector = roleParam && ["mentor", "recruiter", "admin"].includes(roleParam);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<string>(roleParam && roles.some(r => r.key === roleParam) ? roleParam : "student");
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
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
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
        toast({ title: "Check your inbox", description: "We've sent you a password reset link." });
      }
      setLoading(false);
      return;
    }

    if (!password) {
      toast({ title: "Password required", description: "Please enter your password.", variant: "destructive" });
      return;
    }

    if (mode === "register" && password.length < 6) {
      toast({ title: "Weak password", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { error, roles: userRoles } = await signIn(email, password);
      if (error) {
        const msg = error.message.includes("Invalid login") 
          ? "Incorrect email or password. Please try again."
          : error.message;
        toast({ title: "Login failed", description: msg, variant: "destructive" });
      } else {
        const redirectPath = getRedirectPath(userRoles);
        toast({ title: "Welcome back!" });
        navigate(redirectPath, { replace: true });
      }
    } else {
      if (!name.trim()) {
        toast({ title: "Name required", description: "We need your name to set up your profile.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name.trim(), phone);
      if (error) {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "You're all set!", description: "Your account has been created. Signing you in..." });
        // Auto sign-in after registration since auto-confirm is enabled
        const { error: signInError, roles: userRoles } = await signIn(email, password);
        if (!signInError) {
          const redirectPath = getRedirectPath(userRoles);
          navigate(redirectPath, { replace: true });
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, hsl(var(--primary-foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground tracking-tight">SkillBridge</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
            Build skills.<br />
            Land opportunities.<br />
            <span className="opacity-70">Grow your career.</span>
          </h2>
          <p className="text-primary-foreground/70 text-base max-w-sm leading-relaxed">
            Join thousands of developers mastering new skills through hands-on courses, mentorship, and real-world projects.
          </p>
          <div className="flex gap-8 pt-4">
            {[
              { num: "10K+", label: "Learners" },
              { num: "200+", label: "Courses" },
              { num: "50+", label: "Mentors" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-primary-foreground">{stat.num}</div>
                <div className="text-xs text-primary-foreground/60 uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-primary-foreground/40">© 2026 SkillBridge. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">SkillBridge</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">
              {forgotMode ? "Reset your password" : mode === "login" ? "Sign in to your account" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {forgotMode
                ? "Enter your email and we'll send a reset link."
                : mode === "login"
                ? "Enter your credentials to continue."
                : "Fill in the details below to get started."}
            </p>
          </div>

          {/* Role Selector — staff login only */}
          {mode === "login" && !forgotMode && showRoleSelector && (
            <div className="mb-6">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Sign in as</label>
              <div className="grid grid-cols-4 gap-1.5">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isActive = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => setSelectedRole(role.key)}
                      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border text-center transition-all duration-150 ${
                        isActive
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-transparent text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] font-medium leading-none">{role.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                All roles share the same credentials. Your dashboard adapts automatically.
              </p>
            </div>
          )}

          {/* Mode toggle */}
          {!forgotMode && (
            <div className="flex border border-border rounded-lg p-0.5 mb-6 bg-muted/30">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                    mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Reset sent state */}
          {forgotMode && resetSent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-lg">Check your inbox</p>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a reset link to <span className="font-medium text-foreground">{email}</span>
              </p>
              <button
                onClick={() => { setForgotMode(false); setResetSent(false); }}
                className="text-primary hover:underline text-sm mt-6 inline-flex items-center gap-1"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {mode === "register" && !forgotMode && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-border bg-background rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone <span className="text-muted-foreground/50">(optional)</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full border border-border bg-background rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                {!forgotMode && <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>}
                {forgotMode && <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email address</label>}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-border bg-background rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {!forgotMode && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setForgotMode(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-border bg-background rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === "register" && (
                    <p className="text-[11px] text-muted-foreground/60 mt-1">Minimum 6 characters</p>
                  )}
                </div>
              )}

              <Button
                className="w-full py-2.5 mt-2 font-medium"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {forgotMode ? "Send Reset Link" : mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              {mode === "register" && !forgotMode && (
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed mt-3">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              )}
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              {forgotMode ? (
                <button onClick={() => { setForgotMode(false); setResetSent(false); }} className="text-primary font-medium hover:underline">
                  Back to sign in
                </button>
              ) : (
                <>
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => setMode(mode === "login" ? "register" : "login")}
                    className="text-primary font-medium hover:underline"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </>
              )}
            </p>
          </div>

          {!showRoleSelector && !forgotMode && mode === "login" && (
            <p className="text-center text-[11px] text-muted-foreground/40 mt-3">
              <Link to="/auth?role=mentor" className="hover:text-muted-foreground transition-colors">
                Staff login →
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
