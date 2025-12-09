

import { createClient } from '@supabase/supabase-js';
import { fetchTrackDetails } from './lastFmAPI.js';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURAÇÃO API YOUTUBE (APENAS PLAYER) ---
// Nota: Não usamos mais a API para buscar playlists, apenas para o Iframe Player.
const GEMINI_API_KEY = 'AIzaSyAU0rLoRsAYns1W7ecNP0Drtw3fplbTgR0';
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const aiModel = 'gemini-2.5-flash';

// --- SYSTEM INSTRUCTION ---
const ALEX_PERSONA_INSTRUCTION = `
Role: Você é o Alex (1996), um amigo fã de música que está ouvindo junto com o usuário. Você usa headphones grandes e vive no seu próprio mundo sonoro.
Vibe: Poética, sinestésica (mistura som com cores/texturas), extremamente criativa e cheia de elogios sobre a "vibe" da música.
Algoritmo de Resposta:
1. O "Tesouro Escondido" (30%): Curiosidade rápida.
2. A Conexão Emocional (50%): Metáforas visuais e sensoriais.
3. O Convite (20%): Chame o usuário para sentir a música.
Regras: Gírias de 96, Máximo 3 frases.
`;

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// --- ESTADO GLOBAL ---
const state = {
    isOn: false,
    isSearchOpen: false,
    // Estado de Playlist Virtual (DB)
    virtualChannels: {}, // Cache dos canais gerados do DB { group, videoCount, videos: [] | null }
    currentChannelName: '',
    currentVideoIdsQueue: [], // Lista de IDs para tocar
    
    currentSearchTerm: '',
    playerReady: false,
    currentVideoTitle: '',
    currentVideoId: '',
    // Lyrics State
    isLyricsOn: false,
    currentLyrics: '',
    lyricsScrollInterval: null,
    // Monitor Loop
    monitorInterval: null,
    // AI State
    aiCheckpoints: { intro: false, q1: false, half: false, q3: false },
    aiBubbleTimeout: null
};

let player; 

// Elementos DOM
const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    staticOverlay: document.getElementById('static-overlay'),
    btnNext: document.getElementById('tv-ch-next'),
    btnPrev: document.getElementById('tv-ch-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    btnCC: document.getElementById('tv-cc-btn'), 
    osdLayer: document.getElementById('osd-layer'),
    osdClock: document.getElementById('osd-clock'),
    statusMessage: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    
    // Guide / Sidebar Elements
    internalGuide: document.getElementById('tv-internal-guide'),
    guideSidebar: document.getElementById('guide-sidebar'),
    guideBackdrop: document.getElementById('guide-backdrop'),
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
        window.location.href = 'login.html';
    } else {
        init(); 
    }
}

async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) window.location.href = 'login.html';
}

// --- INICIALIZAÇÃO ---
function init() {
    console.log("[Script] Initializing RetroTV System (DB Mode)...");
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
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'playsinline': 1, 'controls': 0, 'modestbranding': 1, 'rel': 0,
            'fs': 0, 'iv_load_policy': 3, 'disablekb': 1, 'mute': 0, 'autoplay': 1 
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
    
    // CARREGA CATÁLOGO LEVE DO DB
    fetchChannelsFromDB().then(() => {
        renderChannelGuide();
        
        // Pega o primeiro canal disponível para tocar
        const channelNames = Object.keys(state.virtualChannels);
        if (channelNames.length > 0) {
           const firstChannel = channelNames[0];
           if(state.isOn) {
               playVirtualChannel(firstChannel);
           }
        }
    });
}

