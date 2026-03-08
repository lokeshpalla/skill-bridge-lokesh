import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Github, Linkedin, Save, Loader2, Star, GitFork, Import,
  ExternalLink, User, Globe, Check, Camera, Trash2, Crop, X, ZoomIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Cropper, { Area } from "react-easy-crop";

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
}

interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

const SettingsPage = () => {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // GitHub sync state
  const [ghProfile, setGhProfile] = useState<GitHubProfile | null>(null);
  const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
  const [ghLanguages, setGhLanguages] = useState<string[]>([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [importedRepos, setImportedRepos] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"profile" | "github" | "linkedin">("profile");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setSkills((profile.skills || []).join(", "));
      setGithubUrl(profile.github_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setPortfolioUrl(profile.portfolio_url || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    const reader = new FileReader();
    reader.onload = () => setCropImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const getCroppedBlob = async (): Promise<Blob> => {
    const image = new Image();
    image.src = cropImage!;
    await new Promise((r) => (image.onload = r));
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const { x, y, width, height } = croppedAreaPixels!;
    canvas.width = 256;
    canvas.height = 256;
    ctx.drawImage(image, x, y, width, height, 0, 0, 256, 256);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
  };

  const saveCroppedAvatar = async () => {
    if (!user || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob();
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: urlWithCache }).eq("user_id", user.id);
      setAvatarUrl(urlWithCache);
      setCropImage(null);
      toast.success("Avatar updated!");
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const removeAvatar = async () => {
    if (!user) return;
    setUploading(true);
    await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", user.id);
    setAvatarUrl(null);
    setUploading(false);
    toast.success("Avatar removed");
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        portfolio_url: portfolioUrl.trim() || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error("Failed to save");
    toast.success("Profile updated!");
  };

  const extractGithubUsername = (url: string) => {
    const match = url.match(/github\.com\/([^\/\?#]+)/);
    return match ? match[1] : url.replace(/^@/, "").trim();
  };

  const syncGitHub = async () => {
    const username = extractGithubUsername(githubUrl);
    if (!username) return toast.error("Enter a GitHub URL or username first");
    setGhLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("github-sync", {
        body: { username },
      });
      if (error) throw error;
      setGhProfile(data.profile);
      setGhRepos(data.repos);
      setGhLanguages(data.languages);
      toast.success(`Found ${data.repos.length} repos!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to sync GitHub");
    }
    setGhLoading(false);
  };

  const importRepo = async (repo: GitHubRepo) => {
    if (!user) return toast.error("Sign in to import");
    const { error } = await supabase.from("portfolio_projects").insert({
      user_id: user.id,
      title: repo.name,
      description: repo.description || `A ${repo.language || ""} project`,
      github_url: repo.html_url,
      live_url: repo.homepage || null,
      tech_stack: [repo.language, ...repo.topics].filter(Boolean).slice(0, 6),
    });
    if (error) {
      return toast.error("Failed to import");
    }
    setImportedRepos((prev) => new Set([...prev, repo.name]));
    toast.success(`Imported "${repo.name}" to portfolio!`);
  };

  const importSkills = async () => {
    if (!user || ghLanguages.length === 0) return;
    const current = skills.split(",").map((s) => s.trim()).filter(Boolean);
    const merged = [...new Set([...current, ...ghLanguages])];
    setSkills(merged.join(", "));
    toast.success(`Added ${ghLanguages.length} languages to skills`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and integrations</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["profile", "👤 Profile"], ["github", "🐙 GitHub"], ["linkedin", "💼 LinkedIn"]] as const).map(([t, label]) => (
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

      {/* Profile Tab */}
      {tab === "profile" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                  <User className="w-7 h-7 text-muted-foreground" />
                </div>
              )}
              <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium">Profile Photo</p>
              <p className="text-[11px] text-muted-foreground">Click to upload (max 2MB)</p>
              {avatarUrl && (
                <button onClick={removeAvatar} disabled={uploading} className="text-[11px] text-destructive hover:underline mt-0.5 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Display Name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Portfolio URL</label>
              <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yoursite.com" className="mt-1 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bio</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." className="mt-1 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Skills (comma-separated)</label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Python..." className="mt-1 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Github className="w-3 h-3" /> GitHub</label>
              <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" className="mt-1 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</label>
              <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" className="mt-1 text-sm" />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </Button>
        </motion.div>
      )}

      {/* GitHub Tab */}
      {tab === "github" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Github className="w-4 h-4" /> Sync GitHub
            </h3>
            <div className="flex gap-2">
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="GitHub username or URL"
                className="text-sm"
              />
              <Button onClick={syncGitHub} disabled={ghLoading} className="gap-1 flex-shrink-0">
                {ghLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                Sync
              </Button>
            </div>
          </div>

          {/* GitHub Profile Card */}
          {ghProfile && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5">
              <div className="flex items-center gap-4">
                <img src={ghProfile.avatar_url} alt={ghProfile.login} className="w-14 h-14 rounded-full" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{ghProfile.name || ghProfile.login}</h3>
                  {ghProfile.bio && <p className="text-xs text-muted-foreground mt-0.5">{ghProfile.bio}</p>}
                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>{ghProfile.public_repos} repos</span>
                    <span>{ghProfile.followers} followers</span>
                  </div>
                </div>
                <a href={ghProfile.html_url} target="_blank" rel="noopener">
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <ExternalLink className="w-3 h-3" /> Profile
                  </Button>
                </a>
              </div>

              {/* Languages */}
              {ghLanguages.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Languages detected</span>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={importSkills}>
                      <Import className="w-3 h-3" /> Add to Skills
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ghLanguages.map((l) => (
                      <span key={l} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Repos List */}
          {ghRepos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Repositories ({ghRepos.length})</h3>
                <span className="text-[10px] text-muted-foreground">Click import to add to portfolio</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {ghRepos.map((repo, i) => (
                  <motion.div
                    key={repo.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-lg border border-border/50 bg-card/60 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold truncate">{repo.name}</h4>
                        {repo.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          {repo.language && <span className="text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded">{repo.language}</span>}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{repo.stargazers_count}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><GitFork className="w-2.5 h-2.5" />{repo.forks_count}</span>
                        </div>
                      </div>
                      {importedRepos.has(repo.name) ? (
                        <span className="text-success"><Check className="w-4 h-4" /></span>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 flex-shrink-0" onClick={() => importRepo(repo)}>
                          <Import className="w-3 h-3" /> Import
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* LinkedIn Tab */}
      {tab === "linkedin" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" /> LinkedIn Integration
          </h3>
          <p className="text-xs text-muted-foreground">
            Add your LinkedIn profile URL to display it on your public portfolio and make it easy for recruiters to find you.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">LinkedIn Profile URL</label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/your-profile"
              className="mt-1 text-sm"
            />
          </div>
          <Button onClick={saveProfile} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save LinkedIn
          </Button>

          {linkedinUrl && (
            <div className="rounded-lg bg-secondary/30 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">LinkedIn Connected</p>
                <p className="text-[10px] text-muted-foreground truncate">{linkedinUrl}</p>
              </div>
              <a href={linkedinUrl} target="_blank" rel="noopener">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <ExternalLink className="w-3 h-3" /> View
                </Button>
              </a>
            </div>
          )}

          <div className="rounded-lg border border-border/30 bg-secondary/20 p-4">
            <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" /> What this enables
            </h4>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              <li>• LinkedIn link shown on your public portfolio</li>
              <li>• Recruiters can find and connect with you directly</li>
              <li>• Your profile appears in internship skill matching</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;
