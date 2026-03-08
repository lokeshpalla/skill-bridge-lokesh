import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Payment {
  id: string;
  booking_id: string;
  mentor_id: string;
  student_id: string;
  amount: number;
  status: string;
  payment_method: string;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
  mentor_name?: string;
  student_name?: string;
}

const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export default function AdminPayouts() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("mentor_payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const userIds = [...new Set([...data.map(p => p.mentor_id), ...data.map(p => p.student_id)])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      setPayments(data.map(p => ({
        ...p,
        mentor_name: profiles?.find(pr => pr.user_id === p.mentor_id)?.display_name || "Mentor",
        student_name: profiles?.find(pr => pr.user_id === p.student_id)?.display_name || "Student",
      })));
    } else {
      setPayments([]);
    }
    setLoading(false);
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("mentor_payments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Marked as paid");
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "paid", paid_at: new Date().toISOString() } : p));
  };

  const filtered = payments.filter(p => filter === "all" || p.status === filter);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Loading payments...</p>;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending Payouts", value: formatRupees(totalPending), icon: Clock, color: "text-warning" },
          { label: "Total Paid", value: formatRupees(totalPaid), icon: CheckCircle, color: "text-green-500" },
          { label: "Total Transactions", value: payments.length, icon: IndianRupee, color: "text-primary" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-xl font-bold">{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "paid"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === f ? "bg-destructive text-destructive-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}>{f} ({f === "all" ? payments.length : payments.filter(p => p.status === f).length})</button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-border/50 bg-card/60">
          <IndianRupee className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No payments found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mentor</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm font-medium">{p.mentor_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.student_name}</TableCell>
                  <TableCell className="text-sm font-semibold">{formatRupees(Number(p.amount))}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "paid" ? "default" : "secondary"} className="text-[10px]">
                      {p.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {p.status === "pending" && (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => markAsPaid(p.id)}>
                        <CheckCircle className="w-3 h-3" /> Mark Paid
                      </Button>
                    )}
                    {p.status === "paid" && p.paid_at && (
                      <span className="text-[10px] text-muted-foreground">Paid {new Date(p.paid_at).toLocaleDateString()}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
