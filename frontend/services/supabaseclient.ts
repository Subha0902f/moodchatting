import { createClient } from "@supabase/supabase-js";

const storage = typeof window !== "undefined" ? window.sessionStorage : undefined;

export const supabase = createClient(
  "https://vqrednhdhmimyjkxpwyl.supabase.co",
  "sb_publishable_RktwtjAPuqvxaBmVF0weEw_4KJZh5cx",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage,
      storageKey: "moodchat-session",
    },
  }
); 