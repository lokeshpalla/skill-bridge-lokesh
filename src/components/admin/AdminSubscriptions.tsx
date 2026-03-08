import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee, CheckCircle, Clock, XCircle, Search, User, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  amount: number;
  status: string;
  paid_at: string | null;
  expires_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  profile?: {
    display_name: string;
    email: string | null;
    avatar_url: string | null;
  };
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("platform_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, avatar_url")
        .in("user_id", userIds);

      setSubscriptions(data.map((s: any) => ({
        ...s,
        profile: profiles?.find((p: any) => p.user_id === s.user_id),
      })));
    } else {
      setSubscriptions([]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === "paid") {
      updates.paid_at = new Date().toISOString();
      // Set expiry to 30 days from now for monthly
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      updates.expires_at = expiry.toISOString();
    }
    if (actionNotes) updates.notes = actionNotes;

    const { error } = await supabase
      .from("platform_subscriptions")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update subscription");
      return;
    }
    toast.success(`Subscription marked as ${status}`);
    setSelectedSub(null);
    setActionNotes("");
    fetchSubscriptions();
  };

  const filtered = subscriptions.filter(s => {
    const matchesSearch = !search ||
      s.profile?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.profile?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    paid: subscriptions.filter(s => s.status === "paid").length,
    pending: subscriptions.filter(s => s.status === "pending").length,
    totalRevenue: subscriptions.filter(s => s.status === "paid").reduce((sum, s) => sum + (s.amount || 0), 0),
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-8">Loading subscriptions...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Subscriptions", value: stats.total, icon: User, color: "text-destructive" },
          { label: "Paid", value: stats.paid, icon: CheckCircle, color: "text-success" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
          { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-primary" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-destructive/20 bg-card/60 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-xl font-bold">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <IndianRupee className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No subscription requests yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(sub => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-destructive/20 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {sub.profile?.avatar_url ? (
                  <img src={sub.profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{sub.profile?.display_name || "Unknown"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{sub.profile?.email || "No email"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold">₹{sub.amount.toLocaleString("en-IN")}</span>
                <Badge variant="outline" className={`text-[10px] ${statusStyles[sub.status] || ""}`}>
                  {sub.status.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(sub.created_at), "MMM d, yyyy")}
                </span>
                {sub.status === "pending" && (
                  <Button size="sm" variant="outline" className="text-xs gap-1 border-success/40 text-success hover:bg-success/10"
                    onClick={() => setSelectedSub(sub)}>
                    <CheckCircle className="w-3 h-3" /> Approve
                  </Button>
                )}
                {sub.status === "paid" && sub.expires_at && (
                  <span className="text-[10px] text-muted-foreground">
                    Expires: {format(new Date(sub.expires_at), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={() => { setSelectedSub(null); setActionNotes(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-sm font-medium">{selectedSub.profile?.display_name}</p>
                <p className="text-xs text-muted-foreground">{selectedSub.profile?.email}</p>
                <p className="text-sm font-semibold mt-1">₹{selectedSub.amount.toLocaleString("en-IN")} — {selectedSub.plan_name}</p>
              </div>
              <Textarea
                placeholder="Admin notes (optional)"
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button className="flex-1 gap-1" onClick={() => updateStatus(selectedSub.id, "paid")}>
                  <CheckCircle className="w-3.5 h-3.5" /> Mark as Paid
                </Button>
                <Button variant="destructive" className="gap-1" onClick={() => updateStatus(selectedSub.id, "cancelled")}>
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
