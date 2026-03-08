import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Download, Plus, Trash2, FileText, Briefcase, GraduationCap, Award, User,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Profile {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  xp: number;
  streak: number;
  github_url: string | null;
  portfolio_url: string | null;
}

interface PortfolioProject {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
  image_url: string | null;
  created_at: string;
}

interface Experience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

interface ResumeData {
  objective: string;
  email: string;
  phone: string;
  location: string;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
}

interface ResumeBuilderProps {
  profile: Profile | null;
  projects: PortfolioProject[];
  onBack: () => void;
}

const genId = () => Math.random().toString(36).slice(2, 8);

const ResumeBuilder = ({ profile, projects, onBack }: ResumeBuilderProps) => {
  const [resume, setResume] = useState<ResumeData>({
    objective: profile?.bio || "",
    email: "",
    phone: "",
    location: "",
    experiences: [],
    education: [],
    certifications: [],
  });
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const addExperience = () => {
    setResume(prev => ({
      ...prev,
      experiences: [...prev.experiences, { id: genId(), role: "", company: "", duration: "", description: "" }],
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setResume(prev => ({
      ...prev,
      experiences: prev.experiences.map(e => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const removeExperience = (id: string) => {
    setResume(prev => ({ ...prev, experiences: prev.experiences.filter(e => e.id !== id) }));
  };

  const addEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [...prev.education, { id: genId(), degree: "", institution: "", year: "" }],
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  const removeEducation = (id: string) => {
    setResume(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
  };

  const addCertification = () => {
    setResume(prev => ({
      ...prev,
      certifications: [...prev.certifications, { id: genId(), name: "", issuer: "", year: "" }],
    }));
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setResume(prev => ({
      ...prev,
      certifications: prev.certifications.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  };

  const removeCertification = (id: string) => {
    setResume(prev => ({ ...prev, certifications: prev.certifications.filter(c => c.id !== id) }));
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const addPageIfNeeded = (needed: number) => {
        if (y + needed > 280) {
          doc.addPage();
          y = 20;
        }
      };

      // Name
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(profile?.display_name || "Your Name", pageWidth / 2, y, { align: "center" });
      y += 8;

      // Contact info
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const contactParts = [resume.email, resume.phone, resume.location].filter(Boolean);
      if (contactParts.length > 0) {
        doc.text(contactParts.join("  •  "), pageWidth / 2, y, { align: "center" });
        y += 5;
      }

      // Links
      const links = [
        profile?.github_url && `GitHub: ${profile.github_url}`,
        profile?.portfolio_url && `Portfolio: ${profile.portfolio_url}`,
      ].filter(Boolean);
      if (links.length > 0) {
        doc.setTextColor(60, 60, 180);
        doc.text(links.join("  |  "), pageWidth / 2, y, { align: "center" });
        doc.setTextColor(0, 0, 0);
        y += 8;
      } else {
        y += 3;
      }

      // Divider
      const drawDivider = () => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      };

      const sectionHeader = (title: string) => {
        addPageIfNeeded(15);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(title.toUpperCase(), margin, y);
        y += 2;
        drawDivider();
      };

      // Objective
      if (resume.objective.trim()) {
        sectionHeader("Professional Summary");
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(resume.objective, contentWidth);
        addPageIfNeeded(lines.length * 5);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 4;
      }

      // Skills
      if (profile?.skills && profile.skills.length > 0) {
        sectionHeader("Skills");
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const skillText = profile.skills.join("  •  ");
        const lines = doc.splitTextToSize(skillText, contentWidth);
        addPageIfNeeded(lines.length * 5);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 4;
      }

      // Experience
      if (resume.experiences.length > 0) {
        sectionHeader("Experience");
        resume.experiences.forEach(exp => {
          addPageIfNeeded(20);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(exp.role, margin, y);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(exp.duration, pageWidth - margin, y, { align: "right" });
          y += 5;
          doc.setFont("helvetica", "italic");
          doc.text(exp.company, margin, y);
          y += 5;
          if (exp.description) {
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(exp.description, contentWidth);
            addPageIfNeeded(lines.length * 4.5);
            doc.text(lines, margin, y);
            y += lines.length * 4.5;
          }
          y += 4;
        });
      }

      // Education
      if (resume.education.length > 0) {
        sectionHeader("Education");
        resume.education.forEach(edu => {
          addPageIfNeeded(12);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(edu.degree, margin, y);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(edu.year, pageWidth - margin, y, { align: "right" });
          y += 5;
          doc.setFont("helvetica", "italic");
          doc.text(edu.institution, margin, y);
          y += 7;
        });
      }

      // Projects
      if (projects.length > 0) {
        sectionHeader("Projects");
        projects.forEach(proj => {
          addPageIfNeeded(15);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(proj.title, margin, y);
          y += 5;
          if (proj.description) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(proj.description, contentWidth);
            addPageIfNeeded(lines.length * 4.5);
            doc.text(lines, margin, y);
            y += lines.length * 4.5;
          }
          if (proj.tech_stack.length > 0) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text("Tech: " + proj.tech_stack.join(", "), margin, y);
            y += 4;
          }
          y += 3;
        });
      }

      // Certifications
      if (resume.certifications.length > 0) {
        sectionHeader("Certifications");
        resume.certifications.forEach(cert => {
          addPageIfNeeded(10);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(cert.name, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(cert.year, pageWidth - margin, y, { align: "right" });
          y += 5;
          doc.setFont("helvetica", "italic");
          doc.text(cert.issuer, margin, y);
          y += 7;
        });
      }

      doc.save(`${(profile?.display_name || "resume").replace(/\s+/g, "_")}_Resume.pdf`);
      toast.success("Resume downloaded! 🎉");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Resume Builder</h1>
            <p className="text-sm text-muted-foreground">Create a professional resume from your portfolio</p>
          </div>
        </div>
        <Button variant="default" size="sm" className="gap-1.5" onClick={generatePDF} disabled={generating}>
          <Download className="w-4 h-4" /> {generating ? "Generating..." : "Download PDF"}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          {/* Contact */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Contact Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={resume.email} onChange={e => setResume(prev => ({ ...prev, email: e.target.value }))} placeholder="you@email.com" className="text-xs h-9" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={resume.phone} onChange={e => setResume(prev => ({ ...prev, phone: e.target.value }))} placeholder="+1 234 567 890" className="text-xs h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input value={resume.location} onChange={e => setResume(prev => ({ ...prev, location: e.target.value }))} placeholder="City, Country" className="text-xs h-9" />
            </div>
          </motion.div>

          {/* Objective */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold">Professional Summary</h2>
            <Textarea
              value={resume.objective}
              onChange={e => setResume(prev => ({ ...prev, objective: e.target.value }))}
              placeholder="A brief summary of your professional background and goals..."
              className="text-xs min-h-[80px]"
            />
          </motion.div>

          {/* Skills from profile */}
          {profile?.skills && profile.skills.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
              <h2 className="text-sm font-semibold">Skills (from profile)</h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map(s => (
                  <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Edit skills in your profile settings</p>
            </motion.div>
          )}

          {/* Experience */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Experience</h2>
              </div>
              <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addExperience}>
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
            {resume.experiences.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No experience added yet</p>
            )}
            {resume.experiences.map((exp, i) => (
              <div key={exp.id} className="space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground">Experience #{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeExperience(exp.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                <Input value={exp.role} onChange={e => updateExperience(exp.id, "role", e.target.value)} placeholder="Job Title" className="text-xs h-8" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={exp.company} onChange={e => updateExperience(exp.id, "company", e.target.value)} placeholder="Company" className="text-xs h-8" />
                  <Input value={exp.duration} onChange={e => updateExperience(exp.id, "duration", e.target.value)} placeholder="2022 - Present" className="text-xs h-8" />
                </div>
                <Textarea value={exp.description} onChange={e => updateExperience(exp.id, "description", e.target.value)} placeholder="Key responsibilities and achievements..." className="text-xs min-h-[60px]" />
              </div>
            ))}
          </motion.div>

          {/* Education */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Education</h2>
              </div>
              <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addEducation}>
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
            {resume.education.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No education added yet</p>
            )}
            {resume.education.map((edu, i) => (
              <div key={edu.id} className="space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground">Education #{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEducation(edu.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                <Input value={edu.degree} onChange={e => updateEducation(edu.id, "degree", e.target.value)} placeholder="Degree / Program" className="text-xs h-8" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={edu.institution} onChange={e => updateEducation(edu.id, "institution", e.target.value)} placeholder="University / School" className="text-xs h-8" />
                  <Input value={edu.year} onChange={e => updateEducation(edu.id, "year", e.target.value)} placeholder="2020 - 2024" className="text-xs h-8" />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Certifications */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Certifications</h2>
              </div>
              <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addCertification}>
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
            {resume.certifications.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No certifications added yet</p>
            )}
            {resume.certifications.map((cert, i) => (
              <div key={cert.id} className="space-y-2 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-muted-foreground">Certification #{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCertification(cert.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                <Input value={cert.name} onChange={e => updateCertification(cert.id, "name", e.target.value)} placeholder="Certification Name" className="text-xs h-8" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={cert.issuer} onChange={e => updateCertification(cert.id, "issuer", e.target.value)} placeholder="Issuing Organization" className="text-xs h-8" />
                  <Input value={cert.year} onChange={e => updateCertification(cert.id, "year", e.target.value)} placeholder="2024" className="text-xs h-8" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Live Preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:sticky lg:top-6 self-start">
          <div className="rounded-xl border border-border/50 bg-white text-gray-900 p-8 shadow-lg min-h-[600px]" ref={previewRef}>
            {/* Preview Header */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{profile?.display_name || "Your Name"}</h2>
              {[resume.email, resume.phone, resume.location].filter(Boolean).length > 0 && (
                <p className="text-[11px] text-gray-500 mt-1">
                  {[resume.email, resume.phone, resume.location].filter(Boolean).join("  •  ")}
                </p>
              )}
              {(profile?.github_url || profile?.portfolio_url) && (
                <p className="text-[10px] text-blue-600 mt-0.5">
                  {[profile?.github_url, profile?.portfolio_url].filter(Boolean).join("  |  ")}
                </p>
              )}
            </div>

            {/* Summary */}
            {resume.objective && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Professional Summary</h3>
                <p className="text-[11px] text-gray-700 leading-relaxed">{resume.objective}</p>
              </div>
            )}

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Skills</h3>
                <p className="text-[11px] text-gray-700">{profile.skills.join("  •  ")}</p>
              </div>
            )}

            {/* Experience */}
            {resume.experiences.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Experience</h3>
                {resume.experiences.map(exp => (
                  <div key={exp.id} className="mb-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-semibold text-gray-900">{exp.role || "Job Title"}</span>
                      <span className="text-[10px] text-gray-500">{exp.duration}</span>
                    </div>
                    <p className="text-[10px] italic text-gray-600">{exp.company || "Company"}</p>
                    {exp.description && <p className="text-[10px] text-gray-700 mt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {resume.education.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Education</h3>
                {resume.education.map(edu => (
                  <div key={edu.id} className="mb-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-semibold text-gray-900">{edu.degree || "Degree"}</span>
                      <span className="text-[10px] text-gray-500">{edu.year}</span>
                    </div>
                    <p className="text-[10px] italic text-gray-600">{edu.institution || "Institution"}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Projects</h3>
                {projects.map(proj => (
                  <div key={proj.id} className="mb-2">
                    <span className="text-[11px] font-semibold text-gray-900">{proj.title}</span>
                    {proj.description && <p className="text-[10px] text-gray-700">{proj.description}</p>}
                    {proj.tech_stack.length > 0 && (
                      <p className="text-[9px] italic text-gray-500">Tech: {proj.tech_stack.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {resume.certifications.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-1 mb-2">Certifications</h3>
                {resume.certifications.map(cert => (
                  <div key={cert.id} className="mb-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] font-semibold text-gray-900">{cert.name || "Certification"}</span>
                      <span className="text-[10px] text-gray-500">{cert.year}</span>
                    </div>
                    <p className="text-[10px] italic text-gray-600">{cert.issuer || "Issuer"}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!resume.objective && resume.experiences.length === 0 && resume.education.length === 0 && projects.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Fill in the form to see your resume preview</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
