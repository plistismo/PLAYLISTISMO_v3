
import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';

const state = {
    isOn: false,
    isSearchOpen: false,
    isAdminOpen: false,
    channelsByCategory: {}, 
    currentChannelList: [], 
    currentIndex: 0,
    currentChannelName: '',
    groupsOrder: ['UPLOADS', 'GENRES', 'ZONES', 'ERAS', 'OTHERS'],
    currentGroupIndex: 0, 
    playerReady: false,
    currentVideoData: null, 
    isPlaying: false,
    isBumping: false,
    adminData: [],
    lastUpdatedId: null
};

let player; 

const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    tvStage: document.getElementById('tv-stage'),
    staticOverlay: document.getElementById('static-overlay'),
    bumpLayer: document.getElementById('bump-layer'),
    bumpContent: document.getElementById('bump-content'),
    playlistLabel: document.getElementById('tv-playlist-label'),
    osdLayer: document.getElementById('osd-layer'),
    videoCredits: document.getElementById('video-credits'),
    statusMsg: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    // Botões Físicos
    btnNextCh: document.getElementById('tv-ch-next'),
    btnPrevCh: document.getElementById('tv-ch-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    headerEditBtn: document.getElementById('header-edit-btn'),
    serviceModeBtn: document.getElementById('service-mode-btn'),
    adminHeader: document.getElementById('admin-panel-header'),
    // Admin Overlay
    adminPanel: document.getElementById('tv-admin-panel'),
    adminCloseBtn: document.getElementById('admin-close-btn'),
    adminStatusMsg: document.getElementById('admin-status-msg'),
    adminForm: document.getElementById('admin-music-form'),
    adminTableBody: document.getElementById('admin-table-body'),
    adminSearchDb: document.getElementById('admin-search-db'),
    adminFilterGroup: document.getElementById('admin-filter-group'),
    adminFilterPlaylist: document.getElementById('admin-filter-playlist'),
    adminFormTitle: document.getElementById('form-title-text'),
    adminFormClear: document.getElementById('admin-form-clear'),
    // Admin Inputs
    adminInputId: document.getElementById('admin-input-id'),
    adminInputArtista: document.getElementById('admin-input-artista'),
    adminInputMusica: document.getElementById('admin-input-musica'),
    adminInputAno: document.getElementById('admin-input-ano'),
    adminInputAlbum: document.getElementById('admin-input-album'),
    adminInputVideoId: document.getElementById('admin-input-video-id'),
    adminBtnSave: document.getElementById('admin-btn-save'),
    // Guide
    guideCloseBtn: document.getElementById('guide-close-btn'),
    guideClock: document.getElementById('guide-clock'),
    guideChannelList: document.getElementById('channel-guide-container'),
    guideSearch: document.getElementById('channel-search'),
    guideNpPlaylist: document.getElementById('np-playlist'),
    guideNowPlayingBox: document.getElementById('guide-now-playing'),
    gnpArtist: document.getElementById('gnp-artist'),
    gnpSong: document.getElementById('gnp-song'),
    speakerGrids: document.querySelectorAll('.speaker-grid')
};

async function init() {
    populateSpeakers();
    startClocks();
    setupEventListeners();
    
    supabase.auth.getSession().then(({ data: { session } }) => {
        checkAdminAccess(session);
    });

    loadYouTubeAPI();
    
    try {
        await fetchGuideData();
    } catch (e) {
        console.error("Erro ao carregar dados do guia:", e);
    }
}

function populateSpeakers() {
    els.speakerGrids.forEach(grid => {
        if (!grid) return;
        grid.innerHTML = '';
        for(let i=0; i<40; i++) {
            const div = document.createElement('div');
            grid.appendChild(div);
        }
    });
}

function checkAdminAccess(session) {
    if (session?.user?.id === ADMIN_UID) {
        if(els.adminHeader) els.adminHeader.classList.remove('hidden');
        loadAdminFilters();
    } else {
        if(els.adminHeader) els.adminHeader.classList.add('hidden');
    }
}

function startClocks() {
    setInterval(() => {
        const now = new Date();
        if(els.guideClock) els.guideClock.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }, 1000);
}

