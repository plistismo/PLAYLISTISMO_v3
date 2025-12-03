import { createClient } from '@supabase/supabase-js';
import { fetchTrackDetails } from './lastFmAPI.js';

// --- CONFIGURAÇÃO API YOUTUBE ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA';

// --- CONFIGURAÇÃO PEXELS API (FALLBACK VISUAL) ---
const PEXELS_KEY = '9RNNrjxwbKyc4KHDfVSZ51TXiRnl3TLgUUuS64ZlvtAo9Kw5BW9eVd0Y';

// --- DADOS DE FALLBACK (LEGACY) ---
const FALLBACK_PLAYLISTS = [
    { id: 'PL_FALLBACK_1', snippet: { title: 'Folk Zone (Backup)', channelTitle: 'System' } },
    { id: 'PL_FALLBACK_2', snippet: { title: 'Trip Hop Zone (Backup)', channelTitle: 'System' } },
];

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// --- ESTADO GLOBAL ---
const state = {
    isOn: false,
    isSearchOpen: false,
    currentPlaylistId: null,
    playlists: [],
    currentPlaylistVideos: [],
    isAuxPlayerActive: false, // Indica se estamos usando o Pexels
    currentSearchTerm: '',
    playerReady: false
};

let player; // YouTube
let auxPlayer; // Pexels
let creditTimers = [];

// Elementos DOM
const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    
    // Players
    youtubeContainer: document.getElementById('player'),
    auxContainer: document.getElementById('aux-player-container'),
    auxVideo: document.getElementById('aux-video'),

    // Static Noise
    staticOverlay: document.getElementById('static-overlay'),
    
    // TV Chassis Buttons
    btnNext: document.getElementById('tv-ch-next'),
    btnPrev: document.getElementById('tv-ch-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    
    osdLayer: document.getElementById('osd-layer'),
    osdClock: document.getElementById('osd-clock'),
    statusMessage: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    
    // Fullscreen Guide Elements
    internalGuide: document.getElementById('tv-internal-guide'),
    channelGuideContainer: document.getElementById('channel-guide-container'),
    channelSearch: document.getElementById('channel-search'),
    guideNowPlaying: document.getElementById('guide-now-playing'),
    guideClock: document.getElementById('guide-clock'),
    
    // Now Playing Info in Menu
    npTitle: document.getElementById('np-title'),
    npPlaylist: document.getElementById('np-playlist'),
    npId: document.getElementById('np-id'),
    
    osdChannel: document.getElementById('osd-channel'),
    ventContainer: document.querySelector('.vent-container'),
    speakerGrids: document.querySelectorAll('.speaker-grid'),
    
    // Last.FM Info Panel
    infoPanel: document.getElementById('info-panel'),
    infoContent: document.getElementById('info-content'),
    
    credits: {
        container: document.getElementById('video-credits'),
        artist: document.getElementById('artist-name'),
        song: document.getElementById('song-name'),
        album: document.getElementById('album-name'),
        year: document.getElementById('release-year'),
        director: document.getElementById('director-name')
    }
};

// --- AUTH GUARD (PROTEÇÃO DE ROTA) ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.warn("[Auth] No session found. Redirecting to login.");
        window.location.href = 'login.html';
    } else {
        console.log("[Auth] Session valid. User:", session.user.email);
        init(); // Só inicia o app se estiver logado
    }
}

async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = 'login.html';
    }
}

