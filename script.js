
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
    adminMusics: [],
    lastUpdatedId: null
};

let player; 

const els = {
    appViewport: document.getElementById('app-viewport'),
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
    btnNextGrp: document.getElementById('tv-grp-next'),
    btnPrevGrp: document.getElementById('tv-grp-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    headerEditBtn: document.getElementById('header-edit-btn'),
    serviceModeBtn: document.getElementById('service-mode-btn'),
    adminHeader: document.getElementById('admin-panel-header'),
    // Admin Panel
    adminPanel: document.getElementById('tv-admin-panel'),
    adminCloseBtn: document.getElementById('admin-close-btn'),
    adminForm: document.getElementById('admin-music-form'),
    adminTableBody: document.getElementById('admin-table-body'),
    adminSearchDb: document.getElementById('admin-search-db'),
    adminFilterGroup: document.getElementById('admin-filter-group'),
    adminFilterPlaylist: document.getElementById('admin-filter-playlist'),
    adminStatusMsg: document.getElementById('admin-status-msg'),
    adminFormTitle: document.getElementById('form-title-text'),
    adminFormClear: document.getElementById('admin-form-clear'),
    // Admin Inputs
    adminInputId: document.getElementById('admin-input-id'),
    adminInputArtista: document.getElementById('admin-input-artista'),
    adminInputMusica: document.getElementById('admin-input-musica'),
    adminInputAno: document.getElementById('admin-input-ano'),
    adminInputAlbum: document.getElementById('admin-input-album'),
    adminInputDirecao: document.getElementById('admin-input-direcao'),
    adminInputVideoId: document.getElementById('admin-input-video-id'),
    adminBtnSave: document.getElementById('admin-btn-save'),
    adminBtnPreview: document.getElementById('admin-btn-preview'),

    // Créditos
    credArtist: document.getElementById('artist-name'),
    credSong: document.getElementById('song-name'),
    credAlbum: document.getElementById('album-name'),
    credYear: document.getElementById('release-year'),
    credDirector: document.getElementById('director-name'),
    // Guide
    guideCloseBtn: document.getElementById('guide-close-btn'),
    guideClock: document.getElementById('guide-clock'),
    guideChannelList: document.getElementById('channel-guide-container'),
    guideSearch: document.getElementById('channel-search'),
    guideNpPlaylist: document.getElementById('np-playlist'),
    guideNowPlayingBox: document.getElementById('guide-now-playing'),
    // Guide Now Playing Info
    gnpArtist: document.getElementById('gnp-artist'),
    gnpSong: document.getElementById('gnp-song'),
    gnpAlbum: document.getElementById('gnp-album'),
    gnpYear: document.getElementById('gnp-year'),
    gnpDirector: document.getElementById('gnp-director'),

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
        checkResumeState();
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
    if (n.includes('RIDE') || n.includes('DRIVE') || n.includes('SPEED') || n.includes('CAR')) return { theme: 'ride', bumpClass: 'bump-chrome', logo: '🏎️ SPEED' };
    if (n.includes('HIP') || n.includes('RAP') || n.includes('STREET') || n.includes('RHYMES')) return { theme: 'street', bumpClass: 'bump-urban', logo: '🖍️ STREET' };
    if (n.includes('ROCK') || n.includes('METAL') || n.includes('PUNK') || n.includes('NOISE')) return { theme: 'noise', bumpClass: 'bump-noise', logo: '🤘 RAW' };
    if (n.includes('TECH') || n.includes('DIGITAL') || n.includes('CYBER') || n.includes('UPLOAD')) return { theme: 'cyber', bumpClass: 'bump-cyber', logo: '📡 DATA' };
    return { theme: 'default', bumpClass: 'bump-noise', logo: '📺 TV' };
}

function triggerBump(playlistName) {
    if (state.isBumping || !state.isOn) return;
    state.isBumping = true;
    const setup = getThematicSetup(playlistName);
    const parts = playlistName.split(':');
    const title = parts.length > 1 ? parts[1].trim() : parts[0].trim();

    els.bumpContent.innerHTML = `
        <div class="bump-ident ${setup.bumpClass}">
            <div class="text-[clamp(1rem,3vmin,1.5rem)] opacity-60 mb-6 font-vt323 tracking-widest">${setup.logo}</div>
            <div class="main-title font-black uppercase tracking-tighter">${title}</div>
        </div>
    `;
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
    if (name.length > 20) els.playlistLabel.classList.add('osd-compact');
    
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
        playerVars: { 
            'controls': 0, 
            'modestbranding': 1, 
            'rel': 0, 
            'iv_load_policy': 3, 
            'enablejsapi': 1,
            'showinfo': 0,
            'disablekb': 1,
            'fs': 0
        },
        events: {
            'onReady': () => { 
                state.playerReady = true; 
                if(state.isOn) playCurrentVideo(); 
            },
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
    } else if (event.data === YT.PlayerState.BUFFERING) {
        showStatus("TUNING...");
    }
}

function startCreditsMonitor() {
    if (window.creditsInterval) clearInterval(window.creditsInterval);
    window.creditsInterval = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== 'function') return;
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        
        if (dur <= 0) return;

        const showCredits = (cur >= 10 && cur < 20) || 
                           (dur > 30 && cur >= (dur - 20) && cur < (dur - 10));
        
        if(els.videoCredits) els.videoCredits.classList.toggle('visible', showCredits);
        const showPlaylist = (cur >= 1.5 && cur < dur);
        if(els.playlistLabel) els.playlistLabel.classList.toggle('visible', showPlaylist);
    }, 1000);
}

