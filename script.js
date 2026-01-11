
import { createClient } from '@supabase/supabase-js';

const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';

/**
 * =====================================================================
 * GRADE DE CANAIS LINEARES (TV ABERTA)
 * Para ADICIONAR ou REMOVER canais, edite este array abaixo.
 * O campo 'playlist' deve bater com o nome exato no seu Supabase.
 * =====================================================================
 */
const LINEAR_STATIONS = [
    {
        id: "00",
        name: "CENTRAL MIX",
        theme: "default",
        schedule_base: {
            0: { name: "Midnight Blend", playlist: "ZONE: R&B" },
            7: { name: "Morning variety", playlist: "ZONE: Solar" },
            12: { name: "Central Hits", playlist: "ZONE: Pop Up" },
            18: { name: "Prime Time Mix", playlist: "ZONE: Pop Up Back" },
            22: { name: "Late Night Mix", playlist: "ZONE: Urbano" }
        }
    },
    {
        id: "01",
        name: "POP UP STATION",
        theme: "default",
        schedule_base: {
            0: { name: "Pop After Hours", playlist: "ZONE: Classy" },
            8: { name: "Morning Hits", playlist: "ZONE: Pop Up" },
            14: { name: "Pop Up Global", playlist: "ZONE: Pop Up" },
            20: { name: "Chart Toppers", playlist: "ZONE: Pop Up" }
        }
    },
    {
        id: "02",
        name: "URBANO RHYMES",
        theme: "street",
        schedule_base: {
            0: { name: "Street Flow", playlist: "ZONE: Trapstar" },
            9: { name: "Hip Hop Classics", playlist: "ZONE: videoRhymes" },
            15: { name: "R&B Sessions", playlist: "ZONE: R&B" },
            21: { name: "Urbano Night", playlist: "ZONE: Urbano" }
        }
    },
    {
        id: "03",
        name: "VINTAGE ERAS",
        theme: "cyber",
        schedule_base: {
            0: { name: "Retro Gems", playlist: "ZONE: Retro Mellow" },
            8: { name: "Pop Up Back", playlist: "ZONE: Pop Up Back" },
            14: { name: "Classy Eras", playlist: "ZONE: Classy" },
            20: { name: "Classic Rock", playlist: "GENRES: Classic Rock" }
        }
    },
    {
        id: "04",
        name: "BRASIL TV",
        theme: "street",
        schedule_base: {
            0: { name: "Brasil Madrugada", playlist: "GENRES: Brasil" },
            8: { name: "Solar Nacional", playlist: "ZONE: Solar" },
            13: { name: "Mix Brasileiro", playlist: "GENRES: Brasil" },
            19: { name: "Noite Brasil", playlist: "GENRES: Brasil" }
        }
    },
    {
        id: "05",
        name: "MUNDO LATINO",
        theme: "street",
        schedule_base: {
            0: { name: "Perreo Night", playlist: "ZONE: Perreo" },
            10: { name: "Pop Up ñ", playlist: "ZONE: Pop Up ñ" },
            16: { name: "Latino Urbano", playlist: "ZONE: Urbano" },
            21: { name: "Fiesta Latina", playlist: "ZONE: Perreo" }
        }
    },
    {
        id: "06",
        name: "ALT-RIFF ZONE",
        theme: "noise",
        schedule_base: {
            0: { name: "Metal Hour", playlist: "GENRES: Metal Mix" },
            9: { name: "Alt-Riff Morning", playlist: "GENRES: alt-Riff" },
            15: { name: "Rock Shapes", playlist: "GENRES: Rock Shapes" },
            20: { name: "Grunge Legacy", playlist: "GENRES: Grunge" }
        }
    },
    {
        id: "07",
        name: "MELLOW SESSIONS",
        theme: "default",
        schedule_base: {
            0: { name: "Elegant Eras", playlist: "ZONE: Retro Mellow" },
            9: { name: "Sophisti-Pop", playlist: "ZONE: Classy" },
            15: { name: "Mellow Gold", playlist: "ZONE: Pop Up Back" },
            21: { name: "Adult Contemporary", playlist: "ZONE: Classy" }
        }
    },
    {
        id: "08",
        name: "CHILLOUT LOUNGE",
        theme: "default",
        schedule_base: {
            0: { name: "Lunar Ambient", playlist: "ZONE: Lunar" },
            8: { name: "Soft Morning", playlist: "ZONE: Soft" },
            13: { name: "Chillout Lounge", playlist: "ZONE: Chillout" },
            18: { name: "Sunset Solar", playlist: "ZONE: Solar" },
            22: { name: "Bedroom Beats", playlist: "ZONE: Mellowverse" }
        }
    },
    {
        id: "09",
        name: "ELECTRO-GAMMA",
        theme: "cyber",
        schedule_base: {
            0: { name: "Techno Peak", playlist: "GENRES: Electronic" },
            10: { name: "Digital Soft", playlist: "ZONE: Soft" },
            15: { name: "Rifftronica Beats", playlist: "GENRES: Rifftronica" },
            21: { name: "Electronic Night", playlist: "GENRES: Electronic" }
        }
    },
    {
        id: "10",
        name: "GEEK ZONE",
        theme: "cyber",
        schedule_base: {
            0: { name: "Geek Aesthetics", playlist: "ZONE: Solar" },
            10: { name: "Making Of / BTS", playlist: "ZONE: Classy" },
            16: { name: "Game Themes", playlist: "ZONE: Retro Mellow" },
            21: { name: "Geek Special", playlist: "ZONE: Mellowverse" }
        }
    },
    {
        id: "11",
        name: "WORLD MIX",
        theme: "street",
        schedule_base: {
            0: { name: "Ethnic Chill", playlist: "ZONE: Soft" },
            9: { name: "Global Rhythms", playlist: "ZONE: Solar" },
            15: { name: "Regional Soundscapes", playlist: "GENRES: Brasil" },
            20: { name: "World Fusion", playlist: "ZONE: Urbano" }
        }
    }
];

