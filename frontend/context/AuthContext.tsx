import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../services/supabaseclient";
import type { Session, User } from "@supabase/supabase-js";


export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<any>;
signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "moodchat-session";

function getCachedSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return (parsed?.session ?? parsed?.currentSession ?? parsed) as Session | null;
  } catch {
    return null;
  }
}

const initialSession = getCachedSession();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(() => initialSession);
  const [loading, setLoading] = useState(false);

  const initDone = useRef(false);
  const sessionAllowed = useRef(Boolean(initialSession?.access_token));

  useEffect(() => {
    let mounted = true;

    const localSession = getCachedSession();
    if (localSession?.access_token) {
      sessionAllowed.current = true;
      setSession(localSession);
      setUser(localSession.user);
    } else {
      sessionAllowed.current = false;
      setSession(null);
      setUser(null);
    }

    setLoading(false);

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (!initDone.current) return; // ignore all events until init settles

      if (event === "SIGNED_OUT") {
        sessionAllowed.current = false;
        setSession(null);
        setUser(null);
        return;
      }

      if (!sessionAllowed.current) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    const initializeSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session) {
          sessionAllowed.current = true;
          setSession(data.session);
          setUser(data.session.user);
        } else {
          sessionAllowed.current = false;
          setSession(null);
          setUser(null);
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
      signUp: async (email: string, password: string, username?: string) => {
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
  .from("users")
  .upsert({
    id: createdUser.id,
    "Email id": email,
  })
  .throwOnError();
          } catch {
            // Keep auth signup successful even if profile sync fails.
          }
        }

        return result;
      },
     signIn: async (email: string, password: string)=> {
        sessionAllowed.current = true;
        return supabase.auth.signInWithPassword({ email, password });
      },
     signOut: async () => {
  sessionAllowed.current = false;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("moodchat-session");
    window.sessionStorage.removeItem("authToken");
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