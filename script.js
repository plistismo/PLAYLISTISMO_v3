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
    // Buttons
    btnNextCh: document.getElementById('tv-ch-next'),
    btnPrevCh: document.getElementById('tv-ch-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    headerEditBtn: document.getElementById('header-edit-btn'),
    // Credits
    credArtist: document.getElementById('artist-name'),
    credSong: document.getElementById('song-name'),
    credAlbum: document.getElementById('album-name'),
    credYear: document.getElementById('release-year'),
    credDirector: document.getElementById('director-name'),
    // Guide
    guideClock: document.getElementById('guide-clock'),
    guideChannelList: document.getElementById('channel-guide-container'),
    guideSearch: document.getElementById('channel-search'),
    guideNpTitle: document.getElementById('np-title'),
    guideNpPlaylist: document.getElementById('np-playlist'),
    guideNowPlayingBox: document.getElementById('guide-now-playing')
};

// --- INICIALIZAÇÃO ---

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    checkAdminAccess(session);
    startClocks();
    loadYouTubeAPI();
    setupEventListeners();
    await fetchGuideData();
    checkResumeState();
}

function checkAdminAccess(session) {
    const panel = document.getElementById('admin-panel-header');
    if (session?.user?.id === ADMIN_UID) {
        panel?.classList.remove('hidden');
    }
}

function startClocks() {
    setInterval(() => {
        const now = new Date();
        if(els.guideClock) els.guideClock.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }, 1000);
}

/**
 * Motor de Identidade V7: Lógica Temática
 */
function getThematicSetup(name) {
    const n = name.toUpperCase();
    if (n.includes('RIDE') || n.includes('DRIVE') || n.includes('SPEED') || n.includes('CAR')) {
        return { theme: 'urban', bumpClass: 'bump-chrome', logo: '🏎️ SPEED' };
    }
    if (n.includes('HIP') || n.includes('RAP') || n.includes('STREET') || n.includes('RHYMES')) {
        return { theme: 'urban', bumpClass: 'bump-urban', logo: '🖍️ STREET' };
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
 * Sistema de Bump (Vinheta MTV)
 */
function triggerBump(playlistName) {
    if (state.isBumping) return;
    state.isBumping = true;

    const setup = getThematicSetup(playlistName);
    const parts = playlistName.split(':');
    const title = parts.length > 1 ? parts[1].trim() : parts[0].trim();

    els.bumpContent.innerHTML = `
        <div class="bump-ident ${setup.bumpClass}">
            <div class="text-[clamp(1rem,4vmin,2rem)] opacity-50 mb-4">${setup.logo}</div>
            <div class="text-[clamp(2rem,10vmin,6rem)] font-black uppercase leading-tight">${title}</div>
        </div>
    `;

    els.bumpLayer.classList.remove('hidden');
    els.bumpLayer.classList.add('bump-active');

    setTimeout(() => {
        els.bumpLayer.classList.add('hidden');
        els.bumpLayer.classList.remove('bump-active');
        state.isBumping = false;
    }, 1600);
}

function updatePlaylistOSD(name) {
    if (!els.playlistLabel) return;

    const setup = getThematicSetup(name);
    const parts = name.split(':');
    
    els.playlistLabel.className = 'osd-futuristic';
    if (name.length > 25) els.playlistLabel.classList.add('osd-compact');

    if (parts.length > 1) {
        els.playlistLabel.innerHTML = `
            <div class="osd-line-1">${parts[0].trim()}</div>
            <div class="osd-line-2">${parts[1].trim()}</div>
        `;
    } else {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">${name}</div>`;
    }
}

// --- PLAYER LOGIC ---

function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
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
        updateCreditsInfo(state.currentVideoData);
        // Monitora tempo para os créditos
        startCreditsMonitor();
    } else if (event.data === YT.PlayerState.ENDED) {
        nextVideo();
    }
}

function startCreditsMonitor() {
    if (window.creditsInterval) clearInterval(window.creditsInterval);
    window.creditsInterval = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== 'function') return;
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        const show = (cur > 2 && cur < 12) || (dur > 30 && cur > dur - 15 && cur < dur - 2);
        els.videoCredits.classList.toggle('visible', show);
    }, 1000);
}

async function loadChannelContent(playlistName, targetId = null) {
    state.currentChannelName = playlistName;
    updatePlaylistOSD(playlistName);
    triggerBump(playlistName); // Bump na troca de canal

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

function nextVideo() {
    state.currentIndex = (state.currentIndex + 1) % state.currentChannelList.length;
    playCurrentVideo();
}

function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- UI HANDLERS ---

function togglePower() {
    state.isOn = !state.isOn;
    els.screenOff.classList.toggle('hidden', state.isOn);
    els.screenOn.classList.toggle('hidden', !state.isOn);
    els.powerLed.classList.toggle('bg-red-500', state.isOn);
    
    if (state.isOn) {
        els.screenOn.classList.add('crt-turn-on');
        if (!state.currentChannelName) loadDefaultChannel();
        else player?.playVideo();
    } else {
        player?.pauseVideo();
    }
}

async function loadDefaultChannel() {
    await fetchGuideData();
    const categories = Object.keys(state.channelsByCategory);
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const pl = state.channelsByCategory[cat][0];
    loadChannelContent(pl.name);
}

function formatCredits(text) {
    if (!text) return "";
    // Regra de quebra após vírgula, sem quebrar nomes no meio
    return text.toString().replace(/,/g, ',<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
}

function updateCreditsInfo(data) {
    if (!data) return;
    els.credArtist.innerHTML = formatCredits(data.artista);
    els.credSong.innerHTML = formatCredits(data.musica);
    els.credAlbum.innerHTML = formatCredits(data.album);
    els.credYear.innerText = data.ano || '';
    els.credDirector.innerHTML = formatCredits(data.direcao);
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
    Object.keys(state.channelsByCategory).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'mb-2';
        div.innerHTML = `<div class="bg-blue-800 p-1 px-2 text-white font-bold border-b border-white/20">${cat}</div>`;
        state.channelsByCategory[cat].forEach(pl => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left p-1 px-2 hover:bg-white hover:text-blue-900 transition-colors border-b border-white/5';
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
        els.guideNpPlaylist.innerText = state.currentChannelName;
        els.guideNowPlayingBox.classList.remove('hidden');
    }
}

function toggleGuide() {
    state.isSearchOpen = !state.isSearchOpen;
    document.body.classList.toggle('guide-active', state.isSearchOpen);
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
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.isSearchOpen) toggleGuide();
    });

    els.headerEditBtn?.addEventListener('click', () => {
        if (state.currentVideoData) {
            localStorage.setItem('tv_resume_state', JSON.stringify({
                playlist: state.currentChannelName,
                videoId: state.currentVideoData.video_id
            }));
            window.location.href = `admin.html?edit_id=${state.currentVideoData.id}`;
        }
    });
}

init();