async function loadChannelContent(playlistName, targetId = null) {
    showStatic(500);
    state.currentChannelName = playlistName;
    updatePlaylistOSD(playlistName);
    triggerBump(playlistName);

    // FIX: Tabela musicas
    const { data } = await supabase.from('musicas').select('*').eq('playlist', playlistName).order('id', { ascending: false });
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
}

function handleVideoEnd() {
    if (state.isAdminOpen) {
        player.seekTo(0);
        player.playVideo();
        return;
    }
    if (state.isBumping) return;
    triggerBump(state.currentChannelName);
    state.currentIndex = (state.currentIndex + 1) % state.currentChannelList.length;
    playCurrentVideo();
}

async function changeGroup(direction) {
    if (!state.isOn) return;
    state.currentGroupIndex = (state.currentGroupIndex + direction + state.groupsOrder.length) % state.groupsOrder.length;
    const groupName = state.groupsOrder[state.currentGroupIndex];
    showStatus(`GROUP: ${groupName}`);
    const playlists = state.channelsByCategory[groupName];
    if (playlists?.length) await loadChannelContent(playlists[0].name);
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
        if(els.playlistLabel) els.playlistLabel.classList.remove('visible');
    }
}

function updateTVVisualState() {
    els.screenOff.classList.toggle('hidden', state.isOn);
    els.screenOn.classList.toggle('hidden', !state.isOn);
    els.powerLed.classList.toggle('bg-red-500', state.isOn);
    els.powerLed.classList.toggle('shadow-[0_0_8px_#ff0000]', state.isOn);
    
    if (state.isOn) {
        els.screenOn.classList.add('crt-turn-on');
    } else {
        els.screenOn.classList.remove('crt-turn-on');
    }
}

async function loadDefaultChannel() {
    const allPlaylists = [];
    Object.values(state.channelsByCategory).forEach(list => {
        list.forEach(pl => allPlaylists.push(pl.name));
    });

    if (allPlaylists.length > 0) {
        const randomPlaylist = allPlaylists[Math.floor(Math.random() * allPlaylists.length)];
        const cat = Object.keys(state.channelsByCategory).find(k => 
            state.channelsByCategory[k].some(p => p.name === randomPlaylist)
        );
        state.currentGroupIndex = state.groupsOrder.indexOf(cat);
        loadChannelContent(randomPlaylist);
    }
}

function showOSD() {
    if(!els.osdLayer) return;
    els.osdLayer.style.opacity = 1;
}

