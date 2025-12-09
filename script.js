

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURAÇÃO API & CHAVES ---
const GEMINI_API_KEY = 'AIzaSyAU0rLoRsAYns1W7ecNP0Drtw3fplbTgR0'; 
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const AI_MODEL = 'gemini-2.5-flash';

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// --- ESTADO GLOBAL ---
const state = {
    isOn: false,
    isSearchOpen: false,
    
    // Playlist System
    channelsByCategory: {}, // Cache: { 'GENRES': [...], 'ERAS': [...] }
    currentChannelList: [], // Lista de vídeos do canal atual
    currentIndex: 0,
    currentChannelName: '',
    
    // Player State
    playerReady: false,
    currentVideoData: null, // Dados do DB da música atual
    isPlaying: false,

    // Lyrics State
    isLyricsOn: false,
    lyricsLoading: false
};

let player; // Instância do Player YT
let timeInterval; // Loop de monitoramento de tempo

// --- ELEMENTOS DOM ---
const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    staticOverlay: document.getElementById('static-overlay'),
    
    // Controls
    btnNext: document.getElementById('tv-ch-next'),
    btnPrev: document.getElementById('tv-ch-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    btnCC: document.getElementById('tv-cc-btn'),
    
    // OSD Cleaned
    osdLayer: document.getElementById('osd-layer'),
    playlistLabel: document.getElementById('tv-playlist-label'),
    statusMsg: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    
    // Guide (Teletext)
    guideContainer: document.getElementById('tv-internal-guide'),
    guideSidebar: document.getElementById('guide-sidebar'),
    guideBackdrop: document.getElementById('guide-backdrop'),
    guideClock: document.getElementById('guide-clock'),
    guideChannelList: document.getElementById('channel-guide-container'),
    guideSearch: document.getElementById('channel-search'),
    guideNpTitle: document.getElementById('np-title'),
    guideNpPlaylist: document.getElementById('np-playlist'),
    guideNowPlayingBox: document.getElementById('guide-now-playing'),

    // Credits Overlay
    creditsOverlay: document.getElementById('video-credits'),
    credArtist: document.getElementById('artist-name'),
    credSong: document.getElementById('song-name'),
    credAlbum: document.getElementById('album-name'),
    credYear: document.getElementById('release-year'),
    credDirector: document.getElementById('director-name'),
    
    // Lyrics
    lyricsOverlay: document.getElementById('lyrics-overlay'),
    lyricsContent: document.getElementById('lyrics-content')
};

// --- INICIALIZAÇÃO ---

function init() {
    startClocks();
    loadYouTubeAPI();
    setupEventListeners();
    fetchGuideData(); // Pré-carrega o guia em segundo plano
}

function startClocks() {
    setInterval(() => {
        const now = new Date();
        // Apenas o relógio do guia (teletexto) é mantido
        els.guideClock.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Monitoramento constante de Créditos e Estado
        if (state.isOn && state.playerReady && state.isPlaying) {
            monitorCredits();
        }
    }, 500); // Verificação mais rápida para precisão
}

