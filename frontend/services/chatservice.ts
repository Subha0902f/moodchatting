import { supabase } from "./supabaseclient";

export const sendMessage = (content: string, userId: string) => {
  return supabase.from("messages").insert({
    content,
    sender_id: userId,
  });
};

export const getMessages = () => {
  return supabase.from("messages").select("*");
};