function showStatus(text) {
    if(!els.statusText || !els.statusMsg) return;
    els.statusText.innerText = text;
    els.statusMsg.classList.remove('hidden');
    setTimeout(hideStatus, 3000);
}
function hideStatus() { if(els.statusMsg) els.statusMsg.classList.add('hidden'); }
function showStatic(dur) { if(els.staticOverlay) els.staticOverlay.classList.add('active'); setTimeout(() => els.staticOverlay.classList.remove('active'), dur); }

function updateCreditsInfo(data) {
    if (!data) return;

    const formatSpecialChars = (text) => {
        if (!text) return '';
        return String(text).replace(/(ft\.|&)/gi, '<span class="font-normal">$1</span>');
    };

    const fields = [
        { el: els.credArtist, val: data.artista, format: true },
        { el: els.credSong, val: data.musica, format: false },
        { el: els.credAlbum, val: data.album, format: false },
        { el: els.credYear, val: data.ano, format: false },
        { el: els.credDirector, val: data.direcao, format: true }
    ];

    fields.forEach(field => {
        if (!field.el) return;
        const line = field.el.closest('.credit-line');
        const hasContent = field.val && String(field.val).trim() !== '';
        if (hasContent) {
            if (line) line.classList.remove('hidden');
            if (field.format) {
                field.el.innerHTML = formatSpecialChars(field.val);
            } else {
                field.el.innerText = field.val;
            }
        } else {
            if (line) line.classList.add('hidden');
        }
    });
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
        header.className = 'guide-cat-header w-full flex justify-between items-center bg-[#0000aa] p-3 text-white font-bold border-b border-white/20 uppercase text-lg transition-all hover:bg-[#0000ff]';
        header.innerHTML = `<span>${cat}</span> <span class="arrow text-xs transition-transform transform">▼</span>`;

        const listContainer = document.createElement('div');
        listContainer.className = 'guide-cat-content hidden flex flex-col bg-black/40';

        state.channelsByCategory[cat].forEach(pl => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left p-2.5 px-6 text-gray-300 hover:bg-[#ffff00] hover:text-[#0000aa] border-b border-white/5 uppercase text-sm font-vt323 transition-colors';
            btn.innerText = pl.name;
            btn.onclick = (e) => { 
                e.stopPropagation();
                loadChannelContent(pl.name); 
                toggleGuide(); 
            };
            listContainer.appendChild(btn);
        });

        header.onclick = () => {
            const isCurrentlyHidden = listContainer.classList.contains('hidden');
            document.querySelectorAll('.guide-cat-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.guide-cat-header').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.guide-cat-header .arrow').forEach(el => el.classList.remove('rotate-180'));

            if (isCurrentlyHidden) {
                listContainer.classList.remove('hidden');
                header.classList.add('active');
                header.querySelector('.arrow').classList.add('rotate-180');
            }
        };

        groupWrapper.appendChild(header);
        groupWrapper.appendChild(listContainer);
        els.guideChannelList.appendChild(groupWrapper);
    });
}

function applySmartMarquee(element, text) {
    if (!element) return;
    const container = element.parentElement;
    if (!container) return;
    element.classList.remove('marquee-active');
    element.style.animationDuration = '0s';
    if (!text) { element.innerText = '--'; return; }
    element.innerText = text;
    requestAnimationFrame(() => {
        const textWidth = element.scrollWidth;
        const containerWidth = container.offsetWidth;
        if (textWidth > containerWidth) {
            const separator = " // ";
            element.innerText = text + separator + text + separator;
            const duration = (element.scrollWidth / 40);
            element.style.animationDuration = `${duration}s`;
            element.classList.add('marquee-active');
        } else {
            element.innerText = text;
        }
    });
}

