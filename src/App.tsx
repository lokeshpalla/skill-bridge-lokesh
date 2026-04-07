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
import PrivateRoute from "@/components/PrivateRoute";

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
          {/* Public routes */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/landing" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/portfolio/:userId" element={<PublicPortfolioPage />} />
          <Route path="/install" element={<InstallPage />} />

          {/* Protected routes — any authenticated user */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute><CoursesPage /></PrivateRoute>} />
          <Route path="/courses/:id" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
          <Route path="/coding" element={<PrivateRoute><CodingPage /></PrivateRoute>} />
          <Route path="/mentors" element={<PrivateRoute><MentorsPage /></PrivateRoute>} />
          <Route path="/mentor-session" element={<PrivateRoute><MentorSessionPage /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
          <Route path="/internships" element={<PrivateRoute><InternshipsPage /></PrivateRoute>} />
          <Route path="/portfolio" element={<PrivateRoute><PortfolioPage /></PrivateRoute>} />
          <Route path="/talent" element={<PrivateRoute><TalentBrowsePage /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
          <Route path="/interview" element={<PrivateRoute><InterviewPage /></PrivateRoute>} />
          <Route path="/paths" element={<PrivateRoute><LearningPathsPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/rooms" element={<PrivateRoute><RoomsPage /></PrivateRoute>} />
          <Route path="/rooms/:id" element={<PrivateRoute><LiveRoomPage /></PrivateRoute>} />
          <Route path="/teams" element={<PrivateRoute><TeamMatchingPage /></PrivateRoute>} />
          <Route path="/teams/:projectId/repo" element={<PrivateRoute><TeamProjectRepoPage /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
          <Route path="/certificates" element={<PrivateRoute><CertificatesPage /></PrivateRoute>} />

          {/* Role-protected routes */}
          <Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminPage /></PrivateRoute>} />
          <Route path="/recruiter" element={<PrivateRoute requiredRole="recruiter"><RecruiterDashboard /></PrivateRoute>} />
          <Route path="/mentor-dashboard" element={<PrivateRoute requiredRole="mentor"><MentorDashboardPage /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
