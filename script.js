

// --- CONFIGURAÇÃO API YOUTUBE ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA'; // Exemplo: Canal provisório (troque pelo seu)

// --- ESTADO & UI ---
const state = {
    isOn: false,
    currentPlaylistId: null,
    playlists: []
};

const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    remoteLight: document.getElementById('remote-light'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    remotePowerBtn: document.getElementById('remote-power-btn'),
    // Remote Control Buttons
    btnNext: document.getElementById('btn-next'),
    btnPrev: document.getElementById('btn-prev'),
    
    osdClock: document.getElementById('osd-clock'),
    statusMessage: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    
    // Internal TV Guide Elements
    internalGuide: document.getElementById('tv-internal-guide'),
    channelGuideContainer: document.getElementById('channel-guide-container'),
    channelSearch: document.getElementById('channel-search'),
    
    osdChannel: document.getElementById('osd-channel'),
    ventContainer: document.querySelector('.vent-container'),
    speakerGrids: document.querySelectorAll('.speaker-grid'),
    
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

// --- INICIALIZAÇÃO ---

async function init() {
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
    
    showStatus("SCANNING...");

    try {
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.items) {
                allPlaylists = [...allPlaylists, ...data.items];
            }
            
            nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);

        if (allPlaylists.length > 0) {
            state.playlists = allPlaylists;
            renderChannelGuide(allPlaylists);
            state.currentPlaylistId = allPlaylists[0].id;
            hideStatus();
        } else {
            console.error("Nenhuma playlist encontrada.");
            if(els.channelGuideContainer) {
                els.channelGuideContainer.innerHTML = '<div class="text-red-500 text-xs p-2">NO SIGNAL</div>';
            }
            showStatus("NO SIGNAL");
        }
    } catch (error) {
        console.error("Erro ao buscar playlists:", error);
        showStatus("NETWORK ERROR");
    }
}