function getThematicSetup(name) {
    const n = name.toUpperCase();
    if (n.includes('RIDE') || n.includes('DRIVE') || n.includes('SPEED')) return { bumpClass: 'bump-chrome', logo: '🏎️ SPEED' };
    if (n.includes('HIP') || n.includes('RAP') || n.includes('STREET')) return { bumpClass: 'bump-urban', logo: '🖍️ STREET' };
    if (n.includes('ROCK') || n.includes('METAL') || n.includes('PUNK')) return { bumpClass: 'bump-noise', logo: '🤘 RAW' };
    if (n.includes('TECH') || n.includes('DIGITAL') || n.includes('UPLOAD')) return { bumpClass: 'bump-cyber', logo: '📡 DATA' };
    return { bumpClass: 'bump-noise', logo: '📺 TV' };
}

function triggerBump(playlistName) {
    if (state.isBumping || !state.isOn) return;
    state.isBumping = true;
    const setup = getThematicSetup(playlistName);
    const parts = playlistName.split(':');
    const title = parts.length > 1 ? parts[1].trim() : parts[0].trim();

    els.bumpContent.innerHTML = `<div class="bump-ident ${setup.bumpClass}"><div class="text-[clamp(1rem,3vmin,1.5rem)] opacity-60 mb-6 font-vt323 tracking-widest">${setup.logo}</div><div class="main-title font-black uppercase tracking-tighter text-white text-5xl">${title}</div></div>`;
    els.bumpLayer.classList.remove('hidden');
    els.bumpLayer.classList.add('bump-active');

    setTimeout(() => {
        els.bumpLayer.classList.add('hidden');
        els.bumpLayer.classList.remove('bump-active');
        state.isBumping = false;
    }, 1500);
}

function updatePlaylistOSD(name) {
    if (!els.playlistLabel) return;
    const setup = getThematicSetup(name);
    const parts = name.split(':');
    els.playlistLabel.className = `osd-futuristic ${setup.bumpClass}`;
    if (parts.length > 1) {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">${parts[0].trim()}:</div><div class="osd-line-2">${parts[1].trim()}</div>`;
    } else {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">${name}</div>`;
    }
}

function loadYouTubeAPI() {
    if (window.YT) return;
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('player', {
        height: '100%', width: '100%',
        playerVars: { 'controls': 0, 'modestbranding': 1, 'rel': 0, 'iv_load_policy': 3, 'enablejsapi': 1 },
        events: {
            'onReady': () => { state.playerReady = true; if(state.isOn) playCurrentVideo(); },
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        state.isPlaying = true;
        hideStatus();
        updateCreditsInfo(state.currentVideoData);
        startCreditsMonitor();
    } else if (event.data === YT.PlayerState.ENDED) {
        handleVideoEnd();
    }
}

function startCreditsMonitor() {
    if (window.creditsInterval) clearInterval(window.creditsInterval);
    window.creditsInterval = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== 'function') return;
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        const showCredits = (cur >= 10 && cur < 20) || (dur > 30 && cur >= (dur - 20) && cur < (dur - 10));
        els.videoCredits.classList.toggle('visible', showCredits);
        els.playlistLabel.classList.toggle('visible', (cur >= 1.5 && cur < dur));
    }, 1000);
}

function handleVideoEnd() {
    // Se o Admin estiver aberto, o vídeo entra em LOOP
    if (state.isAdminOpen) {
        player.seekTo(0);
        player.playVideo();
    } else {
        if (state.isBumping) return;
        triggerBump(state.currentChannelName);
        state.currentIndex = (state.currentIndex + 1) % state.currentChannelList.length;
        playCurrentVideo();
    }
}

async function loadChannelContent(playlistName, targetId = null) {
    showStatic(500);
    state.currentChannelName = playlistName;
    updatePlaylistOSD(playlistName);
    triggerBump(playlistName);

    const { data } = await supabase.from('musicas_backup').select('*').eq('playlist', playlistName).order('id', { ascending: false });
    if (!data?.length) return;

    state.currentChannelList = targetId ? data : fisherYatesShuffle([...data]);
    state.currentIndex = targetId ? data.findIndex(v => v.video_id === targetId) : 0;
    if (state.currentIndex === -1) state.currentIndex = 0;

    playCurrentVideo();
}

