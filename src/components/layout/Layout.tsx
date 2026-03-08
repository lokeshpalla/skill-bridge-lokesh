import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { AppSidebar } from "./AppSidebar";
import AIAssistant from "@/components/ai/AIAssistant";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

const publicRoutes = ["/", "/auth"];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isPublic = publicRoutes.includes(location.pathname) || location.pathname === "*";
  const is404 = !publicRoutes.includes(location.pathname) && ![
    "/dashboard", "/courses", "/coding", "/mentors",
    "/leaderboard", "/internships", "/portfolio", "/achievements",
    "/community", "/install", "/interview", "/paths", "/settings", "/admin", "/rooms", "/analytics"
  ].includes(location.pathname) && !location.pathname.startsWith("/courses/") && !location.pathname.startsWith("/rooms/");

  if (isPublic || is404) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="pt-16"
          >
            {children}
          </motion.main>
        </AnimatePresence>
        <AIAssistant />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/40 px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex-1"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
      <AIAssistant />
    </SidebarProvider>
  );
};

export default Layout;
