

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÕES ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA';

const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';

const supabase = createClient(SB_URL, SB_KEY);

// --- UTILITÁRIOS ---

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

async function fetchAllVideosFromPlaylist(playlistId) {
    let videos = [];
    let nextPageToken = '';
    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.items) videos = [...videos, ...data.items];
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);
    } catch (e) { 
        // Silencia erros de playlist vazia ou privada
    }
    return videos;
}

// --- PROCESSO PRINCIPAL ---

async function enrichDatabaseWithVideoLinks() {
    console.log("🚀 INICIANDO SINCRONIZAÇÃO OTIMIZADA (ESM)...");

    // 1. Busca músicas sem link no banco
    // MIGRADO PARA musicas_backup
    const { data: dbMusics, error } = await supabase
        .from('musicas_backup')
        .select('*')
        .is('video_id', null);

    if (error) { console.error("❌ Erro Supabase:", error.message); return; }
    if (!dbMusics || dbMusics.length === 0) { console.log("✅ Banco de dados já está 100% preenchido!"); return; }

    console.log(`📋 Processando ${dbMusics.length} músicas sem link...`);

    // 2. Busca vídeos do YouTube
    const playlists = await fetchChannelPlaylists();
    
    console.log("⏳ Baixando catálogo de vídeos...");
    const promises = playlists.map(pl => fetchAllVideosFromPlaylist(pl.id));
    const rawResults = await Promise.all(promises);
    
    // 3. Dedupilcação de Vídeos (IMPORTANTE)
    const uniqueVideosMap = new Map();
    
    rawResults.flat().forEach(item => {
        if (item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId) {
            uniqueVideosMap.set(item.snippet.resourceId.videoId, item);
        }
    });

    const allYoutubeVideos = Array.from(uniqueVideosMap.values());
    console.log(`🎥 Catálogo único carregado: ${allYoutubeVideos.length} vídeos.`);

    // 4. Cruzamento
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

            console.log(`✅ MATCH: "${dbRow.artista} - ${dbRow.musica}"`);
            console.log(`   ↳ YouTube: "${videoTitle}"`);

            // MIGRADO PARA musicas_backup
            const { error: upErr } = await supabase
                .from('musicas_backup')
                .update({ video_id: videoId })
                .eq('id', dbRow.id);

            if (!upErr) updates++;
            else console.error(`   ❌ Erro update: ${upErr.message}`);

        } else {
            console.log(`🚫 NÃO ACHEI: "${dbRow.artista} - ${dbRow.musica}"`);
        }
    }

    console.log("-----------------------------------------");
    console.log(`🏁 FIM! ${updates} músicas atualizadas.`);
}

enrichDatabaseWithVideoLinks();
