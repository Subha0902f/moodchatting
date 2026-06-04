import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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

  const initDone = useRef(false);
  const sessionAllowed = useRef(false);

  useEffect(() => {
    let mounted = true;
    const rememberMe =
      typeof window !== "undefined" &&
      localStorage.getItem(REMEMBER_ME_KEY) === "true";

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (!initDone.current) return; // ignore all events until init settles

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        return;
      }

      if (sessionAllowed.current) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    });

    const initializeSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!rememberMe && data.session) {
          await supabase.auth.signOut();
          if (!mounted) return;
          sessionAllowed.current = false;
          setSession(null);
          setUser(null);
        } else {
          sessionAllowed.current = !!data.session;
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
        }
      } catch {
        if (mounted) {
          sessionAllowed.current = false;
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          initDone.current = true;
          setLoading(false);
        }
      }
    };

    initializeSession();

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
        sessionAllowed.current = true;

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
        sessionAllowed.current = true;
        return supabase.auth.signInWithPassword({ email, password });
      },
      signOut: async () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
        sessionAllowed.current = false;
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