

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÕES ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA';

const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';

const supabase = createClient(SB_URL, SB_KEY);

// --- UTILITÁRIOS ---

// Função para classificar o Grupo da Playlist (Mesma lógica do Frontend)
const getPlaylistCategory = (title) => {
    const t = title.toUpperCase();
    if (t.includes('UPLOAD')) return 'UPLOADS';
    if (t.includes('ZONE')) return 'ZONES';
    if (t.includes('ROCK') || t.includes('POP') || t.includes('JAZZ') || t.includes('INDIE') || t.includes('BRASIL')) return 'GENRES';
    if (t.match(/\d{4}/)) return 'ERAS';
    return 'OTHERS';
};

// Função para remover acentos e caracteres especiais para comparação
const normalizeStr = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/official video/g, '')
        .replace(/video oficial/g, '')
        .replace(/videoclipe/g, '')
        .replace(/[({\[]/g, '')
        .replace(/[)}\]]/g, '')
        .replace(/-/g, ' ')
        .trim();
};

// --- FUNÇÕES DE BUSCA ---

async function fetchChannelPlaylists() {
    let allPlaylists = [];
    let nextPageToken = '';
    console.log("📂 Buscando playlists do canal...");
    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.items) allPlaylists = [...allPlaylists, ...data.items];
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);
        console.log(`✅ ${allPlaylists.length} playlists encontradas.`);
        return allPlaylists;
    } catch (error) {
        console.error("❌ Erro ao buscar playlists:", error);
        return [];
    }
}

async function fetchAllVideosFromPlaylist(playlist) {
    let videos = [];
    let nextPageToken = '';
    // Determina o grupo com base no título da playlist atual
    const groupCategory = getPlaylistCategory(playlist.snippet.title);

    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlist.id}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.items) {
                // Anexa o grupo ao objeto do vídeo para uso posterior
                const videosWithGroup = data.items.map(item => ({
                    ...item,
                    _derivedGroup: groupCategory
                }));
                videos = [...videos, ...videosWithGroup];
            }
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);
    } catch (e) { 
        // Silencia erros de playlist vazia ou privada
    }
    return videos;
}

// --- PROCESSO PRINCIPAL ---

async function enrichDatabaseWithVideoLinks() {
    console.log("🚀 INICIANDO SINCRONIZAÇÃO + GROUPING...");

    // 1. Busca músicas sem link OU sem grupo no banco
    const { data: dbMusics, error } = await supabase
        .from('musicas_backup')
        .select('*')
        .or('video_id.is.null,playlist_group.is.null'); // Busca se faltar ID ou Grupo

    if (error) { console.error("❌ Erro Supabase:", error.message); return; }
    if (!dbMusics || dbMusics.length === 0) { console.log("✅ Banco de dados já está 100% preenchido!"); return; }

    console.log(`📋 Processando ${dbMusics.length} registros incompletos...`);

    // 2. Busca vídeos do YouTube e suas Playlists
    const playlists = await fetchChannelPlaylists();
    
    console.log("⏳ Baixando catálogo e categorizando...");
    // Passa o objeto playlist inteiro agora
    const promises = playlists.map(pl => fetchAllVideosFromPlaylist(pl));
    const rawResults = await Promise.all(promises);
    
    // 3. Mapeamento de Vídeos
    const uniqueVideosMap = new Map();
    
    rawResults.flat().forEach(item => {
        if (item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId) {
            // Se o vídeo já existe no mapa, mantemos o primeiro (ou poderíamos priorizar grupos específicos)
            // Aqui, o item contém a propriedade `_derivedGroup` calculada anteriormente
            if (!uniqueVideosMap.has(item.snippet.resourceId.videoId)) {
                uniqueVideosMap.set(item.snippet.resourceId.videoId, item);
            }
        }
    });

    const allYoutubeVideos = Array.from(uniqueVideosMap.values());
    console.log(`🎥 Catálogo carregado: ${allYoutubeVideos.length} vídeos únicos com categorias.`);

    // 4. Cruzamento e Atualização
    let updates = 0;
    
    for (const dbRow of dbMusics) {
        const dbArtist = normalizeStr(dbRow.artista);
        const dbSong = normalizeStr(dbRow.musica);
        
        // Filtra vídeos candidatos
        const matches = allYoutubeVideos.filter(ytVid => {
            const ytTitle = normalizeStr(ytVid.snippet.title);
            return ytTitle.includes(dbArtist) && ytTitle.includes(dbSong);
        });

        if (matches.length > 0) {
            const match = matches[0]; 
            const videoId = match.snippet.resourceId.videoId;
            const videoTitle = match.snippet.title;
            const category = match._derivedGroup || 'OTHERS';

            console.log(`✅ MATCH: "${dbRow.artista} - ${dbRow.musica}"`);
            console.log(`   ↳ YouTube: "${videoTitle}" | Grupo: ${category}`);

            // Prepara update dinâmico (só atualiza o que falta ou se video_id mudar)
            const updatePayload = {};
            if (!dbRow.video_id) updatePayload.video_id = videoId;
            if (!dbRow.playlist_group) updatePayload.playlist_group = category;

            if (Object.keys(updatePayload).length > 0) {
                const { error: upErr } = await supabase
                    .from('musicas_backup')
                    .update(updatePayload)
                    .eq('id', dbRow.id);

                if (!upErr) updates++;
                else console.error(`   ❌ Erro update: ${upErr.message}`);
            }

        } else {
            console.log(`🚫 NÃO ACHEI: "${dbRow.artista} - ${dbRow.musica}"`);
        }
    }

    console.log("-----------------------------------------");
    console.log(`🏁 FIM! ${updates} músicas atualizadas.`);
}

enrichDatabaseWithVideoLinks();