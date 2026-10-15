-- ============================================================
-- Supabase Migration: Multi-Language Manifestos & Invasive OSD Chyron
-- Target Table: playlists (channels)
-- ============================================================

-- 1. Add multi-language columns for Guide Manifestos & Invasive OSD Messages
ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS description_pt TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT,
  ADD COLUMN IF NOT EXISTS osd_messages_pt JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS osd_messages_en JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS osd_messages_es JSONB DEFAULT '[]'::jsonb;

-- 2. Backfill existing legacy descriptions to description_pt
UPDATE playlists
  SET description_pt = descricao
  WHERE (description_pt IS NULL OR description_pt = '')
    AND (descricao IS NOT NULL AND descricao != '');

-- Comment:
-- Columns `osd_messages_pt`, `osd_messages_en`, and `osd_messages_es` are JSONB arrays ('["msg1", "msg2"]').
-- If TEXT[] arrays are preferred in your database, you can alternately execute:
--   ALTER TABLE playlists
--     ADD COLUMN IF NOT EXISTS osd_messages_pt TEXT[] DEFAULT '{}',
--     ADD COLUMN IF NOT EXISTS osd_messages_en TEXT[] DEFAULT '{}',
--     ADD COLUMN IF NOT EXISTS osd_messages_es TEXT[] DEFAULT '{}';
-- The frontend MatrixPanel client seamlessly parses and supports both JSONB and TEXT[] representations.
