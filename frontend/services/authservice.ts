import { supabase } from "./supabaseclient";

export const signUpUser = (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const loginUser = (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const logoutUser = () => {
  return supabase.auth.signOut();
};