const state = {
    isOn: false,
    isSearchOpen: false,
    isLinearMode: true,
    currentLinearStationIndex: 0,
    channelsByCategory: {}, 
    currentChannelList: [], 
    currentIndex: 0,
    currentChannelName: '',
    currentProgramName: '',
    /**
     * ORDEM DAS CATEGORIAS NO GUIA (TELETEXTO)
     * Adicione ou remova nomes aqui para controlar a ordem de exibição.
     */
    groupsOrder: ['CENTRAL', 'POP', 'URBANO', 'ERAS', 'BRASIL', 'LATINO', 'ALT', 'MELLOW', 'CHILL', 'ELECTRONIC', 'GEEK', 'WORLD', 'ZONES', 'GENRES', 'OTHERS'],
    currentGroupIndex: 0, 
    playerReady: false,
    currentVideoData: null, 
    isPlaying: false,
    isBumping: false,
    linearAverageDuration: 240 
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
    liveIndicator: document.getElementById('live-indicator'),
    osdLayer: document.getElementById('osd-layer'),
    videoCredits: document.getElementById('video-credits'),
    statusMsg: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    btnNextCh: document.getElementById('tv-ch-next'),
    btnPrevCh: document.getElementById('tv-ch-prev'),
    btnNextGrp: document.getElementById('tv-grp-next'),
    btnPrevGrp: document.getElementById('tv-grp-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    btnLinear: document.getElementById('tv-linear-btn'),
    linearLed: document.getElementById('linear-led'),
    headerEditBtn: document.getElementById('header-edit-btn'),
    adminHeader: document.getElementById('admin-panel-header'),
    credArtist: document.getElementById('artist-name'),
    credSong: document.getElementById('song-name'),
    credAlbum: document.getElementById('album-name'),
    credYear: document.getElementById('release-year'),
    credDirector: document.getElementById('director-name'),
    guideCloseBtn: document.getElementById('guide-close-btn'),
    guideClock: document.getElementById('guide-clock'),
    guideChannelList: document.getElementById('channel-guide-container'),
    guideSearch: document.getElementById('channel-search'),
    guideNpPlaylist: document.getElementById('np-playlist'),
    guideNowPlayingBox: document.getElementById('guide-now-playing'),
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
    } else {
        if(els.adminHeader) els.adminHeader.classList.add('hidden');
    }
}

