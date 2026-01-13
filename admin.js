import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// DOM Elements
const musicForm = document.getElementById('music-form');
const tableBody = document.getElementById('table-body');
const totalCount = document.getElementById('total-count');
const statusMsg = document.getElementById('status-msg');
const btnLogout = document.getElementById('btn-logout');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');
const btnNormalize = document.getElementById('btn-normalize');

// Pagination Controls
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');
const pageInfo = document.getElementById('page-info');

// Filters
const searchInput = document.getElementById('search-db');
const filterGroupList = document.getElementById('filter-group-list');
const filterPlaylistList = document.getElementById('filter-playlist-list');

// Inputs Form
const inputId = document.getElementById('music-id');
const inputArtista = document.getElementById('input-artista');
const inputMusica = document.getElementById('input-musica');
const inputAno = document.getElementById('input-ano');
const inputAlbum = document.getElementById('input-album');
const inputDirecao = document.getElementById('input-direcao');
const inputVideoId = document.getElementById('input-video-id');

// State Vars
let currentData = []; 
let debounceTimeout = null;
let lastUpdatedId = null; // Para sinalizar o registro editado na tabela

// Pagination State
let currentPage = 0;
const PAGE_SIZE = 50;
let totalRecords = 0;

// --- AUTH CHECK & INIT ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        await loadDatabaseFilterOptions();
        await handleUrlContext(); // Gerencia parâmetros da URL (playlist e edit_id)
        await fetchMusics(); 
    }
}

async function handleUrlContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const playlist = urlParams.get('playlist');
    const editId = urlParams.get('edit_id');

    // Se houver uma playlist na URL, pré-seleciona ela no filtro
    if (playlist) {
        // Aguarda um pouco para o carregamento das opções do select terminar se necessário
        filterPlaylistList.value = playlist;
    }

    // O edit_id será processado em fetchMusics -> renderTable -> editMusicById se necessário, 
    // ou explicitamente aqui se quisermos carregar o formulário.
    if (editId) {
        // Tentaremos carregar os dados específicos após o fetch principal
        setTimeout(async () => {
            let target = currentData.find(m => m.id == editId);
            if (!target) {
                // CHANGED: Reverted to musicas_backup
                const { data } = await supabase.from('musicas_backup').select('*').eq('id', editId).single();
                target = data;
            }
            if(target) editMusicData(target);
        }, 500);
    }
}

async function loadDatabaseFilterOptions() {
    const { data, error } = await supabase
        .from('playlists')
        .select('name, group_name')
        .order('name', { ascending: true })
        .range(0, 9999);

    if (error) {
        console.error("Erro ao carregar lista de filtros:", error);
        return;
    }

    const groups = [...new Set(data.map(item => item.group_name).filter(Boolean))].sort();
    const playlists = data.map(item => item.name).filter(Boolean);

    const currentGroup = filterGroupList.value;
    filterGroupList.innerHTML = '<option value="">TODOS OS GRUPOS</option>';
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.innerText = g;
        if(g === currentGroup) opt.selected = true;
        filterGroupList.appendChild(opt);
    });

    const currentPlaylist = filterPlaylistList.value;
    filterPlaylistList.innerHTML = '<option value="">TODAS AS PLAYLISTS</option>';
    playlists.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.innerText = p;
        if(p === currentPlaylist) opt.selected = true;
        filterPlaylistList.appendChild(opt);
    });
}

