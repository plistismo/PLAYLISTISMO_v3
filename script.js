
import { fetchTrackDetails } from './lastFmAPI.js';

// --- CONFIGURAÇÃO API YOUTUBE ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA';

// --- DADOS DE FALLBACK (SINAL DE EMERGÊNCIA) ---
// Usado caso a API do YouTube falhe (Cota excedida, Erro de rede)
const FALLBACK_PLAYLISTS = [
    { id: 'PL_FALLBACK_1', snippet: { title: 'Folk Zone (Backup)', channelTitle: 'System' } },
    { id: 'PL_FALLBACK_2', snippet: { title: 'Trip Hop Zone (Backup)', channelTitle: 'System' } },
    { id: 'PL_FALLBACK_3', snippet: { title: 'Brasil Classics (Backup)', channelTitle: 'System' } },
    { id: 'PL_FALLBACK_4', snippet: { title: 'Uploads Recentes (Backup)', channelTitle: 'System' } }
];

const FALLBACK_VIDEOS = {
    'PL_FALLBACK_1': [
        { snippet: { resourceId: { videoId: 'TTBDfpPHsak' }, title: 'Rozi Plain - Help', videoOwnerChannelTitle: 'Rozi Plain', publishedAt: '2022-01-01' } },
        { snippet: { resourceId: { videoId: 'gFdUFVz5Z6M' }, title: 'Field Music - Orion From The Street', videoOwnerChannelTitle: 'Field Music', publishedAt: '2021-01-01' } }
    ],
    // Adiciona vídeos genéricos para os outros fallbacks se necessário para teste
};


// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = window.supabase.createClient(SB_URL, SB_KEY);

// --- DEV CONSOLE LOGIC ---
function initDevConsole() {
    const trigger = document.getElementById('dev-debug-trigger');
    const panel = document.getElementById('dev-debug-console');
    const close = document.getElementById('dev-console-close');
    const clear = document.getElementById('dev-console-clear');
    const output = document.getElementById('dev-console-output');

    if (trigger && panel) {
        // Mostra o botão apenas quando o console é inicializado
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

    // Logger interno
    const logToPanel = (msg) => {
        if (!output) return;
        const line = document.createElement('div');
        line.innerText = `> ${msg}`;
        line.className = "border-b border-red-900/30 pb-1";
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        
        // Alerta visual no botão
        if(trigger) {
            trigger.classList.add('animate-pulse', 'bg-red-500');
            setTimeout(() => trigger.classList.remove('animate-pulse', 'bg-red-500'), 2000);
        }
    };

    // Capture Window Errors
    window.onerror = function(message, source, lineno, colno, error) {
        const cleanSource = source ? source.split('/').pop() : 'inline';
        logToPanel(`ERR: ${message} (${cleanSource}:${lineno})`);
        return false;
    };

    // Capture Unhandled Promises
    window.addEventListener('unhandledrejection', function(event) {
        logToPanel(`PROMISE: ${event.reason}`);
    });

    // Capture console.error
    const originalError = console.error;
    console.error = function(...args) {
        originalError.apply(console, args);
        logToPanel(`LOG: ${args.join(' ')}`);
    };
    
    // Capture console.log para debug da API
    const originalLog = console.log;
    console.log = function(...args) {
        originalLog.apply(console, args);
        // Filtra logs muito barulhentos se necessário
        if(args[0] && typeof args[0] === 'string' && args[0].includes('[Script]')) {
             logToPanel(`INFO: ${args.join(' ')}`);
        }
    };
    
    console.log("[System] Debug Console Initialized & Active");
}

// --- ESTADO & UI ---
const state = {
    isOn: false,
    isSearchOpen: false,
    currentPlaylistId: null,
    playlists: []
};

const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    
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
    closeGuideBtn: document.getElementById('close-guide-btn'), 
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

let player;
let currentTimers = [];
let currentPlaylistVideos = {};
let osdTimer = null;

// --- INICIALIZAÇÃO ---

async function init() {
    // Inicializa o console após 2 segundos para otimização
    setTimeout(() => {
        initDevConsole();
    }, 2000);
    
    populateDecorations();
    startClock();
    setupEventListeners();
    
    // Tenta carregar as playlists do canal
    await fetchChannelPlaylists();

    // Carrega o script da API do YouTube
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// --- API FETCHING ---

async function fetchChannelPlaylists() {
    let allPlaylists = [];
    let nextPageToken = '';
    
    console.log("[Script] Buscando playlists...");
    
    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error(`[API Error] Status: ${response.status}`);
                const errData = await response.json();
                console.error("YouTube Error Details:", JSON.stringify(errData));
                break; 
            }

            const data = await response.json();
            
            if (data.items) {
                allPlaylists = [...allPlaylists, ...data.items];
            } else {
                 console.warn("[API Warning] Resposta sem itens:", data);
            }
            
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);

        if (allPlaylists.length > 0) {
            console.log(`[Script] ${allPlaylists.length} playlists carregadas da API.`);
            state.playlists = allPlaylists;
            renderChannelGuide(allPlaylists);
            state.currentPlaylistId = allPlaylists[0].id;
        } else {
            throw new Error("Nenhuma playlist encontrada na API.");
        }

    } catch (error) {
        console.error("FALHA CRÍTICA NA API. Ativando Modo de Segurança (Fallback).", error);
        
        // ATIVAR FALLBACK
        state.playlists = FALLBACK_PLAYLISTS;
        renderChannelGuide(FALLBACK_PLAYLISTS);
        state.currentPlaylistId = FALLBACK_PLAYLISTS[0].id;
        
        if(els.channelGuideContainer) {
            const warning = document.createElement('div');
            warning.className = "text-red-500 font-mono text-xs mt-2 px-4";
            warning.innerText = "⚠ MODO DE SEGURANÇA: API OFFLINE";
            els.channelGuideContainer.prepend(warning);
        }
    }
}

