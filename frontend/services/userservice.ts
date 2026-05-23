import { supabase } from "./supabaseclient";

export const getProfile = (userId: string) => {
  return supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
};

export const updateProfile = (userId: string, data: any) => {
  return supabase
    .from("profiles")
    .update(data)
    .eq("id", userId);
};