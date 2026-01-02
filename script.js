import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';

const state = {
    isOn: false,
    isSearchOpen: false,
    channelsByCategory: {}, 
    currentChannelList: [], 
    currentIndex: 0,
    currentChannelName: '',
    groupsOrder: ['UPLOADS', 'GENRES', 'ZONES', 'ERAS', 'OTHERS'],
    currentGroupIndex: 0, 
    playerReady: false,
    currentVideoData: null, 
    isPlaying: false,
    isBumping: false
};

let player; 

const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    staticOverlay: document.getElementById('static-overlay'),
    bumpLayer: document.getElementById('bump-layer'),
    bumpContent: document.getElementById('bump-content'),
    playlistLabel: document.getElementById('tv-playlist-label'),
    osdLayer: document.getElementById('osd-layer'),
    videoCredits: document.getElementById('video-credits'),
    statusMsg: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    // Buttons Físicos Original
    btnNextCh: document.getElementById('tv-ch-next'),
    btnPrevCh: document.getElementById('tv-ch-prev'),
    btnNextGrp: document.getElementById('tv-grp-next'),
    btnPrevGrp: document.getElementById('tv-grp-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    headerEditBtn: document.getElementById('header-edit-btn'),
    // Credits Original
    credArtist: document.getElementById('artist-name'),
    credSong: document.getElementById('song-name'),
    credAlbum: document.getElementById('album-name'),
    credYear: document.getElementById('release-year'),
    credDirector: document.getElementById('director-name'),
    // Guide Original
    guideClock: document.getElementById('guide-clock'),
    guideChannelList: document.getElementById('channel-guide-container'),
    guideSearch: document.getElementById('channel-search'),
    guideNpTitle: document.getElementById('np-title'),
    guideNpPlaylist: document.getElementById('np-playlist'),
    guideNowPlayingBox: document.getElementById('guide-now-playing'),
    speakerGrids: document.querySelectorAll('.speaker-grid')
};

// --- INICIALIZAÇÃO ---

async function init() {
    populateSpeakers();
    const { data: { session } } = await supabase.auth.getSession();
    checkAdminAccess(session);
    startClocks();
    loadYouTubeAPI();
    setupEventListeners();
    await fetchGuideData();
    checkResumeState();
}

function populateSpeakers() {
    els.speakerGrids.forEach(grid => {
        grid.innerHTML = '';
        for(let i=0; i<40; i++) {
            const div = document.createElement('div');
            grid.appendChild(div);
        }
    });
}

function checkAdminAccess(session) {
    const panel = document.getElementById('admin-panel-header');
    if (session?.user?.id === ADMIN_UID) panel?.classList.remove('hidden');
}

function startClocks() {
    setInterval(() => {
        const now = new Date();
        if(els.guideClock) els.guideClock.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }, 1000);
}

// --- MOTOR DE IDENTIDADE V7 (MIV-7) ---
function getThematicSetup(name) {
    const n = name.toUpperCase();
    if (n.includes('RIDE') || n.includes('DRIVE') || n.includes('SPEED') || n.includes('CAR')) {
        return { theme: 'ride', bumpClass: 'bump-chrome', logo: '🏎️ SPEED' };
    }
    if (n.includes('HIP') || n.includes('RAP') || n.includes('STREET') || n.includes('RHYMES')) {
        return { theme: 'street', bumpClass: 'bump-urban', logo: '🖍️ STREET' };
    }
    if (n.includes('ROCK') || n.includes('METAL') || n.includes('PUNK') || n.includes('NOISE')) {
        return { theme: 'noise', bumpClass: 'bump-noise', logo: '🤘 RAW' };
    }
    if (n.includes('TECH') || n.includes('DIGITAL') || n.includes('CYBER') || n.includes('UPLOAD')) {
        return { theme: 'cyber', bumpClass: 'bump-cyber', logo: '📡 DATA' };
    }
    return { theme: 'default', bumpClass: 'bump-noise', logo: '📺 TV' };
}

/**
 * Sistema de Bump (Vinheta MTV) disparado na troca de vídeo ou canal
 */
function triggerBump(playlistName) {
    if (state.isBumping || !state.isOn) return;
    state.isBumping = true;
    const setup = getThematicSetup(playlistName);
    const parts = playlistName.split(':');
    const title = parts.length > 1 ? parts[1].trim() : parts[0].trim();

    els.bumpContent.innerHTML = `
        <div class="bump-ident ${setup.bumpClass}">
            <div class="text-[clamp(1rem,4vmin,2.5rem)] opacity-60 mb-6 font-vt323 tracking-[0.4em]">${setup.logo}</div>
            <div class="text-[clamp(2rem,12vmin,8rem)] font-black uppercase leading-[0.9] tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">${title}</div>
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
    const parts = name.split(':');
    els.playlistLabel.className = 'osd-futuristic';
    if (name.length > 25) els.playlistLabel.classList.add('osd-compact');

    if (parts.length > 1) {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">${parts[0].trim()}:</div><div class="osd-line-2">${parts[1].trim()}</div>`;
    } else {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">${name}</div>`;
    }
}

