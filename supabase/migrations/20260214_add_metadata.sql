-- Adiciona a coluna metadata na tabela messages para suportar metadados de mídia e rastreamento local.
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.messages.metadata IS 'Metadados da mensagem (dimensões de imagem, localId, etc)';