function playCurrentVideo() {
    const video = state.currentChannelList[state.currentIndex];
    if (!video || !player || !state.playerReady) return;
    state.currentVideoData = video;
    player.loadVideoById(video.video_id);
    updateGuideNowPlaying();
    
    // Se o painel admin estiver aberto, sincroniza o formulário automaticamente se estiver em modo de edição de clipe atual
    if (state.isAdminOpen && els.adminFormTitle.innerText === 'EDITAR VÍDEO ATUAL') {
        fillAdminForm(video);
    }
}

async function changeChannel(direction) {
    if (!state.isOn || !state.currentChannelName) return;
    const group = state.groupsOrder[state.currentGroupIndex];
    const playlists = state.channelsByCategory[group];
    let idx = playlists.findIndex(pl => pl.name === state.currentChannelName);
    idx = (idx + direction + playlists.length) % playlists.length;
    await loadChannelContent(playlists[idx].name);
}

function togglePower() {
    state.isOn = !state.isOn;
    updateTVVisualState();
    if (state.isOn) {
        if (!state.currentChannelName) loadDefaultChannel();
        else player?.playVideo();
        showOSD();
    } else {
        player?.pauseVideo();
    }
}

function updateTVVisualState() {
    els.screenOff.classList.toggle('hidden', state.isOn);
    els.screenOn.classList.toggle('hidden', !state.isOn);
    els.powerLed.classList.toggle('bg-red-500', state.isOn);
    if (state.isOn) els.screenOn.classList.add('crt-turn-on');
}

async function loadDefaultChannel() {
    const allPlaylists = [];
    Object.values(state.channelsByCategory).forEach(list => list.forEach(pl => allPlaylists.push(pl.name)));
    if (allPlaylists.length > 0) {
        const randomPlaylist = allPlaylists[Math.floor(Math.random() * allPlaylists.length)];
        loadChannelContent(randomPlaylist);
    }
}

function showOSD() { if(els.osdLayer) els.osdLayer.style.opacity = 1; }
function hideStatus() { if(els.statusMsg) els.statusMsg.classList.add('hidden'); }
function showStatic(dur) { if(els.staticOverlay) els.staticOverlay.classList.add('active'); setTimeout(() => els.staticOverlay.classList.remove('active'), dur); }

function updateCreditsInfo(data) {
    if (!data) return;
    els.credArtist.innerText = data.artista;
    els.credSong.innerText = data.musica;
    document.getElementById('album-name').innerText = data.album || '---';
    document.getElementById('release-year').innerText = data.ano || '---';
    document.getElementById('director-name').innerText = data.direcao || '---';
}

async function fetchGuideData() {
    const { data } = await supabase.from('playlists').select('*').order('name');
    if (data) {
        state.channelsByCategory = data.reduce((acc, curr) => {
            const g = curr.group_name || 'OTHERS';
            if (!acc[g]) acc[g] = [];
            acc[g].push(curr);
            return acc;
        }, {});
        renderGuide();
    }
}

function renderGuide() {
    if(!els.guideChannelList) return;
    els.guideChannelList.innerHTML = '';
    state.groupsOrder.forEach(cat => {
        if (!state.channelsByCategory[cat]) return;
        const groupWrapper = document.createElement('div');
        groupWrapper.className = 'guide-group mb-1 overflow-hidden';
        const header = document.createElement('button');
        header.className = 'guide-cat-header w-full flex justify-between items-center bg-[#0000aa] p-3 text-white font-bold uppercase';
        header.innerHTML = `<span>${cat}</span>`;
        const listContainer = document.createElement('div');
        listContainer.className = 'guide-cat-content hidden flex flex-col bg-black/40';
        state.channelsByCategory[cat].forEach(pl => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left p-2 px-6 text-gray-300 hover:bg-[#ffff00] hover:text-[#0000aa] border-b border-white/5 uppercase';
            btn.innerText = pl.name;
            btn.onclick = () => { loadChannelContent(pl.name); toggleGuide(); };
            listContainer.appendChild(btn);
        });
        header.onclick = () => {
            const hidden = listContainer.classList.contains('hidden');
            document.querySelectorAll('.guide-cat-content').forEach(el => el.classList.add('hidden'));
            if(hidden) listContainer.classList.remove('hidden');
        };
        groupWrapper.appendChild(header);
        groupWrapper.appendChild(listContainer);
        els.guideChannelList.appendChild(groupWrapper);
    });
}

