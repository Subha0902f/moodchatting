// server/src/config/supabase.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ─── Validate Environment Variables ───────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing environment variable: SUPABASE_URL");
}

if (!SUPABASE_ANON_KEY) {
  throw new Error("Missing environment variable: SUPABASE_ANON_KEY");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
}

// ─── Public Client (anon key) ─────────────────────────────────────────────────
// Use this for operations that respect Row Level Security (RLS)
// Suitable for: auth sign-in, sign-up, reading public data

export const supabaseClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// ─── Admin Client (service role key) ─────────────────────────────────────────
// Use this for server-side operations that bypass RLS
// Suitable for: controllers, models, services — NEVER expose to frontend

export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ─── Connection Test (optional, runs on server start) ─────────────────────────

export const testSupabaseConnection = async (): Promise<void> => {
  try {
    const { error } = await supabaseAdmin.from("users").select("id").limit(1);
    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
    } else {
      console.log("✅ Supabase connected successfully");
    }
  } catch (err) {
    console.error("❌ Supabase connection error:", err);
  }
};

export default supabaseAdmin;