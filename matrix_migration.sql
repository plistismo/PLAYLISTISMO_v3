-- ============================================================
-- MATRIX Module — Migration SQL
-- Executa no Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Adiciona colunas necessárias na tabela playlists
ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS marca_dagua_url TEXT,
  ADD COLUMN IF NOT EXISTS marca_dagua_escala NUMERIC DEFAULT 1.0;

-- 2. Bucket para Marca D'água
-- Execute via Supabase Dashboard > Storage > Create Bucket
-- Nome: marca-dagua
-- Public: SIM (leitura pública para exibir na TV)

-- 3. Policy de upload (INSERT) para usuários autenticados
CREATE POLICY "Admins podem fazer upload de marca dagua"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marca-dagua');

CREATE POLICY "Leitura publica da marca dagua"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'marca-dagua');

-- 4. Multi-Language Manifestos & OSD Chyron (PT / EN / ES)
-- Adiciona colunas de texto para o Manifesto do Canal e colunas de array/JSONB para mensagens OSD
ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS description_pt TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT,
  ADD COLUMN IF NOT EXISTS osd_messages_pt JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS osd_messages_en JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS osd_messages_es JSONB DEFAULT '[]'::jsonb;

-- Migração segura de descrições existentes legadas para description_pt
UPDATE playlists
  SET description_pt = descricao
  WHERE (description_pt IS NULL OR description_pt = '')
    AND (descricao IS NOT NULL AND descricao != '');

-- 5. Generative Watermark Recipe Configuration (ID Studio)
-- Armazena o JSON completo da receita procedural gerada no ID Studio
ALTER TABLE playlists
  ADD COLUMN IF NOT EXISTS watermark_config JSONB;

