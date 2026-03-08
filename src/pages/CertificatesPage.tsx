import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Award, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import CertificateCard from "@/components/courses/CertificateCard";

const CertificatesPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("course_certificates")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false })
      .then(({ data }) => {
        setCertificates(data || []);
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Award className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Sign in to view your certificates</p>
          <Link to="/auth" className="text-xs text-primary hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Award className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">My Certificates</h1>
          <p className="text-xs text-muted-foreground">{certificates.length} certificate{certificates.length !== 1 ? "s" : ""} earned</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-64 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/60 p-12 text-center">
          <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-sm font-semibold mb-1">No certificates yet</h3>
          <p className="text-xs text-muted-foreground mb-4">Complete course exams to earn certificates</p>
          <Link to="/courses" className="text-xs text-primary hover:underline">Browse Courses →</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CertificateCard
                displayName={user.user_metadata?.display_name || user.email || "Student"}
                courseTitle={cert.course_title}
                grade={cert.grade}
                percentage={Number(cert.percentage)}
                certificateNumber={cert.certificate_number}
                issuedAt={cert.issued_at}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
