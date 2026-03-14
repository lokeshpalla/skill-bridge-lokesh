import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/layout/Layout";
import SplashScreen from "./pages/SplashScreen";
import { PageLoadingFallback } from "@/components/ui/loading-skeletons";
import { usePageMeta } from "@/hooks/usePageMeta";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const CodingPage = lazy(() => import("./pages/CodingPage"));
const MentorsPage = lazy(() => import("./pages/MentorsPage"));
const MentorSessionPage = lazy(() => import("./pages/MentorSessionPage"));
const MentorDashboardPage = lazy(() => import("./pages/MentorDashboardPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const InternshipsPage = lazy(() => import("./pages/InternshipsPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const RecruiterDashboard = lazy(() => import("./pages/RecruiterDashboard"));
const TalentBrowsePage = lazy(() => import("./pages/TalentBrowsePage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const PublicPortfolioPage = lazy(() => import("./pages/PublicPortfolioPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const InterviewPage = lazy(() => import("./pages/InterviewPage"));
const LearningPathsPage = lazy(() => import("./pages/LearningPathsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const RoomsPage = lazy(() => import("./pages/RoomsPage"));
const LiveRoomPage = lazy(() => import("./pages/LiveRoomPage"));
const TeamMatchingPage = lazy(() => import("./pages/TeamMatchingPage"));
const TeamProjectRepoPage = lazy(() => import("./pages/TeamProjectRepoPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function AppRoutes() {
  usePageMeta();

  return (
    <Layout>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/landing" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<SubscriptionGate><Dashboard /></SubscriptionGate>} />
          <Route path="/courses" element={<SubscriptionGate><CoursesPage /></SubscriptionGate>} />
          <Route path="/courses/:id" element={<SubscriptionGate><CourseDetail /></SubscriptionGate>} />
          <Route path="/coding" element={<SubscriptionGate><CodingPage /></SubscriptionGate>} />
          <Route path="/mentors" element={<MentorsPage />} />
          <Route path="/mentor-session" element={<MentorSessionPage />} />
          <Route path="/mentor-dashboard" element={<MentorDashboardPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/internships" element={<InternshipsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/recruiter" element={<RecruiterDashboard />} />
          <Route path="/talent" element={<TalentBrowsePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/portfolio/:userId" element={<PublicPortfolioPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/paths" element={<LearningPathsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<LiveRoomPage />} />
          <Route path="/teams" element={<TeamMatchingPage />} />
          <Route path="/teams/:projectId/repo" element={<TeamProjectRepoPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
