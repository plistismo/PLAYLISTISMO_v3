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
    isPlaying: false,

    // Animation Engine
    animationTimer: null
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
    guideSidebar: document.getElementById('tv-internal-guide'), 
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
    
    checkAdminAccess(session);
    startClocks();
    startAnimationEngine();
    loadYouTubeAPI();
    setupEventListeners();
    await fetchGuideData();
    
    const resumeData = localStorage.getItem('tv_resume_state');
    if (resumeData) {
        try {
            const savedState = JSON.parse(resumeData);
            localStorage.removeItem('tv_resume_state'); 
            
            let groupIndex = -1;
            for (let i = 0; i < state.groupsOrder.length; i++) {
                const groupName = state.groupsOrder[i];
                if (state.channelsByCategory[groupName]?.some(p => p.name === savedState.playlist)) {
                    groupIndex = i;
                    break;
                }
            }
            
            if (groupIndex !== -1) {
                state.currentGroupIndex = groupIndex;
                state.isOn = true; 

                els.powerLed.classList.add('bg-red-500', 'shadow-[0_0_8px_#ff0000]');
                els.powerLed.classList.remove('bg-red-900');
                els.screenOff.classList.add('hidden');
                els.screenOn.classList.remove('hidden');
                els.screenOn.classList.add('crt-turn-on');

                await loadChannelContent(savedState.playlist, savedState.videoId);
                setTimeout(() => showOSD(), 1000);
                return;
            }
        } catch (e) {
            console.error("Erro ao restaurar estado:", e);
        }
    }
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

/**
 * Motor de Animações Temáticas Contextuais
 */
function startAnimationEngine() {
    if (state.animationTimer) clearInterval(state.animationTimer);
    
    state.animationTimer = setInterval(() => {
        if (state.isOn && state.isPlaying && !state.isSearchOpen) {
            triggerThematicAnimation();
        }
    }, 20000); // Executa a cada 20 segundos
}

function triggerThematicAnimation() {
    if (!els.playlistLabel) return;
    
    // Aplica a classe de gatilho
    els.playlistLabel.classList.add('animate-trigger');
    
    // Remove a classe após 2 segundos (tempo máximo das animações)
    setTimeout(() => {
        els.playlistLabel.classList.remove('animate-trigger');
    }, 2000);
}

function getThemeForPlaylist(name) {
    const n = name.toUpperCase();
    if (n.includes('RIDE') || n.includes('DRIVE') || n.includes('CAR') || n.includes('LIST')) return 'theme-ride';
    if (n.includes('ROCK') || n.includes('METAL') || n.includes('PUNK') || n.includes('GUITAR')) return 'theme-rock';
    if (n.includes('UPLOAD') || n.includes('TOP') || n.includes('NEWS')) return 'theme-glitch';
    if (n.includes('90S') || n.includes('80S') || n.includes('VHS') || n.includes('RETRO') || n.includes('ERAS')) return 'theme-retro';
    return 'theme-default';
}

function updatePlaylistOSD(name) {
    if (!els.playlistLabel) return;

    // Remove temas anteriores
    els.playlistLabel.className = 'vhs-text-shadow bg-black/50 px-2';
    
    // Identifica e aplica novo tema
    const themeClass = getThemeForPlaylist(name);
    els.playlistLabel.classList.add(themeClass);

    // Lógica de Quebra por ":"
    const parts = name.split(':');
    if (parts.length > 1) {
        els.playlistLabel.innerHTML = `
            <div class="osd-line-1">${parts[0].trim()}:</div>
            <div class="osd-line-2">${parts[1].trim()}</div>
        `;
        els.playlistLabel.classList.add('osd-small');
    } else {
        els.playlistLabel.innerHTML = `<div class="osd-line-1">${name.toUpperCase()}</div>`;
        // Se o nome for muito longo (mais de 20 chars), reduz a fonte mesmo sem quebra
        if (name.length > 20) {
            els.playlistLabel.classList.add('osd-small');
        } else {
            els.playlistLabel.classList.remove('osd-small');
        }
    }
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

    const validGroups = state.groupsOrder.filter(group => 
        state.channelsByCategory[group] && state.channelsByCategory[group].length > 0
    );

    if (validGroups.length === 0) {
        showStatus("NO SIGNAL");
        return;
    }

    const randomGroup = validGroups[Math.floor(Math.random() * validGroups.length)];
    state.currentGroupIndex = state.groupsOrder.indexOf(randomGroup);

    const playlists = state.channelsByCategory[randomGroup];
    const randomPlaylist = playlists[Math.floor(Math.random() * playlists.length)];

    await loadChannelContent(randomPlaylist.name);
}

