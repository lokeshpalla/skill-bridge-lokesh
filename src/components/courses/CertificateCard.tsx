import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateCardProps {
  displayName: string;
  courseTitle: string;
  grade: string;
  percentage: number;
  certificateNumber: string;
  issuedAt: string;
}

const gradeColors: Record<string, string> = {
  "A+": "#00d4ff",
  "A": "#22c55e",
  "B": "#84cc16",
  "C": "#eab308",
  "D": "#f97316",
  "F": "#ef4444",
};

const CertificateCard = ({ displayName, courseTitle, grade, percentage, certificateNumber, issuedAt }: CertificateCardProps) => {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: "#050a15" });
      const pdf = new jsPDF("l", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, h);
      pdf.save(`${courseTitle.replace(/\s+/g, "_")}_Certificate.pdf`);
    } catch { /* noop */ }
    setDownloading(false);
  };

  const color = gradeColors[grade] || "#94a3b8";
  const date = new Date(issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-3">
      <div
        ref={certRef}
        style={{
          background: "linear-gradient(160deg, #0a1128, #050a15, #0f1a35)",
          borderRadius: "16px",
          padding: "48px",
          fontFamily: "'Space Grotesk', sans-serif",
          color: "#e2e8f0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorations */}
        <div style={{
          position: "absolute", top: "-60px", right: "-40px",
          width: "300px", height: "300px", borderRadius: "50%", opacity: 0.06,
          background: `radial-gradient(circle, ${color}, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "10%",
          width: "200px", height: "200px", borderRadius: "50%", opacity: 0.04,
          background: `radial-gradient(circle, #7c3aed, transparent 70%)`,
        }} />

        {/* Border accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "4px",
          background: `linear-gradient(90deg, ${color}, #7c3aed, ${color})`,
        }} />

        <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Award style={{ width: "24px", height: "24px", color }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "3px" }}>
              Certificate of Completion
            </span>
          </div>

          <div style={{
            width: "60px", height: "1px", margin: "16px auto",
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }} />

          {/* Awarded to */}
          <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>This certifies that</p>
          <h1 style={{
            fontSize: "36px", fontWeight: 700, margin: "0 0 4px 0",
            background: `linear-gradient(135deg, ${color}, #a78bfa)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {displayName}
          </h1>

          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "16px 0 4px" }}>
            has successfully completed the course
          </p>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 20px" }}>
            {courseTitle}
          </h2>

          {/* Grade badge */}
          <div style={{ display: "inline-flex", flexDirection: "column" as const, alignItems: "center", gap: "4px" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "16px",
              background: `${color}15`, border: `2px solid ${color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "32px", fontWeight: 800, color,
            }}>
              {grade}
            </div>
            <span style={{ fontSize: "11px", color: "#64748b" }}>{percentage}% Score</span>
          </div>

          <div style={{
            width: "60px", height: "1px", margin: "20px auto",
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
          }} />

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>Certificate No.</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                {certificateNumber}
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>Issued by</p>
              <p style={{ fontSize: "13px", fontWeight: 600, color, margin: 0 }}>SkillBridge</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>Date Issued</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>{date}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="hero" size="sm" className="gap-1.5" onClick={handleDownload} disabled={downloading}>
          <Download className="w-4 h-4" /> {downloading ? "Generating..." : "Download Certificate"}
        </Button>
      </div>
    </div>
  );
};

export default CertificateCard;