async function fetchMusics() {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-amber-500 animate-pulse">BUSCANDO DADOS NO SERVIDOR...</td></tr>';
    
    const searchTerm = searchInput.value.trim();
    const selectedGroup = filterGroupList.value;
    const selectedPlaylist = filterPlaylistList.value;

    // CHANGED: Reverted to musicas_backup
    let query = supabase
        .from('musicas_backup')
        .select('*', { count: 'exact' }) // IMPORTANTE: Solicita a contagem total
        .order('id', { ascending: false });

    if (selectedGroup) {
        query = query.eq('playlist_group', selectedGroup);
    }

    if (selectedPlaylist) {
        query = query.eq('playlist', selectedPlaylist);
    }

    if (searchTerm) {
        const term = `%${searchTerm}%`;
        // Nota: Busca textual complexa pode ser lenta em tabelas grandes, mas a paginação ajuda
        query = query.or(`artista.ilike.${term},musica.ilike.${term},direcao.ilike.${term},id.eq.${Number(searchTerm) || 0}`);
    }

    // Paginação Real
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        showMessage(`ERRO DE LEITURA: ${error.message}`, true);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500">ERRO: ${error.message}</td></tr>`;
        return;
    }

    currentData = data;
    totalRecords = count || 0;
    
    renderTable(currentData);
    updatePaginationUI();
}

function updatePaginationUI() {
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
    
    pageInfo.innerText = `PÁGINA ${currentPage + 1} DE ${totalPages || 1}`;
    
    // Total Count Global Display
    totalCount.innerText = totalRecords;

    // Button States
    btnPrevPage.disabled = currentPage === 0;
    btnNextPage.disabled = (currentPage + 1) * PAGE_SIZE >= totalRecords;
}

// Handlers de Paginação
btnPrevPage.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        fetchMusics();
    }
});

btnNextPage.addEventListener('click', () => {
    if ((currentPage + 1) * PAGE_SIZE < totalRecords) {
        currentPage++;
        fetchMusics();
    }
});

function renderTable(data) {
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 opacity-50">NENHUM REGISTRO ENCONTRADO COM ESTES FILTROS.</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        const isUpdated = item.id == lastUpdatedId;
        row.className = `hover:bg-amber-900/10 transition-colors group border-b border-amber-900/10 ${isUpdated ? 'row-updated' : ''}`;
        row.innerHTML = `
            <td class="font-mono text-sm opacity-70 align-top border-r border-amber-900/30 px-2 text-center py-2">${item.id}</td>
            <td class="align-top border-r border-amber-900/30 px-2 py-2">
                <div class="font-bold text-lg leading-none text-[#00ff00]">${item.artista}</div>
                <div class="text-sm opacity-90">${item.musica || '---'}</div>
            </td>
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2">
                ${item.album || '---'}
            </td>
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2 font-mono">
                ${item.ano || '---'}
            </td>
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2 italic text-[#00ff00]">
                ${item.direcao || '---'}
            </td>
            <td class="text-center align-middle px-2 py-2">
                <div class="flex justify-center gap-2">
                    <button onclick="editMusicById(${item.id})" class="text-amber-500 hover:bg-amber-500 hover:text-black px-2 py-1 border border-amber-500 text-sm font-bold">EDIT</button>
                    <button onclick="deleteMusic(${item.id})" class="text-red-500 hover:bg-red-500 hover:text-black px-2 py-1 border border-red-500 text-sm font-bold">X</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

window.editMusicById = (id) => {
    const music = currentData.find(m => m.id == id);
    if(music) editMusicData(music);
};

function editMusicData(music) {
    inputId.value = music.id;
    inputArtista.value = music.artista || '';
    inputMusica.value = music.musica || '';
    inputAno.value = music.ano || ''; 
    inputAlbum.value = music.album || '';
    inputDirecao.value = music.direcao || '';
    inputVideoId.value = music.video_id || '';

    document.getElementById('form-title').querySelector('span').innerText = `EDITANDO #${music.id}`;
    btnSave.innerText = "ATUALIZAR DADOS";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

musicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = inputId.value;
    const urlParams = new URLSearchParams(window.location.search);
    const fromTv = urlParams.get('from') === 'tv';

    const formData = {
        artista: inputArtista.value.trim(),
        musica: inputMusica.value.trim(),
        ano: inputAno.value ? String(inputAno.value) : null,
        album: inputAlbum.value.trim() || null,
        direcao: inputDirecao.value.trim() || null,
        video_id: inputVideoId.value.trim() || null
    };

    btnSave.disabled = true;
    btnSave.innerText = "PROCESSANDO...";

    let error = null;
    let operationId = id;

    // CHANGED: Reverted to musicas_backup
    if (id) {
        // Feature: Replicate changes across ALL entries with the same video_id
        // Targeting video_id instead of row id to update metadata in all playlists
        const { error: err } = await supabase.from('musicas_backup').update(formData).eq('video_id', formData.video_id);
        error = err;
        if(!error) showMessage(`REGISTROS COM VÍDEO ID ${formData.video_id} ATUALIZADOS!`);
    } else {
        const { data: inserted, error: err } = await supabase.from('musicas_backup').insert([formData]).select();
        error = err;
        if(!error && inserted) {
            operationId = inserted[0].id;
            showMessage("NOVO REGISTRO GRAVADO!");
        }
    }

    if (error) {
        showMessage(`ERRO: ${error.message}`, true);
        btnSave.disabled = false;
        btnSave.innerText = "GRAVAR DADOS";
    } else {
        // Se editou o vídeo ATUAL da TV (ou o vídeo ID bate), atualiza créditos e REINICIA na TV
        if (fromTv) {
            let playlist = null;
            let video_id = formData.video_id;
            
            if (id) {
                const currentItem = currentData.find(m => m.id == id);
                if (currentItem) playlist = currentItem.playlist;
            }

            if (playlist && video_id) {
                localStorage.setItem('tv_resume_state', JSON.stringify({
                    playlist: playlist,
                    videoId: video_id
                }));
            }
            
            showMessage("DADOS GRAVADOS! RETORNANDO À TV...", false);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);
        } else {
            // Se for Service Mode, permanece no Admin e sinaliza na lista
            lastUpdatedId = operationId;
            btnSave.disabled = false;
            resetForm();
            // Limpa parâmetros da URL para evitar comportamentos estranhos no próximo save
            window.history.replaceState({}, document.title, window.location.pathname);
            await fetchMusics();
            showMessage(`REGISTRO #${operationId} PROCESSADO COM SUCESSO!`);
        }
    }
});

