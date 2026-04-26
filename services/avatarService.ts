import { supabase } from './supabase';

// Cache em memória para evitar requisições repetitivas ao Supabase Storage
const avatarCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos

/**
 * Busca a URL do avatar mais recente de um usuário.
 * Implementa cache para reduzir a latência e o consumo de API em re-renders frequentes.
 */
export const getLatestAvatarUrl = async (userId: string): Promise<string | null> => {
  // 1. Verificar se existe no cache e se ainda é válido (menos de 5 minutos)
  const cachedEntry = avatarCache.get(userId);
  const now = Date.now();
  
  if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL)) {
    return cachedEntry.url;
  }

  try {
    // 2. Listar arquivos na pasta de avatars
    const { data, error } = await supabase.storage
      .from('CapyBook')
      .list('avatars', {
        limit: 100,
        offset: 0
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    // 3. Filtrar arquivos pelo ID do usuário e ordenar pelo mais recente
    const userFiles = data
      .filter(file => file.name.includes(userId))
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

    if (userFiles.length === 0) {
      return null;
    }

    // 4. Gerar a URL pública do arquivo mais recente encontrado
    const latestFile = userFiles[0];
    const { data: publicUrlData } = supabase.storage
      .from('CapyBook')
      .getPublicUrl(`avatars/${latestFile.name}`);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return null;
    }

    const finalUrl = publicUrlData.publicUrl;

    // 5. Atualizar o cache antes de retornar
    avatarCache.set(userId, {
      url: finalUrl,
      timestamp: now
    });

    return finalUrl;
  } catch (err) {
    // Falha silenciosa em caso de erro inesperado
    return null;
  }
};
