import { lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AIAssistant = lazy(() => import("@/components/ai/AIAssistant"));

const publicRoutes = ["/", "/auth", "/reset-password", "/landing"];
const hideNavbarRoutes = ["/auth", "/reset-password", "/"];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isPublic = publicRoutes.includes(location.pathname) || location.pathname === "*";
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);
  const is404 = !publicRoutes.includes(location.pathname) && ![
    "/dashboard", "/courses", "/coding", "/mentors",
    "/leaderboard", "/internships", "/portfolio", "/achievements",
    "/community", "/install", "/interview", "/paths", "/settings", "/admin", "/rooms", "/analytics"
  ].includes(location.pathname) && !location.pathname.startsWith("/courses/") && !location.pathname.startsWith("/rooms/");

  if (isPublic || is404) {
    return (
      <div className="min-h-screen bg-background">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        {!hideNavbar && <Navbar />}
        <AnimatePresence mode="wait">
          <motion.main
            id="main-content"
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={hideNavbar ? "" : "pt-16"}
            role="main"
            aria-label="Page content"
          >
            {children}
          </motion.main>
        </AnimatePresence>
        {user && <Suspense fallback={null}><AIAssistant /></Suspense>}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="h-14 flex items-center justify-between border-b border-border/50 px-4 bg-background/90 backdrop-blur-sm sticky top-0 z-30"
            role="banner"
            aria-label="App header"
          >
            <SidebarTrigger
              className="text-muted-foreground hover:text-foreground"
              aria-label="Toggle sidebar navigation"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </SidebarTrigger>
            <div className="flex items-center gap-1" role="toolbar" aria-label="App controls">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
          <AnimatePresence mode="wait">
            <motion.main
              id="main-content"
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex-1"
              role="main"
              aria-label="Page content"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
      {user && <Suspense fallback={null}><AIAssistant /></Suspense>}
    </SidebarProvider>
  );
};

export default Layout;
