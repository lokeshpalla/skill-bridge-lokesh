import { motion } from "framer-motion";
import { Lock, IndianRupee, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

const PLATFORM_FEE = 499; // ₹499/month

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { isActive, subscription, loading, requestSubscription } = useSubscription();
  const { roles, rolesLoading } = useAuth();
  const [requesting, setRequesting] = useState(false);

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Non-student roles (admin, mentor, recruiter) bypass the gate
  const isNonStudent = roles.some(r => ["admin", "mentor", "recruiter"].includes(r));
  if (isNonStudent || isActive) {
    return <>{children}</>;
  }

  const isPending = subscription?.status === "pending";

  const handleRequest = async () => {
    setRequesting(true);
    await requestSubscription(PLATFORM_FEE, "monthly");
    toast.success("Subscription request sent! Admin will approve your payment.");
    setRequesting(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-8 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Platform Subscription Required</h2>
          <p className="text-sm text-muted-foreground">
            To access courses, coding challenges, mentors, and all platform features, you need an active subscription.
          </p>
        </div>

        <div className="rounded-xl bg-secondary/30 p-5 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <IndianRupee className="w-5 h-5 text-primary" />
            <span className="text-3xl font-bold">{PLATFORM_FEE}</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-success" /> Unlimited course access</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-success" /> Coding challenges & leaderboard</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-success" /> Mentor sessions</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-success" /> Certificates & portfolio</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-success" /> Internship applications</li>
          </ul>
        </div>

        {isPending ? (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-warning flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">Payment Pending Approval</p>
              <p className="text-xs text-muted-foreground">Your subscription request has been sent. Admin will review and approve shortly.</p>
            </div>
          </div>
        ) : (
          <Button
            variant="hero"
            size="lg"
            className="w-full gap-2"
            onClick={handleRequest}
            disabled={requesting}
          >
            {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
            {requesting ? "Submitting..." : `Pay ₹${PLATFORM_FEE} — Request Subscription`}
          </Button>
        )}

        <p className="text-[10px] text-muted-foreground">
          After submitting, contact admin to confirm your payment. Your account will be activated once verified.
        </p>
      </motion.div>
    </div>
  );
}
