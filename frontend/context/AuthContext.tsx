import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseclient";
import type { Session, User } from "@supabase/supabase-js";

const REMEMBER_ME_KEY = "moodchat-remember-me";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string, rememberMe?: boolean) => Promise<any>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const rememberMe = typeof window !== "undefined" && localStorage.getItem(REMEMBER_ME_KEY) === "true";

    const initializeSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!rememberMe && data.session) {
          await supabase.auth.signOut();
          if (!mounted) return;
          setSession(null);
          setUser(null);
        } else {
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
        }
      } catch {
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUp: async (email: string, password: string, username?: string, rememberMe = false) => {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, "true");
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }

        const result = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, name: username } },
        });

        const createdUser = result.data.user;
        if (!result.error && createdUser) {
          try {
            await supabase
              .from("profiles")
              .upsert({
                id: createdUser.id,
                username,
                email,
                full_name: username,
                updated_at: new Date().toISOString(),
              })
              .throwOnError();
          } catch {
            // Keep auth signup successful even if profile sync fails.
          }
        }

        return result;
      },
      signIn: async (email: string, password: string, rememberMe = false) => {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, "true");
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
        return supabase.auth.signInWithPassword({ email, password });
      },
      signOut: async () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
        return supabase.auth.signOut();
      },
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}