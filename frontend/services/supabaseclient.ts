import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://vqrednhdhmimyjkxpwyl.supabase.co",
  "sb_publishable_RktwtjAPuqvxaBmVF0weEw_4KJZh5cx",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "moodchat-session",
    },
  }
); 