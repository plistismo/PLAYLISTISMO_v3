import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÕES ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA';

const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';

const supabase = createClient(SB_URL, SB_KEY);

// --- UTILITÁRIOS ---
const normalizeStr = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/official/g, '').replace(/video/g, '').replace(/clipe/g, '')
        .replace(/music/g, '').replace(/feat\.?/g, '').replace(/ft\.?/g, '')
        .replace(/prod\.?/g, '').replace(/[({\[]/g, '').replace(/[)}\]]/g, '')
        .replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
};

function compareTwoStrings(first, second) {
    first = first.replace(/\s+/g, '');
    second = second.replace(/\s+/g, '');
    if (first === second) return 1;
    if (first.length < 2 || second.length < 2) return 0;
    
    let firstBigrams = new Map();
    for (let i = 0; i < first.length - 1; i++) {
        const bigram = first.substring(i, i + 2);
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;
        firstBigrams.set(bigram, count);
    }
    
    let intersectionSize = 0;
    for (let i = 0; i < second.length - 1; i++) {
        const bigram = second.substring(i, i + 2);
        const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;
        if (count > 0) {
            firstBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }
    return (2.0 * intersectionSize) / (first.length + second.length - 2);
}

// --- FUNÇÕES DE BUSCA ---

async function fetchAllPendingMusicFromDB() {
    let allMusics = [];
    let from = 0;
    const batchSize = 1000;
    let keepFetching = true;

    console.log("📥 Baixando lista de pendências (Revisão Geral)...");

    while (keepFetching) {
        const { data, error } = await supabase
            .from('musicas')
            .select('*')
            .is('video_id', null) // <--- ÚNICO FILTRO: Se não tem oficial, entra na roda.
            // REMOVIDO: .is('video_candidato', null) -> Agora ele reavalia quem já tem candidato ruim.
            .range(from, from + batchSize - 1);

        if (error) { console.error("❌ Erro DB:", error.message); break; }

        if (data && data.length > 0) {
            allMusics = [...allMusics, ...data];
            from += batchSize;
            if (data.length < batchSize) keepFetching = false;
        } else {
            keepFetching = false;
        }
    }
    return allMusics;
}

async function fetchChannelPlaylists() {
    let allPlaylists = [];
    let nextPageToken = '';
    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.items) allPlaylists = [...allPlaylists, ...data.items];
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);
        return allPlaylists;
    } catch (error) { return []; }
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
    } catch (e) { }
    return videos;
}

// --- PROCESSO PRINCIPAL ---
async function enrichDatabaseHybrid() {
    console.log("🚀 INICIANDO SINCRONIZAÇÃO: REVISÃO DE PENDÊNCIAS + ÁLBUM...");

    // 1. Busca TUDO que não tem link oficial (incluindo rascunhos antigos)
    const dbMusics = await fetchAllPendingMusicFromDB();
    if (!dbMusics || dbMusics.length === 0) { console.log("✅ Nada pendente."); return; }
    console.log(`📋 Reavaliando ${dbMusics.length} músicas.`);

    console.log("⏳ Mapeando Playlists e Vídeos...");
    const playlists = await fetchChannelPlaylists();
    
    const uniqueVideosMap = new Map();

    await Promise.all(playlists.map(async (pl) => {
        const videos = await fetchAllVideosFromPlaylist(pl.id);
        const playlistName = pl.snippet.title;

        videos.forEach(item => {
            if (item.snippet?.resourceId?.videoId) {
                const vidId = item.snippet.resourceId.videoId;
                if (!uniqueVideosMap.has(vidId)) {
                    uniqueVideosMap.set(vidId, {
                        videoData: item,
                        playlistName: playlistName
                    });
                }
            }
        });
    }));

    const allYoutubeVideos = Array.from(uniqueVideosMap.values());
    console.log(`🎥 Catálogo Mapeado: ${allYoutubeVideos.length} vídeos.`);

    let autoUpdates = 0;
    let candidateUpdates = 0;

    for (const dbRow of dbMusics) {
        const dbArtist = normalizeStr(dbRow.artista);
        const dbSong = normalizeStr(dbRow.musica);
        const dbAlbum = dbRow.album ? normalizeStr(dbRow.album) : ""; 

        const searchStandard = `${dbArtist} ${dbSong}`; 
        const searchExtended = `${dbArtist} ${dbSong} ${dbAlbum}`; 

        let bestMatch = null;
        let highestScore = 0;

        for (const entry of allYoutubeVideos) {
            const ytVid = entry.videoData;
            const ytTitle = normalizeStr(ytVid.snippet.title);
            
            const scoreStandard = compareTwoStrings(searchStandard, ytTitle);
            
            let scoreExtended = 0;
            if (dbAlbum.length > 2) { 
                scoreExtended = compareTwoStrings(searchExtended, ytTitle);
            }

            const currentMaxScore = Math.max(scoreStandard, scoreExtended);

            if (currentMaxScore > highestScore) {
                highestScore = currentMaxScore;
                bestMatch = entry;
            }
        }

        if (bestMatch) {
            const videoId = bestMatch.videoData.snippet.resourceId.videoId;
            const videoTitle = bestMatch.videoData.snippet.title;
            const plName = bestMatch.playlistName;
            const percentage = Math.round(highestScore * 100);

            // REGRA: > 90% vira OFICIAL (mesmo que antes fosse rascunho 50%)
            if (highestScore >= 0.90) {
                console.log(`✅ PROMOVIDO A OFICIAL (${percentage}%): "${dbRow.musica}" -> "${videoTitle}"`);
                
                await supabase
                    .from('musicas')
                    .update({ 
                        video_id: videoId,
                        playlist: plName,
                        match_score: percentage,
                        video_titulo_match: videoTitle,
                        video_candidato: null // Limpa o rascunho pois virou oficial
                    })
                    .eq('id', dbRow.id);
                
                autoUpdates++;

            // REGRA: 40% a 89% vira/atualiza RASCUNHO
            } else if (highestScore > 0.40) {
                // Só atualiza se o novo score for MELHOR que o antigo (ou se não tinha score)
                // Isso evita sobrescrever um rascunho de 80% com um de 45% por engano
                if (!dbRow.match_score || percentage > dbRow.match_score) {
                    // console.log(`📝 Rascunho Atualizado (${percentage}%): "${dbRow.musica}"`);
                    await supabase
                        .from('musicas')
                        .update({ 
                            video_candidato: videoId,
                            video_titulo_match: videoTitle,
                            match_score: percentage
                        })
                        .eq('id', dbRow.id);
                    candidateUpdates++;
                }
            }
        }
    }

    console.log("-----------------------------------------");
    console.log(`🏁 REPROCESSAMENTO FINALIZADO!`);
    console.log(`✅ Promovidos para Oficial (>90%): ${autoUpdates}`);
    console.log(`📝 Rascunhos Atualizados/Criados: ${candidateUpdates}`);
}

enrichDatabaseHybrid();