function startClocks() {
    setInterval(() => {
        const now = new Date();
        if(els.guideClock) els.guideClock.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        if (state.isOn && state.isLinearMode && player) {
            checkLinearSync();
        }
    }, 1000);
}

function getCurrentProgramInfo() {
    const now = new Date();
    const hour = now.getHours();
    const station = LINEAR_STATIONS[state.currentLinearStationIndex];
    const schedule = station.schedule_base;
    const hours = Object.keys(schedule).map(Number).sort((a, b) => b - a);
    const activeHour = hours.find(h => h <= hour) || 0;
    
    return {
        ...schedule[activeHour],
        stationName: station.name,
        stationId: station.id,
        stationTheme: station.theme
    };
}

/**
 * CONFIGURAÇÃO VISUAL DE IDENTIDADE (BUMPS)
 * Aqui você define qual logo e estilo cada nome de playlist ou canal terá.
 */
function getThematicSetup(name) {
    const n = name.toUpperCase();
    if (n.includes('CENTRAL')) return { theme: 'default', bumpClass: 'bump-chrome', logo: '💎 CENTRAL' };
    if (n.includes('POP UP')) return { theme: 'default', bumpClass: 'bump-chrome', logo: '🌟 POP UP' };
    if (n.includes('URBANO') || n.includes('RHYMES') || n.includes('TRAP')) return { theme: 'street', bumpClass: 'bump-urban', logo: '🎤 URBANO' };
    if (n.includes('BRASIL')) return { theme: 'street', bumpClass: 'bump-urban', logo: '🇧🇷 BRASIL' };
    if (n.includes('LATINO') || n.includes('PERREO')) return { theme: 'street', bumpClass: 'bump-urban', logo: '💃 LATINO' };
    if (n.includes('ALT') || n.includes('ROCK') || n.includes('RIFF') || n.includes('NOISE')) return { theme: 'noise', bumpClass: 'bump-noise', logo: '🤘 ALT' };
    if (n.includes('ELECTRO') || n.includes('CYBER') || n.includes('TECH')) return { theme: 'cyber', bumpClass: 'bump-cyber', logo: '📡 ELECTRO' };
    if (n.includes('CHILL') || n.includes('SOFT') || n.includes('LUNAR') || n.includes('LOUNGE')) return { theme: 'default', bumpClass: 'bump-chrome', logo: '☁️ CHILL' };
    if (n.includes('MELLOW')) return { theme: 'default', bumpClass: 'bump-chrome', logo: '🍷 MELLOW' };
    if (n.includes('GEEK')) return { theme: 'cyber', bumpClass: 'bump-cyber', logo: '👾 GEEK' };
    if (n.includes('WORLD')) return { theme: 'street', bumpClass: 'bump-urban', logo: '🌍 WORLD' };
    if (n.includes('ERA') || n.includes('BACK') || n.includes('VINTAGE')) return { theme: 'default', bumpClass: 'bump-chrome', logo: '⏳ ERAS' };
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

function updatePlaylistOSD(name, isLinear = false) {
    if (!els.playlistLabel) return;
    const prog = isLinear ? getCurrentProgramInfo() : null;
    const displayName = isLinear ? `${prog.stationId} ${prog.name}` : name;
    const setup = getThematicSetup(displayName);
    const parts = displayName.split(':');
    
    els.playlistLabel.className = `osd-futuristic ${setup.bumpClass}`;
    if (displayName.length > 20) els.playlistLabel.classList.add('osd-compact');
    
    if (isLinear) {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">CH ${prog.stationId}</div><div class="osd-line-2">${prog.name}</div>`;
    } else if (parts.length > 1) {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">${parts[0].trim()}:</div><div class="osd-line-2">${parts[1].trim()}</div>`;
    } else {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">${displayName}</div>`;
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
            'controls': 0, 'modestbranding': 1, 'rel': 0, 
            'iv_load_policy': 3, 'enablejsapi': 1, 'showinfo': 0,
            'disablekb': 1, 'fs': 0
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

        const showCredits = (cur >= 10 && cur < 20) || (dur > 35 && cur >= (dur - 20) && cur < (dur - 10));
        if(els.videoCredits) els.videoCredits.classList.toggle('visible', showCredits);

        const showPlaylist = (cur >= 1.5 && cur < dur);
        if(els.playlistLabel) els.playlistLabel.classList.toggle('visible', showPlaylist);
    }, 1000);
}