// --- DEV CONSOLE LOGIC ---
function initDevConsole() {
    const trigger = document.getElementById('dev-debug-trigger');
    const panel = document.getElementById('dev-debug-console');
    const close = document.getElementById('dev-console-close');
    const clear = document.getElementById('dev-console-clear');
    const output = document.getElementById('dev-console-output');

    if (trigger && panel) {
        trigger.classList.remove('hidden');

        trigger.addEventListener('click', () => {
            panel.classList.toggle('hidden');
        });
        close.addEventListener('click', () => {
            panel.classList.add('hidden');
        });
        clear.addEventListener('click', () => {
            output.innerHTML = '';
        });
    }

    const logToPanel = (msg) => {
        if (!output) return;
        const line = document.createElement('div');
        line.innerText = `> ${msg}`;
        line.className = "border-b border-red-900/30 pb-1";
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        
        if(trigger) {
            trigger.classList.add('animate-pulse', 'bg-red-500');
            setTimeout(() => trigger.classList.remove('animate-pulse', 'bg-red-500'), 2000);
        }
    };

    window.onerror = function(message, source, lineno, colno, error) {
        const cleanSource = source ? source.split('/').pop() : 'inline';
        logToPanel(`ERR: ${message} (${cleanSource}:${lineno})`);
        return false;
    };

    window.addEventListener('unhandledrejection', function(event) {
        logToPanel(`PROMISE: ${event.reason}`);
    });

    const originalError = console.error;
    console.error = function(...args) {
        originalError.apply(console, args);
        logToPanel(`LOG: ${args.join(' ')}`);
    };
    
    console.log("[System] Debug Console Initialized & Active");
}

// --- INICIALIZAÇÃO ---
function init() {
    console.log("[Script] Initializing RetroTV System...");
    auxPlayer = els.auxVideo;
    populateDecorations();
    startClocks();
    
    // Inicializa a API do YouTube
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    setupEventListeners();

    // AUTO-POWER ON após 2 segundos
    setTimeout(() => {
        initDevConsole();
        console.log("[Auto-Power] Turning TV On...");
        if (!state.isOn) togglePower();
    }, 2000);
}

