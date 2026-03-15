import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel.tsx';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    creditsInterval: any;
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
  
  // App State
  const [isOn, setIsOn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [channelsByCategory, setChannelsByCategory] = useState<Record<string, any[]>>({});
  const [currentChannelList, setCurrentChannelList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChannelName, setCurrentChannelName] = useState('');
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentVideoData, setCurrentVideoData] = useState<any>(null);
  
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

  const playerRef = useRef<any>(null);
  const isPlayerReady = useRef(false); // Keeping ref for internal checks but using state for effects

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
        playerVars: { controls: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, enablejsapi: 1, showinfo: 0, disablekb: 1, fs: 0 },
        events: {
          'onReady': () => { isPlayerReady.current = true; setIsReady(true); if (isOn) playCurrentVideo(); },
          'onStateChange': onPlayerStateChange
        }
      });
    };
  }, []);

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setStatus("");
      startCreditsMonitor();
    } else if (event.data === window.YT.PlayerState.ENDED) {
      handleVideoEnd();
    } else if (event.data === window.YT.PlayerState.BUFFERING) {
      setStatus("TUNING...");
    }
  };

  const startCreditsMonitor = () => {
    if (window.creditsInterval) clearInterval(window.creditsInterval);
    window.creditsInterval = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      const cur = playerRef.current.getCurrentTime();
      const dur = playerRef.current.getDuration();
      if (dur <= 0) return;
      
      setShowCredits((cur >= 10 && cur < 20) || (dur > 30 && cur >= (dur - 20) && cur < (dur - 10)));
      setShowPlaylistLabel(cur >= 1.5 && cur < dur);
    }, 1000);
  };

  const fetchGuideData = async () => {
    const { data } = await supabase.from('playlists').select('*').order('name');
    if (data) {
      const grouped = data.reduce((acc: any, curr: any) => {
        const g = curr.group_name || 'OTHERS';
        if (!acc[g]) acc[g] = [];
        acc[g].push(curr);
        return acc;
      }, {});
      setChannelsByCategory(grouped);
    }
  };

  const setStatus = (msg: string) => {
    setStatusMessage(msg);
    if (msg) setTimeout(() => setStatusMessage(''), 3000);
  };

  const checkResumeState = () => {
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

  const togglePower = () => {
    setIsOn(prev => {
      const next = !prev;
      if (next) {
        if (!currentChannelName) loadDefaultChannel();
        else playerRef.current?.playVideo();
      } else {
        playerRef.current?.pauseVideo();
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
      setCurrentGroupIndex(GROUPS_ORDER.indexOf(cat));
      setExpandedGroup(cat);
    }

    const { data } = await supabase.from('musicas_backup').select('*').eq('playlist', playlistName).order('id', { ascending: false });
    if (!data?.length) return;

    const list = targetId ? data : fisherYatesShuffle([...data]);
    let idx = targetId ? list.findIndex(v => v.video_id === targetId) : 0;
    if (idx === -1) idx = 0;

    setCurrentChannelList(list);
    setCurrentIndex(idx);
    setCurrentVideoData(list[idx]);
  };

  useEffect(() => {
    if (currentChannelList.length > 0 && isReady && currentVideoData) {
      playerRef.current?.loadVideoById(currentVideoData.video_id);
    }
  }, [currentVideoData, isReady]);

  const playCurrentVideo = () => {
    if (!currentChannelList[currentIndex] || !isPlayerReady.current) return;
    setCurrentVideoData(currentChannelList[currentIndex]);
  };

  const handleVideoEnd = () => {
    if (isBumping) return;
    triggerBump(currentChannelName);
    setCurrentIndex(prev => (prev + 1) % currentChannelList.length);
  };

  const changeGroup = (direction: number) => {
    if (!isOn) return;
    const nextGroupIdx = (currentGroupIndex + direction + GROUPS_ORDER.length) % GROUPS_ORDER.length;
    setCurrentGroupIndex(nextGroupIdx);
    const groupName = GROUPS_ORDER[nextGroupIdx];
    setStatus(`GROUP: ${groupName}`);
    setExpandedGroup(groupName);
    const playlists = channelsByCategory[groupName];
    if (playlists?.length) loadChannelContent(playlists[0].name);
  };

  const changeChannel = (direction: number) => {
    if (!isOn || !currentChannelName) return;
    const group = GROUPS_ORDER[currentGroupIndex];
    const playlists = channelsByCategory[group] || [];
    if (!playlists.length) return;
    let idx = playlists.findIndex((pl: any) => pl.name === currentChannelName);
    idx = (idx + direction + playlists.length) % playlists.length;
    loadChannelContent(playlists[idx].name);
  };

  const setupBump = getThematicSetup(currentChannelName);
  const playlistParts = currentChannelName.split(':');

  return (
    <div className={`bg-[#050505] min-h-screen overflow-hidden flex items-center justify-center selection:bg-yellow-400 selection:text-black font-sans transition-all duration-500 ${isSearchOpen ? 'guide-active' : ''}`}>
      
      <div id="admin-panel-header" className="fixed top-4 right-4 z-[9990] flex gap-2">
        {!session && (
          <button onClick={() => navigate('/login')} className="bg-zinc-900/20 text-zinc-500 border border-zinc-600/50 px-3 py-1 font-vt323 text-lg tracking-widest hover:bg-zinc-600 hover:text-white transition-colors uppercase shadow-[0_0_10px_rgba(255,255,255,0.1)] backdrop-blur-sm flex items-center gap-2 opacity-50 hover:opacity-100">🔑 LOGIN</button>
        )}
        {isAdmin && (
          <>
            <button onClick={() => { setAdminEditId(null); setIsAdminSidebarOpen(true); }} className="bg-amber-900/20 text-amber-500 border border-amber-600/50 px-3 py-1 font-vt323 text-lg tracking-widest hover:bg-amber-600 hover:text-black transition-colors uppercase shadow-[0_0_10px_rgba(217,119,6,0.2)] backdrop-blur-sm flex items-center gap-2">⚙ SERVICE MODE</button>
            <button onClick={() => { setAdminEditId(currentVideoData?.id); setIsAdminSidebarOpen(true); }} className="bg-amber-900/20 text-amber-500 border border-amber-600/50 px-3 py-1 font-vt323 text-lg tracking-widest hover:bg-amber-600 hover:text-black transition-colors uppercase shadow-[0_0_10px_rgba(217,119,6,0.2)] backdrop-blur-sm flex items-center gap-2">✎ EDIT VIDEO</button>
          </>
        )}
      </div>

      {/* Guide overlay */}
      <div className={`fixed inset-y-0 left-0 z-[100] w-full md:w-[450px] teletext-bg flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.9)] border-r-4 border-white/10 transform ${isSearchOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-500 ease-in-out font-vt323 h-full`}>
        <div className="bg-black p-4 flex justify-between items-center border-b-2 border-white/20 shrink-0">
            <div className="flex flex-col leading-none">
                <span className="text-3xl font-bold text-white tracking-widest drop-shadow-[2px_2px_0_#000] font-jost"><span className="text-[#ffff00]">P</span><span className="text-[#00ff00]">100</span> GUIDE</span>
                <span className="text-xs text-gray-400 tracking-[0.2em] uppercase font-jost">playlistismo v19</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-white text-xl animate-pulse font-jost"><span>{time || '00:00'}</span></div>
                <button onClick={() => setIsSearchOpen(false)} className="bg-red-600 hover:bg-red-500 text-white w-10 h-10 flex items-center justify-center border-2 border-white shadow-[4px_4px_0_#000] transition-colors active:translate-y-1 active:shadow-none">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        </div>
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
            {currentVideoData && (
              <div className="bg-[#111] border-2 border-white/30 p-4 mb-6 shrink-0 shadow-[8px_8px_0_rgba(0,0,0,1)] font-jost relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-green-400 via-cyan-400 via-pink-400 to-orange-500"></div>
                  <div className="space-y-3">
                      {currentVideoData.artista && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">🎤</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">ARTIST</span><div className="text-[#ffff00] text-xl font-bold uppercase truncate">{currentVideoData.artista}</div></div></div>}
                      {currentVideoData.musica && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">🎼</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">TRACK</span><div className="text-[#00ff00] text-xl font-bold uppercase truncate">{currentVideoData.musica}</div></div></div>}
                      {currentVideoData.album && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">💽</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">ALBUM</span><div className="text-[#00ffff] text-base font-bold uppercase truncate">{currentVideoData.album}</div></div></div>}
                      {currentVideoData.ano && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">📅</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">RELEASE</span><div className="text-[#ff00ff] text-base font-bold uppercase truncate">{currentVideoData.ano}</div></div></div>}
                      {currentVideoData.direcao && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">🎬</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">DIRECTOR</span><div className="text-[#ff8800] text-base font-bold uppercase truncate">{currentVideoData.direcao}</div></div></div>}
                  </div>
                  <div className="mt-4 text-white/40 text-[10px] uppercase tracking-tighter border-t border-white/10 pt-2 italic text-right">CHANNEL: {currentChannelName}</div>
              </div>
            )}
            <div className="relative bg-black border-2 border-[#ffff00] p-2 mb-4 flex items-center shrink-0">
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent text-white text-2xl uppercase outline-none font-vt323 placeholder-white/30" placeholder="BUSCAR..." />
            </div>
            <div className="flex flex-col overflow-y-auto custom-scrollbar pr-1 pb-10 flex-1 accordion-container">
              {GROUPS_ORDER.map(cat => {
                const groupPlaylists = (channelsByCategory[cat] || []).filter(pl => pl.name.toUpperCase().includes(searchTerm.toUpperCase()));
                if (groupPlaylists.length === 0 && searchTerm) return null;
                const isExpanded = searchTerm ? true : expandedGroup === cat;
                return (
                  <div key={cat} className="guide-group mb-2 overflow-hidden rounded-[8px] border border-white/10 bg-[#0a0a0a] shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    <button 
                      onClick={() => setExpandedGroup(expandedGroup === cat ? null : cat)}
                      className={`w-full flex justify-between items-center p-3 text-white font-bold uppercase text-lg transition-colors focus:outline-none ${isExpanded ? 'bg-[#0000aa] border-b border-white/20' : 'hover:bg-[#1a1a1a]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl drop-shadow-[2px_2px_0_#000]">{GROUP_ICONS[cat] || '▶'}</span>
                        <span className="tracking-widest">{cat}</span>
                      </div>
                      <span className="text-sm border border-white/30 rounded px-2 opacity-80">{isExpanded ? '▲' : '▼'}</span>
                    </button>
                    {isExpanded && (
                      <div className="guide-cat-content flex flex-col bg-black/40 pb-1">
                        {groupPlaylists.map(pl => {
                          const isPlaying = pl.name === currentChannelName;
                          return (
                            <button 
                              key={pl.name} 
                              onClick={() => { loadChannelContent(pl.name); setIsSearchOpen(false); }} 
                              className={`w-full text-left p-3 px-6 uppercase text-sm font-vt323 transition-all border-b border-white/5 flex items-center justify-between group
                                ${isPlaying ? 'bg-[#ffff00] text-[#0000aa] font-black pl-8' : 'text-gray-300 hover:bg-[#111] hover:text-white hover:pl-8'}`}
                            >
                              <div className="flex-1 truncate tracking-widest">{pl.name}</div>
                              {isPlaying && <span className="text-xs animate-pulse ml-2 flex items-center gap-1"><div className="w-2 h-2 bg-[#0000aa] rounded-full"></div> PLAYING</span>}
                              {!isPlaying && <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2 text-[#00ff00] bg-[#00ff00]/10 px-2 py-0.5 rounded border border-[#00ff00]/30 shadow-[0_0_5px_rgba(0,255,0,0.2)]">TUNE IN</span>}
                            </button>
                          );
                        })}
                        {groupPlaylists.length === 0 && (
                          <div className="p-4 text-center text-white/40 text-xs tracking-widest uppercase">NO CHANNELS FOUND</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        </div>
      </div>

      {/* Admin Sidebar overlay */}
      <div className={`fixed inset-y-0 right-0 z-[200] w-full md:w-[50vw] transform ${isAdminSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-500 ease-in-out h-full shadow-[-20px_0_60px_rgba(0,0,0,0.9)]`}>
        <AdminPanel 
          session={session} 
          editId={adminEditId} 
          onClose={() => setIsAdminSidebarOpen(false)} 
          onSave={() => fetchGuideData()} 
        />
      </div>

      {/* Main Viewport */}
      <main className={`relative z-10 w-full flex flex-col items-center justify-center transition-all duration-500 p-4 ${isSearchOpen ? 'translate-x-[200px] scale-90' : isAdminSidebarOpen ? 'md:-translate-x-[20vw] scale-75' : ''}`}>
        <div className="text-white/30 font-vt323 text-xl md:text-2xl tracking-[0.5em] uppercase mb-6">playlistismo v19</div>

        <div className="relative w-full max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto flex flex-col transition-all duration-500 ease-out cursor-pointer" onClick={() => setIsSearchOpen(false)}>
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
                                <div id="yt-player" className="w-full h-full"></div>
                                
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
                                
                                <div className="absolute inset-0 z-30 pointer-events-none" style={{ opacity: isOn ? 1 : 0 }}>
                                    <div className="absolute top-4 right-6 text-right">
                                        {showPlaylistLabel && (
                                          <div className={`osd-futuristic visible ${setupBump.bumpClass} ${currentChannelName.length > 20 ? 'osd-compact' : ''}`}>
                                            {playlistParts.length > 1 ? (
                                              <><div className="osd-line-1">{playlistParts[0].trim()}:</div><div className="osd-line-2">{playlistParts[1].trim()}</div></>
                                            ) : (
                                              <div className="osd-line-1">{currentChannelName}</div>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                    {statusMessage && (
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">
                                          <div className="inline-block text-[#00ff00] font-pixel text-xs md:text-xl bg-black/90 px-4 py-3 border-2 border-[#00ff00] uppercase tracking-widest shadow-[0_0_15px_#00ff00]">{statusMessage}</div>
                                      </div>
                                    )}
                                </div>

                                <div className={`credits-overlay ${showCredits ? 'visible' : ''}`}>
                                    {currentVideoData?.artista && <div className="credit-line"><span className="icon">🎤</span> <div className="credit-text-content"><span>{currentVideoData.artista}</span></div></div>}
                                    {currentVideoData?.musica && <div className="credit-line"><span className="icon">🎼</span> <div className="credit-text-content"><span>{currentVideoData.musica}</span></div></div>}
                                    {currentVideoData?.album && <div className="credit-line"><span className="icon">💽</span> <div className="credit-text-content"><span>{currentVideoData.album}</span></div></div>}
                                    {currentVideoData?.ano && <div className="credit-line"><span className="icon">📅</span> <div className="credit-text-content"><span>{currentVideoData.ano}</span></div></div>}
                                    {currentVideoData?.direcao && <div className="credit-line"><span className="icon">🎬</span> <div className="credit-text-content"><span>{currentVideoData.direcao}</span></div></div>}
                                </div>

                                <div className="vhs-noise z-40 mix-blend-overlay pointer-events-none"></div>
                                <div className="vhs-tracking z-40 pointer-events-none"></div>
                                <div className="absolute inset-0 scanlines pointer-events-none z-50 opacity-60"></div>
                            </div>
                        </div>

                        <div className="flex flex-col w-16 md:w-32 ml-4 p-2 md:p-3 bg-[#111] border-l border-[#222] shadow-[inset_2px_0_5px_rgba(0,0,0,0.5)] justify-between items-center gap-4 shrink-0 rounded-r-lg">
                            <div className="flex flex-col items-center select-none opacity-80 mb-2">
                                <span className="font-serif italic font-bold text-[#bbb] text-[8px] md:text-sm drop-shadow-[1px_1px_0_rgba(0,0,0,1)] tracking-tight uppercase vertical-text">playlist<span className="text-[#888]">ismo</span></span>
                                <div className="flex flex-col gap-0.5 mt-2">
                                    <div className="w-1 h-3 md:h-5 bg-red-700"></div>
                                    <div className="w-1 h-3 md:h-5 bg-green-700"></div>
                                    <div className="w-1 h-3 md:h-5 bg-blue-700"></div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4 md:gap-6">
                                <div className="flex flex-col items-center">
                                    <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Guide</span>
                                    <button onClick={(e) => { e.stopPropagation(); setIsSearchOpen(!isSearchOpen); }} className="btn-retro-push w-10 h-8 md:w-14 md:h-12 rounded-sm flex items-center justify-center group relative">
                                        <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                                    </button>
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Grp</span>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); changeGroup(1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center text-gray-400 font-bold hover:text-white">+</button>
                                        <button onClick={(e) => { e.stopPropagation(); changeGroup(-1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center text-gray-400 font-bold hover:text-white">-</button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Ch</span>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); changeChannel(1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center group">
                                            <svg className="w-3 h-3 text-gray-400 group-hover:text-white -rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM4 19l9-7-9-7v14z"/></svg>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); changeChannel(-1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center group">
                                            <svg className="w-3 h-3 text-gray-400 group-hover:text-white rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM4 19l9-7-9-7v14z"/></svg>
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
        </div>

        <div className="mt-8 text-center opacity-20 hover:opacity-100 transition-opacity duration-500 pointer-events-none select-none">
            <span className="font-vt323 text-sm md:text-base text-white tracking-widest uppercase">powered by @addri0n4 e @sandrobreaker</span>
        </div>
      </main>
    </div>
  );
}
