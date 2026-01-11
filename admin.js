
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
const btnExportPdf = document.getElementById('btn-export-pdf');

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
const inputPlaylist = document.getElementById('input-playlist');

let currentData = []; 
let debounceTimeout = null;
let isFromTV = false; // Flag para identificar se viemos do player da TV

// --- AUTH CHECK & INIT ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    } else {
        loadDatabaseFilterOptions();
        fetchMusics(); 
        checkUrlForEdit();
    }
}

async function loadDatabaseFilterOptions() {
    // Carrega todas as playlists disponíveis para os filtros
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

    let query = supabase
        .from('musicas_backup')
        .select('*')
        .order('id', { ascending: false });

    if (selectedGroup) {
        query = query.eq('playlist_group', selectedGroup);
    }

    if (selectedPlaylist) {
        query = query.eq('playlist', selectedPlaylist);
    }

    if (searchTerm) {
        const term = `%${searchTerm}%`;
        query = query.or(`artista.ilike.${term},musica.ilike.${term},direcao.ilike.${term},playlist.ilike.${term},id.eq.${Number(searchTerm) || 0}`);
    }

    query = query.limit(5000);

    const { data, error } = await query;

    if (error) {
        showMessage(`ERRO DE LEITURA: ${error.message}`, true);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500">ERRO: ${error.message}</td></tr>`;
        return;
    }

    currentData = data;
    renderTable(currentData);
}

async function checkUrlForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit_id');
    const fromParam = urlParams.get('from');
    
    if (fromParam === 'tv') isFromTV = true;

    if (editId) {
        let target = currentData.find(m => m.id == editId);
        if (!target) {
            showMessage(`LOCALIZANDO REGISTRO #${editId}...`);
            const { data } = await supabase.from('musicas_backup').select('*').eq('id', editId).single();
            target = data;
            if (target) {
                currentData.unshift(target);
                renderTable(currentData);
            }
        }
        if(target) {
            editMusicData(target);
            showMessage(`REGISTRO #${editId} PRONTO PARA EDIÇÃO.`);
            // Apenas remove os params da URL se não estivermos no fluxo "from tv"
            if (!isFromTV) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } else {
            showMessage(`REGISTRO #${editId} NÃO ENCONTRADO.`);
        }
    }
}

function renderTable(data) {
    totalCount.innerText = data.length + (data.length === 5000 ? "+" : ""); 
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
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2">
                <span class="text-amber-600 font-bold">${item.playlist || 'SEM PLAYLIST'}</span>
            </td>
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2 font-mono">
                ${item.ano || '---'}
            </td>
            <td class="text-sm opacity-80 align-top border-r border-amber-900/30 px-2 py-2 italic">
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
    if(music) {
        // Se clicar em EDIT na tabela, garantimos que não estamos no fluxo da TV
        isFromTV = false;
        editMusicData(music);
    }
};

function editMusicData(music) {
    inputId.value = music.id;
    inputArtista.value = music.artista || '';
    inputMusica.value = music.musica || '';
    inputAno.value = music.ano || ''; 
    inputAlbum.value = music.album || '';
    inputDirecao.value = music.direcao || '';
    inputVideo_id = inputVideoId.value = music.video_id || '';
    inputPlaylist.value = music.playlist || '';

    document.getElementById('form-title').querySelector('span').innerText = `EDITANDO #${music.id}`;
    btnSave.innerText = "ATUALIZAR DADOS";
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        video_id: inputVideoId.value.trim() || null,
        playlist: inputPlaylist.value.trim() || null
    };

    btnSave.disabled = true;
    btnSave.innerText = "PROCESSANDO...";

    let error = null;
    if (id) {
        const { error: err } = await supabase.from('musicas_backup').update(formData).eq('id', id);
        error = err;
    } else {
        const { error: err } = await supabase.from('musicas_backup').insert([formData]);
        error = err;
    }

    if (error) {
        showMessage(`ERRO: ${error.message}`, true);
        btnSave.disabled = false;
        btnSave.innerText = id ? "ATUALIZAR DADOS" : "GRAVAR DADOS";
    } else {
        // Atualizar resume state se houver dados suficientes
        let playlist = formData.playlist;
        let video_id = formData.video_id;

        if (playlist && video_id) {
            localStorage.setItem('tv_resume_state', JSON.stringify({
                playlist: playlist,
                videoId: video_id
            }));
        }
        
        if (isFromTV) {
            // Se veio do "Edit Video" da TV, mantém o redirecionamento
            showMessage("DADOS GRAVADOS! RETORNANDO À TV...", false);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1200);
        } else {
            // Se foi editado diretamente no Service Mode, permanece e atualiza a lista
            showMessage(id ? `REGISTRO #${id} ATUALIZADO!` : "NOVO REGISTRO GRAVADO!", false);
            resetForm();
            fetchMusics();
            loadDatabaseFilterOptions();
            btnSave.disabled = false;
            btnSave.innerText = "GRAVAR DADOS";
        }
    }
});

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

/**
 * EXPORTAÇÃO PARA PDF
 * Utiliza jsPDF + autoTable para gerar catálogo dos vídeos filtrados
 */
async function exportToPDF() {
    if (!currentData || currentData.length === 0) {
        showMessage("NENHUM DADO PARA EXPORTAR!", true);
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título e Header do PDF
    doc.setFontSize(22);
    doc.setTextColor(180, 83, 9); // Amber-700 approx
    doc.text('PLAYLISTISMO - DATABASE EXPORT', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleString('pt-BR');
    doc.text(`Relatório gerado em: ${dateStr}`, 14, 28);
    doc.text(`Total de registros: ${currentData.length}`, 14, 34);

    // Mapeamento dos dados para a tabela
    const rows = currentData.map(item => [
        item.id,
        item.artista,
        item.musica || '---',
        item.playlist || '---',
        item.ano || '---',
        item.direcao || '---'
    ]);

    // Geração da Tabela
    doc.autoTable({
        head: [['ID', 'ARTISTA', 'MÚSICA', 'PLAYLIST', 'ANO', 'DIREÇÃO']],
        body: rows,
        startY: 40,
        theme: 'striped',
        headStyles: { 
            fillColor: [180, 83, 9], // Cor sólida do header (Amber-700)
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
        },
        styles: { 
            fontSize: 8,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 15 },
            4: { cellWidth: 15 }
        },
        didDrawPage: function (data) {
            // Rodapé com número de página
            const str = "Página " + doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text(str, data.settings.margin.left, pageHeight - 10);
        }
    });

    // Salvar o arquivo
    const fileName = `playlistismo_export_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    showMessage("PDF GERADO COM SUCESSO!");
}

searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        fetchMusics();
    }, 500);
});

filterGroupList.addEventListener('change', fetchMusics);
filterPlaylistList.addEventListener('change', fetchMusics);

btnExportPdf.addEventListener('click', exportToPDF);

btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
});

btnClear.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
});

checkAuth();
