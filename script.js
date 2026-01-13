import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// ... (seletores e estado mantidos conforme original)

async function fetchAdminMusics() {
    const tableBody = document.getElementById('admin-table-body');
    const searchDb = document.getElementById('admin-search-db');
    const filterGroup = document.getElementById('admin-filter-group');
    const filterPlaylist = document.getElementById('admin-filter-playlist');

    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-amber-500 animate-pulse uppercase">Sincronizando...</td></tr>';
    
    const term = searchDb.value.trim();
    const group = filterGroup.value;
    const playlist = filterPlaylist.value;
    
    let query = supabase.from('musicas_backup')
        .select('id, artista, musica, direcao, ano, album, video_id, playlist')
        .order('id', { ascending: false })
        .limit(10000); // FORÇANDO LIMITE MASSIVO PARA QUEBRAR A BARREIRA DOS 50
    
    if (group) query = query.eq('playlist_group', group);
    if (playlist) query = query.eq('playlist', playlist);
    if (term) query = query.or(`artista.ilike.%${term}%,musica.ilike.%${term}%`);

    const { data, error } = await query;
    if (error) {
        tableBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
        return;
    }
    
    renderAdminTable(data || []);
}

function renderAdminTable(musics) {
    const tableBody = document.getElementById('admin-table-body');
    tableBody.innerHTML = '';
    if (musics.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center opacity-50 uppercase">Sem Resultados</td></tr>';
        return;
    }
    musics.forEach(m => {
        const row = document.createElement('tr');
        row.className = 'border-b border-amber-900/20 hover:bg-amber-900/10 cursor-pointer';
        row.innerHTML = `
            <td class="p-2 font-mono text-gray-500">${m.id}</td>
            <td class="p-2">
                <div class="font-bold text-amber-500 uppercase">${m.artista}</div>
                <div class="text-[10px] opacity-70 uppercase">${m.musica}</div>
            </td>
            <td class="p-2 text-right">
                <button onclick="editVideo(${m.id})" class="text-[10px] border border-amber-600 px-2 py-1 hover:bg-amber-600 hover:text-black uppercase">Edit</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
// ... (resto do script.js)