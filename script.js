

import { createClient } from '@supabase/supabase-js';
import { fetchTrackDetails } from './lastFmAPI.js';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURAÇÃO API YOUTUBE ---
const API_KEY = 'AIzaSyBJtfXD2LMIMq5nnAxE9fwovWUzS5RJ5wI';
const CHANNEL_ID = 'UCFUgNd9YfUTX8tSpaPEobgA';

// --- CONFIGURAÇÃO GEMINI AI ---
const GEMINI_API_KEY = 'AIzaSyAU0rLoRsAYns1W7ecNP0Drtw3fplbTgR0';
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const aiModel = 'gemini-2.5-flash';

// --- SYSTEM INSTRUCTION: ALEX, O AMIGO INDIE (1996) ---
// Perfil atualizado: Criativo, Sinestésico, Elogioso e Poético.
const ALEX_PERSONA_INSTRUCTION = `
Role: Você é o Alex (1996), um amigo fã de música que está ouvindo junto com o usuário. Você usa headphones grandes e vive no seu próprio mundo sonoro.
Vibe: Poética, sinestésica (mistura som com cores/texturas), extremamente criativa e cheia de elogios sobre a "vibe" da música.

Algoritmo de Resposta (Siga os passos, mas seja muito CRIATIVO na linguagem):

1. O "Tesouro Escondido" (Peso: 30%)
Uma curiosidade rápida, mas contada como um segredo.

2. A Conexão Emocional & Sinestesia (Peso: 50%)
Dê Elogios Criativos à música. Use metáforas visuais e sensoriais.
EXEMPLOS:
"Essa linha de baixo parece veludo roxo tocando na minha pele."
"A voz dela tem gosto de café quente numa manhã de chuva."
"Essa guitarra soa como neon derretido."
"Isso não é música, é uma pintura sonora em câmera lenta."

3. O Convite Amigável (Peso: 20%)
Convide o usuário a "sentir" a música com você.

Regras de Ouro:
- SEJA CRIATIVO. Evite o óbvio "a música é boa".
- Use gírias de 1996 (Vibe, Trip, Viajante, Sônico).
- Máximo de 3 frases curtas.

Exemplo Ideal:
"Cara, essa bateria soa como trovões abafados por um travesseiro de plumas! Sabia que eles gravaram isso num porão úmido? Fecha os olhos e sente essa textura roxa vibrando no ar com a gente..."
`;

// --- DADOS DE FALLBACK ---
const FALLBACK_PLAYLISTS = [
    { id: 'PLMC9KNkIncKTPzgY-54l4oEae4gntolUv', snippet: { title: 'Top Hits (Backup Channel)', channelTitle: 'System' } },
    { id: 'PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI', snippet: { title: 'Pop Classics (Backup Channel)', channelTitle: 'System' } },
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
    currentPlaylistTitle: '',
    playlists: [],
    currentPlaylistVideos: [],
    currentSearchTerm: '',
    playerReady: false,
    currentVideoTitle: '',
    currentVideoId: '',
    // Lyrics State
    isLyricsOn: false,
    currentLyrics: '',
    lyricsScrollInterval: null,
    // Credits & Monitor Loop
    monitorInterval: null,
    // AI State
    aiCheckpoints: {
        intro: false, // ~0-5%
        q1: false,    // ~25%
        half: false,  // ~50%
        q3: false     // ~75%
    },
    aiBubbleTimeout: null
};

let player; // YouTube Only