function updateGuideNowPlaying() {
    const data = state.currentVideoData;
    if (data && els.guideNpPlaylist) {
        applySmartMarquee(els.gnpArtist, data.artista);
        applySmartMarquee(els.gnpSong, data.musica);
        applySmartMarquee(els.gnpAlbum, data.album);
        applySmartMarquee(els.gnpYear, data.ano ? String(data.ano) : '');
        applySmartMarquee(els.gnpDirector, data.direcao);
        const rows = ['gnpArtist', 'gnpSong', 'gnpAlbum', 'gnpYear', 'gnpDirector'];
        rows.forEach(r => {
            const rowEl = document.getElementById(`${r}-row`);
            if(rowEl) rowEl.classList.toggle('hidden', !data[r === 'gnpYear' ? 'ano' : r.replace('gnp', '').toLowerCase()]);
        });
        els.guideNpPlaylist.innerText = `CHANNEL: ${state.currentChannelName}`;
        els.guideNowPlayingBox.classList.remove('hidden');
    } else if(els.guideNowPlayingBox) {
        els.guideNowPlayingBox.classList.add('hidden');
    }
}

function toggleGuide() {
    state.isSearchOpen = !state.isSearchOpen;
    if (state.isSearchOpen && state.isAdminOpen) toggleAdmin(false);
    document.body.classList.toggle('guide-active', state.isSearchOpen);
}

function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function checkResumeState() {
    const saved = localStorage.getItem('tv_resume_state');
    if (saved) {
        try {
            const { playlist, videoId } = JSON.parse(saved);
            localStorage.removeItem('tv_resume_state');
            state.isOn = true;
            updateTVVisualState();
            loadChannelContent(playlist, videoId);
        } catch (e) {
            console.error("Erro no resume state:", e);
        }
    }
}

// --- ADMIN LOGIC ---

function toggleAdmin(open = null, mode = 'SERVICE') {
    state.isAdminOpen = open !== null ? open : !state.isAdminOpen;
    if (state.isAdminOpen && state.isSearchOpen) toggleGuide();
    document.body.classList.toggle('admin-active', state.isAdminOpen);
    
    if (state.isAdminOpen) {
        if (mode === 'EDIT' && state.currentVideoData) {
            editMusicData(state.currentVideoData);
            els.adminFormTitle.innerText = "EDITAR VÍDEO ATUAL";
            if (state.currentChannelName) els.adminFilterPlaylist.value = state.currentChannelName;
        } else {
            resetAdminForm();
            els.adminFormTitle.innerText = "SERVICE MODE";
        }
        fetchAdminMusics();
    } else {
        // Ao fechar, reinicia vídeo editado
        if (player && typeof player.seekTo === 'function') {
            player.seekTo(0);
            player.playVideo();
        }
    }
}

async function loadAdminFilters() {
    const { data } = await supabase.from('playlists').select('name, group_name').order('name');
    if (!data) return;
    const groups = [...new Set(data.map(i => i.group_name).filter(Boolean))].sort();
    els.adminFilterGroup.innerHTML = '<option value="">TODOS OS GRUPOS</option>';
    groups.forEach(g => els.adminFilterGroup.innerHTML += `<option value="${g}">${g}</option>`);
    els.adminFilterPlaylist.innerHTML = '<option value="">TODAS AS PLAYLISTS</option>';
    data.forEach(p => els.adminFilterPlaylist.innerHTML += `<option value="${p.name}">${p.name}</option>`);
}

async function fetchAdminMusics() {
    els.adminTableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-amber-500 animate-pulse">BUSCANDO...</td></tr>';
    const term = els.adminSearchDb.value.trim();
    const group = els.adminFilterGroup.value;
    const playlist = els.adminFilterPlaylist.value;
    // FIX: Tabela musicas
    let query = supabase.from('musicas').select('id, artista, musica, direcao, ano, album, video_id, playlist').order('id', { ascending: false }).limit(50);
    if (group) query = query.eq('playlist_group', group);
    if (playlist) query = query.eq('playlist', playlist);
    if (term) query = query.or(`artista.ilike.%${term}%,musica.ilike.%${term}%`);
    const { data } = await query;
    state.adminMusics = data || [];
    renderAdminTable();
}

