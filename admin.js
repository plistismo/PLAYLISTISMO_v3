

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
const inputGroup = document.getElementById('input-group');
const inputPlaylist = document.getElementById('input-playlist'); // NOVO
const inputDirecao = document.getElementById('input-direcao');
const inputVideoId = document.getElementById('input-video-id');

let allMusics = []; // Cache local para busca rápida

// --- AUTH CHECK ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        fetchMusics();
    }
}

// --- CRUD OPERATIONS ---

// 1. READ
async function fetchMusics() {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">LENDO MEMÓRIA...</td></tr>';
    
    // Carrega registros (limite padrão do Supabase pode cortar registros antigos, por isso a lógica de fallback abaixo é necessária)
    const { data, error } = await supabase
        .from('musicas_backup')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        showMessage(`ERRO DE LEITURA: ${error.message}`, true);
        return;
    }

    allMusics = data;
    
    // Popula Filtros Dinamicamente
    populateFilters(data);
    
    // Renderiza tabela inicial
    applyFilters();

    // AUTO-EDIT CHECK: Verifica se existe parametro na URL para editar imediatamente
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit_id');
    
    if (editId) {
        // Tenta encontrar nos dados carregados
        let target = allMusics.find(m => m.id == editId);
        
        // Se não encontrar (ex: paginação ou ID muito antigo), busca especificamente no DB
        if (!target) {
            showMessage(`BUSCANDO REGISTRO #${editId} NO SERVIDOR...`);
            const { data: specificRecord, error: specificError } = await supabase
                .from('musicas_backup')
                .select('*')
                .eq('id', editId)
                .single();
                
            if (specificRecord) {
                target = specificRecord;
                // Adiciona ao cache local para que editMusic funcione
                allMusics.push(target);
            } else {
                showMessage(`ERRO: ID #${editId} NÃO ENCONTRADO.`);
            }
        }

        // Se encontrou o alvo (no cache ou via fetch específico), edita
        if(target) {
            editMusic(editId);
            showMessage(`REGISTRO #${editId} CARREGADO PARA EDIÇÃO.`);
            
            // Limpa a URL para evitar re-edição no refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// 2. CREATE & UPDATE
musicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = inputId.value;
    const formData = {
        artista: inputArtista.value.trim(),
        musica: inputMusica.value.trim(),
        ano: inputAno.value ? String(inputAno.value) : null,
        album: inputAlbum.value.trim() || null,
        playlist_group: inputGroup.value || null,
        playlist: inputPlaylist.value.trim() || null, // NOVO
        direcao: inputDirecao.value.trim() || null,
        video_id: inputVideoId.value.trim() || null
    };

    btnSave.disabled = true;
    btnSave.innerText = "PROCESSANDO...";

    let error = null;

    if (id) {
        const { error: err } = await supabase.from('musicas_backup').update(formData).eq('id', id);
        error = err;
        if(!error) showMessage(`REGISTRO #${id} ATUALIZADO COM SUCESSO!`);
    } else {
        const { error: err } = await supabase.from('musicas_backup').insert([formData]);
        error = err;
        if(!error) showMessage("NOVO REGISTRO GRAVADO!");
    }

    if (error) {
        showMessage(`ERRO: ${error.message}`, true);
    } else {
        resetForm();
        fetchMusics(); // Recarrega tudo para atualizar filtros se necessário
    }

    btnSave.disabled = false;
    btnSave.innerText = "GRAVAR DADOS";
});

// 3. DELETE
window.deleteMusic = async (id) => {
    if(!confirm(`ATENÇÃO: Deletar registro #${id}? Esta ação é irreversível.`)) return;

    const { error } = await supabase.from('musicas_backup').delete().eq('id', id);

    if (error) {
        showMessage(`ERRO AO DELETAR: ${error.message}`, true);
    } else {
        showMessage(`REGISTRO #${id} APAGADO.`);
        fetchMusics();
    }
};