window.deleteMusic = async (id) => {
    if(!confirm(`ATENÇÃO: Deletar registro #${id}? Esta ação é irreversível.`)) return;
    // CHANGED: Reverted to musicas_backup
    const { error } = await supabase.from('musicas_backup').delete().eq('id', id);
    if (error) {
        showMessage(`ERRO AO DELETAR: ${error.message}`, true);
    } else {
        showMessage(`REGISTRO #${id} APAGADO.`);
        fetchMusics(); 
    }
};

function resetForm() {
    musicForm.reset();
    inputId.value = '';
    document.getElementById('form-title').querySelector('span').innerText = 'NOVO REGISTRO';
    btnSave.innerText = "GRAVAR DADOS";
}

function showMessage(msg, isError = false) {
    statusMsg.innerText = msg;
    statusMsg.classList.remove('hidden');
    if (isError) {
        statusMsg.classList.add('bg-red-900', 'text-white', 'border-red-500');
        statusMsg.classList.remove('bg-amber-900', 'text-amber-500', 'border-amber-500');
    } else {
        statusMsg.classList.remove('bg-red-900', 'text-white', 'border-red-500');
        statusMsg.classList.add('bg-amber-900/20', 'text-amber-500', 'border-amber-500');
    }
    setTimeout(() => statusMsg.classList.add('hidden'), 3000);
}

// --- NORMALIZATION LOGIC ---

function calculateRecordScore(row) {
    let score = 0;
    if (row.artista && row.artista !== 'Desconhecido') score += row.artista.length;
    if (row.musica) score += row.musica.length;
    if (row.album) score += 10;
    if (row.ano) score += 5;
    if (row.direcao) score += 10;
    return score;
}

