import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** All roles owned by the user. */
  roles: AppRole[];
  /** The role currently active in this session. Null if not yet picked. */
  role: AppRole | null;
  profile: { display_name: string | null; avatar_url: string | null; phone: string | null } | null;
  loading: boolean;
  /** True once we have user+roles loaded (or know there's no user). */
  ready: boolean;
  setActiveRole: (role: AppRole) => void;
  clearActiveRole: () => void;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ACTIVE_ROLE_KEY = "agrisetu.activeRole";

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, roles: [], role: null, profile: null,
  loading: true, ready: false,
  setActiveRole: () => {}, clearActiveRole: () => {}, refreshRoles: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const fetchUserData = useCallback(async (userId: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("display_name, avatar_url, phone").eq("user_id", userId).maybeSingle(),
    ]);
    const userRoles = (rolesRes.data || []).map((r) => r.role as AppRole);
    setRoles(userRoles);
    if (profileRes.data) setProfile(profileRes.data);

    // Resolve active role from storage / single-role auto-pick
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY) as AppRole | null;
    if (stored && userRoles.includes(stored)) {
      setRole(stored);
    } else if (userRoles.length === 1) {
      setRole(userRoles[0]);
      localStorage.setItem(ACTIVE_ROLE_KEY, userRoles[0]);
    } else {
      setRole(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setRoles([]);
        setRole(null);
        setProfile(null);
        localStorage.removeItem(ACTIVE_ROLE_KEY);
        setReady(true);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setReady(true);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const setActiveRole = (r: AppRole) => {
    if (!roles.includes(r)) return;
    setRole(r);
    localStorage.setItem(ACTIVE_ROLE_KEY, r);
  };

  const clearActiveRole = () => {
    setRole(null);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  const refreshRoles = async () => {
    if (user) await fetchUserData(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setRole(null);
    setProfile(null);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  return (
    <AuthContext.Provider value={{
      session, user, roles, role, profile, loading, ready,
      setActiveRole, clearActiveRole, refreshRoles, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