// 4. EDIT (Populate Form)
window.editMusic = (id) => {
    const music = allMusics.find(m => m.id == id);
    if (!music) {
        console.error("Registro não encontrado no cache local:", id);
        return;
    }

    inputId.value = music.id;
    inputArtista.value = music.artista || '';
    inputMusica.value = music.musica || '';
    inputAno.value = music.ano || ''; 
    inputAlbum.value = music.album || '';
    inputGroup.value = music.playlist_group || '';
    inputPlaylist.value = music.playlist || ''; // NOVO
    inputDirecao.value = music.direcao || '';
    inputVideoId.value = music.video_id || '';

    document.getElementById('form-title').querySelector('span').innerText = `EDITANDO #${id}`;
    btnSave.innerText = "ATUALIZAR DADOS";
    
    // Scroll mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- FILTERS & RENDER LOGIC ---

function populateFilters(data) {
    // Extrai grupos únicos
    const groups = [...new Set(data.map(item => item.playlist_group).filter(Boolean))].sort();
    
    // Extrai playlists únicas
    const playlists = [...new Set(data.map(item => item.playlist).filter(Boolean))].sort();

    // Popula Select de Grupos
    filterGroupList.innerHTML = '<option value="">TODOS OS GRUPOS</option>';
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.innerText = g;
        filterGroupList.appendChild(opt);
    });

    // Popula Select de Playlists
    filterPlaylistList.innerHTML = '<option value="">TODAS AS PLAYLISTS</option>';
    playlists.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.innerText = p;
        filterPlaylistList.appendChild(opt);
    });
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedGroup = filterGroupList.value;
    const selectedPlaylist = filterPlaylistList.value;

    const filtered = allMusics.filter(m => {
        // 1. Text Search
        const matchesText = 
            (m.artista && m.artista.toLowerCase().includes(searchTerm)) ||
            (m.musica && m.musica.toLowerCase().includes(searchTerm)) ||
            (m.id && m.id.toString().includes(searchTerm)) ||
            (m.direcao && m.direcao.toLowerCase().includes(searchTerm));

        // 2. Group Filter
        const matchesGroup = selectedGroup === "" || m.playlist_group === selectedGroup;

        // 3. Playlist Filter
        const matchesPlaylist = selectedPlaylist === "" || m.playlist === selectedPlaylist;

        return matchesText && matchesGroup && matchesPlaylist;
    });

    renderTable(filtered);
}

function renderTable(data) {
    totalCount.innerText = data.length;
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 opacity-50">NENHUM DADO ENCONTRADO PARA ESTE FILTRO</td></tr>';
        return;
    }

    // Paginação simples (limitada a 100 itens para performance se a lista for gigante)
    const displayData = data.slice(0, 200);

    displayData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-amber-900/10 transition-colors group border-b border-amber-900/10';
        row.innerHTML = `
            <td class="font-mono text-sm opacity-70 align-top border-r border-amber-900/30 px-2 text-center py-2">${item.id}</td>
            
            <td class="align-top border-r border-amber-900/30 px-2 py-2">
                <div class="font-bold text-lg leading-none text-amber-500">${item.artista}</div>
                <div class="text-sm opacity-90">${item.musica || '---'}</div>
            </td>
            
            <td class="hidden lg:table-cell text-sm opacity-60 align-top border-r border-amber-900/30 px-2 py-2 font-mono">
                ${item.album ? `<div title="Álbum">💿 ${item.album.substring(0,20)}${item.album.length>20?'...':''}</div>` : ''}
                ${item.ano ? `<div title="Ano">📅 ${item.ano}</div>` : ''}
            </td>
            
            <td class="hidden md:table-cell text-sm align-top border-r border-amber-900/30 px-2 py-2">
                <div class="font-bold opacity-80">${item.playlist || '---'}</div>
                <div class="text-xs text-amber-700 font-mono mt-1">${item.playlist_group || 'NO GROUP'}</div>
            </td>

            <td class="hidden xl:table-cell text-sm opacity-70 align-top border-r border-amber-900/30 px-2 py-2 italic">
                ${item.direcao || '--'}
            </td>

            <td class="text-center align-middle px-2 py-2">
                <div class="flex justify-center gap-2">
                    <button onclick="editMusic(${item.id})" class="text-amber-500 hover:bg-amber-500 hover:text-black px-2 py-1 border border-amber-500 text-sm font-bold">EDIT</button>
                    <button onclick="deleteMusic(${item.id})" class="text-red-500 hover:bg-red-500 hover:text-black px-2 py-1 border border-red-500 text-sm font-bold">X</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    if (data.length > 200) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" class="text-center p-2 opacity-50 text-xs italic">MOSTRANDO 200 DE ${data.length} REGISTROS. REFINE SUA BUSCA.</td>`;
        tableBody.appendChild(row);
    }
}

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

// Event Listeners for Filters
searchInput.addEventListener('input', applyFilters);
filterGroupList.addEventListener('change', applyFilters);
filterPlaylistList.addEventListener('change', applyFilters);

// Logout
btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
});

btnClear.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
});

// Init
checkAuth();