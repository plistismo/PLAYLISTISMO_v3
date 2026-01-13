

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÕES ---
// PREENCHA AQUI SUAS CHAVES
const YT_API_KEY = 'SUA_YOUTUBE_API_KEY_AQUI'; 
const CHANNEL_ID = 'SEU_CHANNEL_ID_AQUI';      

const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const TARGET_TABLE = 'musicas_backup';

const supabase = createClient(SB_URL, SB_KEY);

// --- LÓGICA DE GRUPOS ---
const getPlaylistCategory = (title) => {
    if (!title) return 'OTHERS';
    const t = title.toUpperCase();
    if (t.includes('UPLOAD')) return 'UPLOADS';
    if (t.includes('ZONE')) return 'ZONES';
    if (t.includes('ROCK') || t.includes('POP') || t.includes('JAZZ') || t.includes('INDIE') || t.includes('BRASIL')) return 'GENRES';
    if (t.match(/\d{4}/)) return 'ERAS';
    return 'OTHERS';
};

// --- API HELPERS ---
async function fetchFromYouTube(endpoint, params) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
    url.searchParams.append('key', YT_API_KEY);
    for (const k in params) url.searchParams.append(k, params[k]);

    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`YouTube API Error (${res.status}): ${txt}`);
    }
    return await res.json();
}

// --- PROCESSO DE MIGRAÇÃO ---

async function runMigration() {
    console.clear();
    console.log("=================================================");
    console.log("🚀 YOUTUBE SYNC & BACKUP V4");
    console.log(`🎯 Alvo: Tabela '${TARGET_TABLE}'`);
    console.log("=================================================");

    if (YT_API_KEY === 'SUA_YOUTUBE_API_KEY_AQUI' || CHANNEL_ID === 'SEU_CHANNEL_ID_AQUI') {
        console.error("❌ ERRO: Configure YT_API_KEY e CHANNEL_ID no arquivo sync.js");
        return;
    }

    // PASSO 1: Buscar Playlists do Canal
    console.log("\n📡 [PASSO 1/3] Buscando Playlists do YouTube...");
    
    let allPlaylists = [];
    let nextPageToken = '';
    
    do {
        const data = await fetchFromYouTube('playlists', {
            part: 'snippet,contentDetails',
            channelId: CHANNEL_ID,
            maxResults: 50,
            pageToken: nextPageToken || ''
        });
        
        allPlaylists = [...allPlaylists, ...data.items];
        nextPageToken = data.nextPageToken;
        process.stdout.write(`   📥 Encontradas: ${allPlaylists.length} playlists...\r`);
    } while (nextPageToken);

    console.log(`\n   ✅ Total de Playlists no Canal: ${allPlaylists.length}`);

    // PASSO 2: Sincronizar Catálogo (Tabela 'playlists')
    console.log("\n📚 [PASSO 2/3] Atualizando Catálogo de Playlists...");
    
    for (const pl of allPlaylists) {
        const name = pl.snippet.title;
        const group = getPlaylistCategory(name);
        const count = pl.contentDetails.itemCount;

        const { error } = await supabase.from('playlists').upsert({
            name: name,
            group_name: group,
            video_count: count,
            updated_at: new Date()
        }, { onConflict: 'name' });

        if (error) console.error(`   ❌ Erro ao catalogar "${name}":`, error.message);
    }
    console.log("   ✅ Catálogo atualizado.");

    // PASSO 3: Sincronizar Vídeos (Tabela 'musicas_backup')
    console.log("\n💾 [PASSO 3/3] Sincronizando Vídeos (Smart Insert)...");

    let totalNew = 0;
    let totalSkipped = 0;

    for (let i = 0; i < allPlaylists.length; i++) {
        const pl = allPlaylists[i];
        const playlistName = pl.snippet.title;
        
        console.log(`\n   📂 Processando: "${playlistName}" [${i+1}/${allPlaylists.length}]`);

        // Busca vídeos da playlist
        let plVideos = [];
        let plPageToken = '';

        try {
            do {
                const vData = await fetchFromYouTube('playlistItems', {
                    part: 'snippet',
                    playlistId: pl.id,
                    maxResults: 50,
                    pageToken: plPageToken || ''
                });
                
                plVideos = [...plVideos, ...vData.items];
                plPageToken = vData.nextPageToken;
            } while (plPageToken);
        } catch (err) {
            console.error(`      ❌ Erro ao ler vídeos da playlist: ${err.message}`);
            continue;
        }

        // Filtra vídeos válidos (que não foram deletados ou privados)
        const validVideos = plVideos.filter(v => v.snippet.title !== 'Private video' && v.snippet.title !== 'Deleted video');

        if (validVideos.length === 0) continue;

        // Smart Check: Busca quais IDs desta playlist JÁ existem no banco
        const videoIds = validVideos.map(v => v.snippet.resourceId.videoId);
        
        // Supabase 'in' filter limita URL, então fazemos em lotes se necessário, mas para 50-100 itens costuma ir bem.
        // Faremos uma verificação mais robusta: buscar IDs existentes no banco para estes videos.
        
        const { data: existingData, error: dbErr } = await supabase
            .from(TARGET_TABLE)
            .select('video_id')
            .in('video_id', videoIds);

        if (dbErr) {
            console.error(`      ❌ Erro ao verificar duplicatas: ${dbErr.message}`);
            continue;
        }

        const existingSet = new Set(existingData.map(e => e.video_id));
        
        // Prepara novos inserts
        const toInsert = validVideos
            .filter(v => !existingSet.has(v.snippet.resourceId.videoId))
            .map(v => {
                const title = v.snippet.title;
                const vidId = v.snippet.resourceId.videoId;
                const year = v.snippet.publishedAt ? new Date(v.snippet.publishedAt).getFullYear() : null;
                
                // Tenta extrair Artista - Musica (básico)
                let artista = "Desconhecido";
                let musica = title;
                
                if (title.includes(' - ')) {
                    const parts = title.split(' - ');
                    artista = parts[0].trim();
                    musica = parts.slice(1).join(' - ').trim();
                }

                return {
                    playlist: playlistName,
                    playlist_group: getPlaylistCategory(playlistName),
                    video_id: vidId,
                    artista: artista, // Tentativa de parse
                    musica: title,    // Salva título completo em 'musica' também para garantir ou ajustamos para 'musica' receber o titulo limpo
                    ano: year,
                    direcao: null,     // Não tem na API
                    album: null        // Não tem na API
                };
            });

        if (toInsert.length > 0) {
            const { error: insertErr } = await supabase.from(TARGET_TABLE).insert(toInsert);
            if (insertErr) {
                console.error(`      ❌ Erro no Insert: ${insertErr.message}`);
            } else {
                console.log(`      ✅ +${toInsert.length} novos vídeos inseridos.`);
                totalNew += toInsert.length;
            }
        } else {
            process.stdout.write(`      💤 Sem novos vídeos.\r`);
        }
        
        totalSkipped += (validVideos.length - toInsert.length);
    }

    console.log("\n\n=================================================");
    console.log("🏁 SINCRONIZAÇÃO CONCLUÍDA!");
    console.log(`   - Novos Vídeos Inseridos: ${totalNew}`);
    console.log(`   - Vídeos Existentes (Ignorados): ${totalSkipped}`);
    console.log("=================================================");
}

runMigration();
