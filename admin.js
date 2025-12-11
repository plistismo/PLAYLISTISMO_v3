

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
const inputPlaylist = document.getElementById('input-playlist'); 
const inputDirecao = document.getElementById('input-direcao');
const inputVideoId = document.getElementById('input-video-id');

let currentData = []; // Dados exibidos na tabela atualmente
let debounceTimeout = null;

// --- AUTH CHECK & INIT ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        // 1. Carrega opções dos dropdowns (Todas as playlists do banco)
        loadDatabaseFilterOptions();
        
        // 2. Carrega tabela inicial
        fetchMusics(); 
        
        // 3. Verifica se há edição pendente via URL
        checkUrlForEdit();
    }
}

// --- CORE: CARREGAMENTO DE FILTROS (OTIMIZADO) ---
async function loadDatabaseFilterOptions() {
    // ALTERAÇÃO: Busca na tabela 'playlists' (leve) em vez de 'musicas_backup' (pesada).
    // Mapeamento: 'name' -> playlist, 'group_name' -> playlist_group
    const { data, error } = await supabase
        .from('playlists')
        .select('name, group_name')
        .order('name', { ascending: true });

    if (error) {
        console.error("Erro ao carregar lista de filtros (tabela playlists):", error);
        return;
    }

    // Extrai grupos únicos
    const groups = [...new Set(data.map(item => item.group_name).filter(Boolean))].sort();
    
    // Extrai playlists (a tabela playlists já deve ter nomes únicos, mas filtramos por segurança)
    const playlists = data.map(item => item.name).filter(Boolean); // Já vem ordenado do banco

    // Popula Select de Grupos
    const currentGroup = filterGroupList.value;
    filterGroupList.innerHTML = '<option value="">TODOS OS GRUPOS</option>';
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.innerText = g;
        if(g === currentGroup) opt.selected = true;
        filterGroupList.appendChild(opt);
    });

    // Popula Select de Playlists
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

// --- CORE: LEITURA DE DADOS (SERVER-SIDE FILTERING) ---
async function fetchMusics() {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-amber-500 animate-pulse">BUSCANDO DADOS NO SERVIDOR...</td></tr>';
    
    // Captura valores dos filtros
    const searchTerm = searchInput.value.trim();
    const selectedGroup = filterGroupList.value;
    const selectedPlaylist = filterPlaylistList.value;

    // Inicia Query Base na tabela PRINCIPAL de dados
    let query = supabase
        .from('musicas_backup')
        .select('*')
        .order('id', { ascending: false });

    // Aplica Filtros Server-Side
    if (selectedGroup) {
        query = query.eq('playlist_group', selectedGroup);
    }

    if (selectedPlaylist) {
        query = query.eq('playlist', selectedPlaylist);
    }

    if (searchTerm) {
        // Busca textual em várias colunas (ilike = case insensitive)
        const term = `%${searchTerm}%`;
        query = query.or(`artista.ilike.${term},musica.ilike.${term},direcao.ilike.${term},id.eq.${Number(searchTerm) || 0}`);
    }

    // Limite de segurança para visualização
    query = query.limit(200);

    const { data, error } = await query;

    if (error) {
        showMessage(`ERRO DE LEITURA: ${error.message}`, true);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500">ERRO: ${error.message}</td></tr>`;
        return;
    }

    currentData = data;
    renderTable(currentData);
}

// --- AUTO-EDIT (URL PARAM) ---
async function checkUrlForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit_id');
    
    if (editId) {
        // Tenta achar nos dados já carregados
        let target = currentData.find(m => m.id == editId);
        
        // Se não achou (ex: filtro inicial não pegou), busca individualmente
        if (!target) {
            showMessage(`LOCALIZANDO REGISTRO #${editId}...`);
            const { data } = await supabase.from('musicas_backup').select('*').eq('id', editId).single();
            target = data;
            // Adiciona visualmente no topo se encontrar
            if (target) {
                currentData.unshift(target);
                renderTable(currentData);
            }
        }

        if(target) {
            editMusicData(target);
            showMessage(`REGISTRO #${editId} PRONTO PARA EDIÇÃO.`);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            showMessage(`REGISTRO #${editId} NÃO ENCONTRADO.`);
        }
    }
}

// --- RENDER ---
function renderTable(data) {
    totalCount.innerText = data.length + (data.length === 200 ? "+" : ""); // Indica se atingiu o limite
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 opacity-50">NENHUM REGISTRO ENCONTRADO COM ESTES FILTROS.</td></tr>';
        return;
    }

    data.forEach(item => {
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
                    <button onclick="editMusicById(${item.id})" class="text-amber-500 hover:bg-amber-500 hover:text-black px-2 py-1 border border-amber-500 text-sm font-bold">EDIT</button>
                    <button onclick="deleteMusic(${item.id})" class="text-red-500 hover:bg-red-500 hover:text-black px-2 py-1 border border-red-500 text-sm font-bold">X</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- CRUD LOGIC ---

// Helper para editar vindo do botão
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
    inputGroup.value = music.playlist_group || '';
    inputPlaylist.value = music.playlist || '';
    inputDirecao.value = music.direcao || '';
    inputVideoId.value = music.video_id || '';

    document.getElementById('form-title').querySelector('span').innerText = `EDITANDO #${music.id}`;
    btnSave.innerText = "ATUALIZAR DADOS";
    
    // Scroll mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// CREATE / UPDATE
musicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = inputId.value;
    const formData = {
        artista: inputArtista.value.trim(),
        musica: inputMusica.value.trim(),
        ano: inputAno.value ? String(inputAno.value) : null,
        album: inputAlbum.value.trim() || null,
        playlist_group: inputGroup.value || null,
        playlist: inputPlaylist.value.trim() || null,
        direcao: inputDirecao.value.trim() || null,
        video_id: inputVideoId.value.trim() || null
    };

    btnSave.disabled = true;
    btnSave.innerText = "PROCESSANDO...";

    let error = null;

    if (id) {
        const { error: err } = await supabase.from('musicas_backup').update(formData).eq('id', id);
        error = err;
        if(!error) showMessage(`REGISTRO #${id} ATUALIZADO!`);
    } else {
        const { error: err } = await supabase.from('musicas_backup').insert([formData]);
        error = err;
        if(!error) showMessage("NOVO REGISTRO GRAVADO!");
    }

    if (error) {
        showMessage(`ERRO: ${error.message}`, true);
    } else {
        resetForm();
        fetchMusics(); // Recarrega tabela para mostrar alterações
        loadDatabaseFilterOptions(); // Recarrega filtros caso haja nova playlist/grupo
    }

    btnSave.disabled = false;
    btnSave.innerText = "GRAVAR DADOS";
});

// DELETE
window.deleteMusic = async (id) => {
    if(!confirm(`ATENÇÃO: Deletar registro #${id}? Esta ação é irreversível.`)) return;

    const { error } = await supabase.from('musicas_backup').delete().eq('id', id);

    if (error) {
        showMessage(`ERRO AO DELETAR: ${error.message}`, true);
    } else {
        showMessage(`REGISTRO #${id} APAGADO.`);
        fetchMusics(); // Recarrega tabela
    }
};

// --- UTILS ---

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

// --- EVENT LISTENERS (Server-Side Trigger) ---

// Busca com Debounce (espera usuario parar de digitar)
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        fetchMusics();
    }, 500);
});

// Filtros Dropdown (Disparam busca imediata)
filterGroupList.addEventListener('change', fetchMusics);
filterPlaylistList.addEventListener('change', fetchMusics);

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