async function loadChannelContent(playlistName, targetVideoId = null) {
    showStatic(500);
    showStatus(`TUNING: ${playlistName}`);
    state.currentChannelName = playlistName;
    updatePlaylistOSD(playlistName);

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

    if (targetVideoId) {
        state.currentChannelList = [...data]; 
        const foundIndex = data.findIndex(v => v.video_id === targetVideoId);
        state.currentIndex = foundIndex !== -1 ? foundIndex : 0;
    } else {
        state.currentChannelList = fisherYatesShuffle([...data]);
        state.currentIndex = 0;
    }

    updateGuideNowPlaying();
    playCurrentVideo();
}

function playCurrentVideo() {
    if (!state.currentChannelList.length) return;
    const videoData = state.currentChannelList[state.currentIndex];
    state.currentVideoData = videoData;
    
    if (player && state.playerReady && videoData.video_id) {
        player.loadVideoById(videoData.video_id, 0); 
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

function formatCredits(text, isDirector = false) {
    if (!text) return "";
    let formatted = text.toString();
    
    if (!isDirector) {
        const connectors = [/ ft\./gi, / & /g, / vs\./gi];
        connectors.forEach(reg => {
            formatted = formatted.replace(reg, (match) => `<span class="credit-connector">${match}</span>`);
        });
    } else {
        formatted = formatted.replace(/ & /g, (match) => `<span class="credit-connector">${match}</span>`);
    }
    
    return formatted;
}

function updateCreditsInfo(data) {
    const updateLine = (element, text, isDirector = false) => {
        const lineParent = element.closest('.credit-line');
        if (text && text.toString().trim() !== '' && text !== 'null' && text !== 'undefined') {
            element.innerHTML = formatCredits(text, isDirector);
            lineParent.style.display = 'flex';
        } else {
            lineParent.style.display = 'none';
        }
    };
    
    updateLine(els.credArtist, data.artista);
    updateLine(els.credSong, data.musica);
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

function setupEventListeners() {
    els.tvPowerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePower();
    });
    
    els.btnNextCh.addEventListener('click', (e) => { e.stopPropagation(); changeChannel(1); });
    els.btnPrevCh.addEventListener('click', (e) => { e.stopPropagation(); changeChannel(-1); });
    els.btnNextGrp.addEventListener('click', (e) => { e.stopPropagation(); changeGroup(1); });
    els.btnPrevGrp.addEventListener('click', (e) => { e.stopPropagation(); changeGroup(-1); });
    els.btnSearch.addEventListener('click', (e) => { e.stopPropagation(); toggleGuide(); });
    
    document.getElementById('app-viewport').addEventListener('click', () => {
        if (state.isSearchOpen) toggleGuide();
    });

    if(els.headerEditBtn) {
        els.headerEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.currentVideoData && state.currentVideoData.id) {
                if (player && state.playerReady) player.pauseVideo();

                const resumeState = {
                    playlist: state.currentChannelName,
                    videoId: state.currentVideoData.video_id
                };
                localStorage.setItem('tv_resume_state', JSON.stringify(resumeState));
                window.location.href = `admin.html?edit_id=${state.currentVideoData.id}`;
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (!state.isOn && e.key !== 'p') return;
        if (e.key === 'Escape' && state.isSearchOpen) toggleGuide();
        if (document.activeElement === els.guideSearch) return;

        if (e.key === 'ArrowRight') changeChannel(1);
        if (e.key === 'ArrowLeft') changeChannel(-1);
        if (e.key === 'ArrowUp') changeGroup(1);
        if (e.key === 'ArrowDown') changeGroup(-1);
    });
}

init();