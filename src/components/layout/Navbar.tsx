import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Code2, BookOpen, Users, Trophy, Briefcase, FolderKanban,
  LayoutDashboard, Menu, X, Sparkles, LogOut, User
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import grexilLogo from "@/assets/grexil-logo.jpeg";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/courses", label: "Courses", icon: BookOpen },
  { path: "/coding", label: "Coding", icon: Code2 },
  { path: "/mentors", label: "Mentors", icon: Users },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/internships", label: "Internships", icon: Briefcase },
  { path: "/portfolio", label: "Portfolio", icon: FolderKanban },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group" aria-label="GreXil home">
          <img src={grexilLogo} alt="GreXil" className="w-8 h-8 rounded-lg object-cover" aria-hidden="true" />
          <span className="text-lg font-bold text-foreground group-hover:text-gradient transition-colors">
            GreXil
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1" role="menubar" aria-label="Navigation links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} aria-current={active ? "page" : undefined}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}
                  aria-label={item.label}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center" aria-hidden="true">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium">{profile?.display_name || "User"}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="glow" size="sm">Sign In</Button>
            </Link>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </Button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-border/50 overflow-hidden"
            role="menu"
            aria-label="Mobile navigation"
          >
            <div className="container py-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} role="menuitem">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="w-4 h-4 mr-2" aria-hidden="true" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {user ? (
                <Button variant="secondary" className="w-full mt-2" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" aria-hidden="true" /> Sign Out
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)}>
                  <Button variant="hero" className="w-full mt-2">Sign In</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
