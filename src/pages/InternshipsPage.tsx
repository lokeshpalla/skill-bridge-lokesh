import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Clock, Search, ExternalLink, Building2,
  Briefcase, Globe, ArrowUpRight, Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string | null;
  duration: string | null;
  description: string | null;
  skills_required: string[];
  logo_emoji: string | null;
  created_at: string;
  apply_url: string | null;
}

const externalPlatforms = [
  { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/internship-jobs", icon: "💼", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", description: "Professional network with thousands of internship listings worldwide" },
  { name: "Internshala", url: "https://internshala.com/internships", icon: "🎓", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", description: "India's largest internship platform with verified opportunities" },
  { name: "AngelList / Wellfound", url: "https://wellfound.com/role/internship", icon: "🚀", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", description: "Startup internships at fast-growing companies" },
  { name: "Indeed", url: "https://www.indeed.com/q-internship-jobs.html", icon: "🔍", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", description: "One of the largest job search engines globally" },
  { name: "Glassdoor", url: "https://www.glassdoor.com/Job/internship-jobs-SRCH_KO0,10.htm", icon: "🏢", color: "bg-green-500/10 text-green-400 border-green-500/20", description: "Company reviews + internship listings with salary insights" },
  { name: "Unstop (D2C)", url: "https://unstop.com/internships", icon: "⚡", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", description: "Competitions, hackathons & internships for students" },
  { name: "HackerRank Jobs", url: "https://www.hackerrank.com/apply", icon: "💻", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", description: "Tech internships with coding challenge-based hiring" },
  { name: "Google Careers", url: "https://www.google.com/about/careers/applications/jobs/results?employment_type=INTERN", icon: "🔵", color: "bg-sky-500/10 text-sky-400 border-sky-500/20", description: "Internship programs at Google and Alphabet companies" },
];

const InternshipsPage = () => {
  const { user, profile } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"platforms" | "posted">("platforms");

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    const { data } = await supabase
      .from("internships")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setInternships(data.map((i: any) => ({
        ...i,
        skills_required: i.skills_required || [],
      })));
    }
    setLoading(false);
  };

  const getApplyUrl = (intern: Internship) => {
    if (intern.apply_url) return intern.apply_url;
    const query = encodeURIComponent(`${intern.company} ${intern.title} internship apply`);
    return `https://www.google.com/search?q=${query}`;
  };

  const filtered = internships.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      i.title.toLowerCase().includes(q) ||
      i.company.toLowerCase().includes(q) ||
      i.skills_required.some(s => s.toLowerCase().includes(q));
    const matchesLocation = locationFilter === "all" ||
      (i.location || "").toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const locations = [...new Set(internships.map(i => i.location).filter(Boolean))] as string[];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" /> Internships
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Find real internship opportunities from top companies</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["platforms", "🌐 Explore Platforms"], ["posted", "📋 Posted Internships"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* PLATFORMS TAB */}
      {tab === "platforms" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Browse real internship opportunities on these trusted platforms. Click to explore listings directly.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {externalPlatforms.map((platform, i) => (
              <motion.a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-border/50 bg-card/60 p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-xl">
                    {platform.icon}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{platform.name}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{platform.description}</p>
              </motion.a>
            ))}
          </div>
        </div>
      )}

      {/* POSTED INTERNSHIPS TAB */}
      {tab === "posted" && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, company, or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card/60 border-border/50 h-9 text-sm"
              />
            </div>
            {locations.length > 0 && (
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40 h-9 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Listings */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading internships...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-1">No internships posted yet</h3>
              <p className="text-xs text-muted-foreground">
                Check the "Explore Platforms" tab to find real opportunities on external job boards.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((intern, i) => (
                <motion.div
                  key={intern.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border/50 bg-card/60 p-5 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-xl">
                        {intern.logo_emoji || "🏢"}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{intern.title}</h3>
                        <p className="text-[11px] text-muted-foreground">{intern.company}</p>
                      </div>
                    </div>
                  </div>

                  {intern.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{intern.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                    {intern.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{intern.location}</span>
                    )}
                    {intern.duration && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{intern.duration}</span>
                    )}
                  </div>

                  {intern.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {intern.skills_required.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/80 text-secondary-foreground">{s}</span>
                      ))}
                    </div>
                  )}

                  <a
                    href={getApplyUrl(intern)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="hero"
                      className="w-full h-8 text-xs gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Apply Now
                    </Button>
                  </a>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InternshipsPage;
