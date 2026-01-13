// ... (imports e config do supabase permanecem iguais)

async function fetchAdminMusics() {
    els.adminTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-amber-500 animate-pulse">BUSCANDO...</td></tr>';
    const term = els.adminSearchDb.value.trim();
    const group = els.adminFilterGroup.value;
    const playlist = els.adminFilterPlaylist.value;
    
    // REMOVIDO .limit(50) e adicionado .limit(2000) para garantir carga total sem travas de rede
    let query = supabase.from('musicas_backup')
        .select('id, artista, musica, direcao, ano, album, video_id, playlist')
        .order('id', { ascending: false })
        .limit(2000); 
    
    if (group) query = query.eq('playlist_group', group);
    if (playlist) query = query.eq('playlist', playlist);
    if (term) query = query.or(`artista.ilike.%${term}%,musica.ilike.%${term}%`);
    const { data } = await query;
    state.adminMusics = data || [];
    renderAdminTable();
}

// ... (resto do script.js permanece igual)