async function runNormalization() {
    if (!confirm("Isso irá padronizar os metadados de todos os vídeos duplicados no banco de dados. Deseja continuar?")) return;

    btnNormalize.disabled = true;
    btnNormalize.innerText = "PROCESSANDO...";
    showMessage("🔍 INICIANDO NORMALIZAÇÃO DE METADADOS...");

    try {
        const TARGET_TABLE = 'musicas_backup';
        const BATCH_SIZE = 1000;
        let allRecords = [];
        let from = 0;
        let hasMore = true;

        // 1. BUSCA EXAUSTIVA (PAGINADA)
        while (hasMore) {
            showMessage(`📡 Lendo registros (${from} a ${from + BATCH_SIZE})...`);
            const { data, error } = await supabase
                .from(TARGET_TABLE)
                .select('*')
                .range(from, from + BATCH_SIZE - 1);

            if (error) throw error;
            allRecords = [...allRecords, ...data];
            if (data.length < BATCH_SIZE) hasMore = false;
            else from += BATCH_SIZE;
        }

        showMessage(`📦 Agrupando ${allRecords.length} registros...`);
        
        // 2. AGRUPAMENTO POR VIDEO_ID
        const groups = allRecords.reduce((acc, row) => {
            if (!row.video_id) return acc;
            if (!acc[row.video_id]) acc[row.video_id] = [];
            acc[row.video_id].push(row);
            return acc;
        }, {});

        const videoIds = Object.keys(groups);
        let updatedCount = 0;
        let skippedCount = 0;

        // 3. PROCESSAMENTO DOS GRUPOS
        for (let i = 0; i < videoIds.length; i++) {
            const videoId = videoIds[i];
            const rows = groups[videoId];
            
            if (i % 20 === 0) {
                showMessage(`⚡ Processando vídeos: ${i}/${videoIds.length}...`);
            }

            if (rows.length <= 1) {
                skippedCount++;
                continue;
            }

            // Encontrar Mestre
            let master = rows[0];
            let maxScore = -1;

            for (const row of rows) {
                const currentScore = calculateRecordScore(row);
                if (currentScore > maxScore) {
                    maxScore = currentScore;
                    master = row;
                }
            }

            if (maxScore <= 0 || (!master.artista && !master.musica)) {
                skippedCount++;
                continue;
            }

            const needsUpdate = rows.some(row => 
                row.id !== master.id && (
                    row.artista !== master.artista || 
                    row.musica !== master.musica || 
                    row.album !== master.album || 
                    row.ano !== master.ano ||
                    row.direcao !== master.direcao
                )
            );

            if (needsUpdate) {
                const updatePayload = {
                    artista: master.artista,
                    musica: master.musica,
                    album: master.album,
                    ano: master.ano,
                    direcao: master.direcao
                };

                const { error: updateError } = await supabase
                    .from(TARGET_TABLE)
                    .update(updatePayload)
                    .eq('video_id', videoId);

                if (updateError) {
                    console.error(`Erro no Video ID ${videoId}:`, updateError.message);
                } else {
                    updatedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        showMessage(`🏁 CONCLUÍDO! Propagados: ${updatedCount} | Mantidos: ${skippedCount}`, false);
        fetchMusics();

    } catch (err) {
        console.error(err);
        showMessage(`❌ ERRO NA NORMALIZAÇÃO: ${err.message}`, true);
    } finally {
        btnNormalize.disabled = false;
        btnNormalize.innerText = "NORMALIZAR DB";
    }
}

// Event Listeners para Filtros: Reseta a página para 0 ao mudar filtros
searchInput.addEventListener('input', (e) => {
    currentPage = 0; // Reset page
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        fetchMusics();
    }, 500);
});

filterGroupList.addEventListener('change', () => { currentPage = 0; fetchMusics(); });
filterPlaylistList.addEventListener('change', () => { currentPage = 0; fetchMusics(); });

btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
});

btnClear.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
    window.history.replaceState({}, document.title, window.location.pathname);
});

btnNormalize.addEventListener('click', runNormalization);

checkAuth();