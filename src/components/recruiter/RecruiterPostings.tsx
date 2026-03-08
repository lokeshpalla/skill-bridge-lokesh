import { motion } from "framer-motion";
import { Briefcase, Plus, Eye, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Internship, Application } from "@/pages/RecruiterDashboard";

interface Props {
  internships: Internship[];
  applications: Application[];
  onViewApplicants: (id: string) => void;
  onDelete: (id: string) => void;
  onPost: () => void;
}

const RecruiterPostings = ({ internships, applications, onViewApplicants, onDelete, onPost }: Props) => {
  if (internships.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border/50 bg-card/60">
        <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-sm font-medium mb-1">No internships posted yet</h3>
        <p className="text-xs text-muted-foreground mb-4">Start by posting your first internship opportunity.</p>
        <Button variant="hero" size="sm" onClick={onPost}><Plus className="w-3.5 h-3.5 mr-1" /> Post Internship</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {internships.map((intern, i) => {
        const appCount = applications.filter(a => a.internship_id === intern.id).length;
        return (
          <motion.div key={intern.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border/50 bg-card/60 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-xl flex-shrink-0">
                {intern.logo_emoji || "🏢"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{intern.title}</h3>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  <span>{intern.company}</span>
                  {intern.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{intern.location}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">{appCount} applicant{appCount !== 1 ? "s" : ""}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => onViewApplicants(intern.id)}>
                <Eye className="w-3 h-3" /> View
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(intern.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RecruiterPostings;