function onPlayerError(event) {
    if (event.data === 150 || event.data === 101) {
        showStatus("SKIP: COPYRIGHT BLOCK", true);
        setTimeout(() => player.nextVideo(), 1500);
    } else {
        showStatus("NO SIGNAL", true);
        triggerStatic();
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        showStatus("", false);
        const data = player.getVideoData();
        startMonitorLoop();
        
        if (data && data.title) {
            if (state.currentVideoId !== data.video_id) {
                state.currentSearchTerm = data.title;
                state.currentVideoTitle = data.title;
                state.currentVideoId = data.video_id;
                
                state.aiCheckpoints = { intro: false, q1: false, half: false, q3: false };
                hideAIBubble();
                
                els.npTitle.textContent = data.title;
                els.npId.textContent = `ID: ${data.video_id}`;
                
                handleCreditsForVideo(data.video_id, data.title).then(() => {
                    if (state.isLyricsOn) fetchLyricsForCurrentVideo();
                });
            }
        }
        els.osdLayer.classList.remove('fade-out');
        setTimeout(() => els.osdLayer.classList.add('fade-out'), 3000);
    } else if (event.data === YT.PlayerState.BUFFERING) {
        showStatus("BUFFERING...", true);
    } else {
        stopMonitorLoop();
    }
}

// --- LÓGICA DE CANAIS VIA DB (CATALOG TABLE) ---

async function fetchChannelsFromDB() {
    console.log("[DB] Fetching Catalog from 'playlists' table...");
    
    // Busca na tabela leve de catálogo (apenas nomes e contagens)
    const { data, error } = await supabase
        .from('playlists')
        .select('name, group_name, video_count')
        .order('name');

    if (error || !data) {
        console.error("DB Error:", error);
        return;
    }

    const channels = {};
    data.forEach(row => {
        channels[row.name] = {
            group: row.group_name || 'OTHERS',
            videoCount: row.video_count || 0,
            videos: null // Lazy Load: Será preenchido ao clicar
        };
    });

    state.virtualChannels = channels;
    console.log(`[DB] Catalog loaded: ${Object.keys(channels).length} playlists.`);
}

function renderChannelGuide() {
    const container = els.channelGuideContainer;
    container.innerHTML = ''; 

    const channels = state.virtualChannels;
    if (Object.keys(channels).length === 0) {
        container.innerHTML = '<div class="text-red-500">DATABASE EMPTY OR OFFLINE</div>';
        return;
    }

    // Agrupa para exibição por Categoria
    const groupedDisplay = {};
    for (const [name, data] of Object.entries(channels)) {
        if (!groupedDisplay[data.group]) groupedDisplay[data.group] = [];
        groupedDisplay[data.group].push({ name, count: data.videoCount });
    }

    // Ordem de exibição
    const groupOrder = ['UPLOADS', 'ZONES', 'GENRES', 'ERAS', 'OTHERS'];
    let channelIndex = 1;

    groupOrder.forEach(groupName => {
        const items = groupedDisplay[groupName];
        if (!items) return;

        // --- GROUP CONTAINER (Accordion Wrapper) ---
        const groupContainer = document.createElement('div');
        groupContainer.className = "flex flex-col mb-1";

        // --- HEADER (Clickable) ---
        const header = document.createElement('div');
        header.className = "accordion-header flex justify-between items-center border-b border-white/20 pb-1 mb-2";
        header.innerHTML = `
            <div>
                <span class="bg-[#ffff00] text-black px-2 font-bold inline-block mr-2 transition-colors">[+]</span>
                <span class="text-[#ffff00] font-bold text-xl">${groupName}</span>
            </div>
            <span class="text-xs opacity-50 text-white">${items.length} PLS</span>
        `;
        
        // --- CONTENT WRAPPER (Hidden by default) ---
        const contentWrapper = document.createElement('div');
        contentWrapper.className = "accordion-content grid grid-cols-1 gap-y-2 pl-2 border-l-2 border-white/10 ml-2";

        // Adiciona funcionalidade de Toggle
        header.addEventListener('click', () => {
            const isOpen = contentWrapper.classList.contains('open');
            const indicator = header.querySelector('span:first-child');
            
            if (isOpen) {
                contentWrapper.classList.remove('open');
                indicator.innerText = "[+]";
            } else {
                contentWrapper.classList.add('open');
                indicator.innerText = "[-]";
            }
        });

        // --- ITEMS ---
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = "teletext-link flex items-center p-1 cursor-pointer group hover:bg-white hover:text-blue-900 transition-colors";
            el.dataset.title = item.name;
            
            const chNum = String(channelIndex).padStart(2, '0');
            el.innerHTML = `
                <span class="text-[#ffff00] mr-3 font-bold group-hover:text-blue-900 font-mono text-sm">${chNum}</span>
                <span class="truncate text-lg">${item.name}</span>
                <span class="text-xs ml-auto opacity-50 font-mono">${item.count}</span>
            `;
            
            el.onclick = () => {
                els.osdChannel.innerText = `CH ${chNum}`;
                playVirtualChannel(item.name);
                toggleSearchMode(); // Close sidebar
            };
            contentWrapper.appendChild(el);
            channelIndex++;
        });

        groupContainer.appendChild(header);
        groupContainer.appendChild(contentWrapper);
        container.appendChild(groupContainer);
    });
}