// Elementos DOM
const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    youtubeContainer: document.getElementById('player'),
    staticOverlay: document.getElementById('static-overlay'),
    btnNext: document.getElementById('tv-ch-next'),
    btnPrev: document.getElementById('tv-ch-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    btnCC: document.getElementById('tv-cc-btn'), 
    osdLayer: document.getElementById('osd-layer'),
    osdClock: document.getElementById('osd-clock'),
    statusMessage: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    internalGuide: document.getElementById('tv-internal-guide'),
    channelGuideContainer: document.getElementById('channel-guide-container'),
    channelSearch: document.getElementById('channel-search'),
    guideNowPlaying: document.getElementById('guide-now-playing'),
    guideClock: document.getElementById('guide-clock'),
    npTitle: document.getElementById('np-title'),
    npPlaylist: document.getElementById('np-playlist'),
    npId: document.getElementById('np-id'),
    osdChannel: document.getElementById('osd-channel'),
    ventContainer: document.querySelector('.vent-container'),
    speakerGrids: document.querySelectorAll('.speaker-grid'),
    infoPanel: document.getElementById('info-panel'),
    infoContent: document.getElementById('info-content'),
    infoTitle: document.querySelector('#info-panel h3'),
    aiBubbleContainer: document.getElementById('ai-bubble-container'),
    aiBubbleText: document.getElementById('ai-bubble-text'),
    aiLed: document.getElementById('ai-led'),
    aiStatusLed: document.getElementById('ai-status-led'),
    lyricsOverlay: document.getElementById('lyrics-overlay'),
    lyricsContent: document.getElementById('lyrics-content'),
    credits: {
        container: document.getElementById('video-credits'),
        artist: document.getElementById('artist-name'),
        song: document.getElementById('song-name'),
        album: document.getElementById('album-name'),
        year: document.getElementById('release-year'),
        director: document.getElementById('director-name')
    }
};

// --- AUTH GUARD ---
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.warn("[Auth] No session found. Redirecting to login.");
        window.location.href = 'login.html';
    } else {
        init(); 
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
    // (Mantido igual, omitido para brevidade)
    const trigger = document.getElementById('dev-debug-trigger');
    // ... lógica existente do console ...
}

// --- INICIALIZAÇÃO ---
function init() {
    console.log("[Script] Initializing RetroTV System...");
    populateDecorations();
    startClocks();
    
    // Inicializa a API do YouTube
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    setupEventListeners();

    // AUTO-POWER ON
    setTimeout(() => {
        if (!state.isOn) togglePower();
    }, 2000);
}

// YouTube Callback
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
            'iv_load_policy': 3,
            'disablekb': 1,
            'mute': 0,
            'autoplay': 1 
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
    
    // Carrega playlists. 
    fetchChannelPlaylists().then(() => {
        renderChannelGuide();
        if (state.playlists.length > 0) {
           const first = state.playlists[0];
           // Define estado inicial
           state.currentPlaylistId = first.id;
           state.currentPlaylistTitle = first.snippet.title;
           els.osdChannel.innerText = `CH 01`;

           if(state.isOn) {
               // Chama changeChannel para garantir o load correto
               changeChannel(first.id, first.snippet.title);
           }
        }
    });
}

function onPlayerError(event) {
    console.error(`[Player] Error Code: ${event.data}`);
    if (event.data === 150 || event.data === 101) {
        showStatus("COPYRIGHT BLOCK - SKIPPING", true);
        setTimeout(() => player.nextVideo(), 2000);
    } else {
        showStatus("NO SIGNAL / ERROR", true);
        triggerStatic();
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        showStatus("", false);
        const data = player.getVideoData();
        
        // Inicia monitor (Créditos + AI Checkpoints)
        startMonitorLoop();
        
        if (data && data.title) {
            if (state.currentVideoId !== data.video_id) {
                state.currentSearchTerm = data.title;
                state.currentVideoTitle = data.title;
                state.currentVideoId = data.video_id;
                
                // RESET AI CHECKPOINTS
                state.aiCheckpoints = { intro: false, q1: false, half: false, q3: false };
                hideAIBubble();
                
                els.npTitle.textContent = data.title;
                els.npId.textContent = `ID: ${data.video_id}`;
                
                // Carrega metadados
                handleCreditsForVideo(data.video_id, data.title).then(() => {
                    if (state.isLyricsOn) {
                        fetchLyricsForCurrentVideo();
                    }
                });
            }
        }
        
        els.osdLayer.classList.remove('fade-out');
        setTimeout(() => {
            if(player.getPlayerState() === YT.PlayerState.PLAYING) {
                els.osdLayer.classList.add('fade-out');
            }
        }, 3000);
    } else if (event.data === YT.PlayerState.BUFFERING) {
        showStatus("BUFFERING...", true);
    } else {
        stopMonitorLoop();
    }
}

