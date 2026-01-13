// ... (imports e config do supabase permanecem iguais)

// LÓGICA PRINCIPAL DE BUSCA SEM PAGINAÇÃO (CARGA TOTAL)
async function fetchMusics() {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-12 text-amber-500 animate-pulse uppercase tracking-[0.2em] text-xl">Sincronizando Banco de Dados...</td></tr>';
    
    const searchTerm = searchInput.value.trim();
    const selectedGroup = filterGroupList.value;
    const selectedPlaylist = filterPlaylistList.value;

    // Adicionado .limit(5000) explicitamente para sobrepor qualquer configuração de 'max_rows' do projeto
    let query = supabase
        .from('musicas_backup')
        .select('*', { count: 'exact' }) 
        .order('id', { ascending: false })
        .limit(5000);

    if (selectedGroup) {
        query = query.eq('playlist_group', selectedGroup);
    }

    if (selectedPlaylist) {
        query = query.eq('playlist', selectedPlaylist);
    }

    if (searchTerm) {
        const term = `%${searchTerm}%`;
        query = query.or(`artista.ilike.${term},musica.ilike.${term},direcao.ilike.${term},id.eq.${Number(searchTerm) || 0}`);
    }

    const { data, error, count } = await query;

    if (error) {
        showMessage(`ERRO DE LEITURA: ${error.message}`, true);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500">ERRO: ${error.message}</td></tr>`;
        return;
    }

    currentData = data || [];
    if (totalCountLabel) totalCountLabel.innerText = count || 0;
    
    renderTable(currentData);
}

// ... (resto do admin.js permanece igual)
