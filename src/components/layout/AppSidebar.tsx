import {
  Code2, BookOpen, Users, Trophy, Briefcase, FolderKanban,
  LayoutDashboard, Sparkles, LogOut, User, ChevronLeft, Settings, Award, MessageSquare, Download, Brain, Compass
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Coding", url: "/coding", icon: Code2 },
  { title: "Interview", url: "/interview", icon: Brain },
];

const socialItems = [
  { title: "Mentors", url: "/mentors", icon: Users },
  { title: "Community", url: "/community", icon: MessageSquare },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Achievements", url: "/achievements", icon: Award },
];

const careerItems = [
  { title: "Internships", url: "/internships", icon: Briefcase },
  { title: "Portfolio", url: "/portfolio", icon: FolderKanban },
  { title: "Install App", url: "/install", icon: Download },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all text-sm"
                  activeClassName="bg-primary/10 text-primary font-medium border border-primary/20"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-sidebar">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-foreground tracking-tight">
              SkillBridge
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 space-y-1">
        {renderGroup("Learn", mainItems)}
        {renderGroup("Community", socialItems)}
        {renderGroup("Career", careerItems)}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/40">
        {user ? (
          <div className="space-y-2">
            {!collapsed && (
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{profile?.display_name || "User"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{profile?.xp || 0} XP</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-destructive text-xs gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              {!collapsed && "Sign Out"}
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button variant="hero" size="sm" className="w-full text-xs">
              {collapsed ? <User className="w-3.5 h-3.5" /> : "Sign In"}
            </Button>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
