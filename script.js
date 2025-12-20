
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// --- CONFIGURAÇÃO ADMIN ---
const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';

// --- ESTADO GLOBAL ---
const state = {
    isOn: false,
    isSearchOpen: false,
    
    // Playlist System
    channelsByCategory: {}, 
    currentChannelList: [], 
    currentIndex: 0,
    currentChannelName: '',
    
    // Navigation System
    groupsOrder: ['UPLOADS', 'GENRES', 'ZONES', 'ERAS', 'OTHERS'],
    currentGroupIndex: 0, 

    // Player State
    playerReady: false,
    currentVideoData: null, 
    isPlaying: false
};

let player; 

// --- ELEMENTOS DOM ---
const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    staticOverlay: document.getElementById('static-overlay'),
    
    btnNextCh: document.getElementById('tv-ch-next'),
    btnPrevCh: document.getElementById('tv-ch-prev'),
    btnNextGrp: document.getElementById('tv-grp-next'),
    btnPrevGrp: document.getElementById('tv-grp-prev'),

    btnSearch: document.getElementById('tv-search-btn'),
    
    adminPanelHeader: document.getElementById('admin-panel-header'),
    headerEditBtn: document.getElementById('header-edit-btn'),
    guideAdminLink: document.getElementById('guide-admin-link'),

    osdLayer: document.getElementById('osd-layer'),
    playlistLabel: document.getElementById('tv-playlist-label'),
    statusMsg: document.getElementById('status-message'),
    statusText: document.getElementById('status-text'),
    
    guideContainer: document.getElementById('tv-internal-guide'),
    guideSidebar: document.getElementById('tv-internal-guide'), // Redirecionado para o contêiner fixo
    guideClock: document.getElementById('guide-clock'),
    guideChannelList: document.getElementById('channel-guide-container'),
    guideSearch: document.getElementById('channel-search'),
    guideNpTitle: document.getElementById('np-title'),
    guideNpPlaylist: document.getElementById('np-playlist'),
    guideNowPlayingBox: document.getElementById('guide-now-playing'),

    creditsOverlay: document.getElementById('video-credits'),
    credArtist: document.getElementById('artist-name'),
    credSong: document.getElementById('song-name'),
    credAlbum: document.getElementById('album-name'),
    credYear: document.getElementById('release-year'),
    credDirector: document.getElementById('director-name')
};

// --- INICIALIZAÇÃO ---

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        console.log("👤 Modo Convidado Ativo");
    } else {
        console.log("👤 Usuário Autenticado:", session.user.email);
    }

    checkAdminAccess(session);
    startClocks();
    loadYouTubeAPI();
    setupEventListeners();
    fetchGuideData();
}

function checkAdminAccess(session) {
    try {
        if (session && session.user && session.user.id === ADMIN_UID) {
            if (els.adminPanelHeader) els.adminPanelHeader.classList.remove('hidden');
            if (els.guideAdminLink) els.guideAdminLink.classList.remove('hidden');
        } else {
            if (els.adminPanelHeader) els.adminPanelHeader.classList.add('hidden');
            if (els.guideAdminLink) els.guideAdminLink.classList.add('hidden');
        }
    } catch (e) {
        console.warn("Auth check error:", e);
    }
}

function startClocks() {
    setInterval(() => {
        const now = new Date();
        if(els.guideClock) els.guideClock.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        if (state.isOn && state.playerReady && state.isPlaying) {
            monitorCredits();
        }
    }, 500);
}

function fisherYatesShuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function monitorCredits() {
    if (!player || typeof player.getCurrentTime !== 'function') return;

    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    
    if (!duration || duration < 1) return;

    const isIntroWindow = currentTime >= 10 && currentTime < 20;
    const outroStartTime = duration - 20;
    const outroEndTime = duration - 10;
    const isOutroWindow = (duration > 40) && (currentTime >= outroStartTime && currentTime < outroEndTime);

    if (isIntroWindow || isOutroWindow) {
        els.creditsOverlay.classList.add('visible');
    } else {
        els.creditsOverlay.classList.remove('visible');
    }
}

