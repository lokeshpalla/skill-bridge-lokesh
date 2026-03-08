import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, Github, Globe, ExternalLink, Mail, Linkedin, Code2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Profile {
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  xp: number;
  streak: number;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
}

interface PortfolioPreviewProps {
  profile: Profile;
  projects: Project[];
  onBack: () => void;
}

const PortfolioPreview = ({ profile, projects, onBack }: PortfolioPreviewProps) => {
  const portfolioRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!portfolioRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(portfolioRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0a0f1a",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -(pdfHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${profile.display_name.replace(/\s+/g, "_")}_Portfolio.pdf`);
    } catch {
      console.error("Failed to generate PDF");
    }
    setDownloading(false);
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back to Editor
        </Button>
        <Button
          variant="hero"
          size="sm"
          className="gap-2"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download className="w-4 h-4" />
          {downloading ? "Generating PDF..." : "Download Portfolio"}
        </Button>
      </motion.div>

      {/* Portfolio Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div
          ref={portfolioRef}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0d1424, #080d18, #0a1020)",
            color: "#e2e8f0",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {/* Hero Section */}
          <div
            className="relative px-8 pt-12 pb-10"
            style={{
              background: "linear-gradient(135deg, rgba(0,200,220,0.12), rgba(120,80,220,0.1), transparent)",
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, hsl(187 100% 50%), transparent 70%)" }}
            />
            <div className="flex items-center gap-6 relative z-10">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(187 100% 50%), hsl(262 80% 60%))",
                  color: "#0a0f1a",
                }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  profile.display_name?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#f1f5f9" }}>
                  {profile.display_name}
                </h1>
                {profile.bio && (
                  <p className="text-sm mt-1 max-w-lg leading-relaxed" style={{ color: "#94a3b8" }}>
                    {profile.bio}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {profile.email && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#64748b" }}>
                      <Mail className="w-3 h-3" /> {profile.email}
                    </span>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: "#00c8dc" }}>
                      <Github className="w-3 h-3" /> GitHub
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: "#00c8dc" }}>
                      <Linkedin className="w-3 h-3" /> LinkedIn
                    </a>
                  )}
                  {profile.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: "#00c8dc" }}>
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-6 relative z-10">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "#00c8dc" }}>{profile.xp}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>XP Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "#00c8dc" }}>{profile.streak}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "#00c8dc" }}>{projects.length}</div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>Projects</div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="px-8 py-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="w-4 h-4" style={{ color: "#00c8dc" }} />
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                  Skills & Technologies
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{
                      background: "rgba(0,200,220,0.1)",
                      color: "#00c8dc",
                      border: "1px solid rgba(0,200,220,0.2)",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="px-8 py-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "#94a3b8" }}>
                Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl p-5"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <h3 className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#64748b" }}>
                        {project.description}
                      </p>
                    )}
                    {project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {project.tech_stack.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded-md"
                            style={{
                              background: "rgba(120,80,220,0.12)",
                              color: "#a78bfa",
                              border: "1px solid rgba(120,80,220,0.2)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] hover:opacity-80" style={{ color: "#00c8dc" }}>
                          <Github className="w-3 h-3" /> Code
                        </a>
                      )}
                      {project.live_url && (
                        <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] hover:opacity-80" style={{ color: "#00c8dc" }}>
                          <ExternalLink className="w-3 h-3" /> Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-4 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-[10px]" style={{ color: "#475569" }}>
              Built with SkillBridge • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PortfolioPreview;
