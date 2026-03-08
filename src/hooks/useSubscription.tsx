import { useState, useEffect, createContext, useContext, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionContextType {
  isActive: boolean;
  subscription: any | null;
  loading: boolean;
  requestSubscription: (amount: number, planName?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserId = useRef<string | null>(null);

  const fetchSubscription = async (force = false) => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Skip if already fetched for this user (unless forced)
    if (!force && lastFetchedUserId.current === user.id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("platform_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const sub = data?.[0] || null;
    setSubscription(sub);
    lastFetchedUserId.current = user.id;
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const isActive = subscription?.status === "paid" &&
    (!subscription?.expires_at || new Date(subscription.expires_at) > new Date());

  const requestSubscription = async (amount: number, planName = "monthly") => {
    if (!user) return;
    await supabase.from("platform_subscriptions").insert({
      user_id: user.id,
      plan_name: planName,
      amount,
      status: "pending",
    });
    await fetchSubscription(true);
  };

  return (
    <SubscriptionContext.Provider value={{ isActive, subscription, loading, requestSubscription, refresh: () => fetchSubscription(true) }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be inside SubscriptionProvider");
  return ctx;
}