async function loadChannelContent(playlistName, targetId = null) {
    showStatic(500);
    state.currentChannelName = playlistName;
    updatePlaylistOSD(playlistName, state.isLinearMode);
    triggerBump(playlistName);

    const { data } = await supabase.from('musicas_backup').select('*').eq('playlist', playlistName);
    if (!data?.length) return;

    if (state.isLinearMode) {
        state.currentChannelList = data; 
        syncToLinearClock();
    } else {
        state.currentChannelList = targetId ? data : fisherYatesShuffle([...data]);
        state.currentIndex = targetId ? data.findIndex(v => v.video_id === targetId) : 0;
        if (state.currentIndex === -1) state.currentIndex = 0;
        playCurrentVideo();
    }
}

async function syncToLinearClock() {
    const prog = getCurrentProgramInfo();
    state.currentProgramName = prog.name;
    
    if (state.currentChannelName !== prog.playlist) {
        state.currentChannelName = prog.playlist;
        const { data } = await supabase.from('musicas_backup').select('*').eq('playlist', prog.playlist);
        if (data?.length) {
            state.currentChannelList = data;
        } else {
            return;
        }
    }

    const now = new Date();
    const totalSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const avgDur = state.linearAverageDuration;
    
    state.currentIndex = Math.floor(totalSeconds / avgDur) % state.currentChannelList.length;
    const startAt = totalSeconds % avgDur;

    updatePlaylistOSD(prog.name, true);
    playCurrentVideo(startAt);
}

function checkLinearSync() {
    const prog = getCurrentProgramInfo();
    
    if (state.currentProgramName !== prog.name) {
        showStatus(`CH ${prog.stationId}: ${prog.name}`);
        syncToLinearClock();
        return;
    }

    const now = new Date();
    const totalSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    const avgDur = state.linearAverageDuration;
    const expectedIndex = Math.floor(totalSeconds / avgDur) % state.currentChannelList.length;
    
    if (expectedIndex !== state.currentIndex) {
        syncToLinearClock();
    }
}

function playCurrentVideo(startAt = 0) {
    const video = state.currentChannelList[state.currentIndex];
    if (!video || !player || !state.playerReady) return;
    state.currentVideoData = video;
    
    if (state.isLinearMode) {
        player.loadVideoById(video.video_id, startAt);
    } else {
        player.loadVideoById(video.video_id);
    }
    
    updateGuideNowPlaying();
}

function handleVideoEnd() {
    if (state.isBumping) return;
    if (state.isLinearMode) {
        syncToLinearClock();
    } else {
        triggerBump(state.currentChannelName);
        state.currentIndex = (state.currentIndex + 1) % state.currentChannelList.length;
        playCurrentVideo();
    }
}

