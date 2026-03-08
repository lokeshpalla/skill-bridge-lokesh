import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserCog, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface UserData {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  xp: number;
  streak: number;
  skills: string[] | null;
  created_at: string;
  role: string;
}

interface Props {
  users: UserData[];
  onRefresh: () => void;
}

const roleColors: Record<string, string> = {
  student: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  mentor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  recruiter: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
};

const AdminUserManagement = ({ users, onRefresh }: Props) => {
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = users.filter(u => {
    const matchesSearch = !search ||
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const changeRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-stats", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { action: "update_role", target_user_id: userId, new_role: newRole },
      });
      if (error) throw error;
      toast.success(`Role updated to ${newRole}`);
      onRefresh();
    } catch (e: any) {
      toast.error("Failed to update role");
    }
    setUpdating(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="mentor">Mentors</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>
        <span className="text-xs text-muted-foreground self-center">{filtered.length} users</span>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.user_id}>
                <TableCell className="font-medium text-sm">{u.display_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.email || "—"}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{u.xp} XP</Badge></TableCell>
                <TableCell className="text-xs">{u.streak}🔥</TableCell>
                <TableCell>
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${roleColors[u.role] || roleColors.student}`}>
                    {u.role}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.user_id, e.target.value)}
                    disabled={updating === u.user_id}
                    className="h-7 rounded border border-border bg-background px-2 text-[11px] text-foreground"
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="admin">Admin</option>
                  </select>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">No users found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUserManagement;
