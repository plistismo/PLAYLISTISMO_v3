

// --- CONFIGURAÇÃO API YOUTUBE ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA'; // Exemplo: Canal provisório (troque pelo seu)

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
    
    // TV Chassis Buttons
    btnNext: document.getElementById('tv-ch-next'),
    btnPrev: document.getElementById('tv-ch-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    
    osdClock: document.getElementById('osd-clock'),
    statusMessage: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    
    // Fullscreen Guide Elements
    internalGuide: document.getElementById('tv-internal-guide'),
    closeGuideBtn: document.getElementById('close-guide-btn'),
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
    
    // showStatus("SCANNING..."); // Avoid showing scanning on boot before ON

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
        } else {
            console.error("Nenhuma playlist encontrada.");
            if(els.channelGuideContainer) {
                els.channelGuideContainer.innerHTML = '<div class="text-white/50 text-center mt-4">NO SIGNAL</div>';
            }
        }
    } catch (error) {
        console.error("Erro ao buscar playlists:", error);
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
            header.className = "text-yellow-400 text-lg md:text-xl font-bold border-b border-white/20 mt-6 mb-2 px-1 uppercase tracking-widest guide-category";
            header.textContent = `[ ${cat} ]`;
            els.channelGuideContainer.appendChild(header);

            // List Container
            const list = document.createElement('div');
            list.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3";
            
            groups[cat].forEach(item => {
                const btn = document.createElement('button');
                btn.className = "guide-item text-left bg-blue-900/50 hover:bg-yellow-400 hover:text-black text-white p-3 font-mono truncate transition-all border border-blue-700 rounded shadow-md group";
                
                // Formata o texto para parecer teletexto
                btn.innerHTML = `<span class="text-yellow-200 group-hover:text-black font-bold mr-2">${item.display.split(':')[0]}</span> ${item.display.split(':')[1]}`;
                
                btn.dataset.id = item.id;
                btn.dataset.name = item.display; // for search
                
                btn.addEventListener('click', () => changeChannel(item.id, item.display));
                
                list.appendChild(btn);
            });
            
            els.channelGuideContainer.appendChild(list);
        }
    });
}

function filterChannels(searchTerm) {
    if(!els.channelGuideContainer) return;
    const term = searchTerm.toLowerCase();
    
    const items = els.channelGuideContainer.querySelectorAll('.guide-item');
    let count = 0;

    items.forEach(item => {
        // Search in dataset name
        if(item.dataset.name.toLowerCase().includes(term)) {
            item.style.display = 'block';
            count++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Hide empty category headers logic could go here, but kept simple for now
    return count;
}

async function changeChannel(playlistId, displayText) {
    state.currentPlaylistId = playlistId;
    
    // Close Search Menu if open
    if(state.isSearchOpen) {
        toggleSearchMode();
    }

    // Update OSD Channel Text
    const channelMatch = displayText.match(/CH \d+/);
    if(channelMatch) {
        els.osdChannel.innerText = channelMatch[0];
    } else {
         els.osdChannel.innerText = "CH --";
    }

    if(state.isOn) {
        showStatus("TUNING...");
        await fetchPlaylistItems(state.currentPlaylistId);

        if (player && player.loadPlaylist) {
            player.loadPlaylist({listType: 'playlist', list: state.currentPlaylistId});
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
    // Player Ready
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
    
    // Enter key to select first result
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
    // Search / Menu Toggle
    if(els.btnSearch) {
        els.btnSearch.onclick = () => {
             // Only works if TV is ON
             if(!state.isOn) return;
             toggleSearchMode();
        };
    }

    // Next Track / Channel
    if(els.btnNext) {
        els.btnNext.onclick = () => {
            if(!state.isOn) return;
            if(state.isSearchOpen) return; 
            
            // Log for debug
            console.log("Next clicked");

            if(player && typeof player.nextVideo === 'function') {
                showStatus("NEXT TRACK >>|");
                player.nextVideo();
                setTimeout(hideStatus, 1500);
            } else {
                showStatus("WAIT...");
            }
        };
    }

    // Previous Track / Channel
    if(els.btnPrev) {
        els.btnPrev.onclick = () => {
            if(!state.isOn) return;
            if(state.isSearchOpen) return;

             console.log("Prev clicked");

            if(player && typeof player.previousVideo === 'function') {
                showStatus("|<< PREV TRACK");
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
        // OPEN MENU (Fullscreen)
        if(player && typeof player.pauseVideo === 'function') {
            player.pauseVideo();
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
        if(state.isSearchOpen) toggleSearchMode(); // Reset search if off
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
    } else {
        els.powerLed.classList.remove('bg-red-500', 'shadow-[0_0_8px_#ff0000]', 'saturate-200');
        els.powerLed.classList.add('bg-red-900');
        els.screenOff.classList.remove('opacity-0');
        
        // Ensure menu is closed visually
        if(els.internalGuide) els.internalGuide.classList.add('hidden');

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
    const displayDuration = 15000; 
    
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
    setupControls();
}

init();