async function changeGroup(direction) {
    if (!state.isOn || state.isLinearMode) return;
    state.currentGroupIndex = (state.currentGroupIndex + direction + state.groupsOrder.length) % state.groupsOrder.length;
    const groupName = state.groupsOrder[state.currentGroupIndex];
    showStatus(`GRP: ${groupName}`);
    const playlists = state.channelsByCategory[groupName];
    if (playlists?.length) await loadChannelContent(playlists[0].name);
}

async function changeChannel(direction) {
    if (!state.isOn) return;
    
    if (state.isLinearMode) {
        state.currentLinearStationIndex = (state.currentLinearStationIndex + direction + LINEAR_STATIONS.length) % LINEAR_STATIONS.length;
        const prog = getCurrentProgramInfo();
        showStatus(`STATION ${prog.stationId}: ${prog.stationName}`);
        showStatic(300);
        syncToLinearClock();
    } else {
        const group = state.groupsOrder[state.currentGroupIndex];
        const playlists = state.channelsByCategory[group];
        let idx = playlists.findIndex(pl => pl.name === state.currentChannelName);
        idx = (idx + direction + playlists.length) % playlists.length;
        await loadChannelContent(playlists[idx].name);
    }
}

function togglePower() {
    state.isOn = !state.isOn;
    updateTVVisualState();
    
    if (state.isOn) {
        if (state.isLinearMode) {
            syncToLinearClock();
        } else if (!state.currentChannelName) {
            loadDefaultChannel();
        } else {
            player?.playVideo();
        }
        showOSD();
    } else {
        player?.pauseVideo();
        if(els.playlistLabel) els.playlistLabel.classList.remove('visible');
    }
}

function toggleLinearMode() {
    if (!state.isOn) return;
    state.isLinearMode = !state.isLinearMode;
    
    els.linearLed.classList.toggle('bg-red-600', state.isLinearMode);
    els.linearLed.classList.toggle('shadow-[0_0_5px_red]', state.isLinearMode);
    els.liveIndicator.classList.toggle('hidden', !state.isLinearMode);
    
    showStatus(state.isLinearMode ? "REDE LIGADA" : "MODO VOD");
    
    if (state.isLinearMode) {
        syncToLinearClock();
    } else {
        loadChannelContent(state.currentChannelName);
    }
}

function updateTVVisualState() {
    els.screenOff.classList.toggle('hidden', state.isOn);
    els.screenOn.classList.toggle('hidden', !state.isOn);
    els.powerLed.classList.toggle('bg-red-500', state.isOn);
    els.powerLed.classList.toggle('shadow-[0_0_8px_#ff0000]', state.isOn);
    if (state.isOn) {
        els.screenOn.classList.add('crt-turn-on');
        els.linearLed.classList.toggle('bg-red-600', state.isLinearMode);
    } else {
        els.screenOn.classList.remove('crt-turn-on');
    }
}

async function loadDefaultChannel() {
    const allPlaylists = [];
    Object.values(state.channelsByCategory).forEach(list => list.forEach(pl => allPlaylists.push(pl.name)));
    if (allPlaylists.length > 0) {
        const randomPlaylist = allPlaylists[Math.floor(Math.random() * allPlaylists.length)];
        const cat = Object.keys(state.channelsByCategory).find(k => state.channelsByCategory[k].some(p => p.name === randomPlaylist));
        state.currentGroupIndex = state.groupsOrder.indexOf(cat);
        loadChannelContent(randomPlaylist);
    }
}