async function fetchPlaylistItems(playlistId) {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}`);
        const data = await response.json();

        if (data.items) {
            currentPlaylistVideos = {};

            data.items.forEach(item => {
                const snippet = item.snippet;
                const videoId = snippet.resourceId.videoId;
                
                // Tenta extrair Artista - Música do título
                let artist = snippet.videoOwnerChannelTitle || snippet.channelTitle;
                let song = snippet.title;
                let album = "-"; 
                
                if (snippet.title.includes('-')) {
                    const parts = snippet.title.split('-');
                    artist = parts[0].trim();
                    song = parts.slice(1).join('-').trim();
                }

                currentPlaylistVideos[videoId] = {
                    artist: artist,
                    song: song,
                    album: album,
                    year: snippet.publishedAt ? snippet.publishedAt.substring(0, 4) : "-",
                    director: "-" // A descrição (snippet.description) pode conter isso, mas precisa de parser complexo
                };
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error("Erro ao buscar vídeos:", error);
        return false;
    }
}

// --- NEW GUIDE RENDERING ---
function renderChannelGuide(playlists) {
    if(!els.channelGuideContainer) return;
    
    els.channelGuideContainer.innerHTML = '';
    
    const groups = {
        'UPLOADS': [], 'ZONES': [], 'GENRES': [], 'ERAS': [], 'BRASIL': [], 'OTHERS': []
    };

    playlists.forEach((playlist, index) => {
        const title = playlist.snippet.title;
        const lowerTitle = title.toLowerCase();
        const num = (index + 1).toString().padStart(2, '0');
        
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

        // Store object for rendering
        groups[category].push({
            id: playlist.id,
            display: `CH ${num}: ${title}`
        });
    });

    const renderOrder = ['UPLOADS', 'ZONES', 'ERAS', 'GENRES', 'BRASIL', 'OTHERS'];
    
    renderOrder.forEach(cat => {
        if (groups[cat].length > 0) {
            // Category Header
            const header = document.createElement('div');
            header.className = "text-[#444] text-[9px] font-bold border-b border-[#222] mt-2 mb-1 px-1 uppercase tracking-widest guide-category";
            header.textContent = cat;
            els.channelGuideContainer.appendChild(header);

            // List
            const list = document.createElement('ul');
            list.className = "mb-2 list-none";
            
            groups[cat].forEach(item => {
                const li = document.createElement('li');
                li.className = "guide-item text-green-700/80 hover:text-green-400 hover:bg-green-900/20 cursor-pointer text-[10px] px-1 py-0.5 font-mono truncate transition-colors";
                li.textContent = item.display;
                li.dataset.id = item.id;
                li.dataset.name = item.display; // for search
                
                li.addEventListener('click', () => changeChannel(item.id, item.display));
                
                list.appendChild(li);
            });
            
            els.channelGuideContainer.appendChild(list);
        }
    });
}

function filterChannels(searchTerm) {
    if(!els.channelGuideContainer) return;
    const term = searchTerm.toLowerCase();
    
    const items = els.channelGuideContainer.querySelectorAll('.guide-item');
    
    items.forEach(item => {
        if(item.textContent.toLowerCase().includes(term)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

async function changeChannel(playlistId, displayText) {
    state.currentPlaylistId = playlistId;
    
    // Update OSD Channel Text
    const channelMatch = displayText.match(/CH \d+/);
    if(channelMatch) {
        els.osdChannel.innerText = channelMatch[0];
    }

    showStatus("TUNING...");
    
    await fetchPlaylistItems(state.currentPlaylistId);

    if (player && player.loadPlaylist) {
        if (state.isOn) {
            player.loadPlaylist({listType: 'playlist', list: state.currentPlaylistId});
            hideStatus();
        } else {
            player.cuePlaylist({listType: 'playlist', list: state.currentPlaylistId});
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
        els.osdClock.innerText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }, 1000);
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
    if (state.currentPlaylistId) {
        player.cuePlaylist({listType: 'playlist', list: state.currentPlaylistId});
    }
}

function onPlayerError(event) {
    console.log("YouTube Player Error:", event.data);
    if (event.data === 150 || event.data === 101) {
        player.nextVideo();
    }
}

// --- EVENTS & LISTENERS ---

// Search Listener
if(els.channelSearch) {
    els.channelSearch.addEventListener('input', (e) => {
        filterChannels(e.target.value);
    });
}

// --- REMOTE CONTROL ---
function setupRemoteControl() {
    // Next Track (Botão +)
    if(els.btnNext) {
        els.btnNext.addEventListener('click', () => {
            if(!state.isOn) return;
            blinkRemoteLight();
            
            if(player && typeof player.nextVideo === 'function') {
                showStatus("NEXT TRACK >>|");
                player.nextVideo();
                setTimeout(hideStatus, 1500);
            } else {
                showStatus("NO SIGNAL");
                setTimeout(hideStatus, 1000);
            }
        });
    }

    // Previous Track (Botão -)
    if(els.btnPrev) {
        els.btnPrev.addEventListener('click', () => {
            if(!state.isOn) return;
            blinkRemoteLight();
            
            if(player && typeof player.previousVideo === 'function') {
                showStatus("|<< PREV TRACK");
                player.previousVideo();
                setTimeout(hideStatus, 1500);
            } else {
                showStatus("NO SIGNAL");
                setTimeout(hideStatus, 1000);
            }
        });
    }
}

function blinkRemoteLight() {
    if(els.remoteLight) {
        els.remoteLight.classList.add('bg-red-500', 'shadow-[0_0_5px_red]');
        els.remoteLight.classList.remove('bg-red-900');
        setTimeout(() => {
            els.remoteLight.classList.remove('bg-red-500', 'shadow-[0_0_5px_red]');
            els.remoteLight.classList.add('bg-red-900');
        }, 200);
    }
}

// --- TV POWER ---
function togglePower() {
    state.isOn = !state.isOn;
    
    updateUI();
    blinkRemoteLight();
    
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
        if(player && player.pauseVideo) {
            player.pauseVideo();
        }
        clearAllTimers();
        hideCredits();
    }
}

function triggerPlay() {
    setTimeout(() => {
        hideStatus();
        if(player && player.playVideo) {
            const playlistNow = player.getPlaylistId();
            if (playlistNow !== state.currentPlaylistId && state.currentPlaylistId) {
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
        els.screenOn.classList.remove('hidden');
        
        // Show Internal Guide when ON
        if(els.internalGuide) els.internalGuide.classList.remove('opacity-0');
    } else {
        els.powerLed.classList.remove('bg-red-500', 'shadow-[0_0_8px_#ff0000]', 'saturate-200');
        els.powerLed.classList.add('bg-red-900');
        els.screenOff.classList.remove('opacity-0');
        
        // Hide Internal Guide when OFF
        if(els.internalGuide) els.internalGuide.classList.add('opacity-0');

        setTimeout(() => {
            if(!state.isOn) els.screenOn.classList.add('hidden');
        }, 300);
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

// --- CRÉDITOS ---

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        const videoId = player.getVideoData().video_id;
        const duration = player.getDuration();
        handleCreditsForVideo(videoId, duration);
    } else if (event.data == YT.PlayerState.ENDED) {
        hideCredits();
    }
}

function handleCreditsForVideo(videoId, duration) {
    clearAllTimers();
    hideCredits();

    let data = currentPlaylistVideos[videoId];
    
    if (!data) {
        const playerTitle = player.getVideoData().title;
        const playerAuthor = player.getVideoData().author;
        
        data = {
            artist: playerAuthor || "Unknown",
            song: playerTitle || "Unknown Track",
            album: "-",
            year: "-",
            director: "-"
        };
    }

    updateCreditsDOM(data);

    // Duração Estendida
    const showAtStart = 6000; // Começa a aparecer aos 6s
    const displayDuration = 15000; // Fica na tela por 15s (antes era menos)
    
    const hideAtStart = showAtStart + displayDuration;
    
    if (duration > 30) {
        // Créditos iniciais
        currentTimers.push(setTimeout(() => showCredits(), showAtStart));
        currentTimers.push(setTimeout(() => hideCredits(), hideAtStart));

        // Créditos finais
        if (duration > 60) {
            const showAtEnd = (duration - 25) * 1000; // 25s antes de acabar
            const hideAtEnd = (duration - 5) * 1000;
            currentTimers.push(setTimeout(() => showCredits(), showAtEnd));
            currentTimers.push(setTimeout(() => hideCredits(), hideAtEnd));
        }
    } else {
        // Vídeo curto
        currentTimers.push(setTimeout(() => showCredits(), 2000));
        currentTimers.push(setTimeout(() => hideCredits(), duration * 1000 - 1000));
    }
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

function showCredits() {
    if(els.credits.container) els.credits.container.classList.add('visible');
}

function hideCredits() {
    if(els.credits.container) els.credits.container.classList.remove('visible');
}

function clearAllTimers() {
    currentTimers.forEach(timerId => clearTimeout(timerId));
    currentTimers = [];
}

function setupEventListeners() {
    els.tvPowerBtn.addEventListener('click', togglePower);
    if(els.remotePowerBtn) els.remotePowerBtn.addEventListener('click', togglePower);
    
    setupRemoteControl();
}

init();