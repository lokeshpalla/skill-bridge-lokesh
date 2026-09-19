import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pageMeta: Record<string, { title: string; description: string; jsonLd?: object }> = {
  "/": { title: "Skill Bridge — AI-Powered Learning Platform", description: "Master coding, land internships, and build your career with AI-powered courses, mentorship, and 500+ coding challenges." },
  "/auth": { title: "Sign In | Skill Bridge", description: "Sign in or create your Skill Bridge account to start learning." },
  "/dashboard": { title: "Dashboard | Skill Bridge", description: "Track your learning progress, streaks, and XP on your personalized dashboard." },
  "/courses": {
    title: "Courses | Skill Bridge",
    description: "Browse expert-led courses in web development, AI/ML, system design, and more.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Skill Bridge Courses",
      description: "Expert-led courses in web development, AI/ML, system design, and more.",
      url: "https://grexil-lokesh01.lovable.app/courses",
    },
  },
  "/coding": { title: "Coding Challenges | Skill Bridge", description: "Practice 500+ coding problems with real-time execution and AI hints." },
  "/mentors": {
    title: "Mentors | Skill Bridge",
    description: "Book 1:1 sessions with senior engineers from top tech companies.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Skill Bridge Mentorship",
      description: "Book 1:1 sessions with senior engineers from top tech companies.",
      provider: { "@type": "Organization", name: "Skill Bridge" },
    },
  },
  "/leaderboard": { title: "Leaderboard | Skill Bridge", description: "See where you rank among 50,000+ developers on Skill Bridge." },
  "/internships": { title: "Internships | Skill Bridge", description: "Discover AI-matched internship opportunities from top companies." },
  "/portfolio": { title: "Portfolio | Skill Bridge", description: "Build and showcase your developer portfolio with projects and achievements." },
  "/achievements": { title: "Achievements | Skill Bridge", description: "View your earned badges, XP milestones, and seasonal challenges." },
  "/community": { title: "Community | Skill Bridge", description: "Join discussions, share solutions, and collaborate with fellow developers." },
  "/interview": { title: "Mock Interviews | Skill Bridge", description: "Practice AI-powered mock interviews with real-time feedback." },
  "/paths": { title: "Learning Paths | Skill Bridge", description: "Follow curated learning paths to master full-stack, data science, or cloud." },
  "/rooms": { title: "Collaboration Rooms | Skill Bridge", description: "Join live rooms for video calls, screen sharing, and collaborative coding." },
  "/analytics": { title: "Analytics | Skill Bridge", description: "Visualize your coding activity, skill growth, and learning trends." },
  "/settings": { title: "Settings | Skill Bridge", description: "Manage your Skill Bridge account, profile, and preferences." },
  "/install": { title: "Install App | Skill Bridge", description: "Install Skill Bridge as a PWA for offline access and push notifications." },
  "/admin": { title: "Admin | Skill Bridge", description: "Manage courses, users, and platform analytics." },
  "/certificates": { title: "Certificates | Skill Bridge", description: "View and download your earned course certificates." },
  "/messages": { title: "Messages | Skill Bridge", description: "Chat with mentors, teammates, and fellow developers." },
  "/teams": { title: "Find a Team | Skill Bridge", description: "Match with developers and build projects together." },
  "/recruiter": { title: "Recruiter Dashboard | Skill Bridge", description: "Manage job postings, track candidates, and hire top talent." },
  "/talent": { title: "Browse Talent | Skill Bridge", description: "Discover skilled developers ready for internships and jobs." },
};

const BASE_URL = "https://grexil-lokesh01.lovable.app";

export function usePageMeta() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const meta = pageMeta[path] || {
      title: "Skill Bridge — AI-Powered Learning Platform",
      description: "Master coding, land internships, and build your career with AI-powered courses, mentorship, and 500+ hands-on coding challenges.",
    };

    document.title = meta.title;

    // Meta description
    updateMeta("name", "description", meta.description);
    // OG tags
    updateMeta("property", "og:title", meta.title);
    updateMeta("property", "og:description", meta.description);
    updateMeta("property", "og:url", `${BASE_URL}${path}`);
    // Twitter tags
    updateMeta("name", "twitter:title", meta.title);
    updateMeta("name", "twitter:description", meta.description);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${BASE_URL}${path}`);

    // JSON-LD structured data
    const existingLd = document.getElementById("json-ld-page");
    if (existingLd) existingLd.remove();

    if ("jsonLd" in meta && meta.jsonLd) {
      const script = document.createElement("script");
      script.id = "json-ld-page";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(meta.jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const ld = document.getElementById("json-ld-page");
      if (ld) ld.remove();
    };
  }, [location.pathname]);
}

function updateMeta(attr: string, key: string, content: string) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}