// Expose YouTube Callback to Global Scope (since we are in a module)
window.onYouTubeIframeAPIReady = function() {
    console.log("[YouTube] API Ready. Creating Player...");
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'modestbranding': 1,
            'rel': 0,
            'fs': 0,
            'iv_load_policy': 3
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady(event) {
    console.log("[Player] Ready.");
    state.playerReady = true;
    fetchChannelPlaylists().then(() => {
        renderChannelGuide();
    });
}

function onPlayerError(event) {
    console.error(`[Player] Error: ${event.data}`);
    console.warn(`[System] YouTube Error. Engaging Database Fallback.`);
    
    getRandomTrackFromDB().then(term => {
        const fallbackTerm = term || state.currentSearchTerm || "Retro aesthetic";
        activateAuxPlayer(fallbackTerm, true);
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        disableAuxPlayer();
        showStatus("", false);
        const data = player.getVideoData();
        state.currentSearchTerm = data.title;
        
        console.log(`[Player] Playing: ${data.title} (${data.video_id})`);
        
        els.npTitle.textContent = data.title;
        els.npId.textContent = `ID: ${data.video_id}`;
        
        handleCreditsForVideo(data.video_id, data.title);
        
        els.osdLayer.classList.remove('fade-out');
        setTimeout(() => {
            if(player.getPlayerState() === YT.PlayerState.PLAYING) {
                els.osdLayer.classList.add('fade-out');
            }
        }, 3000);
    }
}

// --- LOGICA DE FALLBACK (DB + PEXELS) ---

async function getRandomTrackFromDB() {
    console.log("[DB] Fetching random track for fallback...");
    try {
        const { data, error } = await supabase
            .from('musicas')
            .select('artista, musica')
            .not('artista', 'is', null)
            .neq('artista', '')
            .limit(50)
            .order('id', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            const randomItem = data[Math.floor(Math.random() * data.length)];
            const term = `${randomItem.artista} ${randomItem.musica}`;
            console.log(`[DB] Random selection: ${term}`);
            return term;
        }
    } catch (err) {
        console.error("[DB] Failed to get random track:", err);
    }
    return null;
}

async function fetchPexelsVideo(query) {
    const cleanQuery = cleanStringForApi(query).split(' ').slice(0, 3).join(' ');
    console.log(`[Pexels] Searching for: "${cleanQuery}"`);
    
    const trySearch = async (term) => {
        const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(term)}&per_page=5&orientation=landscape`;
        const response = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
        if (!response.ok) throw new Error("Pexels API Error");
        return await response.json();
    };

    try {
        // Tentativa 1: Busca específica
        let data = await trySearch(cleanQuery);
        
        // Tentativa 2: Fallback Genérico se não achar nada
        if (!data.videos || data.videos.length === 0) {
            console.warn("[Pexels] No results. Trying generic term.");
            data = await trySearch("Retro Abstract");
        }
        
        if (data.videos && data.videos.length > 0) {
            const randomVideo = data.videos[Math.floor(Math.random() * data.videos.length)];
            const videoFile = randomVideo.video_files.find(v => v.quality === 'hd') || randomVideo.video_files[0];
            return videoFile.link;
        }
        return null;
    } catch (err) {
        console.error("[Pexels] Fetch failed:", err);
        return null;
    }
}

async function activateAuxPlayer(searchTerm, showWarning = false) {
    console.log(`[System] Switching to AUX PLAYER (Pexels)...`);
    
    if (showWarning) showStatus("AUX SIGNAL", true);
    
    const videoUrl = await fetchPexelsVideo(searchTerm);
    
    if (videoUrl) {
        state.isAuxPlayerActive = true;
        state.currentSearchTerm = searchTerm;
        
        if (player && typeof player.pauseVideo === 'function' && state.playerReady) {
            try { player.pauseVideo(); } catch(e){}
        }

        auxPlayer.src = videoUrl;
        auxPlayer.play().catch(e => console.error("Aux Autoplay blocked", e));
        
        els.auxContainer.classList.remove('opacity-0', 'pointer-events-none');
        els.auxContainer.classList.add('opacity-100', 'pointer-events-auto');
        els.youtubeContainer.classList.add('opacity-0');
        
        // Remove Chiado se Pexels carregar
        els.staticOverlay.classList.remove('active');
        
        updateCreditsDOM(searchTerm.substring(0,25), "Visual Experience", "Pexels DB", "2024", "System");
        showCredits();
        
        els.npTitle.textContent = "AUX: " + searchTerm;
        els.npId.textContent = "SOURCE: PEXELS";
    } else {
        showStatus("NO SIGNAL", true);
    }
}

function disableAuxPlayer() {
    if (!state.isAuxPlayerActive) return;
    console.log(`[System] Switching back to MAIN PLAYER (YouTube)...`);
    state.isAuxPlayerActive = false;
    auxPlayer.pause();
    els.auxContainer.classList.add('opacity-0', 'pointer-events-none');
    els.auxContainer.classList.remove('opacity-100', 'pointer-events-auto');
    els.youtubeContainer.classList.remove('opacity-0');
}

// --- LOGICA DE PLAYLISTS (LAZY LOADING) ---

async function fetchChannelPlaylists() {
    console.log("[API] Fetching Playlists List...");
    let allPlaylists = [];
    let nextPageToken = '';
    
    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            
            if (response.status === 403 || response.status === 429) throw new Error("Quota Exceeded");
            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            if (data.items) allPlaylists = [...allPlaylists, ...data.items];
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);
        
        state.playlists = allPlaylists;
    } catch (error) {
        console.error("[API] Failed to fetch playlists:", error);
        state.playlists = FALLBACK_PLAYLISTS;
    }
}

async function fetchPlaylistItems(playlistId, playlistTitle) {
    console.log(`[API] Fetching videos for playlist ${playlistId}...`);
    let videos = [];
    let nextPageToken = '';
    
    if (playlistId.startsWith('PL_FALLBACK')) return [];

    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            
             if (response.status === 403 || response.status === 429) {
                 console.error("[API] YouTube Quota Exceeded. Engaging DB+Pexels Fallback.");
                 const dbTerm = await getRandomTrackFromDB();
                 activateAuxPlayer(dbTerm || playlistTitle, true);
                 return [];
             }
             if (!response.ok) throw new Error(`API Error: ${response.status}`);
             
            const data = await response.json();
            if (data.items) videos = [...videos, ...data.items];
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);
        return videos;
    } catch (error) {
        console.error(`[API] Failed to load videos for ${playlistId}`, error);
        const dbTerm = await getRandomTrackFromDB();
        activateAuxPlayer(dbTerm || playlistTitle, true);
        return [];
    }
}

function groupPlaylists(playlists) {
    const groups = { 'UPLOADS': [], 'ZONES': [], 'GENRES': [], 'ERAS': [], 'OTHERS': [] };
    playlists.forEach(pl => {
        const title = pl.snippet.title.toUpperCase();
        if (title.includes('UPLOAD')) groups['UPLOADS'].push(pl);
        else if (title.includes('ZONE') || title.includes('RADIO')) groups['ZONES'].push(pl);
        else if (title.includes('ROCK') || title.includes('POP') || title.includes('JAZZ') || title.includes('INDIE') || title.includes('BRASIL')) groups['GENRES'].push(pl);
        else if (title.match(/\d{4}/)) groups['ERAS'].push(pl);
        else groups['OTHERS'].push(pl);
    });
    return groups;
}

function renderChannelGuide() {
    const container = els.channelGuideContainer;
    container.innerHTML = ''; 

    if (state.playlists.length === 0) {
        container.innerHTML = '<div class="text-red-500">NO SIGNAL / NO DATA</div>';
        return;
    }

    const groups = groupPlaylists(state.playlists);
    let channelIndex = 1;

    for (const [category, items] of Object.entries(groups)) {
        if (items.length === 0) continue;

        const header = document.createElement('div');
        header.className = "col-span-full border-b border-white/20 mt-4 mb-2 pb-1";
        header.innerHTML = `<span class="bg-[#ffff00] text-black px-2 font-bold">${category}</span>`;
        container.appendChild(header);

        items.forEach(pl => {
            const el = document.createElement('div');
            el.className = "teletext-link flex items-center p-1 cursor-pointer group hover:bg-white hover:text-blue-900 transition-colors";
            el.dataset.id = pl.id;
            el.dataset.title = pl.snippet.title;
            const chNum = String(channelIndex).padStart(2, '0');
            el.innerHTML = `<span class="text-[#ffff00] mr-3 font-bold group-hover:text-blue-900">${chNum}</span><span class="truncate uppercase">${pl.snippet.title}</span>`;
            el.onclick = () => {
                state.currentPlaylistId = pl.id;
                els.osdChannel.innerText = `CH ${chNum}`;
                els.npPlaylist.innerText = `PLAYLIST: ${pl.snippet.title}`;
                changeChannel(pl.id, pl.snippet.title);
                toggleSearchMode();
            };
            container.appendChild(el);
            channelIndex++;
        });
    }
}

// Filtro de Busca
els.channelSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const links = els.channelGuideContainer.querySelectorAll('.teletext-link');
    links.forEach(link => {
        const title = link.dataset.title.toLowerCase();
        link.classList.toggle('hidden', !title.includes(term));
    });
});

els.channelSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const firstVisible = Array.from(els.channelGuideContainer.querySelectorAll('.teletext-link')).find(el => !el.classList.contains('hidden'));
        if (firstVisible) firstVisible.click();
    }
});

// --- CONTROLE DE CANAL & VÍDEO ---
async function changeChannel(playlistId, playlistTitle) {
    showStatus("TUNING...", true);
    triggerStatic();
    disableAuxPlayer();

    const videos = await fetchPlaylistItems(playlistId, playlistTitle);
    state.currentPlaylistVideos = videos;

    if (videos.length > 0 && player && state.playerReady) {
        const videoIds = videos.map(v => v.snippet.resourceId.videoId);
        player.loadPlaylist(videoIds, 0);
        player.setLoop(true);
    } else {
        if (!state.isAuxPlayerActive) showStatus("EMPTY CHANNEL", true);
    }
}

function nextVideo() {
    triggerStatic();
    if (state.isAuxPlayerActive) {
        getRandomTrackFromDB().then(term => activateAuxPlayer(term || "Abstract Art"));
    } else if (player && state.playerReady) {
        player.nextVideo();
    }
}

function prevVideo() {
    triggerStatic();
    if (state.isAuxPlayerActive) {
        getRandomTrackFromDB().then(term => activateAuxPlayer(term || "Abstract Art"));
    } else if (player && state.playerReady) {
        player.previousVideo();
    }
}

// --- CRÉDITOS & METADADOS (SUPABASE + LAST.FM) ---

function cleanStringForApi(str) {
    if (!str) return "";
    return str
        .replace(/[\(\[\{].*?[\)\]\}]/g, '')
        .replace(/official video/gi, '')
        .replace(/video oficial/gi, '')
        .replace(/videoclipe/gi, '')
        .replace(/ft\./gi, '')
        .replace(/feat\./gi, '')
        .replace(/,/g, '')
        .replace(/-/g, ' ')
        .trim();
}

async function handleCreditsForVideo(videoId, ytTitle) {
    clearCreditTimers();
    hideCredits();
    
    els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-amber-900/50"><span class="animate-pulse">LOADING DATA...</span></div>';
    els.infoPanel.classList.remove('active');

    let artist = "Desconhecido";
    let song = "Faixa Desconhecida";
    let director = "";
    let album = "";
    let year = "";

    const { data } = await supabase.from('musicas').select('*').eq('video_id', videoId).maybeSingle();

    if (data) {
        artist = data.artista;
        song = data.musica || song;
        director = data.direcao || "";
        album = data.album || "";
        year = data.ano || "";
    } else {
        const parts = ytTitle.split('-');
        if (parts.length >= 2) {
            artist = parts[0].trim();
            song = parts.slice(1).join(' ').trim();
        } else {
            song = ytTitle;
            artist = "";
        }
    }

    const apiArtist = cleanStringForApi(artist);
    const apiSong = cleanStringForApi(song);
    
    if (apiArtist && apiSong) {
        fetchTrackDetails(apiArtist, apiSong).then(fmData => updateInfoPanel(fmData, artist, song));
    } else {
        els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-amber-900/50"><span>NO DATA SIGNAL</span></div>';
    }

    updateCreditsDOM(artist, song, album, year, director);

    const showDelay = 4000;
    const duration = 2500;
    creditTimers.push(setTimeout(() => showCredits(), showDelay));
    creditTimers.push(setTimeout(() => hideCredits(), showDelay + duration));
}

function updateInfoPanel(fmData, fallbackArtist, fallbackSong) {
    if (!fmData) {
        els.infoContent.innerHTML = `<div class="p-2 text-center text-amber-900">DATA NOT FOUND FOR<br>"${fallbackArtist}"</div>`;
        els.infoPanel.classList.add('active');
        return;
    }

    let html = '';
    if (fmData.capa) html += `<div class="mb-4 flex justify-center"><img src="${fmData.capa}" class="border border-amber-900/50 shadow-lg w-32 h-32 object-cover sepia-[.5] opacity-80"></div>`;
    html += `<div class="mb-2"><span class="bg-amber-900/20 px-1 text-amber-200">ARTIST:</span> ${fmData.artista}</div>`;
    html += `<div class="mb-2"><span class="bg-amber-900/20 px-1 text-amber-200">TRACK:</span> ${fmData.titulo}</div>`;
    if(fmData.album) html += `<div class="mb-2"><span class="bg-amber-900/20 px-1 text-amber-200">ALBUM:</span> ${fmData.album}</div>`;
    
    if (fmData.tags && fmData.tags.length > 0) {
        html += `<div class="mb-4 flex flex-wrap gap-1 mt-2">${fmData.tags.map(t => `<span class="text-xs border border-amber-900/40 px-1 text-amber-600 uppercase">${t}</span>`).join('')}</div>`;
    }
    html += `<div class="border-t border-amber-900/30 pt-2 mt-2 text-justify text-sm leading-snug">${fmData.curiosidade}</div>`;

    els.infoContent.innerHTML = html;
    els.infoPanel.classList.add('active');
}

function updateCreditsDOM(artist, song, album, year, director) {
    const set = (el, txt) => {
        el.parentElement.style.display = txt ? 'block' : 'none';
        el.innerText = txt || '';
    };
    set(els.credits.artist, artist);
    set(els.credits.song, song);
    set(els.credits.album, album);
    set(els.credits.year, year ? String(year) : "");
    set(els.credits.director, director);
}

function showCredits() { els.credits.container.classList.add('visible'); }
function hideCredits() { els.credits.container.classList.remove('visible'); }
function clearCreditTimers() { creditTimers.forEach(t => clearTimeout(t)); creditTimers = []; }

// --- EFEITOS DE TV ---
function togglePower() {
    state.isOn = !state.isOn;
    if (state.isOn) {
        els.powerLed.classList.add('bg-red-500', 'shadow-[0_0_8px_#ff0000]', 'saturate-200');
        els.powerLed.classList.remove('bg-red-900');
        els.screenOff.classList.add('hidden');
        els.screenOn.classList.remove('hidden');
        els.screenOn.classList.add('crt-turn-on');
        showStatus("INITIALIZING...", true);
        if (state.isAuxPlayerActive && auxPlayer) auxPlayer.play();
    } else {
        if (player && typeof player.stopVideo === 'function' && state.playerReady) player.stopVideo();
        if (auxPlayer) auxPlayer.pause();
        els.powerLed.classList.remove('bg-red-500', 'shadow-[0_0_8px_#ff0000]', 'saturate-200');
        els.powerLed.classList.add('bg-red-900');
        els.screenOn.classList.remove('crt-turn-on');
        els.screenOn.classList.add('crt-turn-off');
        setTimeout(() => {
            els.screenOn.classList.add('hidden');
            els.screenOn.classList.remove('crt-turn-off');
            els.screenOff.classList.remove('hidden');
        }, 400);
        els.internalGuide.classList.add('hidden');
        els.infoPanel.classList.remove('active');
        state.isSearchOpen = false;
    }
}

function toggleSearchMode() {
    if (!state.isOn) return;
    state.isSearchOpen = !state.isSearchOpen;
    if (state.isSearchOpen) {
        if (player && typeof player.pauseVideo === 'function' && state.playerReady) player.pauseVideo();
        if (auxPlayer) auxPlayer.pause();
        els.internalGuide.classList.remove('hidden');
        els.channelSearch.focus();
        updateGuideClock();
        const guideFooter = document.querySelector('#tv-internal-guide div:last-child');
        if (guideFooter && !document.getElementById('logout-btn-guide')) {
            const logoutSpan = document.createElement('span');
            logoutSpan.innerHTML = ' | <span class="text-purple-500 font-bold cursor-pointer" id="logout-btn-guide">SAIR (LOGOUT)</span>';
            guideFooter.appendChild(logoutSpan);
            document.getElementById('logout-btn-guide').addEventListener('click', handleLogout);
        }
    } else {
        els.internalGuide.classList.add('hidden');
        if (state.isAuxPlayerActive) auxPlayer.play();
        else if (player && state.currentPlaylistId && state.playerReady) player.playVideo();
    }
}

function triggerStatic() {
    els.staticOverlay.classList.add('active');
    setTimeout(() => els.staticOverlay.classList.remove('active'), 800);
}

function showStatus(msg, persistent = false) {
    els.statusText.innerText = msg;
    els.statusMessage.classList.remove('hidden');
    if (!persistent) setTimeout(() => els.statusMessage.classList.add('hidden'), 2000);
}

// --- AUXILIARES ---
function populateDecorations() {
    if (els.ventContainer) {
        els.ventContainer.innerHTML = '';
        for(let i=0; i<16; i++) {
            const d = document.createElement('div');
            d.className = 'w-1.5 h-full bg-black rounded-full mx-[1px] shadow-[inset_0_1px_2px_rgba(0,0,0,1)]';
            els.ventContainer.appendChild(d);
        }
    }
    els.speakerGrids.forEach(grid => {
        grid.innerHTML = '';
        for(let i=0; i<20; i++) {
            const d = document.createElement('div');
            d.className = 'w-full h-[3px] bg-[#050505] mb-[2px] rounded-sm';
            grid.appendChild(d);
        }
    });
}

function startClocks() {
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const timeStr24 = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if(els.osdClock) els.osdClock.innerText = timeStr;
        if(els.guideClock) els.guideClock.innerText = timeStr24;
    }, 1000);
}

function updateGuideClock() {
     const now = new Date();
     if(els.guideClock) els.guideClock.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function setupEventListeners() {
    els.tvPowerBtn.addEventListener('click', togglePower);
    els.btnSearch.addEventListener('click', toggleSearchMode);
    els.btnNext.addEventListener('click', nextVideo);
    els.btnPrev.addEventListener('click', prevVideo);
    document.addEventListener('keydown', (e) => {
        if (!state.isOn) return;
        if (e.key === 'Escape' && state.isSearchOpen) toggleSearchMode();
    });
}

// Check Auth BEFORE Init
checkAuth();