import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/": { title: "SkillBridge — AI-Powered Learning Platform", description: "Master coding, land internships, and build your career with AI-powered courses, mentorship, and 500+ coding challenges." },
  "/auth": { title: "Sign In | SkillBridge", description: "Sign in or create your SkillBridge account to start learning." },
  "/dashboard": { title: "Dashboard | SkillBridge", description: "Track your learning progress, streaks, and XP on your personalized dashboard." },
  "/courses": { title: "Courses | SkillBridge", description: "Browse expert-led courses in web development, AI/ML, system design, and more." },
  "/coding": { title: "Coding Challenges | SkillBridge", description: "Practice 500+ coding problems with real-time execution and AI hints." },
  "/mentors": { title: "Mentors | SkillBridge", description: "Book 1:1 sessions with senior engineers from top tech companies." },
  "/leaderboard": { title: "Leaderboard | SkillBridge", description: "See where you rank among 50,000+ developers on SkillBridge." },
  "/internships": { title: "Internships | SkillBridge", description: "Discover AI-matched internship opportunities from top companies." },
  "/portfolio": { title: "Portfolio | SkillBridge", description: "Build and showcase your developer portfolio with projects and achievements." },
  "/achievements": { title: "Achievements | SkillBridge", description: "View your earned badges, XP milestones, and seasonal challenges." },
  "/community": { title: "Community | SkillBridge", description: "Join discussions, share solutions, and collaborate with fellow developers." },
  "/interview": { title: "Mock Interviews | SkillBridge", description: "Practice AI-powered mock interviews with real-time feedback." },
  "/paths": { title: "Learning Paths | SkillBridge", description: "Follow curated learning paths to master full-stack, data science, or cloud." },
  "/rooms": { title: "Collaboration Rooms | SkillBridge", description: "Join live rooms for video calls, screen sharing, and collaborative coding." },
  "/analytics": { title: "Analytics | SkillBridge", description: "Visualize your coding activity, skill growth, and learning trends." },
  "/settings": { title: "Settings | SkillBridge", description: "Manage your SkillBridge account, profile, and preferences." },
  "/install": { title: "Install App | SkillBridge", description: "Install SkillBridge as a PWA for offline access and push notifications." },
  "/admin": { title: "Admin | SkillBridge", description: "Manage courses, users, and platform analytics." },
};

export function usePageMeta() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const meta = pageMeta[path] || {
      title: "SkillBridge — AI-Powered Learning Platform",
      description: "Master coding, land internships, and build your career.",
    };

    document.title = meta.title;

    let descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute("content", meta.description);
    }

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", meta.title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", meta.description);
  }, [location.pathname]);
}