function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        onYouTubeIframeAPIReady();
        return;
    }
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = () => {
    const origin = window.location.origin;

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
            'origin': origin 
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
    if (state.isOn && state.currentVideoData) {
        playCurrentVideo();
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        handleVideoEnd();
        state.isPlaying = false;
        els.creditsOverlay.classList.remove('visible');
    } else if (event.data === YT.PlayerState.PLAYING) {
        state.isPlaying = true;
        hideStatus();
        els.creditsOverlay.classList.remove('visible');
        if (state.currentVideoData) {
            updateCreditsInfo(state.currentVideoData);
        }
    } else if (event.data === YT.PlayerState.BUFFERING) {
        showStatus("TUNING...");
    } else if (event.data === YT.PlayerState.PAUSED) {
        state.isPlaying = false;
    }
}

function onPlayerError(event) {
    console.warn("Player Error:", event.data);
    showStatus("NO SIGNAL - SKIPPING");
    setTimeout(() => {
        state.currentIndex++;
        if (state.currentIndex >= state.currentChannelList.length) state.currentIndex = 0;
        playCurrentVideo();
    }, 2000);
}

function togglePower() {
    state.isOn = !state.isOn;
    
    if (state.isOn) {
        els.powerLed.classList.add('bg-red-500', 'shadow-[0_0_8px_#ff0000]');
        els.powerLed.classList.remove('bg-red-900');
        
        els.screenOff.classList.add('hidden');
        els.screenOn.classList.remove('hidden');
        els.screenOn.classList.add('crt-turn-on');
        els.screenOn.classList.remove('crt-turn-off');

        if (state.currentChannelList.length === 0) {
            loadDefaultChannel();
        } else {
            if (player && state.playerReady) {
                player.playVideo();
            } else if (state.playerReady && state.currentVideoData) {
                playCurrentVideo();
            }
        }
        setTimeout(() => showOSD(), 1000);
    } else {
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
        els.creditsOverlay.classList.remove('visible');
    }
}

async function loadDefaultChannel() {
    if (Object.keys(state.channelsByCategory).length === 0) {
        await fetchGuideData();
    }
    for (let i = 0; i < state.groupsOrder.length; i++) {
        const groupName = state.groupsOrder[i];
        if (state.channelsByCategory[groupName] && state.channelsByCategory[groupName].length > 0) {
            state.currentGroupIndex = i;
            const firstPlaylist = state.channelsByCategory[groupName][0];
            await loadChannelContent(firstPlaylist.name);
            return;
        }
    }
    showStatus("NO SIGNAL");
}

async function loadChannelContent(playlistName) {
    showStatic(500);
    showStatus(`TUNING: ${playlistName}`);
    state.currentChannelName = playlistName;
    els.playlistLabel.innerText = playlistName.toUpperCase();

    const { data, error } = await supabase
        .from('musicas_backup')
        .select('*')
        .eq('playlist', playlistName)
        .order('id', { ascending: false })
        .range(0, 4999); 

    if (error || !data || data.length === 0) {
        showStatus("CHANNEL EMPTY");
        return;
    }

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
        player.loadVideoById(videoData.video_id);
    } else if (videoData) {
        state.currentIndex++;
        if (state.currentIndex >= state.currentChannelList.length) state.currentIndex = 0;
        playCurrentVideo();
    }
    updateCreditsInfo(videoData);
    updateGuideNowPlaying();
}

function handleVideoEnd() {
    state.currentIndex++;
    if (state.currentIndex >= state.currentChannelList.length) state.currentIndex = 0;
    playCurrentVideo();
}

async function changeGroup(direction) {
    if (!state.isOn || Object.keys(state.channelsByCategory).length === 0) return;
    showStatic(400);
    state.currentGroupIndex += direction;
    if (state.currentGroupIndex >= state.groupsOrder.length) state.currentGroupIndex = 0;
    if (state.currentGroupIndex < 0) state.currentGroupIndex = state.groupsOrder.length - 1;
    const groupName = state.groupsOrder[state.currentGroupIndex];
    showStatus(`GROUP: ${groupName}`);
    const playlists = state.channelsByCategory[groupName];
    if (playlists && playlists.length > 0) {
        await loadChannelContent(playlists[0].name);
    } else {
        showStatus(`${groupName}: NO SIGNAL`);
    }
}

