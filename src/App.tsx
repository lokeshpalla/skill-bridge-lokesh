import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CoursesPage from "./pages/CoursesPage";
import CourseDetail from "./pages/CourseDetail";
import CodingPage from "./pages/CodingPage";
import MentorsPage from "./pages/MentorsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import InternshipsPage from "./pages/InternshipsPage";
import PortfolioPage from "./pages/PortfolioPage";
import AchievementsPage from "./pages/AchievementsPage";
import CommunityPage from "./pages/CommunityPage";
import InstallPage from "./pages/InstallPage";
import InterviewPage from "./pages/InterviewPage";
import LearningPathsPage from "./pages/LearningPathsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import RoomsPage from "./pages/RoomsPage";
import LiveRoomPage from "./pages/LiveRoomPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/coding" element={<CodingPage />} />
              <Route path="/mentors" element={<MentorsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/internships" element={<InternshipsPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/install" element={<InstallPage />} />
              <Route path="/interview" element={<InterviewPage />} />
              <Route path="/paths" element={<LearningPathsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