function renderAdminTable() {
    els.adminTableBody.innerHTML = '';
    state.adminMusics.forEach(item => {
        const row = document.createElement('tr');
        const isUpdated = item.id == state.lastUpdatedId;
        row.className = `hover:bg-amber-900/10 transition-colors border-b border-amber-900/10 ${isUpdated ? 'row-updated' : ''}`;
        row.innerHTML = `
            <td class="p-2 font-mono opacity-50 text-[10px]">${item.id}</td>
            <td class="p-2">
                <div class="font-bold text-amber-500 leading-tight">${item.artista}</div>
                <div class="text-[9px] opacity-70">${item.musica || '---'}</div>
            </td>
            <td class="p-2 text-center">
                <button onclick="window.editAdminItem(${item.id})" class="text-[10px] border border-amber-500 px-2 py-0.5 hover:bg-amber-500 hover:text-black">EDIT</button>
            </td>
        `;
        els.adminTableBody.appendChild(row);
    });
}

window.editAdminItem = (id) => {
    const music = state.adminMusics.find(m => m.id == id);
    if (music) editMusicData(music);
};

function editMusicData(music) {
    els.adminInputId.value = music.id;
    els.adminInputArtista.value = music.artista || '';
    els.adminInputMusica.value = music.musica || '';
    els.adminInputAno.value = music.ano || '';
    els.adminInputAlbum.value = music.album || '';
    els.adminInputDirecao.value = music.direcao || '';
    els.adminInputVideoId.value = music.video_id || '';
    els.adminFormTitle.innerText = `EDITANDO #${music.id}`;
    els.adminBtnSave.innerText = "ATUALIZAR DADOS";
    els.adminPanel.querySelector('.flex-1').scrollTo({ top: 0, behavior: 'smooth' });
}

function resetAdminForm() {
    els.adminForm.reset();
    els.adminInputId.value = '';
    els.adminFormTitle.innerText = "NOVO REGISTRO";
    els.adminBtnSave.innerText = "GRAVAR DADOS";
}

function showAdminMsg(msg, isError = false) {
    els.adminStatusMsg.innerText = msg;
    els.adminStatusMsg.classList.remove('hidden', 'bg-red-900', 'bg-amber-900/20');
    els.adminStatusMsg.classList.add(isError ? 'bg-red-900' : 'bg-amber-900/20');
    setTimeout(() => els.adminStatusMsg.classList.add('hidden'), 3000);
}

// --- MAIN EVENTS ---

