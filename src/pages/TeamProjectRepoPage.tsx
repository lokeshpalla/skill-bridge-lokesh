import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FolderOpen, File, Upload, Trash2, Download, ArrowLeft,
  FileCode2, FileText, FileImage, FolderPlus, Eye, ChevronRight,
  GitBranch, Users, Clock, HardDrive, X, FolderUp
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  folder_path: string;
  uploaded_by: string;
  created_at: string;
}

interface GroupProject {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  tech_stack: string[];
  max_members: number;
  status: string;
}

const CODE_EXTENSIONS = [
  "js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "h", "hpp",
  "css", "scss", "less", "html", "xml", "json", "yaml", "yml",
  "md", "txt", "sh", "bash", "sql", "rb", "go", "rs", "php",
  "swift", "kt", "dart", "lua", "r", "m", "env", "toml", "ini",
  "gitignore", "dockerfile", "makefile"
];

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"];

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (CODE_EXTENSIONS.includes(ext)) return <FileCode2 className="w-4 h-4 text-blue-400" />;
  if (IMAGE_EXTENSIONS.includes(ext)) return <FileImage className="w-4 h-4 text-emerald-400" />;
  if (ext === "md" || ext === "txt") return <FileText className="w-4 h-4 text-amber-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getLanguageFromExt(ext: string): string {
  const map: Record<string, string> = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", java: "java", cpp: "c++", c: "c", rb: "ruby",
    go: "go", rs: "rust", php: "php", swift: "swift", kt: "kotlin",
    html: "html", css: "css", scss: "scss", json: "json",
    yaml: "yaml", yml: "yaml", md: "markdown", sql: "sql",
    sh: "bash", bash: "bash", dart: "dart", lua: "lua",
    xml: "xml", toml: "toml",
  };
  return map[ext] || "text";
}