async function changeChannel(direction) {
    if (!state.isOn || !state.currentChannelName) return;
    const groupName = state.groupsOrder[state.currentGroupIndex];
    const playlists = state.channelsByCategory[groupName];
    if (!playlists || playlists.length === 0) return;
    let currentPlIndex = playlists.findIndex(pl => pl.name === state.currentChannelName);
    if (currentPlIndex === -1) currentPlIndex = 0;
    currentPlIndex += direction;
    if (currentPlIndex >= playlists.length) currentPlIndex = 0;
    if (currentPlIndex < 0) currentPlIndex = playlists.length - 1;
    await loadChannelContent(playlists[currentPlIndex].name);
}

function showStatic(duration) {
    els.staticOverlay.classList.add('active');
    setTimeout(() => els.staticOverlay.classList.remove('active'), duration);
}

function showStatus(text) {
    els.statusText.innerText = text;
    els.statusMsg.classList.remove('hidden');
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

function cleanYouTubeTitle(title) {
    if (!title) return "";
    return title
        .replace(/[\(\[\{].*?[\)\]\}]/g, '')
        .replace(/official video/gi, '')
        .replace(/official music video/gi, '')
        .replace(/video clip/gi, '')
        .replace(/lyrics/gi, '')
        .replace(/hq/gi, '')
        .replace(/4k/gi, '')
        .replace(/hd/gi, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*[–—|:]\s*/g, ' - ')
        .trim();
}

/**
 * REGRAS DE EXIBIÇÃO: Conectores não negritos (ft., &, vs.)
 */
function formatCredits(text, isDirector = false) {
    if (!text) return "";
    let formatted = text.toString();
    
    // Conectores de Artista
    if (!isDirector) {
        const connectors = [/ ft\./gi, / & /g, / vs\./gi];
        connectors.forEach(reg => {
            formatted = formatted.replace(reg, (match) => `<span class="credit-connector">${match}</span>`);
        });
    } else {
        // Conector de Diretor
        formatted = formatted.replace(/ & /g, (match) => `<span class="credit-connector">${match}</span>`);
    }
    
    return formatted;
}

function updateCreditsInfo(data) {
    let artist = data.artista;
    let song = data.musica;
    
    if ((!artist || !song || artist === 'Unknown' || song === 'Unknown' || artist.trim() === '') && player && typeof player.getVideoData === 'function') {
        const ytData = player.getVideoData();
        if (ytData && ytData.title) {
            const cleanTitle = cleanYouTubeTitle(ytData.title);
            const parts = cleanTitle.split(' - ');
            if (parts.length >= 2) {
                if (!artist) artist = parts[0].trim();
                if (!song) song = parts.slice(1).join(' - ').trim(); 
            } else {
                if (!artist && ytData.author) {
                    artist = ytData.author.replace(/VEVO/gi, '').replace(/Official/gi, '').replace(/Topic/gi, '').trim();
                }
                if (!song) {
                    if (artist && cleanTitle.toLowerCase().startsWith(artist.toLowerCase())) {
                        let tempSong = cleanTitle.substring(artist.length).trim();
                        tempSong = tempSong.replace(/^[-: ]+/, '').trim();
                        song = tempSong || cleanTitle;
                    } else {
                        song = cleanTitle;
                    }
                }
            }
        }
    }

    const updateLine = (element, text, isDirector = false, isArtist = false) => {
        const lineParent = element.parentElement;
        if (text && text.toString().trim() !== '' && text !== 'null' && text !== 'undefined') {
            // Aplicando a formatação de conectores (innerHTML para permitir tags de span)
            element.innerHTML = formatCredits(text, isDirector);
            lineParent.style.display = 'flex';
        } else {
            lineParent.style.display = 'none';
        }
    };

    updateLine(els.credArtist, artist, false, true);
    updateLine(els.credSong, song);
    updateLine(els.credAlbum, data.album);
    updateLine(els.credYear, data.ano);
    updateLine(els.credDirector, data.direcao, true);
}

async function fetchGuideData() {
    const { data } = await supabase
        .from('playlists')
        .select('*')
        .order('updated_at', { ascending: false }) 
        .range(0, 9999); 
        
    if (data) {
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
    state.groupsOrder.forEach(category => {
        if (state.channelsByCategory[category]) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'mb-1';
            const headerBtn = document.createElement('div');
            headerBtn.className = 'accordion-header text-white font-bold bg-[#0000aa] border border-white p-1 px-2 flex justify-between items-center hover:bg-blue-900 transition-colors';
            headerBtn.innerHTML = `<span>${category}</span> <span class="text-yellow-400 text-xs">▼</span>`;
            const contentDiv = document.createElement('div');
            contentDiv.className = 'accordion-content bg-black border-l border-r border-white/30 ml-2';
            headerBtn.onclick = () => {
                contentDiv.classList.toggle('open');
                const arrow = headerBtn.querySelector('span:last-child');
                arrow.innerText = contentDiv.classList.contains('open') ? '▲' : '▼';
            };
            state.channelsByCategory[category].forEach(pl => {
                const item = document.createElement('div');
                item.className = 'teletext-link p-1 px-2 text-sm text-gray-300 font-mono border-b border-gray-800 flex justify-between hover:bg-white hover:text-blue-800 cursor-pointer';
                item.innerHTML = `<span>${pl.name.substring(0,25)}</span> <span class="text-xs opacity-50">${pl.video_count || 0}</span>`;
                item.onclick = () => selectChannelFromGuide(pl.name);
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
    toggleGuide();
}

function updateGuideNowPlaying() {
    if (state.currentVideoData) {
        els.guideNpTitle.innerText = `${state.currentVideoData.artista || '?'} - ${state.currentVideoData.musica || '?'}`;
        els.guideNpPlaylist.innerText = `CANAL: ${state.currentChannelName}`;
        els.guideNowPlayingBox.classList.remove('hidden');
    }
}

/**
 * TOGGLE GUIDE (NON-STOP VERSION)
 * Gerencia a classe 'guide-active' no body para orquestrar o push da TV
 */
function toggleGuide() {
    state.isSearchOpen = !state.isSearchOpen;
    if (state.isSearchOpen) {
        document.body.classList.add('guide-active');
        els.guideSearch.focus();
    } else {
        document.body.classList.remove('guide-active');
        els.guideSearch.blur();
    }
}

els.guideSearch.addEventListener('input', (e) => {
    const term = e.target.value.toUpperCase();
    const links = document.querySelectorAll('.teletext-link');
    links.forEach(link => {
        const text = link.querySelector('span').innerText.toUpperCase();
        if (text.includes(term)) {
            link.style.display = 'flex';
            link.parentElement.classList.add('open');
        } else {
            link.style.display = 'none';
        }
    });
});

function setupEventListeners() {
    els.tvPowerBtn.addEventListener('click', togglePower);
    els.btnNextCh.addEventListener('click', () => changeChannel(1));
    els.btnPrevCh.addEventListener('click', () => changeChannel(-1));
    els.btnNextGrp.addEventListener('click', () => changeGroup(1));
    els.btnPrevGrp.addEventListener('click', () => changeGroup(-1));
    els.btnSearch.addEventListener('click', toggleGuide);
    
    // Fechar ao clicar na área da TV quando o guia estiver aberto
    document.getElementById('app-viewport').addEventListener('click', () => {
        if (state.isSearchOpen) toggleGuide();
    });

    if(els.headerEditBtn) {
        els.headerEditBtn.addEventListener('click', () => {
            if (state.currentVideoData && state.currentVideoData.id) {
                window.location.href = `admin.html?edit_id=${state.currentVideoData.id}`;
            } else {
                showStatus("NO VIDEO DATA TO EDIT");
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (!state.isOn && e.key !== 'p') return;
        if (e.key === 'Escape' && state.isSearchOpen) toggleGuide();
        
        // Evita navegação de canais se estiver digitando na busca
        if (document.activeElement === els.guideSearch) return;

        if (e.key === 'ArrowRight') changeChannel(1);
        if (e.key === 'ArrowLeft') changeChannel(-1);
        if (e.key === 'ArrowUp') changeGroup(1);
        if (e.key === 'ArrowDown') changeGroup(-1);
    });
}

init();
