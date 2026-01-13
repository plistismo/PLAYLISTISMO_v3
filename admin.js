import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

const musicForm = document.getElementById('music-form');
const tableBody = document.getElementById('table-body');
const totalCountLabel = document.getElementById('total-count');
const statusMsg = document.getElementById('status-msg');
const btnLogout = document.getElementById('btn-logout');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');
const btnNormalize = document.getElementById('btn-normalize');
const searchInput = document.getElementById('search-db');
const filterGroupList = document.getElementById('filter-group-list');
const filterPlaylistList = document.getElementById('filter-playlist-list');
const inputId = document.getElementById('music-id');
const inputArtista = document.getElementById('input-artista');
const inputMusica = document.getElementById('input-musica');
const inputAno = document.getElementById('input-ano');
const inputAlbum = document.getElementById('input-album');
const inputDirecao = document.getElementById('input-direcao');
const inputVideoId = document.getElementById('input-video-id');

let currentData = []; 
let debounceTimeout = null;
let lastUpdatedId = null; 

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        await loadDatabaseFilterOptions();
        await handleUrlContext(); 
        await fetchMusics(); 
    }
}

async function handleUrlContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const playlist = urlParams.get('playlist');
    const editId = urlParams.get('edit_id');
    if (playlist) filterPlaylistList.value = playlist;
    if (editId) {
        setTimeout(async () => {
            const { data } = await supabase.from('musicas_backup').select('*').eq('id', editId).single();
            if(data) editMusicData(data);
        }, 500);
    }
}

async function loadDatabaseFilterOptions() {
    const { data, error } = await supabase
        .from('playlists')
        .select('name, group_name')
        .order('name', { ascending: true })
        .limit(1000);
    if (error) return;
    const groups = [...new Set(data.map(item => item.group_name).filter(Boolean))].sort();
    const playlists = data.map(item => item.name).filter(Boolean);
    filterGroupList.innerHTML = '<option value="">TODOS OS GRUPOS</option>';
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g; opt.innerText = g;
        filterGroupList.appendChild(opt);
    });
    filterPlaylistList.innerHTML = '<option value="">TODAS AS PLAYLISTS</option>';
    playlists.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p; opt.innerText = p;
        filterPlaylistList.appendChild(opt);
    });
}

async function fetchMusics() {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-12 text-amber-500 animate-pulse uppercase tracking-[0.2em] text-xl">Sincronizando Banco de Dados Completo...</td></tr>';
    const searchTerm = searchInput.value.trim();
    const selectedGroup = filterGroupList.value;
    const selectedPlaylist = filterPlaylistList.value;

    let query = supabase
        .from('musicas_backup')
        .select('*', { count: 'exact' }) 
        .order('id', { ascending: false })
        .limit(10000); // FORÇANDO LIMITE MASSIVO PARA DESATIVAR PAGINAÇÃO

    if (selectedGroup) query = query.eq('playlist_group', selectedGroup);
    if (selectedPlaylist) query = query.eq('playlist', selectedPlaylist);
    if (searchTerm) {
        const term = `%${searchTerm}%`;
        query = query.or(`artista.ilike.${term},musica.ilike.${term},direcao.ilike.${term},id.eq.${Number(searchTerm) || 0}`);
    }

    const { data, error, count } = await query;
    if (error) {
        showMessage(`ERRO: ${error.message}`, true);
        return;
    }
    currentData = data || [];
    if (totalCountLabel) totalCountLabel.innerText = count || 0;
    renderTable(currentData);
}

function renderTable(data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-12 opacity-50 uppercase tracking-[0.2em] text-xl">Frequência Vazia.</td></tr>';
        return;
    }
    data.forEach(item => {
        const row = document.createElement('tr');
        const isUpdated = item.id == lastUpdatedId;
        row.className = `hover:bg-amber-900/10 transition-colors group border-b border-amber-900/10 ${isUpdated ? 'row-updated' : ''}`;
        row.innerHTML = `
            <td class="font-mono text-sm opacity-70 align-top border-r border-amber-900/30 px-2 text-center py-2">${item.id}</td>
            <td class="align-top border-r border-amber-900/30 px-2 py-2">
                <div class="font-bold text-lg leading-none text-[#00ff00] uppercase">${item.artista}</div>
                <div class="text-sm opacity-90">${item.musica || '---'}</div>
            </td>
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2">${item.album || '---'}</td>
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2 font-mono">${item.ano || '---'}</td>
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2 italic text-[#00ff00]">${item.direcao || '---'}</td>
            <td class="text-center align-middle px-2 py-2">
                <div class="flex justify-center gap-2">
                    <button onclick="editMusicById(${item.id})" class="text-amber-500 hover:bg-amber-500 hover:text-black px-2 py-1 border border-amber-500 text-sm font-bold uppercase">Edit</button>
                    <button onclick="deleteMusic(${item.id})" class="text-red-500 hover:bg-red-500 hover:text-black px-2 py-1 border border-red-500 text-sm font-bold uppercase">X</button>
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
    const titleEl = document.getElementById('form-title').querySelector('span');
    if (titleEl) titleEl.innerText = `EDITANDO #${music.id}`;
    btnSave.innerText = "ATUALIZAR DADOS";
}

musicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = inputId.value;
    const formData = {
        artista: inputArtista.value.trim(),
        musica: inputMusica.value.trim(),
        ano: inputAno.value ? String(inputAno.value) : null,
        album: inputAlbum.value.trim() || null,
        direcao: inputDirecao.value.trim() || null,
        video_id: inputVideoId.value.trim() || null
    };
    btnSave.disabled = true;
    btnSave.innerText = "Gravando...";
    let error = null;
    if (id) {
        const { error: err } = await supabase.from('musicas_backup').update(formData).eq('id', id);
        error = err;
    } else {
        const { data: inserted, error: err } = await supabase.from('musicas_backup').insert([formData]).select();
        error = err;
        if(!error && inserted) lastUpdatedId = inserted[0].id;
    }
    if (error) {
        showMessage(`Erro: ${error.message}`, true);
        btnSave.disabled = false;
        btnSave.innerText = "Gravar Dados";
    } else {
        showMessage("Sinal Gravado com Sucesso!");
        resetForm();
        fetchMusics();
    }
});

window.deleteMusic = async (id) => {
    if(!confirm(`Excluir registro #${id}?`)) return;
    const { error } = await supabase.from('musicas_backup').delete().eq('id', id);
    if (!error) fetchMusics();
};

function resetForm() {
    musicForm.reset();
    inputId.value = '';
    btnSave.disabled = false;
    btnSave.innerText = "Gravar Dados";
    const titleEl = document.getElementById('form-title').querySelector('span');
    if (titleEl) titleEl.innerText = 'NOVO REGISTRO';
}

function showMessage(msg, isError = false) {
    statusMsg.innerText = msg;
    statusMsg.classList.remove('hidden');
    setTimeout(() => statusMsg.classList.add('hidden'), 3000);
}

searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(fetchMusics, 500);
});
filterGroupList?.addEventListener('change', fetchMusics);
filterPlaylistList?.addEventListener('change', fetchMusics);
btnLogout?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
});
btnClear?.addEventListener('click', (e) => { e.preventDefault(); resetForm(); });
checkAuth();