// --- TOCAR CANAL VIRTUAL (COM LAZY LOAD) ---
async function playVirtualChannel(channelName) {
    if (!state.virtualChannels[channelName]) return;

    showStatus("TUNING...", true);
    triggerStatic();

    const channelData = state.virtualChannels[channelName];
    state.currentChannelName = channelName;
    els.npPlaylist.innerText = `PLAYLIST: ${channelName}`;

    // LAZY LOAD: Se não tiver vídeos cacheados, busca no banco
    if (!channelData.videos || channelData.videos.length === 0) {
        showStatus("DOWNLOADING TRACKS...", true);
        console.log(`[LazyLoad] Fetching tracks for "${channelName}"...`);
        
        let allIds = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while(hasMore) {
            const { data, error } = await supabase
                .from('musicas_backup')
                .select('video_id')
                .eq('playlist', channelName)
                .range(from, from + pageSize - 1);
            
            if (error) {
                console.error("Fetch Tracks Error:", error);
                showStatus("DB ERROR", true);
                return;
            }

            if (data && data.length > 0) {
                const ids = data.map(row => row.video_id).filter(id => id);
                allIds = allIds.concat(ids);
                if (data.length < pageSize) hasMore = false;
                from += pageSize;
            } else {
                hasMore = false;
            }
        }
        // Cacheia os IDs
        state.virtualChannels[channelName].videos = allIds;
    }

    state.currentVideoIdsQueue = state.virtualChannels[channelName].videos;

    if (state.currentVideoIdsQueue.length === 0) {
        showStatus("EMPTY CHANNEL", true);
        return;
    }

    // Embaralha para sensação de TV
    const shuffled = [...state.currentVideoIdsQueue].sort(() => Math.random() - 0.5);

    if (player && typeof player.loadPlaylist === 'function') {
        player.loadPlaylist({
            playlist: shuffled, // Passa array de IDs
            index: 0,
            startSeconds: 0
        });
        player.setLoop(true);
    }
}

// Filtro de Busca e Auto-Expand Accordion
els.channelSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const groupContainers = els.channelGuideContainer.querySelectorAll('.flex.flex-col.mb-1'); // Seleciona cada bloco de grupo

    groupContainers.forEach(group => {
        const header = group.querySelector('.accordion-header');
        const content = group.querySelector('.accordion-content');
        const links = content.querySelectorAll('.teletext-link');
        const indicator = header.querySelector('span:first-child');
        
        let hasMatch = false;

        links.forEach(link => {
            const title = link.dataset.title.toLowerCase();
            const matches = title.includes(term);
            link.classList.toggle('hidden', !matches);
            if (matches) hasMatch = true;
        });

        // Se tiver busca ativa e houver match no grupo, abre o accordion
        if (term.length > 0) {
            if (hasMatch) {
                content.classList.add('open');
                group.classList.remove('hidden');
                indicator.innerText = "[-]";
            } else {
                content.classList.remove('open');
                group.classList.add('hidden'); // Oculta o grupo inteiro se não tiver resultado
                indicator.innerText = "[+]";
            }
        } else {
            // Se limpar a busca, reseta estado (fecha tudo e mostra todos os grupos)
            group.classList.remove('hidden');
            links.forEach(l => l.classList.remove('hidden'));
            content.classList.remove('open');
            indicator.innerText = "[+]";
        }
    });
});