function updateGuideNowPlaying() {
    const data = state.currentVideoData;
    if (data) {
        els.gnpArtist.innerText = data.artista;
        els.gnpSong.innerText = data.musica;
        els.guideNpPlaylist.innerText = `CHANNEL: ${state.currentChannelName}`;
        els.guideNowPlayingBox.classList.remove('hidden');
    }
}

function toggleGuide() {
    state.isSearchOpen = !state.isSearchOpen;
    if(state.isSearchOpen && state.isAdminOpen) toggleAdmin();
    document.body.classList.toggle('guide-active', state.isSearchOpen);
}

function toggleAdmin(mode = 'SERVICE') {
    state.isAdminOpen = !state.isAdminOpen;
    if(state.isAdminOpen && state.isSearchOpen) toggleGuide();
    document.body.classList.toggle('admin-active', state.isAdminOpen);

    if (state.isAdminOpen) {
        if (mode === 'EDIT' && state.currentVideoData) {
            els.adminFormTitle.innerText = 'EDITAR VÍDEO ATUAL';
            fillAdminForm(state.currentVideoData);
        } else {
            els.adminFormTitle.innerText = 'SERVICE MODE';
            resetAdminForm();
        }
        
        // Sincroniza filtros da tabela com a playlist atual ao abrir
        if (state.currentChannelName) {
            els.adminFilterPlaylist.value = state.currentChannelName;
        }
        fetchAdminMusics();
    }
}

// --- ADMIN PANEL LOGIC ---

async function loadAdminFilters() {
    const { data } = await supabase.from('playlists').select('name, group_name').order('name');
    if (!data) return;

    const groups = [...new Set(data.map(i => i.group_name))].sort();
    els.adminFilterGroup.innerHTML = '<option value="">TODOS OS GRUPOS</option>';
    groups.forEach(g => els.adminFilterGroup.innerHTML += `<option value="${g}">${g}</option>`);

    els.adminFilterPlaylist.innerHTML = '<option value="">TODAS AS PLAYLISTS</option>';
    data.forEach(p => els.adminFilterPlaylist.innerHTML += `<option value="${p.name}">${p.name}</option>`);
}

async function fetchAdminMusics() {
    els.adminTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center opacity-50">BUSCANDO...</td></tr>';
    const term = els.adminSearchDb.value.trim();
    const group = els.adminFilterGroup.value;
    const playlist = els.adminFilterPlaylist.value;

    let query = supabase.from('musicas_backup').select('id, artista, musica, video_id').order('id', { ascending: false }).limit(100);
    if (group) query = query.eq('playlist_group', group);
    if (playlist) query = query.eq('playlist', playlist);
    if (term) query = query.or(`artista.ilike.%${term}%,musica.ilike.%${term}%`);

    const { data } = await query;
    state.adminData = data || [];
    renderAdminTable();
}

function renderAdminTable() {
    els.adminTableBody.innerHTML = '';
    state.adminData.forEach(item => {
        const row = document.createElement('tr');
        row.className = `border-b border-amber-900/10 hover:bg-amber-900/10 transition-colors ${item.id == state.lastUpdatedId ? 'row-updated' : ''}`;
        row.innerHTML = `
            <td class="p-2 opacity-50 font-mono">${item.id}</td>
            <td class="p-2">
                <div class="font-bold text-amber-500">${item.artista}</div>
                <div class="text-[10px] opacity-70">${item.musica || '---'}</div>
            </td>
            <td class="p-2 text-center">
                <button onclick="window.editAdminItem(${item.id})" class="text-[10px] border border-amber-600 px-2 py-1 hover:bg-amber-600 hover:text-black">EDIT</button>
            </td>
        `;
        els.adminTableBody.appendChild(row);
    });
}

window.editAdminItem = async (id) => {
    const item = state.adminData.find(i => i.id == id);
    if (item) {
        const { data } = await supabase.from('musicas_backup').select('*').eq('id', id).single();
        fillAdminForm(data);
        els.adminFormTitle.innerText = `EDITANDO #${id}`;
        els.adminPanel.querySelector('.flex-1').scrollTo({ top: 0, behavior: 'smooth' });
    }
};