function setupEventListeners() {
    if(els.tvPowerBtn) els.tvPowerBtn.onclick = (e) => { e.stopPropagation(); togglePower(); };
    if(els.btnSearch) els.btnSearch.onclick = (e) => { e.stopPropagation(); toggleGuide(); };
    if(els.guideCloseBtn) els.guideCloseBtn.onclick = (e) => { e.stopPropagation(); toggleGuide(); };
    if(els.serviceModeBtn) els.serviceModeBtn.onclick = (e) => { e.stopPropagation(); toggleAdmin(true, 'SERVICE'); };
    if(els.adminCloseBtn) els.adminCloseBtn.onclick = (e) => { e.stopPropagation(); toggleAdmin(false); };
    if(els.headerEditBtn) els.headerEditBtn.onclick = (e) => { e.stopPropagation(); toggleAdmin(true, 'EDIT'); };
    if(els.adminFormClear) els.adminFormClear.onclick = (e) => { e.preventDefault(); resetAdminForm(); };

    // Clique na página (viewport) fecha qualquer painel aberto
    if(els.appViewport) {
        els.appViewport.onclick = () => {
            if (state.isSearchOpen) toggleGuide();
            if (state.isAdminOpen) toggleAdmin(false);
        };
    }

    if(els.btnNextCh) els.btnNextCh.onclick = (e) => { e.stopPropagation(); changeChannel(1); };
    if(els.btnPrevCh) els.btnPrevCh.onclick = (e) => { e.stopPropagation(); changeChannel(-1); };
    if(els.btnNextGrp) els.btnNextGrp.onclick = (e) => { e.stopPropagation(); changeGroup(1); };
    if(els.btnPrevGrp) els.btnPrevGrp.onclick = (e) => { e.stopPropagation(); changeGroup(-1); };
    
    // Botão de Preview Admin
    if(els.adminBtnPreview) {
        els.adminBtnPreview.onclick = (e) => {
            e.preventDefault();
            const vidId = els.adminInputVideoId.value.trim();
            if (!vidId) {
                showAdminMsg("VÍDEO ID NÃO DEFINIDO", true);
                return;
            }

            // Criamos um dado temporário de preview baseado nos inputs
            const previewData = {
                artista: els.adminInputArtista.value.trim(),
                musica: els.adminInputMusica.value.trim(),
                ano: els.adminInputAno.value,
                album: els.adminInputAlbum.value.trim(),
                direcao: els.adminInputDirecao.value.trim(),
                video_id: vidId
            };

            state.currentVideoData = previewData;
            
            // Força ligar a TV se estiver desligada
            if (!state.isOn) {
                togglePower();
            }
            
            // Pequeno delay para garantir que o player processe a ligação se necessário
            setTimeout(() => {
                if (state.playerReady && player) {
                    player.loadVideoById(vidId);
                    updateCreditsInfo(previewData);
                    showAdminMsg(`PREVIEW: ${previewData.artista} - ${previewData.musica}`);
                }
            }, 100);
        };
    }

    document.addEventListener('keydown', (e) => {
        if (!state.isOn && e.key !== 'p') return; 
        if (e.key === 'Escape') {
            if (state.isSearchOpen) toggleGuide();
            if (state.isAdminOpen) toggleAdmin(false);
        }
        if (state.isOn && !state.isSearchOpen && !state.isAdminOpen) {
            if (e.key === 'ArrowRight') changeChannel(1);
            if (e.key === 'ArrowLeft') changeChannel(-1);
            if (e.key === 'ArrowUp') changeGroup(1);
            if (e.key === 'ArrowDown') changeGroup(-1);
        }
    });

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
            ano: els.adminInputAno.value ? String(els.adminInputAno.value) : null,
            album: els.adminInputAlbum.value.trim() || null,
            direcao: els.adminInputDirecao.value.trim() || null,
            video_id: els.adminInputVideoId.value.trim() || null
        };
        els.adminBtnSave.disabled = true;
        els.adminBtnSave.innerText = "PROCESSANDO...";
        let error;
        let opId = id;
        if (id) {
            // FIX: Tabela musicas
            const { error: err } = await supabase.from('musicas').update(formData).eq('id', id);
            error = err;
        } else {
            // FIX: Tabela musicas
            const { data, error: err } = await supabase.from('musicas').insert([formData]).select();
            error = err;
            if(data) opId = data[0].id;
        }
        if (error) {
            showAdminMsg(`ERRO: ${error.message}`, true);
        } else {
            state.lastUpdatedId = opId;
            showAdminMsg(`REGISTRO #${opId} SALVO!`);
            
            // Se editou o vídeo ATUAL da TV (ou o vídeo ID bate), atualiza créditos e REINICIA na TV
            if (state.currentVideoData && (state.currentVideoData.id == opId || state.currentVideoData.video_id == formData.video_id)) {
                state.currentVideoData = { ...state.currentVideoData, ...formData };
                updateCreditsInfo(state.currentVideoData);
                
                // Reinicia o vídeo na TV se o player estiver pronto
                if (state.isOn && state.playerReady && player) {
                    player.loadVideoById(formData.video_id);
                }
            }
            
            fetchAdminMusics();
            resetAdminForm();
        }
        els.adminBtnSave.disabled = false;
        els.adminBtnSave.innerText = id ? "ATUALIZAR DADOS" : "GRAVAR DADOS";
    };

    if(els.guideSearch) {
        els.guideSearch.addEventListener('input', (e) => {
            const term = e.target.value.toUpperCase();
            document.querySelectorAll('.guide-group').forEach(group => {
                let hasVisible = false;
                group.querySelectorAll('.guide-cat-content button').forEach(btn => {
                    const match = btn.innerText.toUpperCase().includes(term);
                    btn.classList.toggle('hidden', !match);
                    if(match) hasVisible = true;
                });
                group.classList.toggle('hidden', !hasVisible && term !== '');
            });
        });
    }
}

init();
