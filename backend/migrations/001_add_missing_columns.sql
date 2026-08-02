-- ============================================================================
-- Migration 001: Add missing columns to users and messages tables
-- ============================================================================
-- Run this in your Supabase Dashboard SQL Editor
-- Or use the migration runner: npx tsx backend/migrations/run.ts
-- ============================================================================

-- ─── 1. Add `role` column to `users` table ────────────────────────────────────
-- This is needed by authMiddleware.ts to persist user roles
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- ─── 2. Add `mode` column to `messages` table ─────────────────────────────────
-- This stores the message type (text, image, video, file)
-- Used by socketHandler.ts and Message.ts model
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'text';

-- ─── 3. Add `status` column to `messages` table ──────────────────────────────
-- This tracks message delivery status (sent, delivered, read)
-- Used by socketHandler.ts
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';

-- ─── 4. Ensure `sender_id` column exists on `messages` table ─────────────────
-- The socket handler uses sender_id, while Message.ts uses `sender`
-- We add sender_id as an alias/normalized column
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id);

-- ─── 5. Ensure `chat_id` column exists on `messages` table ────────────────────
-- The socket handler uses chat_id, while Message.ts uses `chat`
-- We add chat_id as an alias/normalized column
ALTER TABLE IF EXISTS public.messages
  ADD COLUMN IF NOT EXISTS chat_id UUID;

-- ─── 6. Update existing data to populate new columns ──────────────────────────
-- Copy sender data to sender_id if empty
UPDATE public.messages
  SET sender_id = sender::UUID
  WHERE sender_id IS NULL AND sender IS NOT NULL;

-- Copy chat/chat_id data
UPDATE public.messages
  SET chat_id = chat::UUID
  WHERE chat_id IS NULL AND chat IS NOT NULL;

-- ─── 7. Set NOT NULL constraints after data is populated ─────────────────────
-- Only if the previous step successfully populated data
ALTER TABLE IF EXISTS public.messages
  ALTER COLUMN sender_id SET NOT NULL;

ALTER TABLE IF EXISTS public.messages
  ALTER COLUMN chat_id SET NOT NULL;

-- ─── 8. Add indexes for performance ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);

-- ============================================================================
-- Done
-- ============================================================================

