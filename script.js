
// --- CONFIGURAÇÃO API YOUTUBE ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';

// IMPORTANTE: Como estamos usando apenas uma API Key (e não login OAuth),
// precisamos do ID do canal para buscar as playlists públicas dele.
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA'; // Exemplo: Canal provisório (troque pelo seu)

// --- ESTADO & UI ---
const state = {
    isOn: false,
    currentPlaylistId: null, // Agora usamos o ID real do YouTube
    playlists: [] // Será preenchido pela API
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
    playlistSelector: document.getElementById('playlist-selector'),
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
// Cache local dos vídeos da playlist atual para os créditos
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
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}`);
        const data = await response.json();

        if (data.items) {
            state.playlists = data.items;
            populatePlaylistSelector(data.items);
            
            // Define a primeira playlist como padrão se houver
            if (data.items.length > 0) {
                state.currentPlaylistId = data.items[0].id;
            }
        } else {
            console.error("Nenhuma playlist encontrada ou erro na API:", data);
            showStatus("API ERROR");
        }
    } catch (error) {
        console.error("Erro ao buscar playlists:", error);
        showStatus("NETWORK ERROR");
    }
}

async function fetchPlaylistItems(playlistId) {
    try {
        // Busca até 50 vídeos da playlist
        const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}`);
        const data = await response.json();

        if (data.items) {
            // Limpa cache anterior
            currentPlaylistVideos = {};

            // Mapeia os dados para nosso formato de créditos
            data.items.forEach(item => {
                const snippet = item.snippet;
                const videoId = snippet.resourceId.videoId;
                
                // Parser simples de Título para extrair Artista - Música
                // Espera formato "Artista - Música" no título do vídeo
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
                    album: album, // A API não retorna álbum, deixamos genérico
                    year: snippet.publishedAt ? snippet.publishedAt.substring(0, 4) : "-",
                    director: "-" // A API não retorna diretor explicitamente (geralmente está na description)
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

function populatePlaylistSelector(playlists) {
    els.playlistSelector.innerHTML = '';
    
    playlists.forEach((playlist, index) => {
        const option = document.createElement('option');
        option.value = playlist.id;
        // Formato CH 01: NOME DA PLAYLIST
        const num = (index + 1).toString().padStart(2, '0');
        option.textContent = `CH ${num}: ${playlist.snippet.title}`;
        els.playlistSelector.appendChild(option);
    });
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
            'listType': 'playlist', // Configuração inicial genérica
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady(event) {
    // Se já temos uma playlist selecionada (fetch terminou antes do player), preparamos
    if (state.currentPlaylistId) {
        player.cuePlaylist({listType: 'playlist', list: state.currentPlaylistId});
    }
}

function onPlayerError(event) {
    console.log("YouTube Player Error:", event.data);
    // Erro 150/101 significa restrição de embed. Pula para o próximo.
    if (event.data === 150 || event.data === 101) {
        player.nextVideo();
    }
}

// --- CONTROLE DE PLAYLIST ---
els.playlistSelector.addEventListener('change', async (e) => {
    state.currentPlaylistId = e.target.value;
    
    // Atualiza Texto do Canal na TV
    const channelIndex = e.target.selectedIndex + 1;
    els.osdChannel.innerText = `CH 0${channelIndex}`;

    showStatus("TUNING...");
    
    // Busca os metadados dos vídeos para os créditos
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
});

// --- REMOTE CONTROL LOGIC ---
function setupRemoteControl() {
    // Next Track (Up Button / ▲)
    if(els.btnNext) {
        els.btnNext.addEventListener('click', () => {
            if(!state.isOn) return;
            blinkRemoteLight();
            
            // Verifica se o player e o método existem
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

    // Previous Track (Down Button / ▼)
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

// --- TV POWER LOGIC ---
function togglePower() {
    state.isOn = !state.isOn;
    
    updateUI();
    blinkRemoteLight();
    
    if (state.isOn) {
        // Turn ON
        showStatus("INITIALIZING...");
        setTimeout(() => showStatus("TUNING..."), 800);
        
        // Garante que temos os metadados da playlist atual
        if (state.currentPlaylistId && Object.keys(currentPlaylistVideos).length === 0) {
            fetchPlaylistItems(state.currentPlaylistId).then(() => {
                // Só dá play depois de tentar buscar metadados
                triggerPlay();
            });
        } else {
            triggerPlay();
        }

    } else {
        // Turn OFF
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
            // Se o player ainda não carregou a lista (primeiro boot), carrega agora
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

// --- LÓGICA DE CRÉDITOS ---

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

    // Tenta pegar do nosso cache da API, ou cria um fallback com dados básicos do player
    let data = currentPlaylistVideos[videoId];
    
    if (!data) {
        // Fallback: Tenta pegar o título direto do player se a API falhou
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

    // Timings
    const showAtStart = 6000; // 6s
    const hideAtStart = 20000; // 20s
    
    // Safety check para vídeos muito curtos
    if (duration > 30) {
        currentTimers.push(setTimeout(() => showCredits(), showAtStart));
        currentTimers.push(setTimeout(() => hideCredits(), hideAtStart));

        if (duration > 60) {
            const showAtEnd = (duration - 30) * 1000;
            const hideAtEnd = (duration - 5) * 1000;
            currentTimers.push(setTimeout(() => showCredits(), showAtEnd));
            currentTimers.push(setTimeout(() => hideCredits(), hideAtEnd));
        }
    } else {
        // Vídeos curtos mostram logo e ficam menos tempo
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
    
    // Initialize Remote Controls
    setupRemoteControl();
}

// Start
init();