async function fetchPlaylistItems(playlistId) {
    // Verifica se é uma playlist de fallback
    if (playlistId.startsWith('PL_FALLBACK')) {
        console.log("[Script] Carregando dados de fallback para playlist:", playlistId);
        const fallbackItems = FALLBACK_VIDEOS[playlistId] || FALLBACK_VIDEOS['PL_FALLBACK_1'];
        processPlaylistItems(fallbackItems);
        return true;
    }

    try {
        let allItems = [];
        let nextPageToken = '';
        
        // Loop simples para pegar páginas (limite 2 páginas para não estourar cota no play)
        let pageCount = 0;
        
        do {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`);
            const data = await response.json();

            if (data.error) {
                console.error("[API Error] Erro ao buscar itens:", data.error.message);
                return false;
            }

            if (data.items) {
                allItems = [...allItems, ...data.items];
            }
            nextPageToken = data.nextPageToken || '';
            pageCount++;
        } while(nextPageToken && pageCount < 2);

        if (allItems.length > 0) {
            processPlaylistItems(allItems);
            return true;
        }
        return false;

    } catch (error) {
        console.error("Erro ao buscar vídeos:", error);
        return false;
    }
}

function processPlaylistItems(items) {
    currentPlaylistVideos = {};

    items.forEach(item => {
        const snippet = item.snippet;
        const videoId = snippet.resourceId.videoId;
        
        // Tenta extrair Artista - Música do título
        let artist = snippet.videoOwnerChannelTitle || snippet.channelTitle || "Desconhecido";
        let song = snippet.title;
        let album = "-"; 
        
        // Lógica de parser de título simples
        if (snippet.title && snippet.title.includes('-')) {
            const parts = snippet.title.split('-');
            artist = parts[0].trim();
            song = parts.slice(1).join('-').trim();
        }

        currentPlaylistVideos[videoId] = {
            artist: artist,
            song: song,
            album: album,
            year: snippet.publishedAt ? snippet.publishedAt.substring(0, 4) : "-",
            director: "-" 
        };
    });
}

// --- NEW GUIDE RENDERING (TELETEXT STYLE) ---
function renderChannelGuide(playlists) {
    if(!els.channelGuideContainer) return;
    
    els.channelGuideContainer.innerHTML = '';
    
    const groups = {
        'UPLOADS': [], 'ZONES': [], 'GENRES': [], 'ERAS': [], 'BRASIL': [], 'OTHERS': []
    };

    playlists.forEach((playlist, index) => {
        const title = playlist.snippet.title;
        const lowerTitle = title.toLowerCase();
        const num = (index + 1).toString().padStart(3, '0'); // P100 style
        
        let category = 'OTHERS';

        if (lowerTitle.includes('upload') || lowerTitle.includes('envios')) {
            category = 'UPLOADS';
        } else if (lowerTitle.includes('zone')) {
            category = 'ZONES';
        } else if (lowerTitle.includes('brasil') || lowerTitle.includes('brazil') || lowerTitle.includes('mpb')) {
            category = 'BRASIL';
        } else if (lowerTitle.match(/\b(19|20)\d{2}\b/)) { 
            category = 'ERAS';
        } else if (lowerTitle.includes('pop') || lowerTitle.includes('rock') || lowerTitle.includes('jazz') || lowerTitle.includes('blues') || lowerTitle.includes('indie') || lowerTitle.includes('folk') || lowerTitle.includes('hop')) {
            category = 'GENRES';
        }

        groups[category].push({
            id: playlist.id,
            display: title,
            num: num
        });
    });

    const renderOrder = ['UPLOADS', 'ZONES', 'ERAS', 'GENRES', 'BRASIL', 'OTHERS'];
    
    renderOrder.forEach(cat => {
        if (groups[cat].length > 0) {
            // Teletext Header
            const header = document.createElement('div');
            header.className = "teletext-header text-xl md:text-2xl font-bold mb-1 px-1 uppercase tracking-wider col-span-full mt-4";
            header.textContent = `${cat}`;
            els.channelGuideContainer.appendChild(header);

            // List Items (Teletext Links)
            groups[cat].forEach(item => {
                const btn = document.createElement('button');
                btn.className = "teletext-link w-full text-left truncate guide-item";
                
                // Formato Teletext: Num (Amarelo) + Nome (Ciano/Branco)
                btn.innerHTML = `<span>${item.num}</span> ${item.display}`;
                
                btn.dataset.id = item.id;
                btn.dataset.name = item.display;
                
                btn.addEventListener('click', () => changeChannel(item.id, `CH ${item.num}`));
                
                els.channelGuideContainer.appendChild(btn);
            });
        }
    });
}

function filterChannels(searchTerm) {
    if(!els.channelGuideContainer) return;
    const term = searchTerm.toLowerCase();
    
    const items = els.channelGuideContainer.querySelectorAll('.guide-item');
    let count = 0;

    items.forEach(item => {
        if(item.dataset.name.toLowerCase().includes(term)) {
            item.style.display = 'block';
            count++;
        } else {
            item.style.display = 'none';
        }
    });
    return count;
}

async function changeChannel(playlistId, displayText) {
    state.currentPlaylistId = playlistId;
    triggerStatic(); 
    
    if(state.isSearchOpen) {
        toggleSearchMode();
    }

    // Update OSD Channel Text
    els.osdChannel.innerText = displayText;

    if(state.isOn) {
        showStatus("TUNING...");
        
        // Carrega itens da nova playlist (API ou Fallback)
        await fetchPlaylistItems(state.currentPlaylistId);

        if (player && player.loadPlaylist) {
            // Se for fallback, precisamos carregar os vídeos manualmente um por um ou playlist custom
            // Como o player do YouTube não aceita ID de playlist falsa, verificamos:
            if (playlistId.startsWith('PL_FALLBACK')) {
                 // Para fallback, carregamos a lista de IDs de vídeo que temos no FALLBACK_VIDEOS
                 const fallbackVids = FALLBACK_VIDEOS[playlistId] || FALLBACK_VIDEOS['PL_FALLBACK_1'];
                 const videoIds = fallbackVids.map(v => v.snippet.resourceId.videoId);
                 player.loadPlaylist(videoIds);
            } else {
                 player.loadPlaylist({listType: 'playlist', list: state.currentPlaylistId});
            }
            hideStatus();
        }
    }
}

// --- VISUAL SETUP ---

function populateDecorations() {
    if(els.ventContainer) {
        els.ventContainer.innerHTML = '';
        for(let i=0; i<24; i++) {
            const div = document.createElement('div');
            div.className = 'w-1 h-full bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)] mx-[1px]';
            els.ventContainer.appendChild(div);
        }
    }
    
    els.speakerGrids.forEach(grid => {
        grid.innerHTML = '';
        for(let i=0; i<36; i++) {
            const div = document.createElement('div');
            div.className = 'w-full h-[2px] bg-[#050505]';
            grid.appendChild(div);
        }
    });
}

function startClock() {
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        els.osdClock.innerText = timeStr;
        if(els.guideClock) els.guideClock.innerText = timeStr;
    }, 1000);
}

// --- EFEITOS VISUAIS ---
function triggerStatic() {
    if(els.staticOverlay) {
        els.staticOverlay.classList.add('active');
        setTimeout(() => {
            els.staticOverlay.classList.remove('active');
        }, 1000); 
    }
}

// --- YOUTUBE API CALLBACK ---
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'playsinline': 1,
            'autoplay': 0, 
            'controls': 0, 
            'modestbranding': 1,
            'rel': 0,
            'disablekb': 1,
            'fs': 0,
            'iv_load_policy': 3, 
            'listType': 'playlist',
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady(event) {
    // Player Ready
}

function onPlayerError(event) {
    console.log("YouTube Player Error:", event.data);
    if (event.data === 150 || event.data === 101) {
        player.nextVideo();
    }
}

// --- EVENTS & LISTENERS ---

if(els.channelSearch) {
    els.channelSearch.addEventListener('input', (e) => {
        filterChannels(e.target.value);
    });
    
    els.channelSearch.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            const visibleItem = Array.from(els.channelGuideContainer.querySelectorAll('.guide-item')).find(item => item.style.display !== 'none');
            if(visibleItem) {
                visibleItem.click();
            }
        }
    });
}

if(els.closeGuideBtn) {
    els.closeGuideBtn.addEventListener('click', toggleSearchMode);
}

// --- CONTROLS & LOGIC ---

function setupControls() {
    // Search / Guide
    if(els.btnSearch) {
        els.btnSearch.onclick = () => {
             if(!state.isOn) return;
             toggleSearchMode();
        };
    }

    // Next Track
    if(els.btnNext) {
        els.btnNext.onclick = () => {
            if(!state.isOn) return;
            if(state.isSearchOpen) return; 
            
            triggerStatic();

            if(player && typeof player.nextVideo === 'function') {
                showStatus("FF >>|");
                player.nextVideo();
                setTimeout(hideStatus, 1500);
            } else {
                showStatus("WAIT...");
            }
        };
    }

    // Previous Track
    if(els.btnPrev) {
        els.btnPrev.onclick = () => {
            if(!state.isOn) return;
            if(state.isSearchOpen) return;
            
            triggerStatic();

            if(player && typeof player.previousVideo === 'function') {
                showStatus("|<< REW");
                player.previousVideo();
                setTimeout(hideStatus, 1500);
            } else {
                showStatus("WAIT...");
            }
        };
    }
}

function toggleSearchMode() {
    state.isSearchOpen = !state.isSearchOpen;

    if(state.isSearchOpen) {
        // OPEN MENU (Teletext Mode)
        if(player && typeof player.pauseVideo === 'function') {
            player.pauseVideo();
        }

        // UPDATE "NOW PLAYING"
        if(player && player.getVideoData) {
            const videoData = player.getVideoData();
            const currentVidId = videoData.video_id;
            
            const displayData = currentPlaylistVideos[currentVidId] || { 
                artist: videoData.author, 
                song: videoData.title 
            };

            els.guideNowPlaying.classList.remove('hidden');
            els.npTitle.textContent = `${displayData.artist} - ${displayData.song}`;
            els.npId.textContent = `ID: ${currentVidId}`;
            
            const currentListObj = state.playlists.find(p => p.id === state.currentPlaylistId);
            els.npPlaylist.textContent = `LIST: ${currentListObj ? currentListObj.snippet.title : '???'}`;
        }

        els.internalGuide.classList.remove('hidden');
        els.channelSearch.value = '';
        els.channelSearch.focus();
        filterChannels(''); 
        
    } else {
        // CLOSE MENU
        els.internalGuide.classList.add('hidden');
        if(player && typeof player.playVideo === 'function') {
            player.playVideo();
        }
    }
}

// --- TV POWER ---
function togglePower() {
    state.isOn = !state.isOn;
    
    // Animação de ligar/desligar CRT
    if (state.isOn) {
        els.screenOn.classList.remove('hidden');
        els.screenOn.classList.add('crt-turn-on');
        els.screenOn.classList.remove('crt-turn-off');
        
        // Remove a classe de animação após o fim para economizar recursos, mas mantém visível
        setTimeout(() => {
             els.screenOn.classList.remove('crt-turn-on');
        }, 500);

    } else {
        els.screenOn.classList.add('crt-turn-off');
        els.screenOn.classList.remove('crt-turn-on');
        
        setTimeout(() => {
            if(!state.isOn) els.screenOn.classList.add('hidden');
            els.screenOn.classList.remove('crt-turn-off');
        }, 350);
    }
    
    updateUI();
    
    if (state.isOn) {
        showStatus("INITIALIZING...");
        setTimeout(() => showStatus("TUNING..."), 800);
        
        if (state.currentPlaylistId && Object.keys(currentPlaylistVideos).length === 0) {
            fetchPlaylistItems(state.currentPlaylistId).then(() => {
                triggerPlay();
            });
        } else {
            triggerPlay();
        }

    } else {
        hideStatus();
        if(state.isSearchOpen) toggleSearchMode(); 
        if(player && player.pauseVideo) {
            player.pauseVideo();
        }
        clearAllTimers();
        hideCredits();
        hideInfoPanel();
    }
}

function triggerPlay() {
    setTimeout(() => {
        hideStatus();
        if(player && player.playVideo) {
            const playlistNow = player.getPlaylistId();
            
            // Check if current playlist is a real YT playlist or fallback
            if (state.currentPlaylistId.startsWith('PL_FALLBACK')) {
                 const fallbackVids = FALLBACK_VIDEOS[state.currentPlaylistId] || FALLBACK_VIDEOS['PL_FALLBACK_1'];
                 const videoIds = fallbackVids.map(v => v.snippet.resourceId.videoId);
                 player.loadPlaylist(videoIds);
            } else if (playlistNow !== state.currentPlaylistId && state.currentPlaylistId) {
                 player.loadPlaylist({listType: 'playlist', list: state.currentPlaylistId});
            } else {
                 player.playVideo();
            }
        }
    }, 1600);
}

function updateUI() {
    if (state.isOn) {
        els.powerLed.classList.add('bg-red-500', 'shadow-[0_0_8px_#ff0000]', 'saturate-200');
        els.powerLed.classList.remove('bg-red-900');
        els.screenOff.classList.add('opacity-0');
    } else {
        els.powerLed.classList.remove('bg-red-500', 'shadow-[0_0_8px_#ff0000]', 'saturate-200');
        els.powerLed.classList.add('bg-red-900');
        els.screenOff.classList.remove('opacity-0');
        
        if(els.internalGuide) els.internalGuide.classList.add('hidden');
    }
}

function showStatus(msg) {
    if (els.statusText && els.statusMessage) {
        els.statusText.innerText = msg;
        els.statusMessage.classList.remove('hidden');
    }
}

function hideStatus() {
    if (els.statusMessage) {
        els.statusMessage.classList.add('hidden');
    }
}

// --- CRÉDITOS & LAST.FM ---

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        els.osdLayer.classList.remove('fade-out');
        
        if (osdTimer) clearTimeout(osdTimer);
        osdTimer = setTimeout(() => {
            els.osdLayer.classList.add('fade-out');
        }, 3000);

        const videoId = player.getVideoData().video_id;
        const duration = player.getDuration();
        handleCreditsForVideo(videoId, duration);

    } else {
        els.osdLayer.classList.remove('fade-out');
        if (osdTimer) clearTimeout(osdTimer);

        if (event.data == YT.PlayerState.ENDED) {
            hideCredits();
            hideInfoPanel();
        }
    }
}

// Limpeza de string para API Last.FM
function cleanStringForApi(str) {
    if (!str) return "";
    return str
        .replace(/\(.*\)/g, '')   
        .replace(/\[.*\]/g, '')
        .replace(/\|.*$/g, '') 
        .replace(/- topic$/i, '')
        .replace(/ft\..*/i, '')   
        .replace(/feat\..*/i, '')
        .replace(/featuring.*/i, '')
        .replace(/official video/gi, '')
        .replace(/video oficial/gi, '')
        .replace(/music video/gi, '')
        .replace(/lyric video/gi, '')
        .replace(/videoclipe/gi, '')
        .replace(/full album/gi, '')
        .replace(/"/g, '') 
        .replace(/\s+/g, ' ') 
        .trim();
}

async function handleCreditsForVideo(videoId, duration) {
    clearAllTimers();
    hideCredits();
    hideInfoPanel(); 

    // 1. Dados iniciais de Fallback
    let finalData = currentPlaylistVideos[videoId];
    
    if (!finalData) {
        const playerTitle = player.getVideoData().title;
        const playerAuthor = player.getVideoData().author;
        
        finalData = {
            artist: playerAuthor || "Unknown",
            song: playerTitle || "Unknown Track",
            album: "-",
            year: "-",
            director: "-"
        };
    }

    // 2. Consulta ao Banco de Dados Supabase
    try {
        const { data: dbData, error } = await supabase
            .from('musicas')
            .select('artista, musica, album, ano, direcao')
            .eq('video_id', videoId)
            .maybeSingle();

        if (dbData) {
            finalData = {
                artist: dbData.artista || finalData.artist,
                song: dbData.musica || finalData.song,
                album: dbData.album || finalData.album,
                year: dbData.ano ? dbData.ano.toString() : finalData.year,
                director: dbData.direcao || finalData.director
            };
        }
    } catch (err) {
        console.warn("Erro Supabase:", err);
    }

    // 3. Atualiza Créditos (TV)
    updateCreditsDOM(finalData);

    const showAtStart = 4000;
    const displayDuration = 2500;
    
    currentTimers.push(setTimeout(() => showCredits(), showAtStart));
    currentTimers.push(setTimeout(() => hideCredits(), showAtStart + displayDuration));

    if (duration > 60) {
        currentTimers.push(setTimeout(() => showCredits(), (duration - 30) * 1000));
        currentTimers.push(setTimeout(() => hideCredits(), (duration - 5) * 1000));
    }

    // 4. CHAMADA LAST.FM
    setTimeout(async () => {
        // Estado visual de "carregando"
        if(els.infoContent) els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-amber-900/50"><span class="animate-pulse">TUNING DATA...</span></div>';
        
        const cleanArtist = cleanStringForApi(finalData.artist);
        const cleanSong = cleanStringForApi(finalData.song);

        console.log(`[Script] Query LastFM: Artist='${cleanArtist}' Song='${cleanSong}'`);

        const lastFmData = await fetchTrackDetails(cleanArtist, cleanSong);
        
        if (lastFmData) {
            updateInfoPanel(lastFmData);
            showInfoPanel();
        } else {
            console.log("[Script] LastFM: Sem dados para exibir.");
            // Opcional: mostrar mensagem de erro na UI ou apenas esconder
            if(els.infoContent) els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-amber-900/30"><span>DATA UNAVAILABLE</span></div>';
        }
    }, 4500); 
}

function updateCreditsDOM(data) {
    const setText = (el, text) => {
        if (!el) return;
        if (text && (text.includes('ft.') || text.includes('&') || text.includes('OST'))) {
             el.className = 'light';
        } else {
             el.className = '';
        }
        el.textContent = text || '';
    };

    setText(els.credits.artist, data.artist);
    setText(els.credits.song, data.song);
    setText(els.credits.album, data.album);
    setText(els.credits.year, data.year);
    setText(els.credits.director, data.director);
}

function updateInfoPanel(data) {
    if(!els.infoContent) return;
    
    let html = '';
    
    html += `<div class="mb-4">
        <h4 class="text-amber-500 font-bold text-2xl leading-none uppercase">${data.titulo}</h4>
        <span class="text-amber-700 text-sm uppercase">${data.artista}</span>
    </div>`;

    if (data.tags && data.tags.length) {
        html += `<div class="flex flex-wrap gap-2 mb-4">
            ${data.tags.map(tag => `<span class="px-2 py-0.5 border border-amber-900/60 text-amber-600 text-xs uppercase rounded">${tag}</span>`).join('')}
        </div>`;
    }

    if (data.curiosidade) {
        html += `<div class="text-amber-300/90 text-base border-l-2 border-amber-900/50 pl-3">
            ${data.curiosidade}
        </div>`;
    } else {
        // Fallback visual se não houver texto de curiosidade
        html += `<div class="text-amber-900/50 text-sm italic border-l-2 border-amber-900/20 pl-3">
            ARCHIVE DATA: BIOGRAPHY MISSING.
        </div>`;
    }

    els.infoContent.innerHTML = html;
}

function showCredits() {
    if(els.credits.container) els.credits.container.classList.add('visible');
}

function hideCredits() {
    if(els.credits.container) els.credits.container.classList.remove('visible');
}

function showInfoPanel() {
    if(els.infoPanel) els.infoPanel.classList.add('active');
}

function hideInfoPanel() {
    if(els.infoPanel) els.infoPanel.classList.remove('active');
}

function clearAllTimers() {
    currentTimers.forEach(timerId => clearTimeout(timerId));
    currentTimers = [];
}

function setupEventListeners() {
    els.tvPowerBtn.addEventListener('click', togglePower);
    setupControls();
}

init();
