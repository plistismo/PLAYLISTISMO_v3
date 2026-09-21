import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel.tsx';
import MatrixPanel from '../components/MatrixPanel.tsx';
import { sanitizeHTML } from '../lib/sanitize.ts';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    creditsInterval: any;
    Vimeo: any;
  }
}

const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';
const GROUPS_ORDER = ['UPLOADS', 'GENRES', 'ZONES', 'ERAS', 'OTHERS'];

const GROUP_ICONS: Record<string, string> = {
  'UPLOADS': '📼',
  'GENRES': '📻',
  'ZONES': '🌍',
  'ERAS': '⏳',
  'OTHERS': '📁'
};

const getGroupIcon = (groupName: string): string => {
  const normalized = (groupName || '').toUpperCase().trim();
  return GROUP_ICONS[normalized] || '📁';
};

const extractUniqueGroups = (playlistItems: { name: string; group_name?: string }[]): string[] => {
  if (!playlistItems || playlistItems.length === 0) {
    return GROUPS_ORDER;
  }

  // Extração dinâmica de group_names únicos
  const rawGroups = playlistItems
    .map(p => (p.group_name && p.group_name.trim() ? p.group_name.trim().toUpperCase() : 'OTHERS'));
  const uniqueSet = new Set(rawGroups);

  // Mantém a ordem preferencial das categorias clássicas e adiciona os novos grupos dinâmicos em ordem alfabética
  const known = GROUPS_ORDER.filter(g => uniqueSet.has(g));
  const dynamic = Array.from(uniqueSet)
    .filter(g => !GROUPS_ORDER.includes(g))
    .sort((a, b) => a.localeCompare(b));

  const result = [...known, ...dynamic];
  return result.length > 0 ? result : GROUPS_ORDER;
};

const getThematicSetup = (name: string) => {
  const n = name.toUpperCase();
  if (n.includes('RIDE') || n.includes('DRIVE') || n.includes('SPEED') || n.includes('CAR')) return { theme: 'ride', bumpClass: 'bump-chrome', logo: '🏎️ SPEED' };
  if (n.includes('HIP') || n.includes('RAP') || n.includes('STREET') || n.includes('RHYMES')) return { theme: 'street', bumpClass: 'bump-urban', logo: '🖍️ STREET' };
  if (n.includes('ROCK') || n.includes('METAL') || n.includes('PUNK') || n.includes('NOISE')) return { theme: 'noise', bumpClass: 'bump-noise', logo: '🤘 RAW' };
  if (n.includes('TECH') || n.includes('DIGITAL') || n.includes('CYBER') || n.includes('UPLOAD')) return { theme: 'cyber', bumpClass: 'bump-cyber', logo: '📡 DATA' };
  return { theme: 'default', bumpClass: 'bump-noise', logo: '📺 TV' };
};

const fisherYatesShuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function Home({ session }: { session: Session | null }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  type PlaylistItem = { name: string; group_name?: string; [key: string]: any };
  type VideoData = { id?: string | number; video_id: string; artista?: string; musica?: string; album?: string; ano?: string; direcao?: string; playlist?: string; [key: string]: any };

  // App State
  const [isOn, setIsOn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [activeGuideGroup, setActiveGuideGroup] = useState<string>('UPLOADS');
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [channelsByCategory, setChannelsByCategory] = useState<Record<string, PlaylistItem[]>>({});
  const [currentChannelList, setCurrentChannelList] = useState<VideoData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChannelName, setCurrentChannelName] = useState('');
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentVideoData, setCurrentVideoData] = useState<VideoData | null>(null);

  // UI State
  const [isBumping, setIsBumping] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showCredits, setShowCredits] = useState(false);
  const [showPlaylistLabel, setShowPlaylistLabel] = useState(false);
  const [time, setTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatic, setShowStatic] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('UPLOADS');
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [adminEditId, setAdminEditId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<VideoData | null>(null);
  const [useJosefinFont, setUseJosefinFont] = useState(false);

  // MATRIX Module State
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [currentChannelWatermark, setCurrentChannelWatermark] = useState<string | null>(null);
  const [currentChannelWatermarkScale, setCurrentChannelWatermarkScale] = useState<number>(1.0);
  
  // Histórico de Sessão (Shuffle sem Repetição)
  const [playedHistory, setPlayedHistory] = useState<Record<string, string[]>>({});
  const playedHistoryRef = useRef<Record<string, string[]>>({});

  // REFS PARA CONTROLE DE API (NON-STOP)
  const playerRef = useRef<any>(null);
  const vimeoPlayerRef = useRef<any>(null);
  const channelListRef = useRef<any[]>([]);
  const currentIndexRef = useRef(0);
  const lastVideoIdRef = useRef<string | null>(null);

  // Plataforma ativa: 'youtube' | 'vimeo'
  const [activePlatform, setActivePlatform] = useState<'youtube' | 'vimeo'>('youtube');
  const activePlatformRef = useRef<'youtube' | 'vimeo'>('youtube');
  const isAdminSidebarOpenRef = useRef(false);
  const adminEditIdRef = useRef<string | null>(null);

  // Grupos únicos extraídos dinamicamente do estado global de playlists
  const uniqueGroups = useMemo(() => extractUniqueGroups(playlists), [playlists]);

  useEffect(() => {
    if (uniqueGroups.length > 0 && !uniqueGroups.includes(activeGuideGroup)) {
      setActiveGuideGroup(uniqueGroups[0]);
    }
  }, [uniqueGroups, activeGuideGroup]);

  const filteredPlaylists = useMemo(() => {
    if (!searchTerm.trim()) {
      return channelsByCategory[activeGuideGroup] || [];
    }
    const term = searchTerm.toUpperCase();
    const inActive = (channelsByCategory[activeGuideGroup] || []).filter(pl =>
      pl.name.toUpperCase().includes(term)
    );
    if (inActive.length > 0) return inActive;
    return (playlists || []).filter(pl => pl.name.toUpperCase().includes(term));
  }, [searchTerm, channelsByCategory, activeGuideGroup, playlists]);

  // Sincroniza as refs com o estado do React
  useEffect(() => {
    channelListRef.current = currentChannelList;
    currentIndexRef.current = currentIndex;
    playedHistoryRef.current = playedHistory;
    activePlatformRef.current = activePlatform;
    isAdminSidebarOpenRef.current = isAdminSidebarOpen;
    adminEditIdRef.current = adminEditId;
  }, [currentChannelList, currentIndex, playedHistory, activePlatform, isAdminSidebarOpen, adminEditId]);

  useEffect(() => {
    if (session?.user?.id === ADMIN_UID) {
      setIsAdmin(true);
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Controle explícito de visibilidade entre os players via element.style
  function syncPlayerVisibility(platform: 'youtube' | 'vimeo') {
    activePlatformRef.current = platform;
    const ytContainer = document.getElementById('yt-player');
    const vimeoContainer = document.getElementById('vimeo-parent-container');
    const vimeoPlayer = document.getElementById('vimeo-player');

    if (platform === 'vimeo') {
      // 1. YouTube obrigatoriamente pausado e oculto
      playerRef.current?.pauseVideo();
      if (ytContainer) {
        ytContainer.style.display = 'none';
      }

      // 2. Vimeo obrigatoriamente visível com 100% de largura e altura
      if (vimeoContainer) {
        vimeoContainer.style.display = 'block';
        vimeoContainer.style.width = '100%';
        vimeoContainer.style.height = '100%';
      }
      if (vimeoPlayer) {
        vimeoPlayer.style.display = 'block';
        vimeoPlayer.style.width = '100%';
        vimeoPlayer.style.height = '100%';
      }
    } else {
      // 1. Vimeo obrigatoriamente pausado e oculto
      vimeoPlayerRef.current?.pause();
      if (vimeoContainer) {
        vimeoContainer.style.display = 'none';
      }
      if (vimeoPlayer) {
        vimeoPlayer.style.display = 'none';
      }

      // 2. YouTube exibido normalmente com 100% de largura e altura
      if (ytContainer) {
        ytContainer.style.display = 'block';
        ytContainer.style.width = '100%';
        ytContainer.style.height = '100%';
      }
    }
  };

  // Inicializa o player Vimeo (chamado após o script já estar carregado)
  function initVimeoPlayer() {
    if (!window.Vimeo || vimeoPlayerRef.current) return;
    vimeoPlayerRef.current = new window.Vimeo.Player('vimeo-player', {
      id: 3559516, // fallback de inicialização; substituído por loadVideo() na reprodução
      width: '100%',
      height: '100%',
      controls: false,
      autoplay: false,
      loop: false,
      muted: false,
      background: false,
    });
    vimeoPlayerRef.current.on('ended', () => {
      if (isAdminSidebarOpenRef.current && adminEditIdRef.current) {
        console.log('VIMEO LOOPING VIDEO (EDIT MODE)');
        vimeoPlayerRef.current.setCurrentTime(0);
        vimeoPlayerRef.current.play();
      } else {
        console.log('VIMEO NON-STOP: VÍDEO ENCERRADO');
        handleVideoEnd();
      }
    });
    vimeoPlayerRef.current.on('error', () => {
      console.warn('VIMEO ERROR: pulando para próximo vídeo');
      handleVideoEnd();
    });
    vimeoPlayerRef.current.on('play', () => {
      setStatus('');
      startCreditsMonitor();
    });
    vimeoPlayerRef.current.on('timeupdate', (data: { seconds: number; duration: number }) => {
      const cur = data.seconds;
      const dur = data.duration;
      if (dur <= 0) return;
      setShowCredits((cur >= 10 && cur < 20) || (dur > 30 && cur >= (dur - 20) && cur < (dur - 10)));
      setShowPlaylistLabel(cur >= 1.5 && cur < dur);
    });
  };

  useEffect(() => {
    fetchGuideData();
    checkResumeState();

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%', width: '100%',
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          showinfo: 0,
          disablekb: 1,
          fs: 0,
          autoplay: 1,
          origin: window.location.origin
        },
        events: {
          'onReady': () => {
            setIsReady(true);
            const isVimeo = currentVideoData?.plataforma === 'vimeo' || /^\d+$/.test(String(currentVideoData?.video_id || ''));
            if (isVimeo) {
              syncPlayerVisibility('vimeo');
            } else if (isOn) {
              playCurrentVideo();
            }
          },
          'onStateChange': onPlayerStateChange,
          'onError': () => handleVideoEnd()
        }
      });
    };

    // Inicializa Vimeo quando o script global já tiver carregado
    // O script é carregado via index.html, então pode já estar pronto
    if (window.Vimeo) {
      initVimeoPlayer();
    } else {
      // Aguarda o script carregar (carregado via index.html)
      const checkVimeo = setInterval(() => {
        if (window.Vimeo) {
          clearInterval(checkVimeo);
          initVimeoPlayer();
        }
      }, 200);
      return () => clearInterval(checkVimeo);
    }
  }, []);

  function onPlayerStateChange(event: any) {
    const YT_STATE = window.YT.PlayerState;
    if (event.data === YT_STATE.PLAYING) {
      setStatus("");
      startCreditsMonitor();
    } else if (event.data === YT_STATE.ENDED) {
      if (isAdminSidebarOpen && adminEditId) {
        console.log("LOOPING VIDEO (EDIT MODE)");
        playerRef.current?.seekTo(0);
        playerRef.current?.playVideo();
      } else {
        console.log("NON-STOP: VÍDEO ENCERRADO");
        handleVideoEnd();
      }
    } else if (event.data === YT_STATE.BUFFERING) {
      setStatus("TUNING...");
    }
  };

  function startCreditsMonitor() {
    if (window.creditsInterval) clearInterval(window.creditsInterval);
    window.creditsInterval = setInterval(async () => {
      let cur = 0;
      let dur = 0;

      const currentPlat = activePlatformRef.current;

      if (currentPlat === 'vimeo' && vimeoPlayerRef.current) {
        try {
          cur = await vimeoPlayerRef.current.getCurrentTime();
          dur = await vimeoPlayerRef.current.getDuration();
        } catch {
          return;
        }
      } else if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          cur = playerRef.current.getCurrentTime();
          dur = playerRef.current.getDuration();
        } catch {
          return;
        }
      }

      if (dur <= 0) return;

      setShowCredits((cur >= 10 && cur < 20) || (dur > 30 && cur >= (dur - 20) && cur < (dur - 10)));
      setShowPlaylistLabel(cur >= 1.5 && cur < dur);
    }, 1000);
  };

  async function fetchGuideData() {
    const { data } = await supabase.from('playlists').select('*').order('name');
    if (data) {
      setPlaylists(data);
      const grouped = data.reduce((acc: any, curr: any) => {
        const g = (curr.group_name && curr.group_name.trim()) ? curr.group_name.trim().toUpperCase() : 'OTHERS';
        if (!acc[g]) acc[g] = [];
        acc[g].push(curr);
        return acc;
      }, {});
      setChannelsByCategory(grouped);
    }
  };

  // Helper para interpretar marca_dagua_escala (se legado > 10, converte 120px = 1.0)
  const parseScale = (raw: any): number => {
    if (raw === null || raw === undefined) return 1.0;
    const num = Number(raw);
    if (isNaN(num) || num <= 0) return 1.0;
    if (num > 10) return Number((num / 120).toFixed(2));
    return num;
  };

  // MATRIX: fetch watermark URL and scale whenever the active channel changes
  useEffect(() => {
    if (!currentChannelName) {
      setCurrentChannelWatermark(null);
      setCurrentChannelWatermarkScale(1.0);
      return;
    }
    supabase
      .from('playlists')
      .select('marca_dagua_url, marca_dagua_escala')
      .eq('name', currentChannelName)
      .maybeSingle()
      .then(({ data }) => {
        setCurrentChannelWatermark(data?.marca_dagua_url || null);
        setCurrentChannelWatermarkScale(parseScale(data?.marca_dagua_escala));
      });
  }, [currentChannelName]);

  function setStatus(msg: string) {
    setStatusMessage(msg);
    if (msg) setTimeout(() => setStatusMessage(''), 3000);
  }

  function checkResumeState() {
    const saved = localStorage.getItem('tv_resume_state');
    if (saved) {
      try {
        const { playlist, videoId } = JSON.parse(saved);
        localStorage.removeItem('tv_resume_state');
        setIsOn(true);
        loadChannelContent(playlist, videoId);
      } catch (e) {
        console.error("Resume state error:", e);
      }
    }
  };

  function togglePower() {
    setIsOn(prev => {
      const next = !prev;
      if (next) {
        if (!currentChannelName) loadDefaultChannel();
        else {
          if (activePlatform === 'vimeo') vimeoPlayerRef.current?.play();
          else playerRef.current?.playVideo();
        }
      } else {
        playerRef.current?.pauseVideo();
        vimeoPlayerRef.current?.pause();
        setShowPlaylistLabel(false);
      }
      return next;
    });
  };

  const loadDefaultChannel = () => {
    const allPlaylists: string[] = [];
    Object.values(channelsByCategory).forEach((list: any) => {
      list.forEach((pl: any) => allPlaylists.push(pl.name));
    });
    if (allPlaylists.length > 0) {
      const randomPlaylist = allPlaylists[Math.floor(Math.random() * allPlaylists.length)];
      loadChannelContent(randomPlaylist);
    }
  };

  const triggerBump = (playlistName: string) => {
    if (isBumping || !isOn) return;
    setIsBumping(true);
    setTimeout(() => { setIsBumping(false); }, 1500);
  };

  const loadChannelContent = async (playlistName: string, targetId: string | null = null) => {
    setShowStatic(true);
    setTimeout(() => setShowStatic(false), 500);
    setCurrentChannelName(playlistName);
    triggerBump(playlistName);
    const cat = Object.keys(channelsByCategory).find(k => channelsByCategory[k].some((p: any) => p.name === playlistName));
    if (cat) {
      setCurrentGroupIndex(uniqueGroups.indexOf(cat));
      setExpandedGroup(cat);
      setActiveGuideGroup(cat);
    }

    const { data } = await supabase.from('musicas_backup').select('*').eq('playlist', playlistName).order('id', { ascending: false });
    if (!data?.length) return;

    const list = targetId ? data : fisherYatesShuffle([...data]);
    let idx = targetId ? list.findIndex(v => v.video_id === targetId) : Math.floor(Math.random() * list.length);
    if (idx === -1) idx = 0;

    setCurrentChannelList(list);
    setCurrentIndex(idx);
    const video = list[idx];

    // Verificação estrita de visibilidade antes de renderizar a faixa
    const initialPlatform = video?.plataforma === 'vimeo' || /^\d+$/.test(String(video?.video_id || '')) ? 'vimeo' : 'youtube';
    syncPlayerVisibility(initialPlatform);

    setCurrentVideoData(video);

    // Registra no histórico se for um novo canal ou vídeo
    if (video?.video_id) {
      setPlayedHistory(prev => {
        const history = prev[playlistName] || [];
        if (history.includes(video.video_id)) return prev;
        return { ...prev, [playlistName]: [...history, video.video_id] };
      });
    }
  };

  const handlePreview = async (videoId: string) => {
    const cleanId = String(videoId || '').trim();
    if (!cleanId) return;
    setStatus("PREVIEWING...");
    
    // Tenta achar nos dados já carregados para ter info completa
    const existing = currentChannelList.find(v => v.video_id === cleanId);
    let nextData = existing;

    if (!existing) {
      const { data } = await supabase.from('musicas_backup').select('*').eq('video_id', cleanId).limit(1).maybeSingle();
      nextData = data || { video_id: cleanId };
    }
    
    const isVimeo = /^\d+$/.test(cleanId);
    const platform: 'youtube' | 'vimeo' = isVimeo ? 'vimeo' : 'youtube';
    setActivePlatform(platform);
    syncPlayerVisibility(platform);
    setCurrentVideoData({ ...nextData!, video_id: cleanId, plataforma: nextData?.plataforma || platform });
    
    if (!isOn) setIsOn(true);
    
    if (isVimeo) {
      if (vimeoPlayerRef.current) {
        playerRef.current?.pauseVideo();
        vimeoPlayerRef.current.loadVideo(Number(cleanId)).then(() => {
          syncPlayerVisibility('vimeo');
          vimeoPlayerRef.current.play();
          startCreditsMonitor();
        }).catch((err: any) => {
          console.warn("Erro no preview do Vimeo:", err);
        });
        lastVideoIdRef.current = cleanId;
      }
    } else if (isReady && playerRef.current) {
      vimeoPlayerRef.current?.pause();
      playerRef.current.loadVideoById({ videoId: cleanId, suggestedQuality: 'hd720' });
      lastVideoIdRef.current = cleanId;
      playerRef.current.playVideo();
      startCreditsMonitor();
    }
  };

  // Efeito centralizado para carregar o vídeo sempre que o dado mudar
  // Suporta plataformas YouTube e Vimeo
  useEffect(() => {
    if (!currentVideoData?.video_id) return;

    const videoId = String(currentVideoData.video_id);
    const platform: 'youtube' | 'vimeo' =
      currentVideoData.plataforma === 'vimeo' || /^\d+$/.test(videoId)
        ? 'vimeo'
        : 'youtube';

    setActivePlatform(platform);

    // Controle de Visibilidade Explicito via element.style.display
    syncPlayerVisibility(platform);

    if (platform === 'vimeo') {
      // --- VIMEO ---
      if (vimeoPlayerRef.current && videoId !== lastVideoIdRef.current) {
        console.log('CARREGANDO VÍDEO VIMEO:', videoId);
        playerRef.current?.pauseVideo(); // para o YouTube
        vimeoPlayerRef.current.loadVideo(Number(videoId)).then(() => {
          syncPlayerVisibility('vimeo');
          if (isOn) vimeoPlayerRef.current.play();
        }).catch(() => {
          console.warn('VIMEO loadVideo falhou, pulando...');
          handleVideoEnd();
        });
        lastVideoIdRef.current = videoId;
      } else if (isOn && vimeoPlayerRef.current) {
        vimeoPlayerRef.current.play();
      }
    } else {
      // --- YOUTUBE ---
      if (isReady && playerRef.current) {
        vimeoPlayerRef.current?.pause(); // para o Vimeo
        if (videoId !== lastVideoIdRef.current) {
          console.log('CARREGANDO VÍDEO YOUTUBE:', videoId);
          playerRef.current.loadVideoById({ videoId, suggestedQuality: 'hd720' });
          lastVideoIdRef.current = videoId;
        }
        if (isOn) playerRef.current.playVideo();
      }
    }
  }, [currentVideoData, isReady]);

  function playCurrentVideo() {
    if (currentChannelList[currentIndex] && isReady) {
      setCurrentVideoData(currentChannelList[currentIndex]);
    }
  }

  function handleVideoEnd() {
    const list = channelListRef.current;
    const currIdx = currentIndexRef.current;
    const history = playedHistoryRef.current[currentChannelName] || [];

    if (list.length === 0) return;

    // Lógica de Shuffle sem Repetição
    let available = list.filter(v => !history.includes(v.video_id));
    
    let nextIndex;
    let nextVideo;

    if (available.length > 0) {
      // Ainda há vídeos não tocados no ciclo
      const randIdx = Math.floor(Math.random() * available.length);
      nextVideo = available[randIdx];
      nextIndex = list.findIndex(v => v.video_id === nextVideo.video_id);
      console.log("SHUFFLE: Selecionando vídeo não tocado:", nextVideo.musica);
    } else {
      // Ciclo completo! Resetamos o histórico do canal
      console.log("SHUFFLE: Ciclo completo. Resetando histórico para:", currentChannelName);
      
      // Filtra para não repetir o mesmo vídeo imediatamente se houver mais de um
      const others = list.length > 1 ? list.filter((_, i) => i !== currIdx) : list;
      nextIndex = list.indexOf(others[Math.floor(Math.random() * others.length)]);
      nextVideo = list[nextIndex];

      // Limpa histórico e começa novo ciclo com o novo vídeo
      setPlayedHistory(prev => ({ ...prev, [currentChannelName]: [nextVideo.video_id] }));
      setCurrentIndex(nextIndex);
      setCurrentVideoData(nextVideo);
      triggerBump(currentChannelName);
      return;
    }

    // Atualiza estado e histórico
    setPlayedHistory(prev => ({
      ...prev,
      [currentChannelName]: [...(prev[currentChannelName] || []), nextVideo.video_id]
    }));
    
    setCurrentIndex(nextIndex);
    setCurrentVideoData(nextVideo);
    triggerBump(currentChannelName);
  };

  const changeGroup = (direction: number) => {
    if (!isOn || uniqueGroups.length === 0) return;
    const nextGroupIdx = (currentGroupIndex + direction + uniqueGroups.length) % uniqueGroups.length;
    setCurrentGroupIndex(nextGroupIdx);
    const groupName = uniqueGroups[nextGroupIdx];
    setStatus(`GROUP: ${groupName}`);
    setExpandedGroup(groupName);
    setActiveGuideGroup(groupName);
    const channelPlaylists = channelsByCategory[groupName];
    if (channelPlaylists?.length) loadChannelContent(channelPlaylists[0].name);
  };

  const changeChannel = (direction: number) => {
    if (!isOn || !currentChannelName || uniqueGroups.length === 0) return;
    const group = uniqueGroups[currentGroupIndex];
    const channelPlaylists = channelsByCategory[group] || [];
    if (!channelPlaylists.length) return;
    let idx = channelPlaylists.findIndex((pl: any) => pl.name === currentChannelName);
    idx = (idx + direction + channelPlaylists.length) % channelPlaylists.length;
    loadChannelContent(channelPlaylists[idx].name);
  };

  const setupBump = getThematicSetup(currentChannelName);
  const playlistParts = currentChannelName.split(':');

  return (
    <div className="bg-[#050505] min-h-screen overflow-x-hidden flex items-center justify-center selection:bg-yellow-400 selection:text-black font-sans transition-all duration-500">

      {/* Admin Panel is now integrated into the main tripartite layout */}

      <main className={`relative z-10 w-full min-h-screen flex flex-col md:grid transition-all duration-500 ease-in-out ${isAdminSidebarOpen ? 'layout-admin-open md:grid-cols-[auto_1fr_auto]' : 'layout-admin-closed md:grid-cols-[0px_1fr_0px] overflow-hidden'}`}>
        
        {/* LEFT PANEL: FORM INTEGRATION */}
        <aside className={`hidden md:flex overflow-hidden transition-all duration-500 ease-in-out border-r border-amber-900/20 bg-black/40 backdrop-blur-md ${isAdminSidebarOpen ? 'translate-x-0 opacity-100 w-auto' : '-translate-x-full opacity-0 w-0'}`}>
          <div className="w-[400px] h-full flex flex-col">
            {isAdminSidebarOpen && (
              <>
                {/* Toggle: Fonte dos Créditos */}
                <div className="shrink-0 px-6 py-3 bg-black border-b border-amber-900/30 flex items-center justify-between">
                  <label htmlFor="toggle-josefin" className="text-xs text-amber-700 uppercase font-bold tracking-widest font-vt323 cursor-pointer select-none">
                    Créditos: Josefin Sans
                  </label>
                  <button
                    id="toggle-josefin"
                    type="button"
                    onClick={() => setUseJosefinFont(prev => !prev)}
                    className={`relative w-10 h-5 rounded-full border transition-all duration-300 focus:outline-none ${
                      useJosefinFont
                        ? 'bg-amber-500 border-amber-400'
                        : 'bg-black border-amber-900/50'
                    }`}
                    aria-pressed={useJosefinFont}
                    title="Alternar fonte dos créditos para Josefin Sans"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${
                        useJosefinFont ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AdminPanel
                    session={session}
                    editId={adminEditId}
                    displayMode="form"
                    onClose={() => setIsAdminSidebarOpen(false)}
                    onSave={(newData) => {
                      fetchGuideData();
                      if (newData) {
                        const savedIdStr = String(newData.id);
                        const videoData = newData as VideoData;
                        setLastSavedRecord(videoData);
                        
                        // Atualiza créditos na tela imediatamente
                        setCurrentVideoData(prev => ({
                          ...prev,
                          ...videoData
                        }));
                        
                        // Sincroniza a lista atual de reprodução
                        setCurrentChannelList(prev => prev.map(item => {
                          if (newData.video_id && item.video_id === newData.video_id) return { ...item, ...videoData };
                          if (!newData.video_id && String(item.id) === savedIdStr) return { ...item, ...videoData };
                          return item;
                        }));

                        setAdminEditId(null);
                      }
                    }}
                    onRestartPlayer={(savedVideoId?: string) => {
                      console.log("RESTARTING PLAYER ON SAVE/COMMIT:", savedVideoId);
                      const targetId = String(savedVideoId || currentVideoData?.video_id || '').trim();
                      const isVimeo = /^\d+$/.test(targetId);

                      if (isVimeo) {
                        syncPlayerVisibility('vimeo');
                        if (vimeoPlayerRef.current && targetId) {
                          vimeoPlayerRef.current.loadVideo(Number(targetId)).then(() => {
                            syncPlayerVisibility('vimeo');
                            vimeoPlayerRef.current.play();
                            startCreditsMonitor();
                          }).catch((err: any) => {
                            console.warn("Erro ao recarregar Vimeo no Commit:", err);
                          });
                          lastVideoIdRef.current = targetId;
                        }
                      } else {
                        syncPlayerVisibility('youtube');
                        if (playerRef.current) {
                          if (targetId && targetId !== lastVideoIdRef.current) {
                            playerRef.current.loadVideoById({ videoId: targetId, suggestedQuality: 'hd720' });
                            lastVideoIdRef.current = targetId;
                          } else {
                            playerRef.current?.seekTo(0);
                          }
                          playerRef.current?.playVideo();
                          startCreditsMonitor();
                        }
                      }
                    }}
                    onPreview={handlePreview}
                  />
                </div>
              </>
            )}
          </div>
        </aside>

        {/* MIDDLE PANEL: TV & CONTROLS */}
        <section className={`flex flex-col items-center justify-center p-4 transition-all duration-500 w-full ${isAdminSidebarOpen ? 'max-w-none' : 'max-w-[1200px] mx-auto'}`}>
          
          {/* Centralized Admin Buttons */}
          <div id="admin-panel-controls" className={`mb-8 flex flex-wrap gap-4 items-center justify-center w-full ${isAdminSidebarOpen ? 'max-w-none' : 'max-w-[800px]'}`}>
            {!session && (
              <button onClick={() => navigate('/login')} className="bg-zinc-900/20 text-zinc-500 border border-zinc-600/50 px-4 py-2 font-vt323 text-xl tracking-widest hover:bg-zinc-600 hover:text-white transition-all uppercase shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-sm flex items-center gap-2 opacity-50 hover:opacity-100">🔑 LOGIN</button>
            )}
            {isAdmin && (
              <>
                <button 
                  onClick={() => { 
                    const newState = !isAdminSidebarOpen || adminEditId !== null;
                    setAdminEditId(null); 
                    setIsAdminSidebarOpen(newState); 
                    if (isMatrixOpen) setIsMatrixOpen(false);
                  }} 
                  className={`min-w-[180px] px-6 py-3 font-vt323 text-2xl tracking-widest transition-all uppercase backdrop-blur-sm flex items-center justify-center gap-2 border shadow-lg rounded-sm ${!adminEditId && isAdminSidebarOpen ? 'bg-amber-600 text-black border-amber-400 scale-105 shadow-[0_0_20px_rgba(217,119,6,0.4)]' : 'bg-amber-900/40 text-amber-500 border-amber-600/50 hover:bg-amber-600 hover:text-black hover:border-amber-400'}`}
                >
                  ⚙ SERVICE MODE
                </button>
                <button 
                  onClick={() => { 
                    const newState = !isAdminSidebarOpen || adminEditId === null;
                    setAdminEditId(currentVideoData?.id ? String(currentVideoData.id) : null); 
                    setIsAdminSidebarOpen(newState); 
                    if (isMatrixOpen) setIsMatrixOpen(false);
                  }} 
                  className={`min-w-[180px] px-6 py-3 font-vt323 text-2xl tracking-widest transition-all uppercase backdrop-blur-sm flex items-center justify-center gap-2 border shadow-lg rounded-sm ${adminEditId && isAdminSidebarOpen ? 'bg-amber-600 text-black border-amber-400 scale-105 shadow-[0_0_20px_rgba(217,119,6,0.4)]' : 'bg-amber-900/40 text-amber-500 border-amber-600/50 hover:bg-amber-600 hover:text-black hover:border-amber-400'}`}
                >
                  ✎ EDIT VIDEO
                </button>

                {/* ── MATRIX Button ── */}
                <button
                  id="btn-matrix"
                  onClick={() => {
                    setIsMatrixOpen(prev => !prev);
                    // Close Service Mode sidebars when opening MATRIX
                    if (!isMatrixOpen) {
                      setIsAdminSidebarOpen(false);
                      setAdminEditId(null);
                    }
                  }}
                  className={`min-w-[180px] px-6 py-3 font-vt323 text-2xl tracking-widest transition-all uppercase backdrop-blur-sm flex items-center justify-center gap-2 shadow-lg rounded-sm ${
                    isMatrixOpen ? 'btn-matrix-active' : 'btn-matrix-idle'
                  }`}
                >
                  ⬡ MATRIX
                </button>
              </>
            )}
          </div>

          {/* ── MATRIX Full-Screen Overlay Panel ── */}
          {isAdmin && (
            <div
              className={`fixed inset-0 z-[200] flex flex-col transition-all duration-400 ease-in-out ${
                isMatrixOpen
                  ? 'opacity-100 pointer-events-auto translate-y-0'
                  : 'opacity-0 pointer-events-none translate-y-4'
              }`}
              style={{ background: 'rgba(1, 8, 4, 0.97)', backdropFilter: 'blur(12px)' }}
            >
              {/* MATRIX Panel Header Bar */}
              <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-[rgba(0,255,136,0.15)] bg-black/60">
                <div className="flex items-center gap-3">
                  <span className="font-vt323 text-3xl tracking-widest" style={{ color: 'var(--matrix-accent)' }}>⬡ MATRIX</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: 'rgba(0,255,136,0.35)' }}>Channel Management System // Admin Only</span>
                </div>
                <button
                  onClick={() => setIsMatrixOpen(false)}
                  className="w-10 h-10 flex items-center justify-center border text-2xl font-bold transition-all"
                  style={{ borderColor: 'rgba(0,255,136,0.3)', color: 'rgba(0,255,136,0.6)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--matrix-accent)'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,255,136,0.6)'; }}
                >
                  ×
                </button>
              </div>
              {/* MATRIX Panel Content */}
              <div className="flex-1 overflow-hidden">
                {isMatrixOpen && (
                  <MatrixPanel
                    session={session}
                    currentChannelName={currentChannelName}
                    onEditVideo={(id) => {
                      setIsMatrixOpen(false);
                      setAdminEditId(id);
                      setIsAdminSidebarOpen(true);
                    }}
                    onChannelUpdated={() => {
                      fetchGuideData();
                      // Re-fetch watermark for current channel
                      if (currentChannelName) {
                        supabase.from('playlists').select('marca_dagua_url, marca_dagua_escala').eq('name', currentChannelName).maybeSingle()
                          .then(({ data }) => {
                            setCurrentChannelWatermark(data?.marca_dagua_url || null);
                            setCurrentChannelWatermarkScale(parseScale(data?.marca_dagua_escala));
                          });
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}



          <div className={`relative w-full ${isAdminSidebarOpen ? 'max-w-full px-4 mx-0' : 'max-w-[1000px] mx-auto'} tv-responsive-container flex flex-col transition-all duration-500 ease-out`}>
            
            {/* ── GAVETA SUPERIOR (INFO / PLAYING NOW) ── */}
            <div
              id="tv-drawer-info"
              className={`w-full overflow-hidden transition-all duration-500 ease-in-out font-jost ${
                isInfoOpen
                  ? 'max-h-[500px] opacity-100 mb-4 translate-y-0'
                  : 'max-h-0 opacity-0 mb-0 -translate-y-6 pointer-events-none'
              }`}
            >
              <div className="bg-[#15171a] border-2 border-[#2b3038] rounded-2xl p-3 md:p-5 shadow-[0_16px_36px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.12)] relative font-jost">
                
                {/* Header Visor do Hardware */}
                <div className="flex items-center justify-between border-b border-[#2b3038] pb-2.5 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
                    <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.25em] text-zinc-300 font-jost">
                      TELEMETRY VISOR // PLAYING NOW
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] md:text-xs text-amber-400 font-mono font-bold uppercase tracking-wider font-jost bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
                      CH: {currentChannelName || 'OFFLINE'}
                    </span>
                    <button
                      onClick={() => setIsInfoOpen(false)}
                      className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-black/50 hover:bg-red-900/60 border border-white/10 transition-colors font-jost"
                      title="Fechar Painel Info"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Hardware Display Rebaixado (shadow-inner) */}
                <div className="bg-neutral-900 border-2 border-black rounded-xl p-3 md:p-4 shadow-[inset_0_4px_18px_rgba(0,0,0,0.95)] relative font-jost">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-green-400 via-cyan-400 via-pink-400 to-orange-500 opacity-70"></div>
                  
                  {currentVideoData ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* ARTIST */}
                      {currentVideoData.artista && (
                        <div className="bg-black/60 p-3 rounded-lg border border-white/10 shadow-inner flex flex-col justify-center">
                          <span className="text-[9px] text-amber-400 font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 font-jost">
                            <span>🎤</span> ARTIST
                          </span>
                          <div
                            className="text-[#ffff00] text-base md:text-lg font-bold uppercase truncate tracking-wide drop-shadow-[0_0_8px_rgba(255,255,0,0.25)] font-jost"
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.artista) }}
                          />
                        </div>
                      )}

                      {/* TRACK */}
                      {currentVideoData.musica && (
                        <div className="bg-black/60 p-3 rounded-lg border border-white/10 shadow-inner flex flex-col justify-center">
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 font-jost">
                            <span>🎼</span> TRACK
                          </span>
                          <div
                            className="text-[#00ff00] text-base md:text-lg font-bold uppercase truncate tracking-wide drop-shadow-[0_0_8px_rgba(0,255,0,0.25)] font-jost"
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.musica) }}
                          />
                        </div>
                      )}

                      {/* ALBUM */}
                      {currentVideoData.album && (
                        <div className="bg-black/60 p-3 rounded-lg border border-white/10 shadow-inner flex flex-col justify-center">
                          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 font-jost">
                            <span>💽</span> ALBUM
                          </span>
                          <div
                            className="text-[#00ffff] text-sm md:text-base font-semibold uppercase truncate tracking-wide font-jost"
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.album) }}
                          />
                        </div>
                      )}

                      {/* RELEASE */}
                      {currentVideoData.ano && (
                        <div className="bg-black/60 p-3 rounded-lg border border-white/10 shadow-inner flex flex-col justify-center">
                          <span className="text-[9px] text-fuchsia-400 font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 font-jost">
                            <span>📅</span> RELEASE
                          </span>
                          <div
                            className="text-[#ff00ff] text-sm md:text-base font-semibold uppercase truncate tracking-wide font-jost"
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.ano) }}
                          />
                        </div>
                      )}

                      {/* DIRECTOR */}
                      {currentVideoData.direcao && (
                        <div className="bg-black/60 p-3 rounded-lg border border-white/10 shadow-inner flex flex-col justify-center sm:col-span-2 lg:col-span-2">
                          <span className="text-[9px] text-orange-400 font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 font-jost">
                            <span>🎬</span> DIRECTOR
                          </span>
                          <div
                            className="text-[#ff8800] text-sm md:text-base font-semibold uppercase truncate tracking-wide font-jost"
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.direcao) }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-zinc-500 uppercase tracking-widest text-xs font-bold font-jost">
                      [ NENHUM SINAL DE VÍDEO ATIVO // REPRODUÇÃO EM ESPERA ]
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CHASSI DA TV */}
            <div className="relative w-full transition-all duration-500 md:perspective-[1500px] group">
              <div className="relative bg-[#181818] texture-plastic rounded-[20px] md:rounded-[32px] p-3 md:p-6 pb-6 md:pb-8 shadow-[0_30px_70px_rgba(0,0,0,0.8),inset_0_2px_3px_rgba(255,255,255,0.15)] border-t border-[#333] md:tv-3d-tilt transform-style-3d z-10 flex flex-col">

              <div className="flex flex-row bg-[#111] rounded-[16px] md:rounded-[36px] p-2 md:p-5 shadow-[inset_0_0_25px_rgba(0,0,0,1)] border-b-4 border-r-4 border-[#080808] border-t border-l border-[#222]">
                <div className="hidden md:flex flex-col justify-center w-10 mr-3 space-y-0.5 opacity-50 shrink-0">
                  {Array.from({ length: 40 }).map((_, i) => <div key={i} className="w-full h-px bg-black/50" />)}
                </div>

                <div className="relative flex-1 aspect-[4/3] bg-[#050505] rounded-[24px] md:rounded-[48px] overflow-hidden screen-container border-[4px] md:border-[8px] border-[#080808] z-10 box-content">
                  <div className="absolute inset-0 crt-overlay z-40 rounded-[24px] md:rounded-[48px] pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]"></div>

                  {!isOn && <div className="absolute inset-0 bg-[#080808] z-20"></div>}

                  <div className={`relative w-full h-full rounded-[20px] md:rounded-[44px] overflow-hidden bg-black ${isOn ? 'crt-turn-on' : ''}`}>
                    {/* YouTube Player */}
                    <div
                      id="yt-player"
                      className="w-full h-full"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        zIndex: 1,
                        display: activePlatform === 'youtube' ? 'block' : 'none',
                      }}
                    ></div>

                    {/* Contêiner Pai do Vimeo Player */}
                    <div
                      id="vimeo-parent-container"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        zIndex: 1,
                        display: activePlatform === 'vimeo' ? 'block' : 'none',
                      }}
                    >
                      <style>{`
                        #vimeo-player,
                        #vimeo-player > div,
                        #vimeo-player iframe {
                          width: 100% !important;
                          height: 100% !important;
                          position: absolute !important;
                          top: 0 !important;
                          left: 0 !important;
                          border: none !important;
                          background: #000 !important;
                        }
                      `}</style>
                      <div
                        id="vimeo-player"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          background: '#000',
                        }}
                      ></div>
                    </div>

                    {isBumping && (
                      <div className="absolute inset-0 z-[70] flex items-center justify-center bg-transparent pointer-events-none overflow-hidden bump-active">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className={`bump-ident ${setupBump.bumpClass}`}>
                            <div className="text-[clamp(1rem,3vmin,1.5rem)] opacity-60 mb-6 font-vt323 tracking-widest">{setupBump.logo}</div>
                            <div className="main-title font-black uppercase tracking-tighter">{playlistParts.length > 1 ? playlistParts[1].trim() : playlistParts[0].trim()}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {showStatic && <div className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-100 bg-repeat active"></div>}

                    <div className="absolute inset-0 z-[60] pointer-events-none" style={{ opacity: isOn ? 1 : 0 }}>
                      <div className="absolute top-4 right-6 text-right">
                        {/* Watermark replaces channel OSD label when available */}
                        {currentChannelWatermark ? (
                          currentChannelWatermark.toLowerCase().endsWith('.mp4') || currentChannelWatermark.toLowerCase().endsWith('.webm') ? (
                            <video
                              key={currentChannelWatermark}
                              src={currentChannelWatermark}
                              autoPlay loop muted playsInline
                              className="watermark-overlay"
                              style={{
                                transform: `scale(${currentChannelWatermarkScale || 1.0})`,
                                transformOrigin: 'top right',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                zIndex: 65,
                                pointerEvents: 'none',
                              }}
                            />
                          ) : (
                            <img
                              key={currentChannelWatermark}
                              src={currentChannelWatermark}
                              alt="marca d'água"
                              className="watermark-overlay"
                              style={{
                                transform: `scale(${currentChannelWatermarkScale || 1.0})`,
                                transformOrigin: 'top right',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                zIndex: 65,
                                pointerEvents: 'none',
                              }}
                            />
                          )
                        ) : currentChannelName ? (
                          <div className={`osd-futuristic visible ${setupBump.bumpClass} ${currentChannelName.length > 20 ? 'osd-compact' : ''}`}>
                            {playlistParts.length > 1 ? (
                              <><div className="osd-line-1">{playlistParts[0].trim()}:</div><div className="osd-line-2">{playlistParts[1].trim()}</div></>
                            ) : (
                              <div className="osd-line-1">{currentChannelName}</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                      {statusMessage && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">
                          <div className="inline-block text-[#00ff00] font-pixel text-xs md:text-xl bg-black/90 px-4 py-3 border-2 border-[#00ff00] uppercase tracking-widest shadow-[0_0_15px_#00ff00]">{statusMessage}</div>
                        </div>
                      )}
                    </div>

                    <div className={`credits-overlay ${showCredits ? 'visible' : ''} credits-3d-shadow${useJosefinFont ? ' credits-josefin' : ''}`}>
                      {currentVideoData?.artista && <div className="credit-line"><span className="icon">🎤</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.artista) }} /></div></div>}
                      {currentVideoData?.musica && <div className="credit-line"><span className="icon">🎼</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.musica) }} /></div></div>}
                      {currentVideoData?.album && <div className="credit-line"><span className="icon">💽</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.album) }} /></div></div>}
                      {currentVideoData?.ano && <div className="credit-line"><span className="icon">📅</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.ano) }} /></div></div>}
                      {currentVideoData?.direcao && <div className="credit-line"><span className="icon">🎬</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.direcao || '—') }} /></div></div>}
                    </div>

                    <div className="vhs-noise z-40 mix-blend-overlay pointer-events-none"></div>
                    <div className="vhs-tracking z-40 pointer-events-none"></div>
                    <div className="absolute inset-0 scanlines pointer-events-none z-50 opacity-60"></div>
                  </div>
                </div>

                <div className="flex flex-col w-16 md:w-32 ml-4 p-2 md:p-3 bg-[#111] border-l border-[#222] shadow-[inset_2px_0_5px_rgba(0,0,0,0.5)] justify-between items-center gap-4 shrink-0 rounded-r-lg">
                  <div className="flex flex-col items-center select-none opacity-80 mb-2">
                    <span className="font-serif italic font-bold text-[#bbb] text-[8px] md:text-sm drop-shadow-[1px_1px_0_rgba(0,0,0,1)] tracking-tight uppercase vertical-text">playlist<span className="text-[#888]">ismo</span></span>
                  </div>

                  <div className="flex flex-col items-center gap-3 md:gap-5">
                    {/* INFO Button */}
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Info</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsInfoOpen(prev => !prev); }}
                        className={`btn-retro-push w-10 h-8 md:w-14 md:h-12 rounded-sm flex items-center justify-center group relative transition-all ${isInfoOpen ? 'border-amber-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]' : ''}`}
                        title="Abrir/Fechar Informações (Now Playing)"
                      >
                        <span className={`font-serif font-black italic text-sm md:text-lg transition-colors ${isInfoOpen ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]' : 'text-gray-400 group-hover:text-white'}`}>
                          i
                        </span>
                      </button>
                    </div>

                    {/* GUIDE Button */}
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Guide</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsSearchOpen(prev => !prev); }}
                        className={`btn-retro-push w-10 h-8 md:w-14 md:h-12 rounded-sm flex items-center justify-center group relative transition-all ${isSearchOpen ? 'border-amber-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]' : ''}`}
                        title="Abrir/Fechar Guia P100"
                      >
                        <svg className={`w-4 h-4 transition-colors ${isSearchOpen ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]' : 'text-gray-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </button>
                    </div>

                    {/* GRP Button */}
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Grp</span>
                      <div className="flex flex-col gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); changeGroup(1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center text-gray-400 font-bold hover:text-white">+</button>
                        <button onClick={(e) => { e.stopPropagation(); changeGroup(-1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center text-gray-400 font-bold hover:text-white">-</button>
                      </div>
                    </div>

                    {/* CH Button */}
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Ch</span>
                      <div className="flex flex-col gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); changeChannel(1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center group">
                          <svg className="w-3 h-3 text-gray-400 group-hover:text-white -rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM4 19l9-7-9-7v14z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); changeChannel(-1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center group">
                          <svg className="w-3 h-3 text-gray-400 group-hover:text-white rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM4 19l9-7-9-7v14z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col items-center gap-3 pb-2">
                    <div className="flex flex-col items-center">
                      <div className={`w-1.5 h-1.5 rounded-full border border-black transition-all duration-300 ${isOn ? 'bg-red-500 shadow-[0_0_8px_#ff0000] saturate-200' : 'bg-red-900 shadow-[0_0_2px_black]'}`}></div>
                      <span className="text-[6px] text-gray-500 mt-1 font-bold uppercase">Pwr</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); togglePower(); }} className="btn-power-push w-10 h-10 md:w-14 md:h-14 rounded-sm flex items-center justify-center group">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── GAVETA INFERIOR MECÂNICA (P100 GUIDE) ── */}
            <div
              id="tv-drawer-guide"
              className={`w-full overflow-hidden transition-all duration-500 ease-in-out font-jost ${
                isSearchOpen
                  ? 'max-h-[650px] opacity-100 mt-4 translate-y-0'
                  : 'max-h-0 opacity-0 mt-0 translate-y-6 pointer-events-none'
              }`}
            >
              <div className="bg-[#15171a] border-2 border-[#2b3038] rounded-2xl p-3 md:p-5 shadow-[0_20px_45px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.12)] relative font-jost">
                
                {/* Header do Guia */}
                <div className="flex items-center justify-between border-b border-[#2b3038] pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl md:text-2xl font-bold tracking-widest text-white drop-shadow-[2px_2px_0_#000] font-jost">
                      <span className="text-[#ffff00]">P</span><span className="text-[#00ff00]">100</span> GUIDE
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold hidden sm:inline font-jost">
                      MECHANICAL MATRIX SELECTOR
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search box */}
                    <div className="relative bg-black/70 border border-[#3a3f47] rounded px-2.5 py-1 flex items-center shadow-inner">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent text-white text-xs uppercase outline-none placeholder-zinc-500 w-24 sm:w-36 font-jost"
                        placeholder="BUSCAR..."
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-zinc-500 hover:text-white text-xs ml-1 font-jost">
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="text-zinc-400 hover:text-white text-sm font-bold w-7 h-7 flex items-center justify-center rounded bg-black/50 hover:bg-red-900/80 border border-white/10 transition-colors font-jost"
                      title="Fechar Guia"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Tabs Horizontais (Grupos): Lead-gray, chamfered physical tabs */}
                <div className="flex items-end gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700 select-none font-jost">
                  {uniqueGroups.map(cat => {
                    const isActive = activeGuideGroup === cat;
                    const count = (channelsByCategory[cat] || []).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveGuideGroup(cat);
                          setExpandedGroup(cat);
                        }}
                        className={`shrink-0 px-3.5 py-2 font-jost uppercase tracking-wider text-xs md:text-sm font-bold flex items-center gap-2 transition-all duration-150 relative ${
                          isActive
                            ? 'bg-gradient-to-b from-[#3d424b] to-[#1e2024] text-yellow-400 border-t-2 border-l border-r border-yellow-400/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_-2px_6px_rgba(0,0,0,0.4)] rounded-t-md translate-y-[2px] z-10'
                            : 'bg-gradient-to-b from-[#2d3036] to-[#202226] text-zinc-300 hover:text-white hover:from-[#353940] hover:to-[#26282d] border-t border-l border-r border-white/10 shadow-[0_-2px_4px_rgba(0,0,0,0.3)] rounded-t-md'
                        }`}
                        style={{
                          clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 100%, 0% 100%)'
                        }}
                      >
                        <span className="text-sm shrink-0 drop-shadow-[1px_1px_0_#000]">{getGroupIcon(cat)}</span>
                        <span>{cat}</span>
                        <span className="text-[10px] opacity-60 font-mono">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Visor de Canais (Grid): Sunken Black Background with shadow-inner */}
                <div className="bg-black rounded-b-xl rounded-tr-xl border-2 border-[#24272c] p-3 md:p-4 shadow-[inset_0_5px_22px_rgba(0,0,0,0.95)] max-h-[320px] overflow-y-auto custom-scrollbar font-jost">
                  {filteredPlaylists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {filteredPlaylists.map((pl, idx) => {
                        const isPlaying = pl.name === currentChannelName;
                        return (
                          <button
                            key={pl.name}
                            onClick={() => {
                              loadChannelContent(pl.name);
                            }}
                            className={`w-full text-left p-2.5 px-3 uppercase text-xs md:text-sm font-bold transition-all border rounded-lg flex items-center justify-between group relative font-jost ${
                              isPlaying
                                ? 'bg-[#ffff00] text-[#0000aa] font-black border-yellow-300 shadow-[0_0_12px_rgba(255,255,0,0.4)] translate-y-0.5'
                                : 'bg-[#121417] hover:bg-[#1c1f24] text-zinc-300 hover:text-white border-[#272b33] hover:border-yellow-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_3px_6px_rgba(0,0,0,0.8)] active:translate-y-0.5'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className={`text-[10px] font-mono shrink-0 ${isPlaying ? 'text-[#0000aa]/70 font-bold' : 'text-zinc-500'}`}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="truncate tracking-wider font-jost">{pl.name}</span>
                            </div>
                            {isPlaying && (
                              <span className="text-[9px] font-black ml-2 shrink-0 flex items-center gap-1 bg-[#0000aa] text-yellow-300 px-1.5 py-0.5 rounded shadow font-jost">
                                <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping"></span>
                                ON AIR
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-zinc-600 uppercase tracking-widest text-xs font-bold font-jost">
                      {searchTerm ? 'NENHUM CANAL ENCONTRADO PARA ESTA BUSCA' : 'NENHUM CANAL NESTE GRUPO'}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

          <div className="mt-8 text-center opacity-20 hover:opacity-100 transition-opacity duration-500 pointer-events-none select-none">
            <span className="font-vt323 text-sm md:text-base text-white tracking-widest uppercase">powered by @addri0n4 e @sandrobreaker</span>
          </div>
        </section>

        {/* RIGHT PANEL: TABLE INTEGRATION */}
        <aside className={`hidden md:flex justify-start overflow-hidden transition-all duration-500 ease-in-out border-l border-amber-900/20 bg-black/40 backdrop-blur-md ${isAdminSidebarOpen ? 'translate-x-0 opacity-100 w-auto' : 'translate-x-full opacity-0 w-0'}`}>
          <div className="w-[550px] h-full">
            {isAdminSidebarOpen && (
              <AdminPanel
                session={session}
                editId={adminEditId}
                displayMode="table"
                onEdit={(id) => setAdminEditId(id)}
                onClose={() => setIsAdminSidebarOpen(false)}
                playingId={currentVideoData?.id ? String(currentVideoData.id) : null}
                initialPlaylist={currentChannelName}
                onSave={(newData) => {
                  fetchGuideData();
                  if (newData) {
                    const savedIdStr = String(newData.id);
                    const videoData = newData as VideoData;
                    setLastSavedRecord(videoData);
                    
                    // Atualiza créditos na tela imediatamente
                    setCurrentVideoData(prev => ({
                      ...prev,
                      ...videoData
                    }));
                    
                    // Sincroniza a lista atual de reprodução
                    setCurrentChannelList(prev => prev.map(item => {
                      if (newData.video_id && item.video_id === newData.video_id) return { ...item, ...videoData };
                      if (!newData.video_id && String(item.id) === savedIdStr) return { ...item, ...videoData };
                      return item;
                    }));

                    setAdminEditId(null);
                  }
                }}
                lastSavedRecord={lastSavedRecord as any}
              />
            )}
          </div>
        </aside>

      </main>
    </div>
  );
}