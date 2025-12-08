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
const searchInput = document.getElementById('search-db');
const btnSave = document.getElementById('btn-save');

// Inputs
const inputId = document.getElementById('music-id');
const inputArtista = document.getElementById('input-artista');
const inputMusica = document.getElementById('input-musica');
const inputAno = document.getElementById('input-ano');
const inputAlbum = document.getElementById('input-album');
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
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4">LENDO MEMÓRIA...</td></tr>';
    
    const { data, error } = await supabase
        .from('musicas')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        showMessage(`ERRO DE LEITURA: ${error.message}`, true);
        return;
    }

    allMusics = data;
    renderTable(allMusics);
}

// 2. CREATE & UPDATE
musicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = inputId.value;
    const formData = {
        artista: inputArtista.value.trim(),
        musica: inputMusica.value.trim(),
        ano: inputAno.value ? parseInt(inputAno.value) : null,
        album: inputAlbum.value.trim() || null,
        direcao: inputDirecao.value.trim() || null,
        video_id: inputVideoId.value.trim() || null
    };

    btnSave.disabled = true;
    btnSave.innerText = "PROCESSANDO...";

    let error = null;

    if (id) {
        // UPDATE
        const { error: err } = await supabase.from('musicas').update(formData).eq('id', id);
        error = err;
        if(!error) showMessage(`REGISTRO #${id} ATUALIZADO COM SUCESSO!`);
    } else {
        // CREATE
        const { error: err } = await supabase.from('musicas').insert([formData]);
        error = err;
        if(!error) showMessage("NOVO REGISTRO GRAVADO!");
    }

    if (error) {
        showMessage(`ERRO: ${error.message}`, true);
    } else {
        resetForm();
        fetchMusics();
    }

    btnSave.disabled = false;
    btnSave.innerText = "GRAVAR DADOS";
});

// 3. DELETE
window.deleteMusic = async (id) => {
    if(!confirm(`ATENÇÃO: Deletar registro #${id}? Esta ação é irreversível.`)) return;

    const { error } = await supabase.from('musicas').delete().eq('id', id);

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
    if (!music) return;

    inputId.value = music.id;
    inputArtista.value = music.artista || '';
    inputMusica.value = music.musica || '';
    inputAno.value = music.ano || '';
    inputAlbum.value = music.album || '';
    inputDirecao.value = music.direcao || '';
    inputVideoId.value = music.video_id || '';

    document.getElementById('form-title').querySelector('span').innerText = `EDITANDO #${id}`;
    btnSave.innerText = "ATUALIZAR DADOS";
    
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- UTILS ---

function renderTable(data) {
    totalCount.innerText = data.length;
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 opacity-50">NENHUM DADO ENCONTRADO</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-amber-900/10 transition-colors group';
        row.innerHTML = `
            <td class="font-mono text-sm opacity-70 align-top">${item.id}</td>
            <td class="align-top">
                <div class="font-bold text-lg leading-none">${item.artista}</div>
                <div class="text-sm opacity-80">${item.musica || '---'}</div>
            </td>
            <td class="hidden md:table-cell text-sm opacity-60 align-top">
                ${item.album ? `💿 ${item.album}` : ''} <br>
                ${item.ano ? `📅 ${item.ano}` : ''}
            </td>
            <td class="hidden md:table-cell font-mono text-xs opacity-50 align-top">
                ${item.video_id ? item.video_id : '<span class="text-red-900">SEM ID</span>'}
            </td>
            <td class="text-center align-middle">
                <button onclick="editMusic(${item.id})" class="text-amber-500 hover:bg-amber-500 hover:text-black px-2 py-1 border border-amber-500 text-sm mr-1">EDIT</button>
                <button onclick="deleteMusic(${item.id})" class="text-red-500 hover:bg-red-500 hover:text-black px-2 py-1 border border-red-500 text-sm">DEL</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
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

// Search Filter
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allMusics.filter(m => 
        (m.artista && m.artista.toLowerCase().includes(term)) ||
        (m.musica && m.musica.toLowerCase().includes(term)) ||
        (m.id && m.id.toString().includes(term))
    );
    renderTable(filtered);
});

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