export default function TeamProjectRepoPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<GroupProject | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [viewingFile, setViewingFile] = useState<ProjectFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  const isOwner = project?.owner_id === user?.id;

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (projectId) fetchProject();
  }, [user, projectId]);

  const fetchProject = async () => {
    setLoading(true);
    const { data: proj } = await supabase
      .from("group_projects")
      .select("*")
      .eq("id", projectId!)
      .single();

    if (!proj) { navigate("/teams"); return; }
    setProject(proj);

    const { count } = await supabase
      .from("group_project_members")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId!);
    setMemberCount((count || 0) + 1);

    await fetchFiles();
    setLoading(false);
  };

  const fetchFiles = async () => {
    const { data } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId!)
      .order("folder_path")
      .order("file_name");
    setFiles((data as ProjectFile[]) || []);
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || !user || !projectId || !isOwner) return;
    setUploading(true);

    for (const file of Array.from(fileList)) {
      // Determine the relative path for folder uploads
      const relativePath = (file as any).webkitRelativePath || file.name;
      const parts = relativePath.split("/");
      let folderPath = currentPath;
      let fileName = file.name;

      if (parts.length > 1) {
        // File from folder upload - preserve folder structure
        fileName = parts[parts.length - 1];
        const folderParts = parts.slice(0, -1);
        folderPath = currentPath
          ? currentPath + "/" + folderParts.join("/")
          : folderParts.join("/");
      }

      const storagePath = `${projectId}/${folderPath ? folderPath + "/" : ""}${Date.now()}_${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("team-projects")
        .upload(storagePath, file);

      if (uploadErr) {
        toast.error(`Failed to upload ${fileName}`);
        continue;
      }

      const { data: urlData } = await supabase.storage
        .from("team-projects")
        .createSignedUrl(storagePath, 3600);

      await supabase.from("project_files").insert({
        project_id: projectId,
        file_name: fileName,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type || null,
        folder_path: folderPath,
        uploaded_by: user.id,
      });
    }

    toast.success(`Uploaded ${fileList.length} file(s)`);
    await fetchFiles();
    setUploading(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newPath = currentPath
      ? currentPath + "/" + newFolderName.trim()
      : newFolderName.trim();
    setCurrentPath(newPath);
    setNewFolderName("");
    setShowNewFolder(false);
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    setDeletingId(file.id);
    await supabase.storage.from("team-projects").remove([file.file_path]);
    await supabase.from("project_files").delete().eq("id", file.id);
    toast.success("File deleted");
    setFiles(prev => prev.filter(f => f.id !== file.id));
    setDeletingId(null);
  };

  const handleViewFile = async (file: ProjectFile) => {
    setViewingFile(file);
    setFileContent(null);
    setFileUrl(null);

    const ext = file.file_name.split(".").pop()?.toLowerCase() || "";
    const { data: urlData } = await supabase.storage
      .from("team-projects")
      .createSignedUrl(file.file_path, 3600);
    const publicUrl = urlData?.signedUrl;

    if (IMAGE_EXTENSIONS.includes(ext)) {
      setFileUrl(publicUrl);
      return;
    }

    if (CODE_EXTENSIONS.includes(ext) || ext === "txt" || ext === "md") {
      try {
        const res = await fetch(publicUrl);
        const text = await res.text();
        setFileContent(text);
      } catch {
        setFileContent("// Unable to load file content");
      }
      return;
    }

    setFileUrl(publicUrl);
  };

  const handleDownload = async (file: ProjectFile) => {
    const { data } = await supabase.storage
      .from("team-projects")
      .createSignedUrl(file.file_path, 3600);
    if (!data?.signedUrl) return;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = file.file_name;
    a.click();
  };

  // Get folder structure for current path
  const currentItems = (() => {
    const folders = new Set<string>();
    const currentFiles: ProjectFile[] = [];

    files.forEach(f => {
      if (f.folder_path === currentPath) {
        currentFiles.push(f);
      } else if (f.folder_path.startsWith(currentPath ? currentPath + "/" : "")) {
        const remaining = currentPath
          ? f.folder_path.slice(currentPath.length + 1)
          : f.folder_path;
        const nextFolder = remaining.split("/")[0];
        if (nextFolder) folders.add(nextFolder);
      }
    });

    return { folders: Array.from(folders).sort(), files: currentFiles };
  })();

  const breadcrumbs = currentPath ? currentPath.split("/") : [];
  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0);

  // Find README
  const readmeFile = currentPath === ""
    ? files.find(f =>
        f.folder_path === "" &&
        f.file_name.toLowerCase().startsWith("readme")
      )
    : null;

  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  useEffect(() => {
    if (readmeFile) {
      const { data } = supabase.storage
        .from("team-projects")
        .getPublicUrl(readmeFile.file_path);
      fetch(data.publicUrl)
        .then(res => res.text())
        .then(setReadmeContent)
        .catch(() => setReadmeContent(null));
    } else {
      setReadmeContent(null);
    }
  }, [readmeFile?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teams")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <GitBranch className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground truncate">{project?.title}</h1>
            <Badge variant="outline" className="text-xs">{project?.status}</Badge>
          </div>
          {project?.description && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{project.description}</p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {memberCount} members
        </div>
        <div className="flex items-center gap-1.5">
          <File className="w-3.5 h-3.5" />
          {files.length} files
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />
          {formatFileSize(totalSize)}
        </div>
        {project?.tech_stack?.map(t => (
          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
        ))}
      </div>

      {/* Upload actions (owner only) */}
      {isOwner && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={e => handleUploadFiles(e.target.files)}
          />
          <input
            type="file"
            ref={folderInputRef}
            className="hidden"
            // @ts-ignore
            webkitdirectory="true"
            multiple
            onChange={e => handleUploadFiles(e.target.files)}
          />
          <Button
            size="sm"
            variant="default"
            className="gap-1.5 text-xs"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            disabled={uploading}
            onClick={() => folderInputRef.current?.click()}
          >
            <FolderUp className="w-3.5 h-3.5" /> Upload Folder
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => setShowNewFolder(true)}
          >
            <FolderPlus className="w-3.5 h-3.5" /> New Folder
          </Button>

          {showNewFolder && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="h-8 w-40 text-xs"
                onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button
          onClick={() => setCurrentPath("")}
          className="text-primary hover:underline font-medium"
        >
          root
        </button>
        {breadcrumbs.map((crumb, idx) => {
          const path = breadcrumbs.slice(0, idx + 1).join("/");
          return (
            <span key={idx} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <button
                onClick={() => setCurrentPath(path)}
                className="text-primary hover:underline"
              >
                {crumb}
              </button>
            </span>
          );
        })}
      </div>

      {/* File Browser */}
      <Card className="border-border/50 overflow-hidden">
        <div className="divide-y divide-border/50">
          {/* Parent folder */}
          {currentPath && (
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
              onClick={() => {
                const parts = currentPath.split("/");
                parts.pop();
                setCurrentPath(parts.join("/"));
              }}
            >
              <FolderOpen className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">..</span>
            </button>
          )}

          {/* Folders */}
          {currentItems.folders.map(folder => (
            <button
              key={folder}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
              onClick={() => setCurrentPath(currentPath ? currentPath + "/" + folder : folder)}
            >
              <FolderOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground flex-1">{folder}</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ))}

          {/* Files */}
          {currentItems.files.map(file => (
            <div
              key={file.id}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group"
            >
              {getFileIcon(file.file_name)}
              <button
                className="text-sm text-foreground flex-1 text-left hover:text-primary transition-colors truncate"
                onClick={() => handleViewFile(file)}
              >
                {file.file_name}
              </button>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {formatFileSize(file.file_size)}
              </span>
              <span className="text-xs text-muted-foreground hidden md:block">
                {new Date(file.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleViewFile(file)}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
                {isOwner && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={deletingId === file.id}
                    onClick={() => handleDeleteFile(file)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {currentItems.folders.length === 0 && currentItems.files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">
                {isOwner ? "Upload files to get started" : "No files in this folder"}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* README display */}
      {readmeContent && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm">{readmeFile?.file_name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted/30 p-4 rounded-lg overflow-x-auto font-mono">
                {readmeContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Viewer Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {viewingFile && getFileIcon(viewingFile.file_name)}
              {viewingFile?.file_name}
              <Badge variant="outline" className="text-[10px] ml-2">
                {viewingFile && formatFileSize(viewingFile.file_size)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden min-h-0">
            {fileContent !== null ? (
              <ScrollArea className="h-[60vh] rounded-lg border border-border/50 bg-muted/20">
                <pre className="p-4 text-sm font-mono text-foreground whitespace-pre overflow-x-auto">
                  <code>
                    {fileContent.split("\n").map((line, i) => (
                      <div key={i} className="flex">
                        <span className="inline-block w-12 text-right pr-4 text-muted-foreground/50 select-none text-xs leading-6">
                          {i + 1}
                        </span>
                        <span className="flex-1 leading-6">{line || " "}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </ScrollArea>
            ) : fileUrl && IMAGE_EXTENSIONS.includes(viewingFile?.file_name.split(".").pop()?.toLowerCase() || "") ? (
              <div className="flex items-center justify-center h-[60vh] bg-muted/20 rounded-lg border border-border/50">
                <img src={fileUrl} alt={viewingFile?.file_name} className="max-w-full max-h-full object-contain" />
              </div>
            ) : fileUrl ? (
              <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
                <File className="w-16 h-16 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                <Button onClick={() => viewingFile && handleDownload(viewingFile)} className="gap-2">
                  <Download className="w-4 h-4" /> Download File
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[40vh]">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={() => viewingFile && handleDownload(viewingFile)} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
            {fileContent !== null && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(fileContent);
                  toast.success("Code copied to clipboard");
                }}
              >
                Copy Code
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
