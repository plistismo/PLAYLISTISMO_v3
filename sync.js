
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÕES ---
// Nota: API KEY do YouTube removida pois não será mais utilizada.
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';

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

// --- FUNÇÕES AUXILIARES ---

// Busca apenas os nomes das playlists existentes no banco para evitar duplicatas e chamadas de API
async function fetchUniquePlaylistsFromDB() {
    let allPlaylists = new Set();
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    process.stdout.write("\n"); // Pula linha

    try {
        while (hasMore) {
            // Feedback visual para evitar sensação de travamento
            process.stdout.write(`   ⏳ Lendo registros do DB: ${from} a ${from + pageSize}...\r`);

            const { data, error } = await supabase
                .from('musicas_backup')
                .select('playlist')
                .not('playlist', 'is', null) // Ignora nulos
                .range(from, from + pageSize - 1);

            if (error) {
                console.error("\n   ❌ Erro ao ler lote do Supabase:", error.message);
                throw error;
            }

            if (data && data.length > 0) {
                data.forEach(row => {
                    if (row.playlist) allPlaylists.add(row.playlist);
                });
                from += pageSize;
                // Se retornou menos que o tamanho da página, acabaram os dados
                if (data.length < pageSize) hasMore = false;
            } else {
                hasMore = false;
            }
        }
    } catch (err) {
        console.error("\n   ❌ Erro Fatal no Loop de Leitura:", err);
        return [];
    }

    console.log(`\n   ✅ Leitura concluída. Total de registros varridos: ${from}`);
    return Array.from(allPlaylists);
}

// --- PROCESSO DE MIGRAÇÃO ---

async function runMigration() {
    console.clear();
    console.log("=================================================");
    console.log("🚀 MIGRATOR V3 (DB-ONLY) - INTERNAL PROCESSING");
    console.log("=================================================");
    console.log("");

    // PASSO 1: Ler do Banco
    console.log("📥 [PASSO 1/3] Lendo catálogo do Banco de Dados (Supabase)...");
    const uniquePlaylistNames = await fetchUniquePlaylistsFromDB();
    
    const totalPlaylists = uniquePlaylistNames.length;
    console.log(`   ✅ Playlists Únicas Identificadas: ${totalPlaylists}`);
    console.log("");

    if (totalPlaylists === 0) {
        console.log("   ⚠️  Nenhuma playlist encontrada no banco. O script será encerrado.");
        return;
    }

    // PASSO 2: Atualização
    console.log("💾 [PASSO 2/3] Calculando Grupos e Atualizando Registros...");
    console.log("   ℹ️  Atualizando coluna 'playlist_group' baseado no nome da playlist.");
    console.log("");

    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < totalPlaylists; i++) {
        const playlistName = uniquePlaylistNames[i];
        const group = getPlaylistCategory(playlistName);
        
        // UX: Mostra o progresso atual
        process.stdout.write(`   🔨 [${i + 1}/${totalPlaylists}] Atualizando: "${playlistName.substring(0, 30)}..." -> GRUPO: ${group}          \r`);

        try {
            const { error } = await supabase
                .from('musicas_backup')
                .update({ playlist_group: group })
                .eq('playlist', playlistName);

            if (error) {
                // Loga o erro mas não para o loop
                console.log(`\n   ❌ Erro ao atualizar "${playlistName}": ${error.message}`);
                errorCount++;
            } else {
                successCount++;
            }
        } catch (err) {
            console.log(`\n   ❌ Exceção ao atualizar "${playlistName}":`, err);
            errorCount++;
        }
    }

    console.log("\n");

    // RESUMO
    console.log("=================================================");
    console.log("🏁 MIGRAÇÃO CONCLUÍDA!");
    console.log(`   - Playlists Únicas Processadas: ${totalPlaylists}`);
    console.log(`   - Updates com Sucesso: ${successCount}`);
    console.log(`   - Falhas: ${errorCount}`);
    console.log("=================================================");
}

runMigration();