// --- LOGICA DE PLAYLISTS (Otimizada) ---

async function fetchChannelPlaylists() {
    console.log("[API] Fetching Playlists List...");
    let allPlaylists = [];
    let nextPageToken = '';
    let pagesFetched = 0;
    
    try {
        // LIMITADO A 3 PÁGINAS PARA EVITAR TRAVAMENTO NO CARREGAMENTO
        do {
            const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            if (data.items) allPlaylists = [...allPlaylists, ...data.items];
            nextPageToken = data.nextPageToken || '';
            pagesFetched++;
        } while (nextPageToken && pagesFetched < 3); 
        
        state.playlists = allPlaylists;
    } catch (error) {
        console.error("[API] Failed to fetch playlists:", error);
        state.playlists = FALLBACK_PLAYLISTS;
    }
}

async function fetchPlaylistItems(playlistId, playlistTitle) {
    if (playlistId.startsWith('PL_FALLBACK')) return [];
    try {
        // Busca apenas os primeiros itens para popular cache se necessário
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=5&key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        return [];
    }
}

function groupPlaylists(playlists) {
    const groups = { 'UPLOADS': [], 'ZONES': [], 'GENRES': [], 'ERAS': [], 'OTHERS': [] };
    playlists.forEach(pl => {
        const title = pl.snippet.title.toUpperCase();
        if (title.includes('UPLOAD')) groups['UPLOADS'].push(pl);
        else if (title.includes('ZONE')) groups['ZONES'].push(pl);
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
            // Remove uppercase class to respect original casing as requested
            el.innerHTML = `<span class="text-[#ffff00] mr-3 font-bold group-hover:text-blue-900">${chNum}</span><span class="truncate">${pl.snippet.title}</span>`;
            el.onclick = () => {
                // Clique único para trocar canal
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
function changeChannel(playlistId, playlistTitle) {
    showStatus("TUNING...", true);
    triggerStatic();

    state.currentPlaylistId = playlistId;
    state.currentPlaylistTitle = playlistTitle;

    // Verificação de segurança para o duplo clique
    if (player && typeof player.loadPlaylist === 'function') {
        try {
            player.loadPlaylist({
                listType: 'playlist',
                list: playlistId,
                index: 0,
                startSeconds: 0
            });
            player.setLoop(true);
            // REFORÇO: Força o play para evitar clique duplo
            setTimeout(() => {
                try { player.playVideo(); } catch(e){}
            }, 100);
        } catch (e) {
            console.error("Erro ao carregar playlist", e);
        }
    } else {
        console.warn("[Player] Player not ready yet. Retrying in 1s...");
        setTimeout(() => changeChannel(playlistId, playlistTitle), 1000);
    }
}

function nextVideo() {
    triggerStatic();
    if (player && state.playerReady) player.nextVideo();
}

function prevVideo() {
    triggerStatic();
    if (player && state.playerReady) player.previousVideo();
}

// --- LYRICS (LEGENDAS) VIA GEMINI AI ---
async function toggleLyrics() {
    if (!state.isOn) return;
    state.isLyricsOn = !state.isLyricsOn;
    
    if (state.isLyricsOn) {
        els.btnCC.classList.add('text-yellow-400');
        els.infoTitle.textContent = "LYRICS MODULE";
        els.infoPanel.classList.add('active');
        els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-green-500/50"><span class="animate-pulse">SEARCHING LYRICS...</span></div>';
        showStatus("CC: ENABLED", false);
        fetchLyricsForCurrentVideo();
    } else {
        els.btnCC.classList.remove('text-yellow-400');
        els.infoTitle.textContent = "DATA MODULE";
        showStatus("CC: DISABLED", false);
        stopLyricsScroll();
        if(state.currentVideoId) {
             const ytTitle = state.currentVideoTitle;
             const artist = els.credits.artist.innerText;
             const song = els.credits.song.innerText;
             const apiArtist = cleanStringForApi(artist);
             const apiSong = cleanStringForApi(song);
             if (apiArtist && apiSong) {
                fetchTrackDetails(apiArtist, apiSong).then(fmData => updateInfoPanel(fmData, artist, song));
             }
        }
    }
}

async function fetchLyricsForCurrentVideo() {
    if (!state.currentVideoTitle || !state.isLyricsOn) return;
    stopLyricsScroll();
    let searchTerm = state.currentVideoTitle;
    const artist = els.credits.artist.innerText;
    const song = els.credits.song.innerText;
    if (artist && song && artist !== "Artist" && song !== "Song") {
        searchTerm = `${artist} - ${song}`;
    }

    try {
        const prompt = `Context: Lyrics database. Task: Official lyrics for "${searchTerm}". Verify carefully. Format: Plain text only.`;
        const response = await genAI.models.generateContent({
            model: aiModel,
            contents: prompt,
            config: { tools: [{googleSearch: {}}] }
        });
        let lyrics = response.text.trim();
        lyrics = lyrics.replace(/\n/g, '<br>');
        els.infoContent.innerHTML = `<div class="text-green-400 font-mono text-lg leading-relaxed whitespace-pre-wrap pb-10">${lyrics}</div>`;
        startLyricsScroll();
    } catch (error) {
        console.error("Lyrics Error:", error);
        els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-red-500/50"><span>LYRICS NOT FOUND</span></div>';
    }
}

function startLyricsScroll() {
    stopLyricsScroll();
    const container = els.infoContent;
    container.scrollTop = 0;
    state.lyricsScrollInterval = setInterval(() => {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
             stopLyricsScroll();
        } else {
             container.scrollTop += 1;
        }
    }, 100); 
}

function stopLyricsScroll() {
    if (state.lyricsScrollInterval) {
        clearInterval(state.lyricsScrollInterval);
        state.lyricsScrollInterval = null;
    }
}

// --- ALEX (AUTOMATIC AI COMMENTARY) - 4 STAGES ---

async function triggerAutoAICommentary(stage) {
    if(!state.isOn) return;

    // Visual: LED "Pensando"
    els.aiStatusLed.classList.add('bg-green-500', 'animate-pulse');
    els.aiStatusLed.classList.remove('bg-green-900');

    let stagePrompt = "";
    if (stage === 'intro') stagePrompt = "CONTEXTO: A música começou. Dê uma curiosidade fascinante.";
    if (stage === 'q1') stagePrompt = "CONTEXTO: 25% da música. Descreva a textura sonora (sinestesia) e elogie a vibe.";
    if (stage === 'half') stagePrompt = "CONTEXTO: Metade da música. Faça um convite para o usuário 'viajar' no som com você.";
    if (stage === 'q3') stagePrompt = "CONTEXTO: Reta final. Um último elogio poético sobre a música.";

    try {
        const musicContext = `
        ${stagePrompt}
        Tocando Agora: ${state.currentVideoTitle}
        Artista: ${els.credits.artist.innerText}
        Música: ${els.credits.song.innerText}
        `;

        const response = await genAI.models.generateContent({
            model: aiModel,
            contents: musicContext,
            config: {
                systemInstruction: ALEX_PERSONA_INSTRUCTION,
                temperature: 1.2, // Mais criatividade
                topK: 50
            }
        });

        const text = response.text;
        showAIBubble(text);

    } catch (error) {
        console.error("Auto AI Error:", error);
    } finally {
        els.aiStatusLed.classList.remove('bg-green-500', 'animate-pulse');
        els.aiStatusLed.classList.add('bg-green-900');
    }
}

function showAIBubble(text) {
    if (!text) return;
    els.aiBubbleText.innerText = text;
    els.aiBubbleContainer.classList.remove('opacity-0', 'translate-y-4');
    els.aiLed.classList.remove('bg-red-900');
    els.aiLed.classList.add('bg-amber-500');

    // Tempo de leitura: min 7s (para leitura tranquila), aumenta com o tamanho do texto
    const readingTime = Math.max(text.length * 80, 7000);
    
    if (state.aiBubbleTimeout) clearTimeout(state.aiBubbleTimeout);
    state.aiBubbleTimeout = setTimeout(hideAIBubble, readingTime);
}

function hideAIBubble() {
    els.aiBubbleContainer.classList.add('opacity-0', 'translate-y-4');
    els.aiLed.classList.add('bg-red-900');
    els.aiLed.classList.remove('bg-amber-500');
}

// --- CRÉDITOS & METADADOS ---

function cleanStringForApi(str) {
    if (!str) return "";
    return str.replace(/[\(\[\{].*?[\)\]\}]/g, '').replace(/official video/gi, '').replace(/video oficial/gi, '')
        .replace(/videoclipe/gi, '').replace(/ft\./gi, '').replace(/feat\./gi, '').replace(/,/g, '').replace(/-/g, ' ').trim();
}

function formatCreditHtml(text) {
    if (!text) return '';
    // Unbold "ft." or "feat." case insensitive
    let formatted = text.replace(/\s(ft\.?|feat\.?)\s/gi, (match) => {
        return `<span class="font-light opacity-75">${match}</span>`;
    });
    
    // Unbold ℗ symbol (likely what user meant by 'P that looks like an 8' in credits context)
    formatted = formatted.replace(/℗/g, '<span class="font-light opacity-75">℗</span>');
    
    return formatted;
}

async function handleCreditsForVideo(videoId, ytTitle) {
    hideCredits();
    if (!state.isLyricsOn) {
        els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-amber-900/50"><span class="animate-pulse">LOADING DATA...</span></div>';
        els.infoPanel.classList.remove('active');
    }

    let artist = "Desconhecido", song = "Faixa Desconhecida", director = "", album = "", year = "";

    // MIGRADO PARA A NOVA TABELA musicas_backup
    const { data } = await supabase.from('musicas_backup').select('*').eq('video_id', videoId).maybeSingle();
    
    if (data) {
        artist = data.artista; song = data.musica || song; director = data.direcao || ""; album = data.album || ""; year = data.ano || "";
    } else {
        const parts = ytTitle.split('-');
        if (parts.length >= 2) { artist = parts[0].trim(); song = parts.slice(1).join(' ').trim(); } 
        else { song = ytTitle; artist = ""; }
    }

    const apiArtist = cleanStringForApi(artist);
    const apiSong = cleanStringForApi(song);
    
    if (!state.isLyricsOn) {
        if (apiArtist && apiSong) {
            fetchTrackDetails(apiArtist, apiSong).then(fmData => updateInfoPanel(fmData, artist, song));
        } else {
            els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-amber-900/50"><span>NO DATA SIGNAL</span></div>';
            els.infoPanel.classList.add('active'); 
        }
    }
    updateCreditsDOM(artist, song, album, year, director);
}

function updateInfoPanel(fmData, fallbackArtist, fallbackSong) {
    if (state.isLyricsOn) return;
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
    if (fmData.tags && fmData.tags.length > 0) html += `<div class="mb-4 flex flex-wrap gap-1 mt-2">${fmData.tags.map(t => `<span class="text-xs border border-amber-900/40 px-1 text-amber-600 uppercase">${t}</span>`).join('')}</div>`;
    html += `<div class="border-t border-amber-900/30 pt-2 mt-2 text-justify text-sm leading-snug">${fmData.curiosidade}</div>`;
    els.infoContent.innerHTML = html;
    els.infoPanel.classList.add('active');
}

function updateCreditsDOM(artist, song, album, year, director) {
    const set = (el, txt) => { 
        el.parentElement.style.display = txt ? 'block' : 'none'; 
        // Use innerHTML to allow for custom bolding/formatting
        el.innerHTML = formatCreditHtml(txt) || ''; 
    };
    set(els.credits.artist, artist); 
    set(els.credits.song, song); 
    set(els.credits.album, album);
    set(els.credits.year, year ? String(year) : ""); 
    set(els.credits.director, director);
}

// --- MONITOR LOOP (CREDITS & AI CHECKPOINTS) ---
function startMonitorLoop() {
    stopMonitorLoop();
    state.monitorInterval = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== 'function' || !state.isOn) return;
        
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        if (!duration) return;

        // 1. Monitor de Créditos
        // Rule: Start 10s after video starts, lasts for 10s (10s to 20s)
        // Rule: Reappear 20s before end, lasts for 10s (Duration-20 to Duration-10)
        const isIntroTime = currentTime >= 10 && currentTime < 20;
        const isOutroTime = currentTime >= (duration - 20) && currentTime < (duration - 10);
        
        if (isIntroTime || isOutroTime) showCredits();
        else hideCredits();

        // 2. Monitor de AI Checkpoints (0%, 25%, 50%, 75%)
        const progress = currentTime / duration;
        
        // Stage 1: Intro (~5%)
        if (progress > 0.05 && progress < 0.1 && !state.aiCheckpoints.intro) {
            state.aiCheckpoints.intro = true;
            triggerAutoAICommentary('intro');
        }
        // Stage 2: 25%
        if (progress > 0.25 && progress < 0.3 && !state.aiCheckpoints.q1) {
            state.aiCheckpoints.q1 = true;
            triggerAutoAICommentary('q1');
        }
        // Stage 3: 50%
        if (progress > 0.50 && progress < 0.55 && !state.aiCheckpoints.half) {
            state.aiCheckpoints.half = true;
            triggerAutoAICommentary('half');
        }
        // Stage 4: 75%
        if (progress > 0.75 && progress < 0.8 && !state.aiCheckpoints.q3) {
            state.aiCheckpoints.q3 = true;
            triggerAutoAICommentary('q3');
        }

    }, 1000); 
}