// --- ALGORITMO DE SHUFFLE (FISHER-YATES) ---
// Garante embaralhamento real e sem repetições na sequência
function fisherYatesShuffle(array) {
    let currentIndex = array.length, randomIndex;

    // Enquanto restarem elementos para embaralhar...
    while (currentIndex != 0) {
        // Escolhe um elemento restante...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // E troca com o elemento atual.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

// --- MONITORAMENTO DE CRÉDITOS ---
function monitorCredits() {
    if (!player || typeof player.getCurrentTime !== 'function') return;

    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    
    if (!duration || duration < 1) return;

    // LÓGICA DE TEMPO DOS CRÉDITOS
    
    // Intro: Aparece aos 10s, fica por 10s (sai aos 20s)
    const isIntroWindow = currentTime >= 10 && currentTime < 20;
    
    // Outro: Aparece 20s antes do fim, fica por 10s (sai 10s antes do fim)
    const outroStartTime = duration - 20;
    const outroEndTime = duration - 10;
    const isOutroWindow = (duration > 40) && (currentTime >= outroStartTime && currentTime < outroEndTime);

    if (isIntroWindow || isOutroWindow) {
        els.creditsOverlay.classList.add('visible');
    } else {
        els.creditsOverlay.classList.remove('visible');
    }
}

// --- YOUTUBE API ---

function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        // API já carregada (navegação SPA ou reload rápido)
        onYouTubeIframeAPIReady();
        return;
    }

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Callback global do YouTube API
window.onYouTubeIframeAPIReady = () => {
    console.log("📺 TV Tube: Inicializando Player...");
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'showinfo': 0,
            'rel': 0,
            'iv_load_policy': 3,
            'modestbranding': 1,
            'disablekb': 1,
            'fs': 0,
            'enablejsapi': 1,
            'origin': window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady(event) {
    state.playerReady = true;
    console.log("📺 TV Tube: Sintonizador Pronto.");
    
    // Se a TV foi ligada antes do player carregar, inicia o vídeo agora
    if (state.isOn && state.currentVideoData) {
        playCurrentVideo();
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        handleVideoEnd();
        state.isPlaying = false;
        els.creditsOverlay.classList.remove('visible'); // Força esconder
    } else if (event.data === YT.PlayerState.PLAYING) {
        state.isPlaying = true;
        hideStatus();
        
        // Reset visual imediato ao iniciar
        els.creditsOverlay.classList.remove('visible');

        // Tenta atualizar créditos agora que o vídeo começou (para pegar o título se necessário)
        if (state.currentVideoData) {
            updateCreditsInfo(state.currentVideoData);
        }

        // Se CC estiver ligado, gera letras
        if (state.isLyricsOn && state.currentVideoData) {
            generateAILyrics(state.currentVideoData);
        }
        
    } else if (event.data === YT.PlayerState.BUFFERING) {
        showStatus("TUNING...");
    } else if (event.data === YT.PlayerState.PAUSED) {
        state.isPlaying = false;
    }
}

function onPlayerError(event) {
    console.warn("Sinal fraco ou interferência (Erro YT):", event.data);
    showStatus("NO SIGNAL - SKIPPING");
    // Pula para o próximo vídeo após breve delay
    setTimeout(() => changeChannel(1), 2000);
}

// --- CONTROLE DA TV ---

function togglePower() {
    state.isOn = !state.isOn;
    
    if (state.isOn) {
        // Ligar
        els.powerLed.classList.add('bg-red-500', 'shadow-[0_0_8px_#ff0000]');
        els.powerLed.classList.remove('bg-red-900');
        
        els.screenOff.classList.add('hidden');
        els.screenOn.classList.remove('hidden');
        els.screenOn.classList.add('crt-turn-on');
        els.screenOn.classList.remove('crt-turn-off');

        // Se não tem canal carregado, carrega um padrão
        if (state.currentChannelList.length === 0) {
            loadDefaultChannel();
        } else {
            // Se já tem canal, retoma
            if (player && state.playerReady) {
                player.playVideo();
            } else if (state.playerReady && state.currentVideoData) {
                playCurrentVideo();
            }
        }

        setTimeout(() => {
            showOSD();
        }, 1000);

    } else {
        // Desligar
        els.powerLed.classList.remove('bg-red-500', 'shadow-[0_0_8px_#ff0000]');
        els.powerLed.classList.add('bg-red-900');
        
        els.screenOn.classList.remove('crt-turn-on');
        els.screenOn.classList.add('crt-turn-off');
        
        setTimeout(() => {
            els.screenOn.classList.add('hidden');
            els.screenOff.classList.remove('hidden');
            if (player && state.playerReady) player.pauseVideo();
            state.isPlaying = false;
        }, 400);
        
        // Reset estados visuais
        els.creditsOverlay.classList.remove('visible');
        els.lyricsOverlay.classList.add('hidden');
    }
}

async function loadDefaultChannel() {
    // Tenta carregar o canal "MTV 90s" ou o primeiro que achar
    showStatus("SEARCHING SATELLITE...");
    
    // Busca uma playlist popular ou random
    const { data } = await supabase.from('playlists').select('name').limit(1);
    if (data && data.length > 0) {
        await loadChannelContent(data[0].name);
    } else {
        showStatus("NO SERVICE");
    }
}

async function loadChannelContent(playlistName) {
    showStatic(500);
    showStatus(`TUNING: ${playlistName}`);
    state.currentChannelName = playlistName;
    
    // Atualiza apenas o nome da Playlist na tela
    els.playlistLabel.innerText = playlistName.toUpperCase();

    // Busca vídeos dessa playlist
    const { data, error } = await supabase
        .from('musicas_backup')
        .select('*')
        .eq('playlist', playlistName);

    if (error || !data || data.length === 0) {
        showStatus("CHANNEL EMPTY");
        console.error("Erro ao carregar canal:", error);
        return;
    }

    // APLICAÇÃO DO SHUFFLE REAL (FISHER-YATES)
    state.currentChannelList = fisherYatesShuffle([...data]);
    state.currentIndex = 0;
    
    updateGuideNowPlaying();
    playCurrentVideo();
}

function playCurrentVideo() {
    if (!state.currentChannelList.length) return;
    
    const videoData = state.currentChannelList[state.currentIndex];
    state.currentVideoData = videoData;
    
    if (player && state.playerReady && videoData.video_id) {
        console.log(`▶️ Tocando: ${videoData.musica} (${videoData.video_id})`);
        player.loadVideoById(videoData.video_id);
    } else {
        console.log("⏳ Aguardando player ou ID inválido...");
        if (!videoData.video_id) {
            console.warn("⚠️ Vídeo sem ID. Pulando...");
            changeChannel(1);
        }
    }
    
    // Atualiza info inicial (tentativa com dados do DB)
    updateCreditsInfo(videoData);
    updateGuideNowPlaying();
}

function handleVideoEnd() {
    changeChannel(1); // Auto next
}

function changeChannel(direction) {
    if (!state.isOn || state.currentChannelList.length === 0) return;
    
    showStatic(300); // Ruído de troca de canal
    
    state.currentIndex += direction;
    
    // Loop da playlist
    if (state.currentIndex >= state.currentChannelList.length) state.currentIndex = 0;
    if (state.currentIndex < 0) state.currentIndex = state.currentChannelList.length - 1;
    
    playCurrentVideo();
    showOSD();
}

// --- VISUAL EFFECTS ---

function showStatic(duration) {
    els.staticOverlay.classList.add('active');
    setTimeout(() => {
        els.staticOverlay.classList.remove('active');
    }, duration);
}

function showStatus(text) {
    els.statusText.innerText = text;
    els.statusMsg.classList.remove('hidden');
    // Auto hide
    setTimeout(hideStatus, 3000);
}

function hideStatus() {
    els.statusMsg.classList.add('hidden');
}

function showOSD() {
    els.osdLayer.classList.remove('fade-out');
    els.osdLayer.style.opacity = 1;
    clearTimeout(window.osdTimeout);
    window.osdTimeout = setTimeout(() => {
        els.osdLayer.classList.add('fade-out');
    }, 4000);
}

// --- SMART CREDITS LOGIC ---

// Helper: Limpa títulos do YouTube (remove "Official Video", "Lyrics", etc)
function cleanYouTubeTitle(title) {
    if (!title) return "";
    return title
        .replace(/[\(\[\{].*?[\)\]\}]/g, '') // Remove parênteses/colchetes e conteúdo
        .replace(/official video/gi, '')
        .replace(/official music video/gi, '')
        .replace(/video clip/gi, '')
        .replace(/lyrics/gi, '')
        .replace(/hq/gi, '')
        .replace(/4k/gi, '')
        .replace(/hd/gi, '')
        .replace(/\s+/g, ' ') // Remove espaços duplos
        .replace(/\s*[–—|:]\s*/g, ' - ') // Normaliza separadores (hífen, travessão, pipe)
        .trim();
}

function updateCreditsInfo(data) {
    // 1. Prioriza dados do Banco de Dados
    let artist = data.artista;
    let song = data.musica;
    
    // 2. Fallback: Se não tem no DB, tenta pegar do título do YouTube
    if ((!artist || !song || artist === 'Unknown' || song === 'Unknown' || artist.trim() === '') && player && typeof player.getVideoData === 'function') {
        const ytData = player.getVideoData();
        
        if (ytData && ytData.title) {
            const cleanTitle = cleanYouTubeTitle(ytData.title);
            
            // Tenta separar por hífen padrão "Artist - Song"
            const parts = cleanTitle.split(' - ');
            
            if (parts.length >= 2) {
                // Se encontrou separador, assume Artista - Música
                if (!artist) artist = parts[0].trim();
                // Junta o resto caso tenha mais hifens no nome da música
                if (!song) song = parts.slice(1).join(' - ').trim(); 
            } else {
                // FALLBACK DE ÚLTIMO RECURSO:
                // Se não tem separador no título, pegamos o Nome do Canal (Author) como Artista
                if (!artist && ytData.author) {
                    // Remove sufixos comuns de canais oficiais para limpar o nome
                    artist = ytData.author.replace(/VEVO/gi, '').replace(/Official/gi, '').replace(/Topic/gi, '').trim();
                }
                
                if (!song) {
                    // VERIFICAÇÃO DE REPETIÇÃO:
                    // Se temos o artista (vindo do canal) e o título começa com esse nome,
                    // removemos o artista do título para evitar "Madonna: Madonna - Like a Prayer"
                    if (artist && cleanTitle.toLowerCase().startsWith(artist.toLowerCase())) {
                        let tempSong = cleanTitle.substring(artist.length).trim();
                        // Remove separadores que podem ter sobrado no início (ex: " - Like a Prayer")
                        tempSong = tempSong.replace(/^[-: ]+/, '').trim();
                        song = tempSong || cleanTitle; // Se sobrar vazio, volta ao original
                    } else {
                        song = cleanTitle;
                    }
                }
            }
        }
    }

    // 3. Função auxiliar para mostrar/esconder linha
    const updateLine = (element, text) => {
        const lineParent = element.parentElement; // A div .credit-line
        
        if (text && text.toString().trim() !== '' && text !== 'null' && text !== 'undefined') {
            element.innerText = text;
            lineParent.style.display = 'flex'; // Mostra se tem dado
        } else {
            lineParent.style.display = 'none'; // Esconde se vazio
        }
    };

    // 4. Aplica lógica linha a linha
    updateLine(els.credArtist, artist);
    updateLine(els.credSong, song);
    updateLine(els.credAlbum, data.album);
    updateLine(els.credYear, data.ano);
    updateLine(els.credDirector, data.direcao);
}


// --- GEMINI AI (CC) ---

// CC / Lyrics Logic
els.btnCC.addEventListener('click', () => {
    state.isLyricsOn = !state.isLyricsOn;
    const btnSpan = els.btnCC.querySelector('span:last-child');
    
    if (state.isLyricsOn) {
        btnSpan.classList.add('text-yellow-400', 'border-yellow-400');
        showStatus("CC: AI CAPTIONING ON");
        els.lyricsOverlay.classList.remove('hidden');
        if (state.currentVideoData) generateAILyrics(state.currentVideoData);
    } else {
        btnSpan.classList.remove('text-yellow-400', 'border-yellow-400');
        showStatus("CC: OFF");
        els.lyricsOverlay.classList.add('hidden');
    }
});

async function generateAILyrics(videoData) {
    if (state.lyricsLoading) return;
    state.lyricsLoading = true;
    els.lyricsContent.innerText = "Scanning audio patterns...";

    try {
        // Usa fallback name também para a AI se necessário
        let searchName = videoData.musica;
        if (!searchName && player && player.getVideoData) {
             searchName = cleanYouTubeTitle(player.getVideoData().title);
        }

        const prompt = `Gere uma interpretação poética curta ou a letra (se for famosa) da música "${searchName}" do artista "${videoData.artista || 'Unknown'}". 
        Formate como legendas de Closed Caption.`;

        const response = await genAI.models.generateContent({
            model: AI_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
        });

        if (state.isLyricsOn) {
            els.lyricsContent.innerText = response.text;
        }
    } catch (e) {
        els.lyricsContent.innerText = "[CC UNAVAILABLE]";
    } finally {
        state.lyricsLoading = false;
    }
}


// --- TELETEXT GUIDE LOGIC ---

async function fetchGuideData() {
    // Busca todas playlists agrupadas
    const { data } = await supabase.from('playlists').select('*');
    
    if (data) {
        // Agrupa por categoria
        state.channelsByCategory = data.reduce((acc, curr) => {
            const group = curr.group_name || 'OTHERS';
            if (!acc[group]) acc[group] = [];
            acc[group].push(curr);
            return acc;
        }, {});
        
        renderGuide();
    }
}

function renderGuide() {
    els.guideChannelList.innerHTML = '';
    
    // Ordem preferencial de categorias
    const order = ['UPLOADS', 'GENRES', 'ZONES', 'ERAS', 'OTHERS'];
    
    order.forEach(category => {
        if (state.channelsByCategory[category]) {
            // Cria Header do Grupo
            const groupDiv = document.createElement('div');
            groupDiv.className = 'mb-1';
            
            const headerBtn = document.createElement('div');
            headerBtn.className = 'accordion-header text-white font-bold bg-[#0000aa] border border-white p-1 px-2 flex justify-between items-center hover:bg-blue-900 transition-colors';
            headerBtn.innerHTML = `<span>${category}</span> <span class="text-yellow-400 text-xs">▼</span>`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'accordion-content bg-black border-l border-r border-white/30 ml-2';
            
            // Toggle Accordion
            headerBtn.onclick = () => {
                contentDiv.classList.toggle('open');
                const arrow = headerBtn.querySelector('span:last-child');
                arrow.innerText = contentDiv.classList.contains('open') ? '▲' : '▼';
            };
            
            // Popula Playlists
            state.channelsByCategory[category].forEach(pl => {
                const item = document.createElement('div');
                item.className = 'teletext-link p-1 px-2 text-sm text-gray-300 font-mono border-b border-gray-800 flex justify-between hover:bg-white hover:text-blue-800 cursor-pointer';
                item.innerHTML = `<span>${pl.name.substring(0,25)}</span> <span class="text-xs opacity-50">${pl.video_count || 0}</span>`;
                item.onclick = () => {
                    selectChannelFromGuide(pl.name);
                };
                contentDiv.appendChild(item);
            });
            
            groupDiv.appendChild(headerBtn);
            groupDiv.appendChild(contentDiv);
            els.guideChannelList.appendChild(groupDiv);
        }
    });
}

function selectChannelFromGuide(name) {
    loadChannelContent(name);
    toggleGuide(); // Fecha guia
}

function updateGuideNowPlaying() {
    if (state.currentVideoData) {
        els.guideNpTitle.innerText = `${state.currentVideoData.artista || '?'} - ${state.currentVideoData.musica || '?'}`;
        els.guideNpPlaylist.innerText = `CANAL: ${state.currentChannelName}`;
        els.guideNowPlayingBox.classList.remove('hidden');
    }
}

function toggleGuide() {
    state.isSearchOpen = !state.isSearchOpen;
    
    if (state.isSearchOpen) {
        els.guideContainer.classList.remove('hidden');
        // Animação de entrada
        setTimeout(() => {
            els.guideBackdrop.classList.remove('opacity-0');
            els.guideSidebar.classList.remove('-translate-x-full');
        }, 10);
        els.guideSearch.focus();
    } else {
        els.guideBackdrop.classList.add('opacity-0');
        els.guideSidebar.classList.add('-translate-x-full');
        setTimeout(() => {
            els.guideContainer.classList.add('hidden');
        }, 300);
    }
}

// Filtro de Busca no Guia
els.guideSearch.addEventListener('input', (e) => {
    const term = e.target.value.toUpperCase();
    const links = document.querySelectorAll('.teletext-link');
    
    links.forEach(link => {
        const text = link.querySelector('span').innerText.toUpperCase();
        if (text.includes(term)) {
            link.style.display = 'flex';
            // Abre o accordion pai se encontrar
            link.parentElement.classList.add('open');
        } else {
            link.style.display = 'none';
        }
    });
});


// --- EVENT LISTENERS GERAIS ---

function setupEventListeners() {
    els.tvPowerBtn.addEventListener('click', togglePower);
    
    els.btnNext.addEventListener('click', () => changeChannel(1));
    els.btnPrev.addEventListener('click', () => changeChannel(-1));
    
    // Botão de Busca/Guide
    els.btnSearch.addEventListener('click', toggleGuide);
    els.guideBackdrop.addEventListener('click', toggleGuide);
    
    // Teclado
    document.addEventListener('keydown', (e) => {
        if (!state.isOn && e.key !== 'p') return;
        
        if (e.key === 'Escape' && state.isSearchOpen) toggleGuide();
        if (e.key === 'ArrowRight') changeChannel(1);
        if (e.key === 'ArrowLeft') changeChannel(-1);
    });
}

// Start
init();