function showOSD() { if(els.osdLayer) els.osdLayer.style.opacity = 1; }
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
    const fields = [
        { el: els.credArtist, val: data.artista },
        { el: els.credSong, val: data.musica },
        { el: els.credAlbum, val: data.album },
        { el: els.credYear, val: data.ano },
        { el: els.credDirector, val: data.direcao }
    ];
    fields.forEach(field => {
        if (!field.el) return;
        const line = field.el.closest('.credit-line');
        if (field.val) {
            if (line) line.classList.remove('hidden');
            field.el.innerText = field.val;
        } else if (line) line.classList.add('hidden');
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
        listContainer.className = 'guide-cat-content flex flex-col bg-black/40';
        state.channelsByCategory[cat].forEach(pl => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left p-2.5 px-6 text-gray-300 hover:bg-[#ffff00] hover:text-[#0000aa] border-b border-white/5 uppercase text-sm font-vt323 transition-colors';
            btn.innerText = pl.name;
            btn.onclick = (e) => { 
                e.stopPropagation();
                if (state.isLinearMode) toggleLinearMode(); 
                loadChannelContent(pl.name); 
                toggleGuide(); 
            };
            listContainer.appendChild(btn);
        });
        header.onclick = () => {
            const isCurrentlyShown = listContainer.classList.contains('show');
            document.querySelectorAll('.guide-cat-content').forEach(el => el.classList.remove('show'));
            if (!isCurrentlyShown) listContainer.classList.add('show');
        };
        groupWrapper.appendChild(header);
        groupWrapper.appendChild(listContainer);
        els.guideChannelList.appendChild(groupWrapper);
    });
}

function applySmartMarquee(element, text) {
    if (!element) return;
    element.innerText = text || '--';
}

function updateGuideNowPlaying() {
    const data = state.currentVideoData;
    if (data && els.guideNpPlaylist) {
        applySmartMarquee(els.gnpArtist, data.artista);
        applySmartMarquee(els.gnpSong, data.musica);
        applySmartMarquee(els.gnpAlbum, data.album);
        applySmartMarquee(els.gnpYear, data.ano ? String(data.ano) : '');
        applySmartMarquee(els.gnpDirector, data.direcao);
        els.guideNpPlaylist.innerText = `CHANNEL: ${state.currentChannelName}`;
        els.guideNowPlayingBox.classList.remove('hidden');
    } else if(els.guideNowPlayingBox) els.guideNowPlayingBox.classList.add('hidden');
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
        try {
            const { playlist, videoId } = JSON.parse(saved);
            localStorage.removeItem('tv_resume_state');
            state.isOn = true;
            updateTVVisualState();
            loadChannelContent(playlist, videoId);
        } catch (e) { console.error("Erro no resume state:", e); }
    }
}

function setupEventListeners() {
    if(els.tvPowerBtn) els.tvPowerBtn.onclick = (e) => { e.stopPropagation(); togglePower(); };
    if(els.btnLinear) els.btnLinear.onclick = (e) => { e.stopPropagation(); toggleLinearMode(); };
    if(els.btnSearch) els.btnSearch.onclick = (e) => { e.stopPropagation(); toggleGuide(); };
    if(els.guideCloseBtn) els.guideCloseBtn.onclick = (e) => { e.stopPropagation(); toggleGuide(); };
    if(els.btnNextCh) els.btnNextCh.onclick = (e) => { e.stopPropagation(); changeChannel(1); };
    if(els.btnPrevCh) els.btnPrevCh.onclick = (e) => { e.stopPropagation(); changeChannel(-1); };
    if(els.btnNextGrp) els.btnNextGrp.onclick = (e) => { e.stopPropagation(); changeGroup(1); };
    if(els.btnPrevGrp) els.btnPrevGrp.onclick = (e) => { e.stopPropagation(); changeGroup(-1); };
    if(els.headerEditBtn) {
        els.headerEditBtn.onclick = (e) => {
            e.stopPropagation();
            if (state.currentVideoData) {
                window.location.href = `admin.html?edit_id=${state.currentVideoData.id}&from=tv`;
            }
        };
    }
    document.addEventListener('keydown', (e) => {
        if (!state.isOn && e.key !== 'p') return; 
        if (state.isOn && !state.isSearchOpen) {
            if (e.key === 'ArrowRight') changeChannel(1);
            if (e.key === 'ArrowLeft') changeChannel(-1);
            if (e.key === 'l' || e.key === 'L') toggleLinearMode();
            if (e.key === 'g' || e.key === 'G') toggleGuide();
        }
    });
}

init();