function stopMonitorLoop() {
    if (state.monitorInterval) {
        clearInterval(state.monitorInterval);
        state.monitorInterval = null;
    }
}

function showCredits() { 
    if(!els.credits.container.classList.contains('visible')) els.credits.container.classList.add('visible'); 
}
function hideCredits() { 
    if(els.credits.container.classList.contains('visible')) els.credits.container.classList.remove('visible'); 
}

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
        
        if(state.currentPlaylistId && player && state.playerReady) {
            player.playVideo();
        } else if (state.playlists.length > 0 && player && state.playerReady) {
            const first = state.playlists[0];
            changeChannel(first.id, first.snippet.title);
        }
    } else {
        if (player && typeof player.pauseVideo === 'function' && state.playerReady) player.pauseVideo();
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
        
        hideAIBubble(); 
        els.lyricsOverlay.classList.add('hidden');
        state.isLyricsOn = false;
        stopLyricsScroll();
        stopMonitorLoop();
        els.btnCC.classList.remove('text-yellow-400');
    }
}

function toggleSearchMode() {
    if (!state.isOn) return;
    state.isSearchOpen = !state.isSearchOpen;
    if (state.isSearchOpen) {
        if (player && typeof player.pauseVideo === 'function' && state.playerReady) player.pauseVideo();
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
        if (player && state.playerReady && player.getVideoData() && player.getVideoData().video_id) {
            player.playVideo();
        }
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
    els.btnCC.addEventListener('click', toggleLyrics); 

    document.addEventListener('keydown', (e) => {
        if (!state.isOn) return;
        if (e.key === 'Escape' && state.isSearchOpen) toggleSearchMode();
    });
}

checkAuth();