function fillAdminForm(data) {
    els.adminInputId.value = data.id;
    els.adminInputArtista.value = data.artista || '';
    els.adminInputMusica.value = data.musica || '';
    els.adminInputAno.value = data.ano || '';
    els.adminInputAlbum.value = data.album || '';
    els.adminInputVideoId.value = data.video_id || '';
    els.adminBtnSave.innerText = "ATUALIZAR DADOS";
}

function resetAdminForm() {
    els.adminForm.reset();
    els.adminInputId.value = '';
    els.adminBtnSave.innerText = "GRAVAR DADOS";
}

function showAdminMsg(msg, isError = false) {
    els.adminStatusMsg.innerText = msg;
    els.adminStatusMsg.classList.remove('hidden', 'bg-red-900', 'bg-amber-900/20');
    els.adminStatusMsg.classList.add(isError ? 'bg-red-900' : 'bg-amber-900/20');
    setTimeout(() => els.adminStatusMsg.classList.add('hidden'), 3000);
}

// --- SHARED LOGIC ---

function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function setupEventListeners() {
    els.tvPowerBtn.onclick = togglePower;
    els.btnSearch.onclick = toggleGuide;
    els.guideCloseBtn.onclick = toggleGuide;
    els.adminCloseBtn.onclick = () => toggleAdmin();
    
    els.serviceModeBtn.onclick = () => toggleAdmin('SERVICE');
    els.headerEditBtn.onclick = () => toggleAdmin('EDIT');

    els.adminFormClear.onclick = (e) => { e.preventDefault(); resetAdminForm(); els.adminFormTitle.innerText = 'NOVO REGISTRO'; };

    els.btnNextCh.onclick = () => changeChannel(1);
    els.btnPrevCh.onclick = () => changeChannel(-1);

    els.adminSearchDb.oninput = () => {
        clearTimeout(window.adminSearchTimeout);
        window.adminSearchTimeout = setTimeout(fetchAdminMusics, 500);
    };
    els.adminFilterGroup.onchange = fetchAdminMusics;
    els.adminFilterPlaylist.onchange = fetchAdminMusics;

    els.adminForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = els.adminInputId.value;
        const formData = {
            artista: els.adminInputArtista.value.trim(),
            musica: els.adminInputMusica.value.trim(),
            ano: els.adminInputAno.value || null,
            album: els.adminInputAlbum.value.trim() || null,
            video_id: els.adminInputVideoId.value.trim() || null
        };

        els.adminBtnSave.disabled = true;
        els.adminBtnSave.innerText = "SALVANDO...";

        let error;
        let finalId = id;

        if (id) {
            const { error: err } = await supabase.from('musicas_backup').update(formData).eq('id', id);
            error = err;
        } else {
            const { data, error: err } = await supabase.from('musicas_backup').insert([formData]).select();
            error = err;
            if(data) finalId = data[0].id;
        }

        if (error) {
            showAdminMsg(`ERRO: ${error.message}`, true);
        } else {
            state.lastUpdatedId = finalId;
            showAdminMsg(`REGISTRO #${finalId} SALVO COM SUCESSO!`);
            
            // Se salvamos o vídeo ATUAL da TV, atualizamos o estado local para refletir a mudança sem recarregar
            if (state.currentVideoData && state.currentVideoData.id == finalId) {
                state.currentVideoData = { ...state.currentVideoData, ...formData };
                updateCreditsInfo(state.currentVideoData);
            }

            await fetchAdminMusics();
        }
        els.adminBtnSave.disabled = false;
        els.adminBtnSave.innerText = id ? "ATUALIZAR DADOS" : "GRAVAR DADOS";
    };

    els.guideSearch.addEventListener('input', (e) => {
        const term = e.target.value.toUpperCase();
        document.querySelectorAll('.guide-group').forEach(group => {
            let visible = false;
            group.querySelectorAll('.guide-cat-content button').forEach(btn => {
                const match = btn.innerText.toUpperCase().includes(term);
                btn.classList.toggle('hidden', !match);
                if(match) visible = true;
            });
            group.classList.toggle('hidden', !visible && term !== '');
        });
    });
}

init();