// --- PLAYER & NAVEGAÇÃO ---
function loadYouTubeAPI() {
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
        // Exibe no início (4-14s) e no final (últimos 15s)
        const show = (cur > 4 && cur < 14) || (dur > 40 && cur > dur - 15 && cur < dur - 4);
        els.videoCredits.classList.toggle('visible', show);
    }, 1000);
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
}

function handleVideoEnd() {
    // Dispara bump na troca automática de vídeo
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
    els.screenOff.classList.toggle('hidden', state.isOn);
    els.screenOn.classList.toggle('hidden', !state.isOn);
    els.powerLed.classList.toggle('bg-red-500', state.isOn);
    els.powerLed.classList.toggle('shadow-[0_0_8px_#ff0000]', state.isOn);
    
    if (state.isOn) {
        els.screenOn.classList.add('crt-turn-on');
        if (!state.currentChannelName) loadDefaultChannel();
        else player?.playVideo();
        showOSD();
    } else {
        player?.pauseVideo();
        els.screenOn.classList.remove('crt-turn-on');
    }
}

async function loadDefaultChannel() {
    await fetchGuideData();
    const cat = state.groupsOrder.find(g => state.channelsByCategory[g]?.length > 0);
    if(cat) loadChannelContent(state.channelsByCategory[cat][0].name);
}

function showOSD() {
    els.osdLayer.style.opacity = 1;
    clearTimeout(window.osdTimeout);
    window.osdTimeout = setTimeout(() => { els.osdLayer.style.opacity = 0; }, 4000);
}

function showStatus(text) {
    els.statusText.innerText = text;
    els.statusMsg.classList.remove('hidden');
    setTimeout(hideStatus, 3000);
}
function hideStatus() { els.statusMsg.classList.add('hidden'); }
function showStatic(dur) { els.staticOverlay.classList.add('active'); setTimeout(() => els.staticOverlay.classList.remove('active'), dur); }

function updateCreditsInfo(data) {
    if (!data) return;
    els.credArtist.innerText = data.artista || '';
    els.credSong.innerText = data.musica || '';
    els.credAlbum.innerText = data.album || '';
    els.credYear.innerText = data.ano || '';
    els.credDirector.innerText = data.direcao || '';
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
    els.guideChannelList.innerHTML = '';
    state.groupsOrder.forEach(cat => {
        if (!state.channelsByCategory[cat]) return;
        const div = document.createElement('div');
        div.className = 'mb-2';
        div.innerHTML = `<div class="bg-[#0000aa] p-1 px-2 text-white font-bold border border-white/20 uppercase tracking-widest text-xs">${cat}</div>`;
        state.channelsByCategory[cat].forEach(pl => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left p-1 px-2 text-gray-300 hover:bg-white hover:text-[#0000aa] border-b border-white/5 uppercase text-sm font-vt323';
            btn.innerText = pl.name;
            btn.onclick = () => { loadChannelContent(pl.name); toggleGuide(); };
            div.appendChild(btn);
        });
        els.guideChannelList.appendChild(div);
    });
}

function updateGuideNowPlaying() {
    if (state.currentVideoData) {
        els.guideNpTitle.innerText = `${state.currentVideoData.artista} - ${state.currentVideoData.musica}`;
        els.guideNpPlaylist.innerText = `CANAL: ${state.currentChannelName}`;
        els.guideNowPlayingBox.classList.remove('hidden');
    }
}

function toggleGuide() {
    state.isSearchOpen = !state.isSearchOpen;
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
        const { playlist, videoId } = JSON.parse(saved);
        localStorage.removeItem('tv_resume_state');
        state.isOn = true;
        els.screenOff.classList.add('hidden');
        els.screenOn.classList.remove('hidden');
        els.powerLed.classList.add('bg-red-500');
        loadChannelContent(playlist, videoId);
    }
}

function setupEventListeners() {
    els.tvPowerBtn.onclick = togglePower;
    els.btnSearch.onclick = toggleGuide;
    els.btnNextCh.onclick = () => changeChannel(1);
    els.btnPrevCh.onclick = () => changeChannel(-1);
    els.btnNextGrp.onclick = () => changeGroup(1);
    els.btnPrevGrp.onclick = () => changeGroup(-1);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.isSearchOpen) toggleGuide();
        if (state.isOn && !state.isSearchOpen) {
            if (e.key === 'ArrowRight') changeChannel(1);
            if (e.key === 'ArrowLeft') changeChannel(-1);
            if (e.key === 'ArrowUp') changeGroup(1);
            if (e.key === 'ArrowDown') changeGroup(-1);
        }
    });

    els.headerEditBtn?.onclick = () => {
        if (state.currentVideoData) {
            localStorage.setItem('tv_resume_state', JSON.stringify({
                playlist: state.currentChannelName,
                videoId: state.currentVideoData.video_id
            }));
            window.location.href = `admin.html?edit_id=${state.currentVideoData.id}`;
        }
    };
}

init();