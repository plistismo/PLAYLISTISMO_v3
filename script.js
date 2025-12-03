// --- BANCO DE DADOS ---
const PLAYLIST_DATA = {
    'folkzone': {
        youtubePlaylistId: 'PL_FolkZone_Playlist_ID_Here', 
        videos: {
            'TTBDfpPHsak': { artist: 'Rozi Plain', song: 'Help', album: 'Prize', year: '2022', director: 'Noriko Okaku' },
            'gFdUFVz5Z6M': { artist: 'Field Music', song: 'Orion From The Street', album: 'Flat White Moon', year: '2021', director: 'Kevin Dosdale' },
            'qFxhHFD2LBE': { artist: 'Gengahr', song: 'Carrion', album: 'Where Wildness Grows', year: '2017', director: 'Dan Jacobs' },
            'QRGqsPBu73I': { artist: 'The Besnard Lakes', song: 'Feuds With Guns', album: 'The Last of the Great Thunderstorm...', year: '2020', director: 'Jordan "Dr.Cool" Minkoff' },
            'zUCtZNoj_ww': { artist: 'Suuns', song: 'Watch You, Watch Me', album: 'Felt', year: '2018', director: 'RUFFMERCY' },
            'xmKEd8E9QY0': { artist: 'Cráneo', song: 'NASA', album: 'single', year: '2018', director: 'Cráneo' },
            'MCPfywB_lVs': { artist: 'Nathy Peluso', song: 'Esmeralda', album: 'single', year: '2017', director: 'Cráneo' },
            'TOy95MU2a80': { artist: 'Angelo De Augustine', song: 'Another Universe', album: 'Toil and Trouble', year: '2023', director: 'Angelo De Augustine' }
        },
        defaultList: ['TTBDfpPHsak', 'gFdUFVz5Z6M', 'qFxhHFD2LBE', 'QRGqsPBu73I']
    },
    'trip_hop': {
        videos: {}, 
        defaultList: ['zUCtZNoj_ww', 'xmKEd8E9QY0'] 
    },
    'mid_pop': {
        videos: {},
        defaultList: ['MCPfywB_lVs']
    },
    'sepia': {
        videos: {},
        defaultList: ['TOy95MU2a80']
    }
};

// --- TV STATE & UI ELEMENTS ---
const state = {
    isOn: false, // Starts OFF
    currentPlaylist: 'folkzone'
};

const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    remoteLight: document.getElementById('remote-light'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    remotePowerBtn: document.getElementById('remote-power-btn'),
    osdClock: document.getElementById('osd-clock'),
    statusMessage: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    playlistSelector: document.getElementById('playlist-selector'),
    osdChannel: document.getElementById('osd-channel'),
    ventContainer: document.querySelector('.vent-container'),
    speakerGrids: document.querySelectorAll('.speaker-grid')
};

// --- CONFIGURAÇÃO PLAYER ---
let player;
let currentTimers = [];

// --- INICIALIZAÇÃO ---

function init() {
    populateDecorations();
    startClock();
    setupEventListeners();
    
    // Carrega o script da API do YouTube
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Populate Vents & Speakers (Visual)
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
    const initialList = PLAYLIST_DATA[state.currentPlaylist].defaultList;
    
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'playsinline': 1,
            'autoplay': 0, // Starts paused because TV is off
            'controls': 0, // Hide default controls for TV look
            'modestbranding': 1,
            'rel': 0,
            'disablekb': 1,
            'fs': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerReady(event) {
    // Se a TV estivesse ligada por padrão, carregaríamos aqui.
    // Como começa desligada, apenas preparamos a lista.
    player.cuePlaylist(PLAYLIST_DATA[state.currentPlaylist].defaultList);
}

// --- CONTROLE DE PLAYLIST ---
els.playlistSelector.addEventListener('change', (e) => {
    state.currentPlaylist = e.target.value;
    
    // Update OSD Channel Text
    const channelIndex = e.target.selectedIndex + 1;
    els.osdChannel.innerText = `CH 0${channelIndex}`;

    // Change Content
    loadPlaylist(state.currentPlaylist);
});

function loadPlaylist(playlistKey) {
    const playlistData = PLAYLIST_DATA[playlistKey];
    if (playlistData && playlistData.defaultList.length > 0 && player && player.loadPlaylist) {
        if(state.isOn) {
             player.loadPlaylist(playlistData.defaultList);
        } else {
             player.cuePlaylist(playlistData.defaultList);
        }
    }
}

// --- TV POWER LOGIC ---
function togglePower() {
    state.isOn = !state.isOn;
    
    updateUI();
    
    if (state.isOn) {
        // Turn ON
        showStatus("INITIALIZING...");
        setTimeout(() => showStatus("TUNING..."), 800);
        setTimeout(() => {
            hideStatus();
            if(player && player.playVideo) {
                player.playVideo();
            }
        }, 1600);
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
        }, 300); // Wait for transition
    }
}

function showStatus(msg) {
    els.statusText.innerText = msg;
    els.statusMessage.classList.remove('hidden');
}

function hideStatus() {
    els.statusMessage.classList.add('hidden');
}

// --- LÓGICA DE CRÉDITOS (Original) ---

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        const videoId = player.getVideoData().video_id;
        const duration = player.getDuration();
        handleCreditsForVideo(videoId, duration);
    } else if (event.data == YT.PlayerState.ENDED || event.data == YT.PlayerState.PAUSED) {
        // Optional logic when paused/ended
    }
}

function handleCreditsForVideo(videoId, duration) {
    clearAllTimers();
    hideCredits();

    const data = findVideoData(videoId);
    if (!data) return;

    updateCreditsDOM(data);

    const showAtStart = 6000; // 6 seconds in
    const hideAtStart = 20000; // 20 seconds in
    const showAtEnd = (duration - 30) * 1000;
    const hideAtEnd = (duration - 5) * 1000;

    currentTimers.push(setTimeout(() => showCredits(), showAtStart));
    currentTimers.push(setTimeout(() => hideCredits(), hideAtStart));

    if (duration > 40) {
        currentTimers.push(setTimeout(() => showCredits(), showAtEnd));
        currentTimers.push(setTimeout(() => hideCredits(), hideAtEnd));
    }
}

function findVideoData(videoId) {
    if (PLAYLIST_DATA[state.currentPlaylist].videos[videoId]) {
        return PLAYLIST_DATA[state.currentPlaylist].videos[videoId];
    }
    for (const key in PLAYLIST_DATA) {
        if (PLAYLIST_DATA[key].videos[videoId]) {
            return PLAYLIST_DATA[key].videos[videoId];
        }
    }
    return {
        artist: "Desconhecido",
        song: "Sinal Não Identificado",
        album: "-",
        year: "-",
        director: "-"
    };
}

function updateCreditsDOM(data) {
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (text && (text.includes('ft.') || text.includes('&') || text.includes('OST'))) {
             el.className = 'light';
        } else {
             el.className = '';
        }
        el.textContent = text || '';
    };

    setText('artist-name', data.artist);
    setText('song-name', data.song);
    setText('album-name', data.album);
    setText('release-year', data.year);
    setText('director-name', data.director);
}

function showCredits() {
    document.getElementById('video-credits').classList.add('visible');
}

function hideCredits() {
    document.getElementById('video-credits').classList.remove('visible');
}

function clearAllTimers() {
    currentTimers.forEach(timerId => clearTimeout(timerId));
    currentTimers = [];
}

function setupEventListeners() {
    els.tvPowerBtn.addEventListener('click', togglePower);
    if(els.remotePowerBtn) els.remotePowerBtn.addEventListener('click', togglePower);
}

// Start
init();