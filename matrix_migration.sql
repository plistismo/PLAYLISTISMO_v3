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
