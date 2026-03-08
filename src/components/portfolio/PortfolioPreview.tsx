import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, Github, Globe, ExternalLink, Mail, Linkedin, ArrowLeft, Sparkles, Briefcase, Share2, Copy, Check } from "lucide-react";
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
  onBack?: () => void;
  shareUserId?: string;
}

const PortfolioPreview = ({ profile, projects, onBack, shareUserId }: PortfolioPreviewProps) => {
  const portfolioRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!shareUserId) return;
    const url = `${window.location.origin}/portfolio/${shareUserId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!portfolioRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(portfolioRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#050a15",
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

  const firstName = profile.display_name?.split(" ")[0] || "";

  // Color palette for inline styles (needed for PDF rendering)
  const c = {
    bg: "#050a15",
    bgCard: "#0a1128",
    bgCardHover: "#0f1a35",
    cyan: "#00d4ff",
    purple: "#7c3aed",
    purpleLight: "#a78bfa",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    border: "rgba(255,255,255,0.06)",
    borderAccent: "rgba(0,212,255,0.15)",
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between sticky top-0 z-50 py-3 px-4 -mx-4 rounded-xl"
        style={{ background: "rgba(5,10,21,0.85)", backdropFilter: "blur(12px)" }}
      >
        {onBack ? (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Back to Editor
          </Button>
        ) : <div />}
        <div className="flex gap-2">
          {shareUserId && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          )}
          <Button
            variant="hero"
            size="sm"
            className="gap-2"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generating..." : "Download as PDF"}
          </Button>
        </div>
      </motion.div>

      {/* Full Portfolio Website */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          ref={portfolioRef}
          style={{
            background: c.bg,
            color: c.textPrimary,
            fontFamily: "'Space Grotesk', sans-serif",
            minHeight: "100vh",
          }}
        >
          {/* ═══════════ HERO SECTION ═══════════ */}
          <div
            style={{
              background: `linear-gradient(160deg, ${c.bgCard}, ${c.bg} 40%, rgba(124,58,237,0.08) 80%, ${c.bg})`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background orbs */}
            <div style={{
              position: "absolute", top: "-80px", right: "-40px",
              width: "400px", height: "400px", borderRadius: "50%", opacity: 0.07,
              background: `radial-gradient(circle, ${c.cyan}, transparent 70%)`,
            }} />
            <div style={{
              position: "absolute", bottom: "-60px", left: "10%",
              width: "300px", height: "300px", borderRadius: "50%", opacity: 0.05,
              background: `radial-gradient(circle, ${c.purple}, transparent 70%)`,
            }} />

            {/* Nav */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "24px 40px", position: "relative", zIndex: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: `linear-gradient(135deg, ${c.cyan}, ${c.purple})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 700, color: c.bg,
                }}>
                  {firstName.charAt(0)}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: c.textPrimary }}>
                  {firstName}.dev
                </span>
              </div>
              <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: c.textMuted }}>
                <span>About</span>
                <span>Skills</span>
                <span>Projects</span>
                <span>Contact</span>
              </div>
            </div>

            {/* Hero content */}
            <div style={{ padding: "60px 40px 80px", position: "relative", zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                {/* Avatar */}
                <div style={{
                  width: "120px", height: "120px", borderRadius: "24px", flexShrink: 0,
                  background: `linear-gradient(135deg, ${c.cyan}, ${c.purple})`,
                  padding: "3px",
                }}>
                  <div style={{
                    width: "100%", height: "100%", borderRadius: "22px", overflow: "hidden",
                    background: c.bgCard,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "48px", fontWeight: 700, color: c.cyan,
                  }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      firstName.charAt(0)
                    )}
                  </div>
                </div>

                <div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    fontSize: "11px", fontWeight: 600, color: c.cyan,
                    background: "rgba(0,212,255,0.08)", border: `1px solid rgba(0,212,255,0.2)`,
                    padding: "4px 12px", borderRadius: "100px", marginBottom: "12px",
                    textTransform: "uppercase", letterSpacing: "1px",
                  }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.cyan }} />
                    Available for opportunities
                  </div>

                  <h1 style={{
                    fontSize: "42px", fontWeight: 700, lineHeight: 1.1,
                    margin: "0 0 8px 0", color: c.textPrimary,
                  }}>
                    Hi, I'm{" "}
                    <span style={{
                      background: `linear-gradient(135deg, ${c.cyan}, ${c.purpleLight})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                      {profile.display_name}
                    </span>
                  </h1>

                  {profile.bio && (
                    <p style={{ fontSize: "16px", color: c.textSecondary, maxWidth: "500px", lineHeight: 1.6, margin: 0 }}>
                      {profile.bio}
                    </p>
                  )}

                  {/* Social links */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 500,
                        background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`,
                        color: c.textSecondary, textDecoration: "none",
                      }}>
                        <Github style={{ width: "14px", height: "14px" }} /> GitHub
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 500,
                        background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`,
                        color: c.textSecondary, textDecoration: "none",
                      }}>
                        <Linkedin style={{ width: "14px", height: "14px" }} /> LinkedIn
                      </a>
                    )}
                    {profile.portfolio_url && (
                      <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 500,
                        background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`,
                        color: c.textSecondary, textDecoration: "none",
                      }}>
                        <Globe style={{ width: "14px", height: "14px" }} /> Website
                      </a>
                    )}
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 500,
                        background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`,
                        color: c.textSecondary, textDecoration: "none",
                      }}>
                        <Mail style={{ width: "14px", height: "14px" }} /> Email
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{
                display: "flex", gap: "0", marginTop: "48px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${c.border}`,
                borderRadius: "16px", overflow: "hidden",
              }}>
                {[
                  { value: profile.xp.toLocaleString(), label: "XP Earned", icon: "⚡" },
                  { value: profile.streak, label: "Day Streak", icon: "🔥" },
                  { value: projects.length, label: "Projects Built", icon: "🚀" },
                  { value: profile.skills?.length || 0, label: "Technologies", icon: "💡" },
                ].map((stat, i) => (
                  <div key={i} style={{
                    flex: 1, textAlign: "center", padding: "24px 16px",
                    borderRight: i < 3 ? `1px solid ${c.border}` : "none",
                  }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>{stat.icon}</div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: c.textPrimary }}>{stat.value}</div>
                    <div style={{ fontSize: "11px", color: c.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════════ SKILLS SECTION ═══════════ */}
          {profile.skills && profile.skills.length > 0 && (
            <div style={{ padding: "64px 40px", borderTop: `1px solid ${c.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Sparkles style={{ width: "18px", height: "18px", color: c.cyan }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: c.cyan, textTransform: "uppercase", letterSpacing: "2px" }}>
                  Skills & Technologies
                </span>
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 700, color: c.textPrimary, margin: "0 0 32px 0" }}>
                What I Work With
              </h2>

              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px" }}>
                {profile.skills.map((skill, i) => (
                  <div
                    key={skill}
                    style={{
                      padding: "12px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
                      background: i % 3 === 0
                        ? "rgba(0,212,255,0.06)"
                        : i % 3 === 1
                          ? "rgba(124,58,237,0.08)"
                          : "rgba(255,255,255,0.03)",
                      border: `1px solid ${i % 3 === 0 ? "rgba(0,212,255,0.15)" : i % 3 === 1 ? "rgba(124,58,237,0.2)" : c.border}`,
                      color: i % 3 === 0 ? c.cyan : i % 3 === 1 ? c.purpleLight : c.textSecondary,
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ PROJECTS SECTION ═══════════ */}
          {projects.length > 0 && (
            <div style={{ padding: "64px 40px", borderTop: `1px solid ${c.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Briefcase style={{ width: "18px", height: "18px", color: c.purple }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: c.purpleLight, textTransform: "uppercase", letterSpacing: "2px" }}>
                  Featured Projects
                </span>
              </div>
              <h2 style={{ fontSize: "28px", fontWeight: 700, color: c.textPrimary, margin: "0 0 32px 0" }}>
                Things I've Built
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {projects.map((project, i) => (
                  <div
                    key={project.id}
                    style={{
                      borderRadius: "16px", overflow: "hidden",
                      background: c.bgCard,
                      border: `1px solid ${c.border}`,
                      gridColumn: i === 0 && projects.length >= 3 ? "span 2" : undefined,
                    }}
                  >
                    {/* Project header gradient bar */}
                    <div style={{
                      height: "4px",
                      background: i % 2 === 0
                        ? `linear-gradient(90deg, ${c.cyan}, ${c.purple})`
                        : `linear-gradient(90deg, ${c.purple}, ${c.cyan})`,
                    }} />

                    <div style={{ padding: "28px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{
                            fontSize: "11px", color: c.textMuted, textTransform: "uppercase",
                            letterSpacing: "1px", marginBottom: "6px",
                          }}>
                            Project {String(i + 1).padStart(2, "0")}
                          </div>
                          <h3 style={{ fontSize: "20px", fontWeight: 700, color: c.textPrimary, margin: 0 }}>
                            {project.title}
                          </h3>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {project.github_url && (
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer" style={{
                              width: "36px", height: "36px", borderRadius: "10px",
                              background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: c.textMuted, textDecoration: "none",
                            }}>
                              <Github style={{ width: "16px", height: "16px" }} />
                            </a>
                          )}
                          {project.live_url && (
                            <a href={project.live_url} target="_blank" rel="noopener noreferrer" style={{
                              width: "36px", height: "36px", borderRadius: "10px",
                              background: "rgba(0,212,255,0.08)", border: `1px solid rgba(0,212,255,0.2)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: c.cyan, textDecoration: "none",
                            }}>
                              <ExternalLink style={{ width: "16px", height: "16px" }} />
                            </a>
                          )}
                        </div>
                      </div>

                      {project.description && (
                        <p style={{
                          fontSize: "13px", color: c.textMuted, lineHeight: 1.7,
                          margin: "12px 0 0 0", maxWidth: "500px",
                        }}>
                          {project.description}
                        </p>
                      )}

                      {project.tech_stack.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginTop: "16px" }}>
                          {project.tech_stack.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
                                background: "rgba(124,58,237,0.1)",
                                border: "1px solid rgba(124,58,237,0.15)",
                                color: c.purpleLight, fontWeight: 500,
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ CONTACT / FOOTER ═══════════ */}
          <div style={{
            padding: "64px 40px", borderTop: `1px solid ${c.border}`,
            background: `linear-gradient(180deg, transparent, rgba(0,212,255,0.02))`,
            textAlign: "center" as const,
          }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, color: c.textPrimary, margin: "0 0 8px 0" }}>
              Let's Connect
            </h2>
            <p style={{ fontSize: "14px", color: c.textMuted, margin: "0 0 24px 0" }}>
              Interested in working together? Feel free to reach out!
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" as const }}>
              {profile.email && (
                <a href={`mailto:${profile.email}`} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 24px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                  background: `linear-gradient(135deg, ${c.cyan}, ${c.purple})`,
                  color: c.bg, textDecoration: "none",
                }}>
                  <Mail style={{ width: "16px", height: "16px" }} /> {profile.email}
                </a>
              )}
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 24px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`,
                  color: c.textSecondary, textDecoration: "none",
                }}>
                  <Github style={{ width: "16px", height: "16px" }} /> GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 24px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${c.border}`,
                  color: c.textSecondary, textDecoration: "none",
                }}>
                  <Linkedin style={{ width: "16px", height: "16px" }} /> LinkedIn
                </a>
              )}
            </div>

            <div style={{
              marginTop: "48px", paddingTop: "24px",
              borderTop: `1px solid ${c.border}`,
              fontSize: "12px", color: c.textMuted,
            }}>
              © {new Date().getFullYear()} {profile.display_name}. Built with{" "}
              <span style={{ color: c.cyan }}>SkillBridge</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PortfolioPreview;