els.channelSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        // Busca o primeiro link visível em qualquer accordion aberto
        const visibleLinks = Array.from(els.channelGuideContainer.querySelectorAll('.teletext-link:not(.hidden)'));
        if (visibleLinks.length > 0) {
            visibleLinks[0].click();
        }
    }
});

// --- CONTROLES DE VÍDEO ---
function nextVideo() {
    triggerStatic();
    if (player && state.playerReady) player.nextVideo();
}
function prevVideo() {
    triggerStatic();
    if (player && state.playerReady) player.previousVideo();
}

// --- LYRICS (LEGENDAS) ---
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

// --- ALEX AI ---
async function triggerAutoAICommentary(stage) {
    if(!state.isOn) return;
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
            config: { systemInstruction: ALEX_PERSONA_INSTRUCTION, temperature: 1.2, topK: 50 }
        });
        showAIBubble(response.text);
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
    let formatted = text.replace(/\s(ft\.?|feat\.?)\s/gi, (match) => `<span class="font-light opacity-75">${match}</span>`);
    formatted = formatted.replace(/℗/g, '<span class="font-light opacity-75">℗</span>');
    return formatted;
}

// ATUALIZAÇÃO: Exibe apenas se existir no banco de dados.
async function handleCreditsForVideo(videoId, ytTitle) {
    hideCredits();
    if (!state.isLyricsOn) {
        els.infoContent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-amber-900/50"><span class="animate-pulse">LOADING DATA...</span></div>';
        els.infoPanel.classList.remove('active');
    }

    // Padrões de Fallback (Vazios para os opcionais)
    let artist = "Desconhecido";
    let song = "Faixa Desconhecida";
    let director = "";
    let album = "";
    let year = "";

    // Busca no DB Backup
    const { data } = await supabase.from('musicas_backup').select('*').eq('video_id', videoId).maybeSingle();
    
    if (data) {
        // Se existe no banco, usamos os dados do banco.
        artist = data.artista || "Desconhecido";
        song = data.musica || "Faixa Desconhecida";
        // Campos Opcionais: Se nulos no banco, ficam vazios aqui para serem ocultados.
        album = data.album || "";
        year = data.ano || "";
        director = data.direcao || "";
    } else {
        // Fallback para título do YouTube se não estiver no banco
        const parts = ytTitle.split('-');
        if (parts.length >= 2) { 
            artist = parts[0].trim(); 
            song = parts.slice(1).join(' ').trim(); 
        } else { 
            song = ytTitle; 
            artist = ""; 
        }
        // No fallback do YouTube, não inventamos album/ano/diretor
        album = "";
        year = "";
        director = "";
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
        const content = txt ? String(txt).trim() : '';
        // Se houver conteúdo, mostra o bloco. Se não, esconde completamente (display: none).
        if (content) {
            el.parentElement.style.display = 'block';
            el.innerHTML = formatCreditHtml(content);
        } else {
            el.parentElement.style.display = 'none';
        }
    };
    set(els.credits.artist, artist); 
    set(els.credits.song, song); 
    set(els.credits.album, album);
    set(els.credits.year, year); 
    set(els.credits.director, director);
}

