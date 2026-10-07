import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  rolesLoading: boolean;
  refreshProfile: () => Promise<void>;
  getRedirectPath: (loadedRoles?: string[]) => string;
  signUp: (email: string, password: string, displayName: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; roles?: string[] }>;
  signOut: () => Promise<void>;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  xp: number;
  streak: number;
  last_active_date: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  created_at: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const lastFetchedUserId = useRef<string | null>(null);

  const fetchRoles = useCallback(async (userId: string): Promise<string[]> => {
    setRolesLoading(true);
    let timeoutId: number | undefined;
    try {
      const roleRequest = supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const timeout = new Promise<null>((resolve) => {
        timeoutId = window.setTimeout(() => resolve(null), 5000);
      });
      const result = await Promise.race([roleRequest, timeout]);
      const fetchedRoles = result?.data ? result.data.map((r) => r.role) : [];
      setRoles(fetchedRoles);
      return fetchedRoles;
    } catch {
      setRoles([]);
      return [];
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      setRolesLoading(false);
    }
  }, []);

  const getRedirectPath = useCallback((loadedRoles?: string[]) => {
    const r = loadedRoles || roles;
    if (r.includes("admin")) return "/admin";
    if (r.includes("recruiter")) return "/recruiter";
    if (r.includes("mentor")) return "/mentor-dashboard";
    return "/dashboard";
  }, [roles]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as Profile);
  };

  const loadUserData = useCallback(async (userId: string) => {
    // Skip if we already loaded data for this user
    if (lastFetchedUserId.current === userId) return;
    lastFetchedUserId.current = userId;
    // Fetch profile and roles in parallel
    await Promise.all([fetchProfile(userId), fetchRoles(userId)]);
  }, [fetchRoles]);

  useEffect(() => {
    let initialSessionHandled = false;
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!initialSessionHandled) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // On sign-in/token refresh, reload data
          if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
            lastFetchedUserId.current = null;
          }
          setTimeout(() => loadUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRoles([]);
          lastFetchedUserId.current = null;
        }
        setLoading(false);
      }
    );

    const timeout = window.setTimeout(() => {
      initialSessionHandled = true;
      if (isMounted) setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      window.clearTimeout(timeout);
      if (!isMounted) return;
      initialSessionHandled = true;
      if (error) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
      setLoading(false);
    }).catch(() => {
      window.clearTimeout(timeout);
      if (!isMounted) return;
      initialSessionHandled = true;
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signUp = async (email: string, password: string, displayName: string, phone?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, phone: phone || undefined },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error | null };
    lastFetchedUserId.current = null; // Force refresh on sign in
    const userRoles = data.user ? await fetchRoles(data.user.id) : [];
    return { error: null, roles: userRoles };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    lastFetchedUserId.current = null;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, rolesLoading, refreshProfile, getRedirectPath, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