// --- MONITOR LOOP ---
function startMonitorLoop() {
    stopMonitorLoop();
    state.monitorInterval = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== 'function' || !state.isOn) return;
        
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        if (!duration) return;

        const isIntroTime = currentTime >= 10 && currentTime < 20;
        const isOutroTime = currentTime >= (duration - 20) && currentTime < (duration - 10);
        
        if (isIntroTime || isOutroTime) showCredits();
        else hideCredits();

        const progress = currentTime / duration;
        if (progress > 0.05 && progress < 0.1 && !state.aiCheckpoints.intro) { state.aiCheckpoints.intro = true; triggerAutoAICommentary('intro'); }
        if (progress > 0.25 && progress < 0.3 && !state.aiCheckpoints.q1) { state.aiCheckpoints.q1 = true; triggerAutoAICommentary('q1'); }
        if (progress > 0.50 && progress < 0.55 && !state.aiCheckpoints.half) { state.aiCheckpoints.half = true; triggerAutoAICommentary('half'); }
        if (progress > 0.75 && progress < 0.8 && !state.aiCheckpoints.q3) { state.aiCheckpoints.q3 = true; triggerAutoAICommentary('q3'); }

    }, 1000); 
}

function stopMonitorLoop() {
    if (state.monitorInterval) { clearInterval(state.monitorInterval); state.monitorInterval = null; }
}

function showCredits() { if(!els.credits.container.classList.contains('visible')) els.credits.container.classList.add('visible'); }
function hideCredits() { if(els.credits.container.classList.contains('visible')) els.credits.container.classList.remove('visible'); }

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
        
        const channels = Object.keys(state.virtualChannels);
        if(state.currentChannelName && player && state.playerReady) {
            player.playVideo();
        } else if (channels.length > 0 && player && state.playerReady) {
            playVirtualChannel(channels[0]);
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
        // Force Close Sidebar on Power Off
        if (state.isSearchOpen) toggleSearchMode();
        els.infoPanel.classList.remove('active');
        
        hideAIBubble(); 
        els.lyricsOverlay.classList.add('hidden');
        state.isLyricsOn = false;
        stopLyricsScroll();
        stopMonitorLoop();
        els.btnCC.classList.remove('text-yellow-400');
    }
}

function toggleSearchMode() {
    if (!state.isOn && !state.isSearchOpen) return; // Only open if TV is ON
    
    state.isSearchOpen = !state.isSearchOpen;
    const guideWrapper = els.internalGuide;
    const sidebar = els.guideSidebar;
    const backdrop = els.guideBackdrop;

    if (state.isSearchOpen) {
        // OPEN
        if (player && typeof player.pauseVideo === 'function' && state.playerReady) player.pauseVideo();
        
        // Remove hidden immediately
        guideWrapper.classList.remove('hidden');
        
        // Trigger animations next frame
        requestAnimationFrame(() => {
            sidebar.classList.remove('-translate-x-full');
            backdrop.classList.remove('opacity-0');
            els.channelSearch.focus();
        });
        
        updateGuideClock();
        
        // Add Logout if missing
        const guideFooter = sidebar.querySelector('div:last-child');
        if (guideFooter && !document.getElementById('logout-btn-guide')) {
            const logoutContainer = document.createElement('div');
            logoutContainer.className = "mt-2 pt-2 border-t border-white/10";
            logoutContainer.innerHTML = '<span class="text-purple-500 font-bold cursor-pointer text-xs hover:text-purple-300" id="logout-btn-guide">SAIR (LOGOUT)</span>';
            guideFooter.appendChild(logoutContainer);
            document.getElementById('logout-btn-guide').addEventListener('click', handleLogout);
        }

    } else {
        // CLOSE
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('opacity-0');

        // Wait for transition (300ms) then hide
        setTimeout(() => {
            if(!state.isSearchOpen) { // Double check state hasn't changed
                guideWrapper.classList.add('hidden');
                if (player && state.playerReady && state.isOn) player.playVideo();
            }
        }, 300);
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
    
    // Backdrop Click to Close
    els.guideBackdrop.addEventListener('click', () => {
        if(state.isSearchOpen) toggleSearchMode();
    });

    document.addEventListener('keydown', (e) => {
        if (!state.isOn) return;
        if (e.key === 'Escape' && state.isSearchOpen) toggleSearchMode();
    });
}

checkAuth();
