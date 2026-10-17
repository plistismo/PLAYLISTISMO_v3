import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel.tsx';
import MatrixPanel from '../components/MatrixPanel.tsx';
import { sanitizeHTML } from '../lib/sanitize.ts';
import { formatCreditsConnectors } from '../components/RichTextInput.tsx';
import { manualSpreads } from '../data/manualSpreads.ts';
import { ManualDirectoryPanel } from '../components/manual/ManualDirectoryPanel.tsx';
import { ManualSpreadViewer } from '../components/manual/ManualSpreadViewer.tsx';
import { ManualControlDeck } from '../components/manual/ManualControlDeck.tsx';

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

// Helper to progressively reveal HTML text safely without breaking tag structure
export function getVisibleHtmlAtLength(html: string, targetLength: number): string {
  if (!html) return '';
  let textCount = 0;
  let inTag = false;
  let result = '';
  const openTags: string[] = [];

  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    if (char === '<') {
      inTag = true;
      const tagMatch = html.slice(i).match(/^<\/?([a-zA-Z0-9]+)[^>]*>/);
      if (tagMatch) {
        const fullTag = tagMatch[0];
        const tagName = tagMatch[1].toLowerCase();
        const isClosing = fullTag.startsWith('</');
        const isSelfClosing = fullTag.endsWith('/>') || ['br', 'hr', 'img'].includes(tagName);

        if (isClosing) {
          const idx = openTags.lastIndexOf(tagName);
          if (idx !== -1) openTags.splice(idx, 1);
        } else if (!isSelfClosing) {
          openTags.push(tagName);
        }

        result += fullTag;
        i += fullTag.length - 1;
        inTag = false;
        continue;
      }
    }

    if (!inTag) {
      result += char;
      textCount++;
      if (textCount >= targetLength) break;
    }
  }

  for (let t = openTags.length - 1; t >= 0; t--) {
    result += `</${openTags[t]}>`;
  }

  return result;
}

export type PlaylistItem = {
  id?: number;
  name: string;
  group_name?: string;
  descricao?: string;
  description_pt?: string | null;
  description_en?: string | null;
  description_es?: string | null;
  osd_messages_pt?: string[];
  osd_messages_en?: string[];
  osd_messages_es?: string[];
  marca_dagua_url?: string | null;
  marca_dagua_escala?: number | null;
  videos?: any[];
  [key: string]: any;
};

// ─── Intercepted Signals (Artist Radar) Helper & Cache ───────────────────────

const channelVideosCache = new Map<string, any[]>();

export function generateInterceptedSignals(videos: any[] | null | undefined): string[] {
  if (!videos || !Array.isArray(videos) || videos.length === 0) return [];

  // Filter Logic: Discard any artist string containing (case-insensitive): ft., feat, feat., &, vs, vs.,  x , +
  const filterTokens = ['ft.', 'feat', 'feat.', '&', 'vs', 'vs.', ' x ', '+'];
  const uniqueArtists: string[] = [];
  const seen = new Set<string>();

  for (const v of videos) {
    const raw = typeof v === 'string' ? v : (v?.artista || v?.artist || '');
    if (!raw) continue;
    const cleaned = raw.replace(/<[^>]*>/g, '').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;

    const lowerCleaned = cleaned.toLowerCase();
    const lowerRaw = raw.toLowerCase();
    const isDiscarded = filterTokens.some(token => lowerCleaned.includes(token) || lowerRaw.includes(token));
    if (isDiscarded) continue;

    const dedupeKey = cleaned.toUpperCase();
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      uniqueArtists.push(cleaned);
    }
  }

  // Deduplicate the array (unique artists only). Randomly shuffle the array. Slice the first 4 artists.
  const shuffled = fisherYatesShuffle([...uniqueArtists]);
  return shuffled.slice(0, 4);
}

// ─── Dedicated Black Terminal Screen Component for Channel Guide ───────────

interface TerminalManifestoProps {
  channel?: PlaylistItem | null;
  hoveredChannel?: PlaylistItem | null;
  activeLang: 'pt' | 'en' | 'es';
  onLanguageChange: (lang: 'pt' | 'en' | 'es') => void;
  videos?: any[];
  currentChannelName?: string;
}

function TerminalManifesto({
  channel: propChannel,
  hoveredChannel: propHoveredChannel,
  activeLang,
  onLanguageChange,
  videos,
  currentChannelName,
}: TerminalManifestoProps) {
  const hoveredChannel = propHoveredChannel !== undefined ? propHoveredChannel : (propChannel ?? null);
  const channel = hoveredChannel;
  const [visibleChars, setVisibleChars] = useState(0);
  const [interceptedSignals, setInterceptedSignals] = useState<string[]>([]);

  // Extract manifesto matching active language with PT fallback
  const manifestoRaw = useMemo(() => {
    if (!channel) return '';
    if (activeLang === 'en') {
      return channel.description_en || channel.description_pt || channel.descricao || '';
    }
    if (activeLang === 'es') {
      return channel.description_es || channel.description_pt || channel.descricao || '';
    }
    return channel.description_pt || channel.descricao || '';
  }, [channel, activeLang]);

  // Clean / sanitize HTML
  const sanitizedFullHtml = useMemo(() => {
    if (!manifestoRaw || !manifestoRaw.trim()) return '';
    return sanitizeHTML(manifestoRaw);
  }, [manifestoRaw]);

  // Total visible text character count
  const totalTextChars = useMemo(() => {
    if (!sanitizedFullHtml) return 0;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedFullHtml;
    return (tempDiv.textContent || tempDiv.innerText || '').length;
  }, [sanitizedFullHtml]);

  // Fast typewriter effect whenever channel or activeLang changes
  useEffect(() => {
    setVisibleChars(0);
    if (!sanitizedFullHtml || totalTextChars <= 0) return;

    let current = 0;
    const step = totalTextChars > 250 ? 4 : totalTextChars > 120 ? 2 : 1;
    const intervalMs = 10;

    const timer = setInterval(() => {
      current += step;
      if (current >= totalTextChars) {
        setVisibleChars(totalTextChars);
        clearInterval(timer);
      } else {
        setVisibleChars(current);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [channel?.name, activeLang, sanitizedFullHtml, totalTextChars]);

  // Intercepted Signals: live artist radar updated when hoveredChannel changes
  useEffect(() => {
    if (!hoveredChannel || !hoveredChannel.name) {
      setInterceptedSignals([]);
      return;
    }

    const channelName = hoveredChannel.name;

    // 1. Channel already has embedded videos
    if (hoveredChannel.videos && Array.isArray(hoveredChannel.videos) && hoveredChannel.videos.length > 0) {
      setInterceptedSignals(generateInterceptedSignals(hoveredChannel.videos));
      return;
    }

    // 2. Hovered channel is currently playing channel and videos prop is present
    if (videos && videos.length > 0 && (channelName === currentChannelName || channelName === videos[0]?.playlist)) {
      channelVideosCache.set(channelName, videos);
      setInterceptedSignals(generateInterceptedSignals(videos));
      return;
    }

    // 3. Module cache hit
    if (channelVideosCache.has(channelName)) {
      const cached = channelVideosCache.get(channelName)!;
      setInterceptedSignals(generateInterceptedSignals(cached));
      return;
    }

    // 4. Query Supabase for channel artist names
    let isCancelled = false;
    supabase
      .from('musicas_backup')
      .select('artista')
      .eq('playlist', channelName)
      .then(({ data, error }) => {
        if (isCancelled) return;
        if (!error && data && data.length > 0) {
          channelVideosCache.set(channelName, data);
          setInterceptedSignals(generateInterceptedSignals(data));
        } else {
          setInterceptedSignals([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [hoveredChannel, videos, currentChannelName]);

  const displayedHtml = useMemo(() => {
    if (!sanitizedFullHtml) return '';
    if (visibleChars >= totalTextChars) return sanitizedFullHtml;
    return getVisibleHtmlAtLength(sanitizedFullHtml, visibleChars);
  }, [sanitizedFullHtml, visibleChars, totalTextChars]);

  const isTyping = visibleChars < totalTextChars && totalTextChars > 0;

  // Count of OSD messages for this channel
  const osdCount = useMemo(() => {
    if (!channel) return 0;
    const arr = activeLang === 'en' ? (channel.osd_messages_en || channel.osd_messages_pt)
      : activeLang === 'es' ? (channel.osd_messages_es || channel.osd_messages_pt)
      : channel.osd_messages_pt;
    return Array.isArray(arr) ? arr.length : 0;
  }, [channel, activeLang]);

  return (
    <div className="w-full h-full flex flex-col bg-[#020704] border border-[#00ff88]/40 rounded-xl p-3 sm:p-3.5 shadow-[inset_0_0_30px_rgba(0,255,136,0.1),0_4px_25px_rgba(0,0,0,0.95)] overflow-hidden relative font-jost select-text">
      {/* Subtle CRT Scanlines */}
      <div className="terminal-crt-scanlines absolute inset-0 opacity-40 z-10 pointer-events-none" />

      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-[#00ff88]/30 pb-2 mb-2 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping shrink-0" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#00ff88] uppercase truncate">
            TERMINAL // MANIFESTO
          </span>
          {channel?.group_name && (
            <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 rounded uppercase tracking-wider">
              {channel.group_name}
            </span>
          )}
        </div>

        {/* Language Switcher Pills */}
        <div className="flex items-center gap-1 bg-black/80 border border-[#00ff88]/40 rounded p-0.5 shrink-0">
          {(['pt', 'en', 'es'] as const).map(l => (
            <button
              key={l}
              onClick={() => onLanguageChange(l)}
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded transition-all ${
                activeLang === l
                  ? 'bg-[#00ff88] text-black shadow-[0_0_8px_rgba(0,255,136,0.6)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Name banner */}
      <div className="mb-2 shrink-0 z-20 flex items-center justify-between">
        <span className="text-sm font-black font-jost uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">
          {channel ? channel.name : 'SELECIONE UM CANAL'}
        </span>
        <span className="text-[10px] font-mono text-[#00ff88]/70 shrink-0">
          {isTyping ? 'DECRYPTING...' : 'ONLINE'}
        </span>
      </div>

      {/* Terminal Manifesto Body */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar z-20 pr-1 text-xs md:text-sm text-[#d4f8dc] leading-relaxed font-jost">
        {sanitizedFullHtml ? (
          <div>
            <span
              dangerouslySetInnerHTML={{ __html: displayedHtml }}
              className="manifesto-content"
            />
            {isTyping && (
              <span className="inline-block text-[#00ff88] ml-0.5 font-mono animate-pulse">▋</span>
            )}
          </div>
        ) : (
          <div className="py-4 text-center font-mono text-zinc-500 text-xs">
            <p className="text-[#00ff88]/40 mb-1">&gt; STATUS: NO MANIFESTO REGISTERED</p>
            <p className="text-[10px] text-zinc-600 uppercase">
              Abra a MATRIX (Admin) para cadastrar o manifesto deste canal em {activeLang.toUpperCase()}.
            </p>
          </div>
        )}

        {/* Intercepted Signals (Artist Radar) */}
        {interceptedSignals.length > 0 && (
          <div className="mt-4 pt-2.5 border-t border-[#00ff88]/20 select-text">
            <div className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-[#00ff88] leading-relaxed drop-shadow-[0_0_6px_rgba(0,255,136,0.6)]">
              <span className="osd-typewriter-text inline-block max-w-full break-words">
                &gt; SINAIS INTERCEPTADOS: {interceptedSignals.map(s => s.toUpperCase()).join(' // ')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer (OSD Chyron Info) */}
      <div className="pt-2 mt-2 border-t border-[#00ff88]/20 flex items-center justify-between text-[10px] font-mono shrink-0 z-20 text-[#00ff88]/70">
        <div className="flex items-center gap-1.5 truncate">
          <span>◈ OSD HIJACK:</span>
          <span className="text-white font-bold">{osdCount} MENSAGENS</span>
          <span className="text-zinc-500">({activeLang.toUpperCase()})</span>
        </div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest hidden sm:inline">
          7S HIJACK ON AIR
        </span>
      </div>
    </div>
  );
}

export default function Home({ session }: { session: Session | null }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);

  // Skeuomorphic Chassis Skin State (URL Query Param Driven)
  const skinParam = searchParams.get('skin')?.toLowerCase();
  const activeSkin = skinParam === 'y2k' ? 'y2k' : skinParam === 'future' ? 'future' : 'classic';

  const cycleSkin = () => {
    const nextSkin = activeSkin === 'classic' ? 'y2k' : activeSkin === 'y2k' ? 'future' : 'classic';
    const newParams = new URLSearchParams(searchParams);
    newParams.set('skin', nextSkin);
    setSearchParams(newParams);
  };

  type VideoData = { id?: string | number; video_id: string; artista?: string; musica?: string; album?: string; ano?: string; direcao?: string; playlist?: string; [key: string]: any };

  // App State
  const [isOn, setIsOn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
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
  const [osdGlitch, setOsdGlitch] = useState<string | null>(null);
  const [showCredits, setShowCredits] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylistLabel, setShowPlaylistLabel] = useState(false);
  const [time, setTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatic, setShowStatic] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('UPLOADS');
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [adminEditId, setAdminEditId] = useState<string | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<VideoData | null>(null);
  const [useJosefinFont, setUseJosefinFont] = useState(false);
  const [autoFetchMetadata, setAutoFetchMetadata] = useState(true);

  // MATRIX Module State
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [currentChannelWatermark, setCurrentChannelWatermark] = useState<string | null>(null);
  const [currentChannelWatermarkScale, setCurrentChannelWatermarkScale] = useState<number>(1.0);

  // ── Multi-Language & OSD Signal Hijack State (Part 1 & Part 2) ──
  const [activeLang, setActiveLang] = useState<'pt' | 'en' | 'es'>('pt');
  const activeLangRef = useRef<'pt' | 'en' | 'es'>('pt');
  useEffect(() => { activeLangRef.current = activeLang; }, [activeLang]);

  const [osdActive, setOsdActive] = useState<boolean>(false);
  const [osdPhase, setOsdPhase] = useState<'idle' | 'cue' | 'typewriter'>('idle');
  const [currentOsdMessage, setCurrentOsdMessage] = useState<string>('');
  const osdTimeoutRef = useRef<any>(null);
  const osdCueTimeoutRef = useRef<any>(null);
  const currentTriggerPointsRef = useRef<number[]>([]);
  const firedTriggersRef = useRef<Set<number>>(new Set());

  // Global Clip Pacing session tracking
  const channelVideoCount = useRef<number>(0);
  const osdVideoPacingRef = useRef<{
    videoId: string;
    eligible: boolean;
    triggerSet: boolean;
    triggerTime: number;
    hasFired: boolean;
  }>({
    videoId: '',
    eligible: false,
    triggerSet: false,
    triggerTime: 0,
    hasFired: false,
  });

  const [currentChannelRecord, setCurrentChannelRecord] = useState<PlaylistItem | null>(null);
  const currentChannelRecordRef = useRef<PlaylistItem | null>(null);
  useEffect(() => { currentChannelRecordRef.current = currentChannelRecord; }, [currentChannelRecord]);

  const activeChannel = useMemo(() => {
    return currentChannelRecord || playlists.find(p => p.name === currentChannelName) || null;
  }, [currentChannelRecord, playlists, currentChannelName]);

  const currentChannelNameRef = useRef<string>('');
  useEffect(() => { currentChannelNameRef.current = currentChannelName; }, [currentChannelName]);

  const playlistsRef = useRef<PlaylistItem[]>([]);
  useEffect(() => { playlistsRef.current = playlists; }, [playlists]);

  const currentVideoDataRef = useRef<VideoData | null>(null);
  useEffect(() => { currentVideoDataRef.current = currentVideoData; }, [currentVideoData]);

  // Terminal Guide Hover State
  const [hoveredChannel, setHoveredChannel] = useState<PlaylistItem | null>(null);

  // Trigger OSD Hijack execution with Morphological Sequence (1.5s Cue -> Typewriter -> 14s total duration)
  const triggerOsdHijack = useCallback(() => {
    const ch = currentChannelRecordRef.current || playlistsRef.current.find(p => p.name === currentChannelNameRef.current);
    if (!ch) return;

    const lang = activeLangRef.current;

    // Safely parse OSD message array for active language, with fallback to PT or other available languages
    // Aggressive Parsing Logic: Grab raw data with active language & PT fallback
    const rawData = lang === 'en' ? (ch.osd_messages_en || ch.osd_messages_pt)
      : lang === 'es' ? (ch.osd_messages_es || ch.osd_messages_pt)
      : (ch.osd_messages_pt || ch.osd_messages_en || ch.osd_messages_es);

    let parsedMsgs: any[] = [];
    if (Array.isArray(rawData)) {
      parsedMsgs = rawData;
    } else if (typeof rawData === 'string') {
      const trimmed = rawData.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsedMsgs = trimmed.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim());
      } else {
        try {
          const parsed = JSON.parse(trimmed);
          parsedMsgs = Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch (e) {
          parsedMsgs = trimmed.split('\n').filter(msg => msg.trim() !== '');
        }
      }
    }

    const msgs = (Array.isArray(parsedMsgs) ? parsedMsgs : [])
      .map(msg => (typeof msg === 'string' ? msg.trim() : String(msg || '').trim()))
      .filter(msg => msg !== '');

    // Data Bail-out: ONLY check if empty after aggressive parsing
    if (!msgs || msgs.length === 0) {
      console.log('[OSD] Bail-out: No OSD messages defined for channel:', ch.name);
      return;
    }

    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
    console.log('[OSD] Firing hijack, message:', randomMsg);

    setCurrentOsdMessage(randomMsg);
    setOsdActive(true);
    setOsdPhase('cue'); // Step 1: Visual cue [ SIGNAL OVERRIDE ] while box expands

    if (osdCueTimeoutRef.current) clearTimeout(osdCueTimeoutRef.current);
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);

    // Step 2: Visual Cue delay for 1.5s, then start typewriter text
    osdCueTimeoutRef.current = setTimeout(() => {
      setOsdPhase('typewriter');
    }, 1500);

    // Step 3: Total duration of 14 seconds
    osdTimeoutRef.current = setTimeout(() => {
      setOsdActive(false); // removes .is-hijacked to smoothly morph back
      setTimeout(() => {
        setOsdPhase('idle');
        setCurrentOsdMessage('');
      }, 700);
    }, 14000);
  }, []);

  // OWNER'S MANUAL & MASTER AUDIO GAIN STATE
  const [isManualMode, setIsManualMode] = useState<boolean>(() => {
    return new URLSearchParams(window.location.search).has('manual');
  });
  const [manualZoomLevel, setManualZoomLevel] = useState<number>(1);
  const [isPipMinimized, setIsPipMinimized] = useState<boolean>(false);
  const manualScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleCycleZoom = useCallback(() => {
    setManualZoomLevel(prev => {
      const next = prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1;
      if (next === 1) {
        setIsPipMinimized(false);
      }
      return next;
    });
  }, []);

  const [activeSpreadIndex, setActiveSpreadIndex] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const cavityRef = useRef<HTMLDivElement | null>(null);
  const [cavityCoords, setCavityCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const updateCavityCoords = useCallback(() => {
    if (cavityRef.current) {
      const rect = cavityRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCavityCoords({
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (!isManualMode || manualZoomLevel > 1) {
      if (!isManualMode) setCavityCoords(null);
      return;
    }

    // Initial measurement
    updateCavityCoords();

    // Settle on next frame after modal/overlay paints
    const rafId = requestAnimationFrame(updateCavityCoords);
    const timeoutId = setTimeout(updateCavityCoords, 60);

    window.addEventListener('resize', updateCavityCoords);
    window.addEventListener('scroll', updateCavityCoords);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCavityCoords);
      window.removeEventListener('scroll', updateCavityCoords);
    };
  }, [isManualMode, manualZoomLevel, updateCavityCoords]);

  const handleVolumeChange = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVolume)));
    setVolume(clamped);
    try {
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(clamped);
        if (clamped > 0 && typeof playerRef.current.unMute === 'function') {
          playerRef.current.unMute();
        }
      }
    } catch (err) {
      console.warn("Error setting YouTube volume:", err);
    }
    try {
      if (vimeoPlayerRef.current && typeof vimeoPlayerRef.current.setVolume === 'function') {
        vimeoPlayerRef.current.setVolume(clamped / 100);
      }
    } catch (err) {
      console.warn("Error setting Vimeo volume:", err);
    }
  };

  useEffect(() => {
    if (!isManualMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        setActiveSpreadIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveSpreadIndex(prev => (prev < manualSpreads.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'Escape') {
        setIsManualMode(false);
        setManualZoomLevel(1);
        setIsPipMinimized(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isManualMode]);
  
  // Histórico de Sessão (Shuffle sem Repetição)
  const [playedHistory, setPlayedHistory] = useState<Record<string, string[]>>({});
  const playedHistoryRef = useRef<Record<string, string[]>>({});

  // REFS PARA CONTROLE DE API (NON-STOP)
  const playerRef = useRef<any>(null);
  const vimeoPlayerRef = useRef<any>(null);
  const ytErrorTimeoutRef = useRef<any>(null);
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
  const [activePlanet, setActivePlanet] = useState<string>(uniqueGroups[0]);

  useEffect(() => {
    if (uniqueGroups.length > 0 && (!activePlanet || !uniqueGroups.includes(activePlanet))) {
      setActivePlanet(uniqueGroups[0]);
    }
  }, [uniqueGroups, activePlanet]);

  const filteredPlaylists = useMemo(() => {
    const planetChannels = channelsByCategory[activePlanet] || 
      (playlists || []).filter(pl => ((pl.group_name && pl.group_name.trim()) ? pl.group_name.trim().toUpperCase() : 'OTHERS') === activePlanet);
    if (!searchTerm.trim()) {
      return planetChannels;
    }
    const term = searchTerm.toUpperCase();
    return planetChannels.filter(pl => pl.name.toUpperCase().includes(term));
  }, [searchTerm, channelsByCategory, activePlanet, playlists]);

  // Sincroniza as refs com o estado do React
  useEffect(() => {
    channelListRef.current = currentChannelList;
    currentIndexRef.current = currentIndex;
    playedHistoryRef.current = playedHistory;
    activePlatformRef.current = activePlatform;
    isAdminSidebarOpenRef.current = isAdminSidebarOpen || isEditDrawerOpen;
    adminEditIdRef.current = adminEditId;
  }, [currentChannelList, currentIndex, playedHistory, activePlatform, isAdminSidebarOpen, isEditDrawerOpen, adminEditId]);

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

  // Dynamic Matrix OSD Glitch Lifecycle (Channel-Specific MTV Signal)
  useEffect(() => {
    // Clear glitch message immediately when channel changes or TV powers off
    setOsdGlitch(null);

    if (!isOn || !activeChannel) {
      return;
    }

    // Grab raw data directly from the active channel's object (Matrix database data)
    const rawData = (activeLang === 'en' && activeChannel.osd_messages_en)
      ? activeChannel.osd_messages_en
      : (activeLang === 'es' && activeChannel.osd_messages_es)
      ? activeChannel.osd_messages_es
      : (activeChannel.osd_messages_pt || activeChannel.osd_messages_en || activeChannel.osd_messages_es);

    // Aggressive Parsing Logic: Handle Array, stringified JSON, newline splits, or Postgres literals
    let parsedMsgs: any[] = [];
    if (Array.isArray(rawData)) {
      parsedMsgs = rawData;
    } else if (typeof rawData === 'string') {
      const trimmed = rawData.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsedMsgs = trimmed.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim());
      } else {
        try {
          const parsed = JSON.parse(trimmed);
          parsedMsgs = Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch (e) {
          parsedMsgs = trimmed.split('\n').filter(msg => msg.trim() !== '');
        }
      }
    }

    const validMsgs = (Array.isArray(parsedMsgs) ? parsedMsgs : [])
      .map(msg => (typeof msg === 'string' ? msg.trim() : String(msg || '').trim()))
      .filter(msg => msg !== '');

    // Bail-out condition ONLY checks AFTER aggressive parsing
    if (!validMsgs || validMsgs.length === 0) {
      return;
    }

    let hideTimeoutId: any = null;
    let nextTriggerTimeoutId: any = null;

    const scheduleNextGlitch = () => {
      // Set a randomized interval triggering between every 30 to 60 seconds
      const randomInterval = Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000;
      nextTriggerTimeoutId = setTimeout(() => {
        // Pick a random message from that specific channel's array
        const randomMsg = validMsgs[Math.floor(Math.random() * validMsgs.length)];
        setOsdGlitch(randomMsg);

        // Clear the message automatically after 2 to 4 seconds
        const displayDuration = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
        hideTimeoutId = setTimeout(() => {
          setOsdGlitch(null);
          scheduleNextGlitch();
        }, displayDuration);
      }, randomInterval);
    };

    scheduleNextGlitch();

    return () => {
      if (nextTriggerTimeoutId) clearTimeout(nextTriggerTimeoutId);
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
      setOsdGlitch(null);
    };
  }, [isOn, activeChannel, activeLang]);

  // Controle explícito de visibilidade entre os players via element.style
  function syncPlayerVisibility(platform: 'youtube' | 'vimeo') {
    activePlatformRef.current = platform;
    const ytContainer = document.getElementById('yt-player');
    const ytWrapper = document.getElementById('yt-player-wrapper');
    const vimeoContainer = document.getElementById('vimeo-parent-container');
    const vimeoPlayer = document.getElementById('vimeo-player');

    if (platform === 'vimeo') {
      // 1. YouTube obrigatoriamente pausado e oculto
      playerRef.current?.pauseVideo();
      if (ytWrapper) {
        ytWrapper.style.display = 'none';
        ytWrapper.style.zIndex = '1';
        ytWrapper.style.pointerEvents = 'none';
      }
      if (ytContainer) {
        ytContainer.style.display = 'none';
        ytContainer.style.zIndex = '1';
        ytContainer.style.pointerEvents = 'none';
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

      // 2. YouTube exibido normalmente com 100% de largura e altura (strict pointer-events: none e z-index: 1)
      if (ytWrapper) {
        ytWrapper.style.display = 'block';
        ytWrapper.style.width = '100%';
        ytWrapper.style.height = '100%';
        ytWrapper.style.zIndex = '1';
        ytWrapper.style.pointerEvents = 'none';
      }
      if (ytContainer) {
        ytContainer.style.display = 'block';
        ytContainer.style.width = '100%';
        ytContainer.style.height = '100%';
        ytContainer.style.zIndex = '1';
        ytContainer.style.pointerEvents = 'none';
      }
      const ytIframe = document.querySelector('#yt-player iframe, iframe#yt-player') as HTMLElement;
      if (ytIframe) {
        ytIframe.style.pointerEvents = 'none';
        ytIframe.style.zIndex = '1';
      }
    }
  };

  // ── OSD Signal Hijack Safe Zone & Subliminal Pacing Engine ──
  const checkPlaybackTriggers = useCallback((cur: number, dur: number) => {
    if (dur <= 0) return;

    // Credits & Playlist Label (MTV style overlay)
    setShowCredits((cur >= 10 && cur < 20) || (dur > 30 && cur >= (dur - 20) && cur < (dur - 10)));
    setShowPlaylistLabel(cur >= 1.5 && cur < dur);

    // Track video changes for Global Clip Pacing
    const vidId = String(currentVideoDataRef.current?.video_id || currentVideoDataRef.current?.id || '');
    if (vidId && osdVideoPacingRef.current.videoId !== vidId) {
      osdVideoPacingRef.current.videoId = vidId;
      channelVideoCount.current += 1;
      const count = channelVideoCount.current;

      // Pacing Rule: Trigger on count === 1 (first video) OR count % 3 === 0 (every third video)
      const isEligible = count === 1 || count % 3 === 0;
      osdVideoPacingRef.current.eligible = isEligible;
      osdVideoPacingRef.current.triggerSet = false;

      firedTriggersRef.current.clear();
      currentTriggerPointsRef.current = [];
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
      if (osdCueTimeoutRef.current) clearTimeout(osdCueTimeoutRef.current);
      setOsdActive(false);
      setOsdPhase('idle');
      setCurrentOsdMessage('');

      console.log(`[OSD Pacing Engine] Channel Video #${count} ('${vidId}') detected. Eligible for OSD: ${isEligible}`);
    }

    // Set trigger point at exact middle of Safe Zone (duration / 2) if eligible
    if (dur > 0 && osdVideoPacingRef.current.eligible && !osdVideoPacingRef.current.triggerSet) {
      const midPoint = Math.round(dur / 2);
      osdVideoPacingRef.current.triggerTime = midPoint;
      osdVideoPacingRef.current.triggerSet = true;
      console.log(`[OSD Pacing Engine] Video #${channelVideoCount.current} trigger locked at exact middle: ${midPoint}s (dur: ${dur}s).`);
    }

    // Threshold Trigger Execution: currentTime >= triggerTime && !osdVideoPacingRef.current.hasFired
    if (
      osdVideoPacingRef.current.eligible &&
      osdVideoPacingRef.current.triggerSet &&
      !osdVideoPacingRef.current.hasFired &&
      osdVideoPacingRef.current.triggerTime > 0 &&
      cur >= osdVideoPacingRef.current.triggerTime
    ) {
      osdVideoPacingRef.current.hasFired = true;
      triggerOsdHijack();
    }
  }, [triggerOsdHijack]);

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
      setIsPlaying(false);
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
      setIsPlaying(false);
      handleVideoEnd();
    });
    vimeoPlayerRef.current.on('play', () => {
      setIsPlaying(true);
      setStatus('');
      startCreditsMonitor();
    });
    vimeoPlayerRef.current.on('pause', () => {
      setIsPlaying(false);
    });
    vimeoPlayerRef.current.on('timeupdate', (data: { seconds: number; duration: number }) => {
      checkPlaybackTriggers(data.seconds, data.duration);
    });
  };

  useEffect(() => {
    fetchGuideData();
    checkResumeState();

    let checkVimeo: any = null;

    const initYouTubePlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;
      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%', width: '100%',
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          enablejsapi: 1,
          showinfo: 0,
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
          'onError': onPlayerError
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initYouTubePlayer();
    } else {
      window.onYouTubeIframeAPIReady = initYouTubePlayer;
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    // Inicializa Vimeo quando o script global já tiver carregado
    // O script é carregado via index.html, então pode já estar pronto
    if (window.Vimeo) {
      initVimeoPlayer();
    } else {
      // Aguarda o script carregar (carregado via index.html)
      checkVimeo = setInterval(() => {
        if (window.Vimeo) {
          clearInterval(checkVimeo);
          initVimeoPlayer();
        }
      }, 200);
    }

    return () => {
      if (checkVimeo) clearInterval(checkVimeo);
      if (ytErrorTimeoutRef.current) {
        clearTimeout(ytErrorTimeoutRef.current);
        ytErrorTimeoutRef.current = null;
      }
    };
  }, []);

  function onPlayerError(event: any) {
    const errorCode = event?.data;
    console.warn("YouTube Player Error (un-embeddable 101/150 or failure):", errorCode);

    // 1. Force the player to stop if instance is available to cleanly resolve internal error state
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.stopVideo === 'function') {
          playerRef.current.stopVideo();
        }
      } catch (err) {
        console.warn("Could not stop YouTube player on error:", err);
      }
    }

    // 2. Conditionally trigger the CRT static/noise interference effect on the top-level TV screen wrapper
    // to visually mask the YouTube native error screen from the user
    setShowStatic(true);

    // 3. Wrap the nextVideo() (handleVideoEnd) state change function inside a setTimeout of 800ms to 1000ms (900ms)
    // This allows the YouTube IFrame API to cleanly resolve its internal error state before React forces the re-render with the new video ID.
    if (ytErrorTimeoutRef.current) {
      clearTimeout(ytErrorTimeoutRef.current);
    }

    ytErrorTimeoutRef.current = setTimeout(() => {
      handleVideoEnd();
      setShowStatic(false);
      ytErrorTimeoutRef.current = null;
    }, 900);
  }

  function onPlayerStateChange(event: any) {
    const YT_STATE = window.YT.PlayerState;
    if (event.data === YT_STATE.PLAYING) {
      setIsPlaying(true);
      setStatus("");
      startCreditsMonitor();
    } else if (event.data === YT_STATE.PAUSED) {
      setIsPlaying(false);
    } else if (event.data === YT_STATE.ENDED) {
      setIsPlaying(false);
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
      checkPlaybackTriggers(cur, dur);
    }, 1000);
  };

  async function fetchGuideData() {
    const { data } = await supabase
      .from('playlists')
      .select('*, osd_messages_pt, osd_messages_en, osd_messages_es')
      .order('name');
    if (data) {
      setPlaylists(data);
      playlistsRef.current = data;
      const grouped = data.reduce((acc: any, curr: any) => {
        const g = (curr.group_name && curr.group_name.trim()) ? curr.group_name.trim().toUpperCase() : 'OTHERS';
        if (!acc[g]) acc[g] = [];
        acc[g].push(curr);
        return acc;
      }, {});
      setChannelsByCategory(grouped);
      if (currentChannelName) {
        const matched = data.find((p: any) => p.name === currentChannelName);
        if (matched) {
          setCurrentChannelRecord(matched);
        }
      }
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

  // MATRIX: fetch channel data, watermark URL and scale whenever the active channel changes
  useEffect(() => {
    // Reset OSD pacing and session counter on channel change
    channelVideoCount.current = 0;
    osdVideoPacingRef.current = { videoId: '', eligible: false, triggerSet: false, triggerTime: 0, hasFired: false };
    firedTriggersRef.current.clear();
    currentTriggerPointsRef.current = [];
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    if (osdCueTimeoutRef.current) clearTimeout(osdCueTimeoutRef.current);
    setOsdActive(false);
    setOsdPhase('idle');
    setCurrentOsdMessage('');

    if (!currentChannelName) {
      setCurrentChannelWatermark(null);
      setCurrentChannelWatermarkScale(1.0);
      setCurrentChannelRecord(null);
      return;
    }
    supabase
      .from('playlists')
      .select('*, osd_messages_pt, osd_messages_en, osd_messages_es')
      .eq('name', currentChannelName)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCurrentChannelRecord(data);
          setCurrentChannelWatermark(data.marca_dagua_url || null);
          setCurrentChannelWatermarkScale(parseScale(data.marca_dagua_escala));
        } else {
          setCurrentChannelRecord(null);
          setCurrentChannelWatermark(null);
          setCurrentChannelWatermarkScale(1.0);
        }
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
          setIsPlaying(true);
        }
      } else {
        playerRef.current?.pauseVideo();
        vimeoPlayerRef.current?.pause();
        setIsPlaying(false);
        setShowPlaylistLabel(false);
      }
      return next;
    });
  };

  const togglePlayPause = () => {
    if (!isOn) {
      togglePower();
      return;
    }

    if (activePlatform === 'vimeo') {
      if (vimeoPlayerRef.current) {
        if (isPlaying) {
          vimeoPlayerRef.current.pause();
          setIsPlaying(false);
        } else {
          vimeoPlayerRef.current.play();
          setIsPlaying(true);
        }
      }
    } else {
      if (playerRef.current) {
        const state = typeof playerRef.current.getPlayerState === 'function'
          ? playerRef.current.getPlayerState()
          : -1;
        if (state === window.YT?.PlayerState?.PLAYING || isPlaying) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      }
    }
  };

  // Global Shortcut: Spacebar for Play/Pause / Power (ignores if user is typing in INPUT, TEXTAREA, or contentEditable)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          activeEl &&
          (['INPUT', 'TEXTAREA'].includes(activeEl.tagName) ||
           activeEl.isContentEditable ||
           (activeEl.getAttribute && activeEl.getAttribute('contenteditable') === 'true'))
        ) {
          return;
        }
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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
    if (ytErrorTimeoutRef.current) {
      clearTimeout(ytErrorTimeoutRef.current);
      ytErrorTimeoutRef.current = null;
    }
    setShowStatic(true);
    setTimeout(() => setShowStatic(false), 500);
    setCurrentChannelName(playlistName);
    triggerBump(playlistName);
    const cat = Object.keys(channelsByCategory).find(k => channelsByCategory[k].some((p: any) => p.name === playlistName));
    if (cat) {
      setCurrentGroupIndex(uniqueGroups.indexOf(cat));
      setExpandedGroup(cat);
      setActivePlanet(cat);
    }

    const { data } = await supabase.from('musicas_backup').select('*').eq('playlist', playlistName).order('id', { ascending: false });
    if (!data?.length) return;
    channelVideosCache.set(playlistName, data);

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

    // Force State Reset on Video Change: prevent state leaks across clips
    setOsdActive(false);
    setOsdPhase('idle');
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    if (osdCueTimeoutRef.current) clearTimeout(osdCueTimeoutRef.current);
    osdVideoPacingRef.current.hasFired = false;

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
    if (ytErrorTimeoutRef.current) {
      clearTimeout(ytErrorTimeoutRef.current);
      ytErrorTimeoutRef.current = null;
    }
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
    setActivePlanet(groupName);
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
  const isCavityMode = isManualMode && manualZoomLevel === 1;
  const isFloatingPip = isManualMode && manualZoomLevel > 1;

  return (
    <div className="bg-neutral-950 h-screen w-screen overflow-hidden flex items-center justify-center selection:bg-yellow-400 selection:text-black font-sans transition-all duration-500">

      {/* Admin Panel — bipartite layout: TV column + right frequency list */}

      <main className={`relative z-10 w-screen h-screen overflow-hidden bg-neutral-950 flex flex-col md:flex-row transition-all duration-500 ease-in-out ${isAdminSidebarOpen ? 'layout-admin-open' : 'layout-admin-closed'}`}>

        {/* MAIN PANEL: TV & CONTROLS */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0 h-full p-4 items-center justify-center transition-all duration-500 relative overflow-hidden">
          
          {/* Centralized Admin Buttons */}
          <div id="admin-panel-controls" className={`shrink-0 mb-2 md:mb-3 flex flex-wrap gap-2 md:gap-4 items-center justify-center w-full ${isAdminSidebarOpen ? 'max-w-none' : 'max-w-[800px]'}`}>
            {!session && (
              <button onClick={() => navigate('/login')} className="bg-zinc-900/20 text-zinc-500 border border-zinc-600/50 px-4 py-2 font-vt323 text-xl tracking-widest hover:bg-zinc-600 hover:text-white transition-all uppercase shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-sm flex items-center gap-2 opacity-50 hover:opacity-100">🔑 LOGIN</button>
            )}
            {isAdmin && (
              <>
                <button 
                  onClick={() => { 
                    setIsAdminSidebarOpen(prev => {
                      const next = !prev;
                      // Top drawer follows the SERVICE MODE toggle (expand on open / collapse on close)
                      setIsEditDrawerOpen(next);
                      if (!next) setAdminEditId(null);
                      return next;
                    }); 
                    if (isMatrixOpen) setIsMatrixOpen(false);
                  }} 
                  className={`min-w-[180px] px-6 py-3 font-vt323 text-2xl tracking-widest transition-all uppercase backdrop-blur-sm flex items-center justify-center gap-2 border shadow-lg rounded-sm ${isAdminSidebarOpen ? 'bg-amber-600 text-black border-amber-400 scale-105 shadow-[0_0_20px_rgba(217,119,6,0.4)]' : 'bg-amber-900/40 text-amber-500 border-amber-600/50 hover:bg-amber-600 hover:text-black hover:border-amber-400'}`}
                >
                  ⚙ SERVICE MODE
                </button>
                <button 
                  onClick={() => { 
                    if (isEditDrawerOpen && (!adminEditId || adminEditId === String(currentVideoData?.id))) {
                      setIsEditDrawerOpen(false);
                    } else {
                      setAdminEditId(currentVideoData?.id ? String(currentVideoData.id) : null); 
                      setIsEditDrawerOpen(true);
                      if (!isAdminSidebarOpen) setIsAdminSidebarOpen(true);
                    }
                    if (isMatrixOpen) setIsMatrixOpen(false);
                  }} 
                  className={`min-w-[180px] px-6 py-3 font-vt323 text-2xl tracking-widest transition-all uppercase backdrop-blur-sm flex items-center justify-center gap-2 border shadow-lg rounded-sm ${isEditDrawerOpen ? 'bg-amber-600 text-black border-amber-400 scale-105 shadow-[0_0_20px_rgba(217,119,6,0.4)]' : 'bg-amber-900/40 text-amber-500 border-amber-600/50 hover:bg-amber-600 hover:text-black hover:border-amber-400'}`}
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
                      // Re-fetch watermark & channel record for current channel
                      if (currentChannelName) {
                        supabase
                          .from('playlists')
                          .select('*, osd_messages_pt, osd_messages_en, osd_messages_es')
                          .eq('name', currentChannelName)
                          .maybeSingle()
                          .then(({ data }) => {
                            if (data) {
                              setCurrentChannelRecord(data);
                              setCurrentChannelWatermark(data?.marca_dagua_url || null);
                              setCurrentChannelWatermarkScale(parseScale(data?.marca_dagua_escala));
                            }
                          });
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}



          <div className={`relative w-full min-w-0 min-h-0 flex-1 tv-responsive-container flex flex-col transition-all duration-500 ease-out overflow-hidden ${
            isManualMode ? 'justify-between' : 'items-center justify-center'
          }`}>
            
            {/* ── GAVETA SUPERIOR: SERVICE MODE / EDIT VIDEO (TOP DRAWER) ──
                Telemetry-style module mounted above the TV top bezel. Lives in normal
                document flow (pushes the chassis down) — never overlays, narrows or
                scales the CRT, so the TV keeps 100% of its column width. */}
            {!isManualMode && isAdmin && (
            <div
              id="tv-drawer-edit"
              inert={!isEditDrawerOpen}
              className={`w-full shrink-0 overflow-hidden transition-all duration-500 ease-in-out font-jost ${
                isEditDrawerOpen
                  ? 'max-h-[50vh] opacity-100 mb-2 md:mb-3 translate-y-0'
                  : 'max-h-0 opacity-0 mb-0 -translate-y-6 pointer-events-none'
              }`}
            >
              <div className="bg-neutral-950/95 backdrop-blur-md border border-neutral-800 border-b-2 border-b-amber-500/40 rounded-2xl p-2 md:p-3 shadow-[0_20px_45px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(245,158,11,0.18)] relative font-jost max-h-[50vh] flex flex-col overflow-hidden">
                
                {/* Header Visor do Hardware */}
                <div className="flex items-center justify-between border-b border-amber-500/40 pb-1.5 mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse"></span>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-amber-300 font-jost">
                      SERVICE MODE // {adminEditId ? `EDIT UNIT #${adminEditId}` : 'NEW UNIT CALIBRATION'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {/* Bypass Button: Abrir Sinal Original */}
                    {currentVideoData?.video_id && (
                      <button
                        type="button"
                        id="btn-open-original-signal-topbar"
                        onClick={() => {
                          const vid = currentVideoData.video_id;
                          const isVimeo = currentVideoData.plataforma === 'vimeo' || /^\d+$/.test(vid);
                          const url = isVimeo ? `https://vimeo.com/${vid}` : `https://www.youtube.com/watch?v=${vid}`;
                          window.open(url, '_blank');
                        }}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black border border-yellow-300 px-2.5 py-1 rounded-sm font-mono-tech font-black text-[9px] md:text-[10px] uppercase tracking-wider shadow-[0_0_10px_rgba(250,204,21,0.4)] hover:shadow-[0_0_14px_rgba(250,204,21,0.6)] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                        title="Abrir sinal original na plataforma externa (YouTube / Vimeo) para extração de metadados"
                      >
                        <span className="text-[10px]">↗</span>
                        <span>[ABRIR SINAL ORIGINAL]</span>
                      </button>
                    )}

                    {/* Auto-Fetch Metadata Toggle */}
                    <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded border border-amber-900/40 font-jost">
                      <label htmlFor="toggle-autofetch-drawer" className="text-[9px] md:text-[10px] text-amber-500/80 uppercase font-bold tracking-wider font-jost cursor-pointer select-none">
                        Auto-Fetch Metadata
                      </label>
                      <button
                        id="toggle-autofetch-drawer"
                        type="button"
                        onClick={() => setAutoFetchMetadata(prev => !prev)}
                        className={`relative w-7 h-3.5 rounded-full border transition-all duration-300 focus:outline-none ${
                          autoFetchMetadata
                            ? 'bg-amber-500 border-amber-400'
                            : 'bg-black border-amber-900/50'
                        }`}
                        aria-pressed={autoFetchMetadata}
                        title="Alternar busca automática de metadados ao colar Video ID"
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform duration-300 ${
                            autoFetchMetadata ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Josefin Font Toggle */}
                    <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded border border-amber-900/40 font-jost">
                      <label htmlFor="toggle-josefin-drawer" className="text-[9px] md:text-[10px] text-amber-500/80 uppercase font-bold tracking-wider font-jost cursor-pointer select-none">
                        Josefin Sans
                      </label>
                      <button
                        id="toggle-josefin-drawer"
                        type="button"
                        onClick={() => setUseJosefinFont(prev => !prev)}
                        className={`relative w-7 h-3.5 rounded-full border transition-all duration-300 focus:outline-none ${
                          useJosefinFont
                            ? 'bg-amber-500 border-amber-400'
                            : 'bg-black border-amber-900/50'
                        }`}
                        aria-pressed={useJosefinFont}
                        title="Alternar fonte dos créditos para Josefin Sans"
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform duration-300 ${
                            useJosefinFont ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={() => setIsEditDrawerOpen(false)}
                      className="text-amber-500 hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-black/50 hover:bg-amber-900/60 border border-amber-700/30 transition-colors font-jost"
                      title="Fechar Painel de Edição"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Hardware Display Rebaixado (shadow-inner) */}
                <div className="bg-neutral-900 border-2 border-black rounded-xl p-2 md:p-3 shadow-[inset_0_4px_18px_rgba(0,0,0,0.95)] relative font-jost flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 via-yellow-400 via-amber-500 to-orange-500 opacity-80"></div>
                  
                  <AdminPanel
                    session={session}
                    editId={adminEditId}
                    playingId={currentVideoData?.video_id || (currentVideoData?.id ? String(currentVideoData.id) : null)}
                    displayMode="drawer"
                    autoFetchMetadata={autoFetchMetadata}
                    onAutoFetchMetadataChange={setAutoFetchMetadata}
                    onClose={() => setIsEditDrawerOpen(false)}
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
                        setIsEditDrawerOpen(false);
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
              </div>
            </div>
            
            )}
            
            {/* ── GAVETA SUPERIOR (INFO / PLAYING NOW) ── */}
            {!isManualMode && (
            <div
              id="tv-drawer-info"
              className={`w-full shrink-0 overflow-hidden transition-all duration-500 ease-in-out font-jost ${
                isInfoOpen
                  ? 'max-h-[32vh] opacity-100 mb-2 md:mb-3 translate-y-0'
                  : 'max-h-0 opacity-0 mb-0 -translate-y-6 pointer-events-none'
              }`}
            >
              <div className="bg-[#15171a] border-2 border-[#2b3038] rounded-2xl p-2.5 md:p-4 shadow-[0_16px_36px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.12)] relative font-jost max-h-[32vh] flex flex-col overflow-hidden">
                
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
            )}

            {/* ── CENTRAL TV STAGE (Standard Mode) / EMBEDDED CAVITY DOCK (Manual Mode) ── */}
            <div className={`w-full flex items-center justify-center min-h-0 min-w-0 ${
              isManualMode ? 'pointer-events-none' : 'relative flex-1'
            }`}>
              <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0 relative">
                {/* CHASSI DA TV (Uninterrupted continuous playback across all states!) */}
                <div 
                  className={`tv-chassis-wrapper flex items-center justify-center ${
                    isManualMode
                      ? 'pointer-events-auto'
                      : 'relative w-full flex-1 min-h-0 min-w-0 md:perspective-[1500px] group transition-all duration-500'
                  }`}
                  style={!isManualMode ? undefined : isCavityMode ? {
                    position: 'fixed',
                    top: cavityCoords ? `${cavityCoords.top}px` : '-9999px',
                    left: cavityCoords ? `${cavityCoords.left}px` : '-9999px',
                    width: cavityCoords ? `${cavityCoords.width}px` : '320px',
                    height: cavityCoords ? `${cavityCoords.height}px` : '240px',
                    zIndex: 225,
                    margin: 0,
                    padding: 0,
                    opacity: cavityCoords ? 1 : 0,
                    transition: 'none',
                  } : {
                    position: 'fixed',
                    bottom: '5.5rem',
                    right: '1.5rem',
                    width: '320px',
                    height: '240px',
                    zIndex: 250,
                    margin: 0,
                    padding: 0,
                    opacity: isPipMinimized ? 0 : 1,
                    pointerEvents: isPipMinimized ? 'none' : 'auto',
                    transition: 'opacity 0.25s ease, transform 0.25s ease',
                    transform: isPipMinimized ? 'scale(0.8) translateY(20px)' : 'scale(1) translateY(0)',
                  }}
                >
              <div className={`tv-chassis-frame relative z-10 flex flex-col justify-center max-h-full max-w-full ${
                isCavityMode
                  ? 'w-full h-full p-0 bg-transparent shadow-none border-0 rounded-2xl'
                  : isFloatingPip
                  ? 'w-full h-full p-0 bg-[#0a0a0c] shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_0_2px_#3c414c,inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-2xl overflow-hidden border border-black'
                  : `bg-[#181818] texture-plastic rounded-[20px] md:rounded-[32px] p-2.5 sm:p-3 md:p-5 shadow-[0_30px_70px_rgba(0,0,0,0.8),inset_0_2px_3px_rgba(255,255,255,0.15)] border-t border-[#333] md:tv-3d-tilt transform-style-3d ${
                      activeSkin === 'y2k' ? 'chassis-y2k' : activeSkin === 'future' ? 'chassis-future' : ''
                    }`
              }`}>

              {/* Floating PiP Controls (Minimize to Audio-Only Mode) */}
              {isFloatingPip && !isPipMinimized && (
                <div className="absolute top-2 right-2 z-50 flex items-center gap-1.5 select-none">
                  <div className="bg-black/80 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 font-mono-tech text-[8px] font-bold tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>PiP LIVE</span>
                  </div>
                  <button
                    type="button"
                    id="btn-pip-minimize"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPipMinimized(true);
                    }}
                    className="bg-black/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-600 rounded px-1.5 py-0.5 font-mono-tech text-[9px] font-bold tracking-wider shadow transition-all cursor-pointer active:scale-90"
                    title="Minimizar Vídeo (Modo Foco em Leitura // Áudio Contínuo)"
                  >
                    [ _ ]
                  </button>
                </div>
              )}

              {/* Physical Glare & Rim Overlays (Layered Skeuomorphism) */}
              {!isManualMode && activeSkin === 'y2k' && (
                <div className="chassis-specular-glare pointer-events-none absolute -top-1 left-4 right-4 h-12 md:h-16 rounded-t-[32px] opacity-75 z-20"></div>
              )}
              {!isManualMode && activeSkin === 'future' && (
                <>
                  <div className="chassis-chrome-reflection pointer-events-none absolute top-0 left-0 right-0 h-10 md:h-14 rounded-t-[32px] opacity-90 z-20"></div>
                  <div className="chassis-future-rim pointer-events-none absolute -inset-[2px] rounded-[22px] md:rounded-[34px] z-15"></div>
                </>
              )}

              <div className={`flex flex-row h-full w-full items-stretch transition-all duration-500 relative z-20 ${
                isManualMode
                  ? 'p-0 bg-transparent shadow-none border-0 rounded-2xl'
                  : `rounded-[16px] md:rounded-[36px] p-2 md:p-3.5 ${
                      activeSkin === 'y2k'
                        ? 'inner-housing-y2k'
                        : activeSkin === 'future'
                        ? 'inner-housing-future'
                        : 'bg-[#111] shadow-[inset_0_0_25px_rgba(0,0,0,1)] border-b-4 border-r-4 border-[#080808] border-t border-l border-[#222]'
                    }`
              }`}>
                {/* ── LEFT BEZEL: ROUND CONCAVE MECHANICAL '?' BUTTON & STATUS LED ── */}
                <div className={`flex flex-col justify-between items-center w-7 sm:w-8 md:w-10 mr-1.5 sm:mr-2 md:mr-3 shrink-0 h-full py-2 sm:py-3 md:py-4 select-none relative z-30 ${
                  isManualMode ? 'hidden' : ''
                }`}>
                  {/* Upper decorative grill */}
                  <div className="flex flex-col items-center gap-1 opacity-40 w-full mb-auto">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`vent-t-${i}`} className="w-3/4 h-[1.5px] bg-black/70 rounded-full" />
                    ))}
                  </div>

                  {/* CENTER HARDWARE MODULE: STATUS LED + CONCAVE '?' BUTTON */}
                  <div className="my-auto flex flex-col items-center gap-1 sm:gap-1.5">
                    {/* Status LED: Glows amber when manual is open */}
                    <div className="flex flex-col items-center gap-0.5">
                      <div 
                        className={`w-2 h-2 rounded-full border transition-all duration-300 ${
                          isManualMode 
                            ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_#f59e0b,0_0_4px_#fbbf24] animate-pulse' 
                            : 'bg-zinc-800 border-zinc-950 shadow-none opacity-40'
                        }`} 
                        title={isManualMode ? "Owner's Manual Active" : "Owner's Manual Standby"}
                      />
                      <span className={`text-[6px] font-mono-tech font-bold uppercase tracking-wider ${
                        isManualMode ? 'text-amber-400 drop-shadow-[0_0_4px_#f59e0b]' : 'text-zinc-600'
                      }`}>
                        DOC
                      </span>
                    </div>

                    {/* Round Concave Mechanical '?' Button */}
                    <button
                      type="button"
                      id="btn-tv-manual-bezel"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsManualMode(prev => {
                          const next = !prev;
                          if (next) {
                            setIsAdminSidebarOpen(false);
                            setIsEditDrawerOpen(false);
                            setIsMatrixOpen(false);
                            setIsSearchOpen(false);
                            setIsInfoOpen(false);
                          } else {
                            setManualZoomLevel(1);
                            setIsPipMinimized(false);
                          }
                          return next;
                        });
                      }}
                      className={`btn-bezel-concave w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center cursor-pointer group relative ${
                        isManualMode ? 'ring-1 ring-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : ''
                      }`}
                      title="Owner's Manual [?] — Clique para abrir/fechar o manual do proprietário"
                    >
                      <span className={`font-mono-tech font-bold text-xs sm:text-sm md:text-base leading-none select-none transition-colors ${
                        isManualMode ? 'text-amber-400 drop-shadow-[0_0_6px_#f59e0b]' : 'text-zinc-400 group-hover:text-amber-300'
                      }`}>
                        ?
                      </span>
                    </button>
                  </div>

                  {/* Lower decorative grill */}
                  <div className="flex flex-col items-center gap-1 opacity-40 w-full mt-auto">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`vent-b-${i}`} className="w-3/4 h-[1.5px] bg-black/70 rounded-full" />
                    ))}
                  </div>
                </div>

                <div className={`relative flex-1 aspect-[4/3] bg-[#050505] overflow-hidden screen-container z-10 box-border max-h-full ${
                  isManualMode
                    ? 'w-full h-full rounded-2xl border border-black/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]'
                    : 'rounded-[20px] md:rounded-[44px] border-[4px] md:border-[8px] border-[#080808]'
                }`}>
                  <div className={`absolute inset-0 crt-overlay z-40 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] ${
                    isManualMode ? 'rounded-2xl' : 'rounded-[20px] md:rounded-[44px]'
                  }`}></div>

                  {!isOn && <div className="absolute inset-0 bg-[#080808] z-20"></div>}

                  <div className={`relative w-full h-full overflow-hidden bg-black ${
                    isManualMode ? 'rounded-xl' : 'rounded-[16px] md:rounded-[40px]'
                  } ${isOn ? 'crt-turn-on' : ''}`}>
                    {/* YouTube Player Wrapper (Visual Shield: pointer-events-none completely blocks iframe hover bug) */}
                    <div
                      id="yt-player-wrapper"
                      className="w-full h-full pointer-events-none select-none"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        zIndex: 1,
                        display: activePlatform === 'youtube' ? 'block' : 'none',
                        pointerEvents: 'none',
                      }}
                    >
                      <style>{`
                        #yt-player-wrapper,
                        #yt-player-wrapper iframe,
                        #yt-player,
                        #yt-player iframe,
                        iframe#yt-player {
                          pointer-events: none !important;
                          z-index: 1 !important;
                        }
                      `}</style>
                      <div
                        id="yt-player"
                        className="w-full h-full pointer-events-none"
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                          zIndex: 1,
                          pointerEvents: 'none',
                        }}
                      ></div>
                    </div>

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

                    {/* Dynamic Invisible Overlay (Protective Interaction Layer) */}
                    <div
                      id="dynamic-player-overlay"
                      className="absolute inset-0 cursor-pointer"
                      style={{
                        zIndex: 25,
                        pointerEvents: 'auto',
                      }}
                      onClick={togglePlayPause}
                    />

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

                    {/* Visual Transition: CRT Static/Noise Interference Effect (Masks YouTube error & transitions) */}
                    {showStatic && (
                      <div
                        className="absolute inset-0 z-[35] pointer-events-none crt-static-screen overflow-hidden"
                        style={{ pointerEvents: 'none' }}
                      >
                        <div className="vhs-noise opacity-90 pointer-events-none" />
                        <div className="vhs-tracking pointer-events-none" />
                        <div className="absolute inset-0 scanlines opacity-60 pointer-events-none" />
                      </div>
                    )}

                    <div className="absolute inset-0 z-[60] pointer-events-none" style={{ opacity: isOn ? 1 : 0 }}>
                      {/* Unified Morphological Container: Watermark <-> OSD Signal Hijack */}
                      <div className={`watermark-osd-container pointer-events-none select-none ${osdActive ? 'is-hijacked' : ''}`}>
                        {/* Static Watermark (smoothly shrinks and fades when hijacked) */}
                        {currentChannelWatermark && (
                          <div
                            className="watermark-inner pointer-events-none select-none"
                            style={{
                              transform: `scale(${currentChannelWatermarkScale || 1.0})`,
                            }}
                          >
                            {currentChannelWatermark.toLowerCase().endsWith('.mp4') ||
                            currentChannelWatermark.toLowerCase().endsWith('.webm') ||
                            currentChannelWatermark.toLowerCase().endsWith('.mov') ||
                            currentChannelWatermark.toLowerCase().endsWith('.ogg') ||
                            /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(currentChannelWatermark) ? (
                              <video
                                key={currentChannelWatermark}
                                src={currentChannelWatermark}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="watermark-overlay pointer-events-none"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '65px',
                                  width: 'auto',
                                  height: 'auto',
                                  objectFit: 'contain',
                                  opacity: 0.82,
                                  pointerEvents: 'none',
                                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45))',
                                }}
                              />
                            ) : (
                              <img
                                key={currentChannelWatermark}
                                src={currentChannelWatermark}
                                alt="marca d'água"
                                className="watermark-overlay pointer-events-none"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '65px',
                                  width: 'auto',
                                  height: 'auto',
                                  objectFit: 'contain',
                                  opacity: 0.82,
                                  pointerEvents: 'none',
                                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45))',
                                }}
                              />
                            )}
                          </div>
                        )}

                        {/* OSD Signal Hijack Content (smoothly fades & expands in when hijacked) */}
                        <div className="osd-content-inner font-mono-tech pointer-events-none select-none">
                          {osdPhase === 'cue' ? (
                            <div className="osd-cue-banner py-1 select-none pointer-events-none">
                              <span className="osd-cue-beacon shrink-0" />
                              <span className="tracking-widest uppercase font-mono-tech">[ SIGNAL OVERRIDE // DECRYPTING ]</span>
                              <span className="animate-pulse font-mono text-[#00ff88]">▋</span>
                            </div>
                          ) : (
                            <div className="flex flex-col w-full pointer-events-none select-none">
                              <div className="flex items-center justify-between gap-3 border-b border-emerald-500/40 pb-1 mb-1.5 text-[9px] uppercase tracking-wider text-emerald-400 font-bold select-none pointer-events-none">
                                <span className="flex items-center gap-1.5 pointer-events-none">
                                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                  SIGNAL HIJACK // OSD
                                </span>
                                <span className="text-[8px] text-emerald-500/80 font-mono pointer-events-none">{currentChannelName || 'SYS.BRDCST'}</span>
                              </div>
                              <div className="text-emerald-400 text-xs sm:text-sm font-bold tracking-wide leading-tight break-words osd-typewriter-text drop-shadow-[0_0_8px_rgba(16,185,129,0.9)] pointer-events-none">
                                {currentOsdMessage}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fallback channel name label when NO watermark is configured and NOT hijacked */}
                      {!currentChannelWatermark && !osdActive && currentChannelName ? (
                        <div className="absolute top-4 right-6 text-right font-['Jost',sans-serif] pointer-events-none z-[65]">
                          <div className={`osd-futuristic visible ${setupBump.bumpClass} ${currentChannelName.length > 20 ? 'osd-compact' : ''} font-['Jost',sans-serif]`}>
                            {playlistParts.length > 1 ? (
                              <><div className="osd-line-1">{playlistParts[0].trim()}:</div><div className="osd-line-2">{playlistParts[1].trim()}</div></>
                            ) : (
                              <div className="osd-line-1">{currentChannelName}</div>
                            )}
                          </div>
                        </div>
                      ) : null}
                      {statusMessage && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">
                          <div className="inline-block text-[#00ff00] font-pixel text-xs md:text-xl bg-black/90 px-4 py-3 border-2 border-[#00ff00] uppercase tracking-widest shadow-[0_0_15px_#00ff00]">{statusMessage}</div>
                        </div>
                      )}
                    </div>

                    {/* Global OSD Glitch Injection (Unstable Signal Override) */}
                    {osdGlitch && (
                      <div className="osd-glitch-text pointer-events-none select-none">
                        {osdGlitch}
                      </div>
                    )}

                    <div 
                      className={`credits-overlay ${isOn && currentVideoData && (!isPlaying || showCredits) ? 'visible' : ''} absolute bottom-6 left-6 md:bottom-8 md:left-8 z-50 space-y-1 md:space-y-1.5 ${useJosefinFont ? "!font-['Josefin_Sans',sans-serif]" : "!font-['Jost',sans-serif]"} drop-shadow-[0_2px_2px_rgba(0,0,0,1)] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,2px_2px_0_#000_!important] select-none`}
                    >
                      {currentVideoData?.artista && (
                        <div className="credit-line flex items-start gap-2.5 text-base sm:text-lg md:text-xl">
                          <span className="icon select-none font-normal not-italic drop-shadow-[0_2px_2px_rgba(0,0,0,1)] shrink-0 text-base sm:text-lg md:text-xl leading-[1.15]">🎤</span>
                          <div 
                            className={`credit-text-content flex-1 whitespace-normal break-words text-base sm:text-lg md:text-xl leading-[1.15] font-bold tracking-[0.03em] text-[#f8f8f8] drop-shadow-[0_2px_2px_rgba(0,0,0,1)] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,2px_2px_0_#000_!important] ${useJosefinFont ? "!font-['Josefin_Sans',sans-serif]" : "!font-['Jost',sans-serif]"}`}
                            style={{ fontWeight: 700 }}
                          >
                            <span dangerouslySetInnerHTML={{ __html: formatCreditsConnectors(sanitizeHTML(currentVideoData.artista), 'artista') }} />
                          </div>
                        </div>
                      )}
                      {currentVideoData?.musica && (
                        <div className="credit-line flex items-start gap-2.5 text-base sm:text-lg md:text-xl">
                          <span className="icon select-none font-normal not-italic drop-shadow-[0_2px_2px_rgba(0,0,0,1)] shrink-0 text-base sm:text-lg md:text-xl leading-[1.15]">🎼</span>
                          <div 
                            className={`credit-text-content flex-1 whitespace-normal break-words text-base sm:text-lg md:text-xl leading-[1.15] font-bold tracking-[0.03em] text-[#f8f8f8] drop-shadow-[0_2px_2px_rgba(0,0,0,1)] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,2px_2px_0_#000_!important] ${useJosefinFont ? "!font-['Josefin_Sans',sans-serif]" : "!font-['Jost',sans-serif]"}`}
                            style={{ fontWeight: 700 }}
                          >
                            <span dangerouslySetInnerHTML={{ __html: formatCreditsConnectors(sanitizeHTML(currentVideoData.musica), 'musica') }} />
                          </div>
                        </div>
                      )}
                      {currentVideoData?.album && (
                        <div className="credit-line flex items-start gap-2.5 text-base sm:text-lg md:text-xl">
                          <span className="icon select-none font-normal not-italic drop-shadow-[0_2px_2px_rgba(0,0,0,1)] shrink-0 text-base sm:text-lg md:text-xl leading-[1.15]">💽</span>
                          <div 
                            className={`credit-text-content flex-1 whitespace-normal break-words text-base sm:text-lg md:text-xl leading-[1.15] font-semibold tracking-[0.02em] text-white/95 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,2px_2px_0_#000_!important] ${useJosefinFont ? "!font-['Josefin_Sans',sans-serif]" : "!font-['Jost',sans-serif]"}`}
                            style={{ fontWeight: 600 }}
                          >
                            <span dangerouslySetInnerHTML={{ __html: formatCreditsConnectors(sanitizeHTML(currentVideoData.album), 'album') }} />
                          </div>
                        </div>
                      )}
                      {currentVideoData?.ano && (
                        <div className="credit-line flex items-start gap-2.5 text-base sm:text-lg md:text-xl">
                          <span className="icon select-none font-normal not-italic drop-shadow-[0_2px_2px_rgba(0,0,0,1)] shrink-0 text-base sm:text-lg md:text-xl leading-[1.15]">📅</span>
                          <div 
                            className={`credit-text-content flex-1 whitespace-normal break-words text-base sm:text-lg md:text-xl leading-[1.15] font-semibold tracking-[0.02em] text-white/95 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,2px_2px_0_#000_!important] ${useJosefinFont ? "!font-['Josefin_Sans',sans-serif]" : "!font-['Jost',sans-serif]"}`}
                            style={{ fontWeight: 600 }}
                          >
                            <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.ano) }} />
                          </div>
                        </div>
                      )}
                      {currentVideoData?.direcao && (
                        <div className="credit-line flex items-start gap-2.5 text-base sm:text-lg md:text-xl">
                          <span className="icon select-none font-normal not-italic drop-shadow-[0_2px_2px_rgba(0,0,0,1)] shrink-0 text-base sm:text-lg md:text-xl leading-[1.15]">🎬</span>
                          <div 
                            className={`credit-text-content flex-1 whitespace-normal break-words text-base sm:text-lg md:text-xl leading-[1.15] font-semibold tracking-[0.02em] text-white/95 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,2px_2px_0_#000_!important] ${useJosefinFont ? "!font-['Josefin_Sans',sans-serif]" : "!font-['Jost',sans-serif]"}`}
                            style={{ fontWeight: 600 }}
                          >
                            <span dangerouslySetInnerHTML={{ __html: formatCreditsConnectors(sanitizeHTML(currentVideoData.direcao || '—'), 'direcao') }} />
                          </div>
                        </div>
                      )}

                      <style>{`
                        .credits-overlay,
                        .credits-overlay .credit-text-content,
                        .credits-overlay .credit-line {
                          text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 2px 2px 0 #000 !important;
                        }
                        .credits-overlay .credit-line {
                          display: flex !important;
                          align-items: flex-start !important;
                          white-space: normal !important;
                          gap: 0.6rem !important;
                        }
                        .credits-overlay .credit-text-content {
                          white-space: normal !important;
                          word-break: break-word !important;
                          overflow-wrap: break-word !important;
                        }
                        .credits-overlay .credit-text-content b,
                        .credits-overlay .credit-text-content strong {
                          font-weight: 700 !important;
                        }
                        .credits-overlay .credit-text-content i,
                        .credits-overlay .credit-text-content em {
                          font-style: italic !important;
                        }
                        .credits-overlay .credit-text-content span[style*="font-weight: 400"],
                        .credits-overlay .credit-text-content span[style*="font-weight:400"],
                        .credits-overlay .credit-text-content span[style*="400"],
                        .credits-overlay .credit-text-content span[style*="font-weight: normal"],
                        .credits-overlay .credit-text-content .font-normal {
                          font-weight: 400 !important;
                        }
                        .credits-overlay .credit-text-content span[style*="opacity: 0.8"],
                        .credits-overlay .credit-text-content span[style*="opacity:0.8"],
                        .credits-overlay .credit-text-content .opacity-80 {
                          opacity: 0.8 !important;
                        }
                        .credits-overlay .icon {
                          font-size: inherit !important;
                          width: auto !important;
                          min-width: unset !important;
                          font-weight: 400 !important;
                          font-style: normal !important;
                          line-height: 1.15;
                          flex-shrink: 0;
                        }
                      `}</style>
                    </div>

                    <div className="vhs-noise z-40 mix-blend-overlay pointer-events-none"></div>
                    <div className="vhs-tracking z-40 pointer-events-none"></div>
                    <div className="absolute inset-0 scanlines pointer-events-none z-50 opacity-60"></div>
                  </div>
                </div>

                {/* PAINEL DE CONTROLE LATERAL DIREITO */}
                <div className={`flex flex-col w-14 sm:w-16 md:w-28 lg:w-32 ml-2 md:ml-3 p-1.5 md:p-2.5 justify-between items-center gap-2 md:gap-3 shrink-0 rounded-r-lg h-full overflow-hidden font-['Jost',sans-serif] transition-all duration-500 relative z-30 ${
                  isManualMode ? 'hidden' : ''
                } ${
                  activeSkin === 'y2k'
                    ? 'panel-y2k'
                    : activeSkin === 'future'
                    ? 'panel-future'
                    : 'bg-[#111] border-l border-[#222] shadow-[inset_2px_0_5px_rgba(0,0,0,0.5)]'
                }`}>
                  <div className="flex flex-col items-center select-none mb-1 shrink-0">
                    {activeSkin === 'future' ? (
                      <span className="font-['Jost',sans-serif] font-black text-sky-300 text-[8px] md:text-xs drop-shadow-[0_0_8px_#00e5ff] tracking-widest uppercase vertical-text">PLIST</span>
                    ) : activeSkin === 'y2k' ? (
                      <span className="font-['Jost',sans-serif] font-black text-sky-900 text-[8px] md:text-xs drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] tracking-tight uppercase vertical-text">playlist<span className="text-cyan-700">ismo</span></span>
                    ) : (
                      <span className="font-serif italic font-bold text-[#bbb] text-[8px] md:text-sm drop-shadow-[1px_1px_0_rgba(0,0,0,1)] tracking-tight uppercase vertical-text">playlist<span className="text-[#888]">ismo</span></span>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5 my-auto shrink-0">
                    {/* INFO Button */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[6px] font-bold tracking-widest uppercase ${
                        activeSkin === 'future' ? 'text-sky-300 drop-shadow-[0_0_4px_#38bdf8]' : activeSkin === 'y2k' ? 'text-sky-900 font-extrabold' : 'text-gray-500'
                      }`}>
                        Info
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsInfoOpen(prev => !prev); }}
                        className={`${
                          activeSkin === 'y2k'
                            ? `btn-y2k-bubble w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center ${isInfoOpen ? 'ring-2 ring-white/90 brightness-110' : ''}`
                            : activeSkin === 'future'
                            ? `btn-future-chrome w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center ${isInfoOpen ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_#00e5ff]' : ''}`
                            : `btn-retro-push w-8 h-7 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-sm flex items-center justify-center group relative transition-all ${isInfoOpen ? 'border-amber-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]' : ''}`
                        }`}
                        title="Abrir/Fechar Informações (Now Playing)"
                      >
                        <span className={`font-serif font-black italic text-sm md:text-base transition-colors ${
                          activeSkin === 'future'
                            ? 'text-cyan-300 drop-shadow-[0_0_6px_#00e5ff]'
                            : activeSkin === 'y2k'
                            ? 'text-white drop-shadow-[0_1px_2px_rgba(3,105,161,0.8)]'
                            : isInfoOpen ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]' : 'text-gray-400 group-hover:text-white'
                        }`}>
                          i
                        </span>
                      </button>
                    </div>

                    {/* GUIDE Button */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[6px] font-bold tracking-widest uppercase ${
                        activeSkin === 'future' ? 'text-sky-300 drop-shadow-[0_0_4px_#38bdf8]' : activeSkin === 'y2k' ? 'text-sky-900 font-extrabold' : 'text-gray-500'
                      }`}>
                        Guide
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setIsSearchOpen(prev => !prev); }}
                        className={`${
                          activeSkin === 'y2k'
                            ? `btn-y2k-bubble w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center ${isSearchOpen ? 'ring-2 ring-white/90 brightness-110' : ''}`
                            : activeSkin === 'future'
                            ? `btn-future-chrome w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center ${isSearchOpen ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_#00e5ff]' : ''}`
                            : `btn-retro-push w-8 h-7 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-sm flex items-center justify-center group relative transition-all ${isSearchOpen ? 'border-amber-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]' : ''}`
                        }`}
                        title="Abrir/Fechar Guia P100"
                      >
                        <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${
                          activeSkin === 'future'
                            ? 'text-cyan-300 drop-shadow-[0_0_6px_#00e5ff]'
                            : activeSkin === 'y2k'
                            ? 'text-white drop-shadow-[0_1px_2px_rgba(3,105,161,0.8)]'
                            : isSearchOpen ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]' : 'text-gray-400 group-hover:text-white'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </button>
                    </div>

                    {/* PLAY / PAUSE Button (Tactile Deck Control) */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[6px] font-bold tracking-widest uppercase ${
                        activeSkin === 'future' ? 'text-sky-300 drop-shadow-[0_0_4px_#38bdf8]' : activeSkin === 'y2k' ? 'text-sky-900 font-extrabold' : 'text-gray-500'
                      }`}>
                        {isPlaying ? 'Pause' : 'Play'}
                      </span>
                      <button
                        id="btn-tv-play-pause"
                        type="button"
                        onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                        className={`${
                          activeSkin === 'y2k'
                            ? `btn-y2k-bubble w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center ${isPlaying ? 'ring-2 ring-cyan-200' : 'ring-1 ring-white/50'}`
                            : activeSkin === 'future'
                            ? `btn-future-chrome w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center ${isPlaying ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_#00e5ff]' : ''}`
                            : `btn-retro-push w-8 h-7 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-sm flex items-center justify-center group relative transition-all ${isPlaying ? 'border-amber-500/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]' : ''}`
                        }`}
                        title={isPlaying ? "Pausar Reprodução (Space / Clique na Tela)" : "Continuar Reprodução (Space / Clique na Tela)"}
                      >
                        {isPlaying ? (
                          <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${
                            activeSkin === 'future'
                              ? 'text-cyan-300 drop-shadow-[0_0_6px_#00e5ff]'
                              : activeSkin === 'y2k'
                              ? 'text-white drop-shadow-[0_1px_2px_rgba(3,105,161,0.8)]'
                              : 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]'
                          }`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                          </svg>
                        ) : (
                          <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${
                            activeSkin === 'future'
                              ? 'text-cyan-300 drop-shadow-[0_0_6px_#00e5ff]'
                              : activeSkin === 'y2k'
                              ? 'text-white drop-shadow-[0_1px_2px_rgba(3,105,161,0.8)]'
                              : 'text-gray-400 group-hover:text-white'
                          }`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* SKIN Button */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[6px] font-bold tracking-widest uppercase ${
                        activeSkin === 'future' ? 'text-sky-300 drop-shadow-[0_0_4px_#38bdf8]' : activeSkin === 'y2k' ? 'text-sky-900 font-extrabold' : 'text-gray-500'
                      }`}>
                        Skin
                      </span>
                      <button
                        id="btn-tv-skin"
                        onClick={(e) => { e.stopPropagation(); cycleSkin(); }}
                        className={`${
                          activeSkin === 'y2k'
                            ? 'btn-y2k-bubble w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex flex-col items-center justify-center ring-1 ring-cyan-200'
                            : activeSkin === 'future'
                            ? 'btn-future-chrome w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex flex-col items-center justify-center ring-1 ring-cyan-400'
                            : 'btn-retro-push w-8 h-7 sm:w-10 sm:h-8 md:w-12 md:h-10 rounded-sm flex flex-col items-center justify-center group relative transition-all'
                        }`}
                        title={`Tema do Chassi: ${activeSkin.toUpperCase()} (Clique para alternar: Classic -> Y2K -> Future)`}
                      >
                        <span className={`font-mono font-black text-[7px] sm:text-[8px] md:text-[9px] tracking-wider uppercase transition-colors ${
                          activeSkin === 'future'
                            ? 'text-cyan-300 drop-shadow-[0_0_6px_#00e5ff]'
                            : activeSkin === 'y2k'
                            ? 'text-white drop-shadow-[0_1px_2px_rgba(3,105,161,0.8)]'
                            : 'text-gray-400 group-hover:text-white'
                        }`}>
                          {activeSkin === 'classic' ? 'SKIN' : activeSkin.toUpperCase()}
                        </span>
                      </button>
                    </div>

                    {/* GRP Button */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[6px] font-bold tracking-widest uppercase ${
                        activeSkin === 'future' ? 'text-sky-300 drop-shadow-[0_0_4px_#38bdf8]' : activeSkin === 'y2k' ? 'text-sky-900 font-extrabold' : 'text-gray-500'
                      }`}>
                        Grp
                      </span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); changeGroup(1); }}
                          className={`${
                            activeSkin === 'y2k'
                              ? 'btn-y2k-bubble w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 flex justify-center items-center text-white font-black text-xs md:text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'
                              : activeSkin === 'future'
                              ? 'btn-future-chrome w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 flex justify-center items-center text-cyan-300 font-black text-xs md:text-sm drop-shadow-[0_0_4px_#00e5ff]'
                              : 'btn-retro-push w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 rounded-sm flex justify-center items-center text-gray-400 font-bold hover:text-white text-xs md:text-sm'
                          }`}
                        >
                          +
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); changeGroup(-1); }}
                          className={`${
                            activeSkin === 'y2k'
                              ? 'btn-y2k-bubble w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 flex justify-center items-center text-white font-black text-xs md:text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]'
                              : activeSkin === 'future'
                              ? 'btn-future-chrome w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 flex justify-center items-center text-cyan-300 font-black text-xs md:text-sm drop-shadow-[0_0_4px_#00e5ff]'
                              : 'btn-retro-push w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 rounded-sm flex justify-center items-center text-gray-400 font-bold hover:text-white text-xs md:text-sm'
                          }`}
                        >
                          -
                        </button>
                      </div>
                    </div>

                    {/* CH Button */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[6px] font-bold tracking-widest uppercase ${
                        activeSkin === 'future' ? 'text-sky-300 drop-shadow-[0_0_4px_#38bdf8]' : activeSkin === 'y2k' ? 'text-sky-900 font-extrabold' : 'text-gray-500'
                      }`}>
                        Ch
                      </span>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); changeChannel(1); }}
                          className={`${
                            activeSkin === 'y2k'
                              ? 'btn-y2k-bubble w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 flex justify-center items-center'
                              : activeSkin === 'future'
                              ? 'btn-future-chrome w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 flex justify-center items-center'
                              : 'btn-retro-push w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 rounded-sm flex justify-center items-center group'
                          }`}
                        >
                          <svg className={`w-2.5 h-2.5 sm:w-3 sm:h-3 -rotate-90 ${
                            activeSkin === 'future' ? 'text-cyan-300 drop-shadow-[0_0_4px_#00e5ff]' : activeSkin === 'y2k' ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' : 'text-gray-400 group-hover:text-white'
                          }`} fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM4 19l9-7-9-7v14z" /></svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); changeChannel(-1); }}
                          className={`${
                            activeSkin === 'y2k'
                              ? 'btn-y2k-bubble w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 flex justify-center items-center'
                              : activeSkin === 'future'
                              ? 'btn-future-chrome w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 flex justify-center items-center'
                              : 'btn-retro-push w-7 h-6 sm:w-8 sm:h-7 md:w-10 md:h-8 rounded-sm flex justify-center items-center group'
                          }`}
                        >
                          <svg className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rotate-90 ${
                            activeSkin === 'future' ? 'text-cyan-300 drop-shadow-[0_0_4px_#00e5ff]' : activeSkin === 'y2k' ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' : 'text-gray-400 group-hover:text-white'
                          }`} fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM4 19l9-7-9-7v14z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col items-center gap-1.5 md:gap-2 pb-1 shrink-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-1.5 h-1.5 rounded-full border transition-all duration-300 ${
                        activeSkin === 'future'
                          ? isOn ? 'bg-cyan-400 shadow-[0_0_8px_#00e5ff] border-cyan-200' : 'bg-slate-700 border-slate-900'
                          : activeSkin === 'y2k'
                          ? isOn ? 'bg-cyan-300 shadow-[0_0_8px_#22d3ee] border-cyan-100' : 'bg-sky-950 border-sky-900'
                          : isOn ? 'bg-red-500 shadow-[0_0_8px_#ff0000] saturate-200 border-black' : 'bg-red-900 shadow-[0_0_2px_black] border-black'
                      }`}></div>
                      <span className={`text-[6px] mt-0.5 font-bold uppercase ${
                        activeSkin === 'future' ? 'text-sky-300 drop-shadow-[0_0_4px_#38bdf8]' : activeSkin === 'y2k' ? 'text-sky-900 font-extrabold' : 'text-gray-500'
                      }`}>
                        Pwr
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePower(); }}
                      className={`${
                        activeSkin === 'y2k'
                          ? 'btn-y2k-power w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center group'
                          : activeSkin === 'future'
                          ? 'btn-future-power w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center group'
                          : 'btn-power-push w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-sm flex items-center justify-center group'
                      }`}
                    >
                      <svg className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${
                        activeSkin === 'future'
                          ? isOn ? 'text-cyan-300 drop-shadow-[0_0_8px_#00e5ff]' : 'text-slate-400 group-hover:text-cyan-200'
                          : activeSkin === 'y2k'
                          ? isOn ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'text-cyan-200 group-hover:text-white'
                          : isOn ? 'text-red-500 drop-shadow-[0_0_6px_#ef4444]' : 'text-gray-400 group-hover:text-red-500'
                      }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── FULLSCREEN OWNER'S MANUAL OVERLAY (With Embedded Die-Cut Cavity & Zoom) ── */}
      {isManualMode && (
        <div className="fixed inset-0 z-[200] bg-neutral-950/98 backdrop-blur-md p-2 sm:p-4 md:p-6 flex flex-col justify-between overflow-hidden">
          <div 
            ref={manualScrollContainerRef}
            className={`flex-1 min-h-0 w-full flex justify-center ${
              manualZoomLevel > 1 ? 'items-start overflow-y-auto custom-scrollbar' : 'items-center overflow-hidden'
            }`}
          >
            <ManualSpreadViewer
              spread={manualSpreads[activeSpreadIndex]}
              spreadIndex={activeSpreadIndex}
              totalSpreads={manualSpreads.length}
              cavityRef={cavityRef}
              zoomLevel={manualZoomLevel}
            />
          </div>
          <div className="shrink-0 w-full pt-1.5 z-[210]">
            <ManualControlDeck
              currentSpreadIndex={activeSpreadIndex}
              totalSpreads={manualSpreads.length}
              isPlaying={isPlaying}
              onTogglePlayPause={togglePlayPause}
              onPrevPage={() => {
                setActiveSpreadIndex(prev => Math.max(0, prev - 1));
                if (manualScrollContainerRef.current) {
                  manualScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onNextPage={() => {
                setActiveSpreadIndex(prev => (prev < manualSpreads.length - 1 ? prev + 1 : prev));
                if (manualScrollContainerRef.current) {
                  manualScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              onClose={() => {
                setIsManualMode(false);
                setManualZoomLevel(1);
                setIsPipMinimized(false);
              }}
              zoomLevel={manualZoomLevel}
              onCycleZoom={handleCycleZoom}
            />
          </div>
        </div>
      )}

      {/* ── PiP MINIMIZED RESTORE BADGE (AUDIO-ONLY MODE) ── */}
      {isManualMode && manualZoomLevel > 1 && isPipMinimized && (
        <button
          type="button"
          id="btn-pip-restore-badge"
          onClick={() => setIsPipMinimized(false)}
          className="fixed bottom-24 right-6 z-[260] bg-[#121418] hover:bg-[#1a1e24] text-amber-300 hover:text-amber-200 border-2 border-amber-500/70 hover:border-amber-400 px-3.5 py-2.5 rounded-lg shadow-[0_12px_30px_rgba(0,0,0,0.9),0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2.5 font-mono-tech text-xs font-bold tracking-wider uppercase transition-all cursor-pointer active:scale-95 animate-pulse"
          title="Restaurar Janela PiP do CRT"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span>🔊 AUDIO ACTIVE — RESTORE TV</span>
          <span className="text-zinc-500 text-[10px]">▲</span>
        </button>
      )}

      <div
          id="tv-drawer-guide"
          className={`w-full shrink-0 overflow-hidden transition-all duration-500 ease-in-out font-['Jost',sans-serif] font-jost ${
            isSearchOpen
              ? 'max-h-[50vh] md:max-h-[54vh] opacity-100 mt-2 md:mt-3 translate-y-0'
              : 'max-h-0 opacity-0 mt-0 translate-y-6 pointer-events-none'
          }`}
        >
              <div className="orbital-telemetry-container rounded-2xl p-2.5 md:p-3.5 relative font-['Jost',sans-serif] font-jost h-[50vh] md:h-[54vh] max-h-[50vh] md:max-h-[54vh] flex flex-col overflow-hidden">
                
                {/* Header do Guia: Orbital Telemetry System */}
                <div className="flex items-center justify-between border-b border-[#00ff88]/30 pb-2 mb-2 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping shrink-0" />
                    <span className="text-base sm:text-lg md:text-xl font-bold tracking-widest text-white drop-shadow-[0_0_8px_rgba(0,255,136,0.6)] font-mono truncate">
                      <span className="text-[#00ff88]">P100</span> TELEMETRY MAP
                    </span>
                    <span className="text-[10px] text-[#00ff88]/70 uppercase tracking-[0.2em] font-mono hidden md:inline truncate">
                      // ORBITAL MATRIX SELECTOR
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Search box */}
                    <div className="relative bg-black/80 border border-[#00ff88]/40 rounded px-2.5 py-1 flex items-center shadow-inner">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent text-[#00ff88] text-xs uppercase outline-none placeholder-[#00ff88]/40 w-24 sm:w-36 font-mono"
                        placeholder="BUSCAR SAT..."
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-[#00ff88]/60 hover:text-[#00ff88] text-xs ml-1 font-mono">
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="text-[#00ff88] hover:text-white text-sm font-bold w-7 h-7 flex items-center justify-center rounded bg-black/60 hover:bg-red-950/80 border border-[#00ff88]/40 hover:border-red-500/80 transition-colors font-mono"
                      title="Fechar Guia"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 3-Column Orbital Telemetry Architecture */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 md:gap-3 overflow-hidden">
                  
                  {/* Column 1 (Left - Fixed): PLANETAS / ROTAS */}
                  <div className="w-full lg:w-56 xl:w-64 h-36 sm:h-44 lg:h-full min-h-0 shrink-0 flex flex-col bg-black/60 border border-[#00ff88]/30 rounded-xl p-2.5 shadow-[inset_0_0_15px_rgba(0,255,136,0.04)]">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#00ff88]/30 shrink-0 select-none">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#00ff88] uppercase truncate">
                          ◈ PLANETAS / ROTAS
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-[#00ff88]/70 px-1 py-0.2 bg-[#00ff88]/10 rounded border border-[#00ff88]/20 shrink-0">
                        {uniqueGroups.length}
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto orbital-telemetry-scrollbar space-y-1 pr-1 font-mono">
                      {uniqueGroups.map(grp => {
                        const isSelected = activePlanet === grp;
                        const count = (channelsByCategory[grp] || []).length;
                        return (
                          <button
                            key={grp}
                            onClick={() => {
                              setActivePlanet(grp);
                              const planetChs = channelsByCategory[grp] || [];
                              if (planetChs.length > 0) {
                                const playingInPlanet = planetChs.find(p => p.name === currentChannelName);
                                setHoveredChannel(playingInPlanet || planetChs[0]);
                              }
                            }}
                            className={`w-full text-left px-2 py-1.5 text-xs font-mono font-bold uppercase transition-all rounded flex items-center justify-between group ${
                              isSelected
                                ? 'bg-[#00ff88] text-black shadow-[0_0_12px_rgba(0,255,136,0.7)] font-black border border-[#00ff88]'
                                : 'bg-black/50 hover:bg-[#00ff88]/10 text-zinc-300 hover:text-[#00ff88] border border-[#00ff88]/20 hover:border-[#00ff88]/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className={`text-[10px] font-mono shrink-0 ${isSelected ? 'text-black font-black' : 'text-[#00ff88]'}`}>
                                {isSelected ? '[X]' : '[ ]'}
                              </span>
                              <span className="text-sm shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                                {getGroupIcon(grp)}
                              </span>
                              <span className="truncate tracking-wider text-xs">
                                {grp}
                              </span>
                            </div>
                            <span className={`text-[10px] font-mono shrink-0 ml-1 ${isSelected ? 'text-black/80 font-black' : 'text-zinc-500 group-hover:text-[#00ff88]/80'}`}>
                              ({count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2 (Center - Scrollable): SATÉLITES / CANAIS */}
                  <div className="flex-1 min-w-0 h-60 sm:h-72 lg:h-full min-h-0 flex flex-col bg-black/60 border border-[#00ff88]/30 rounded-xl p-2.5 shadow-[inset_0_0_15px_rgba(0,255,136,0.04)]">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#00ff88]/30 shrink-0 select-none">
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#00ff88] uppercase truncate">
                          ◎ SATÉLITES / CANAIS
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 rounded uppercase tracking-wider shrink-0">
                          {activePlanet}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-[#00ff88]/70 px-1 py-0.2 bg-[#00ff88]/10 rounded border border-[#00ff88]/20 shrink-0">
                        {filteredPlaylists.length} SATS
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto orbital-telemetry-scrollbar pr-1 space-y-1 font-mono">
                      {filteredPlaylists.length > 0 ? (
                        filteredPlaylists.map((pl, idx) => {
                          const isLast = idx === filteredPlaylists.length - 1;
                          const branch = isLast ? '└──' : '├──';
                          const channelNum = String(idx + 1).padStart(2, '0');
                          const isChannelActive = pl.name === currentChannelName;
                          const isHovered = (hoveredChannel?.name === pl.name) || (!hoveredChannel && isChannelActive);

                          return (
                            <button
                              key={pl.name}
                              onClick={() => {
                                loadChannelContent(pl.name);
                              }}
                              onMouseEnter={() => setHoveredChannel(pl)}
                              onFocus={() => setHoveredChannel(pl)}
                              className={`w-full text-left px-2 py-1.5 rounded transition-all flex items-center justify-between group font-mono text-xs md:text-sm border ${
                                isChannelActive
                                  ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.35)] font-bold'
                                  : isHovered
                                  ? 'bg-[#00ff88]/10 text-white border-[#00ff88]/60 shadow-[0_0_8px_rgba(0,255,136,0.2)]'
                                  : 'bg-black/40 hover:bg-black/70 text-zinc-300 hover:text-white border-transparent hover:border-[#00ff88]/30'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                <span className={`ascii-branch select-none shrink-0 text-sm ${isChannelActive ? 'text-[#00ff88] font-bold' : isHovered ? 'text-[#00ff88]' : 'text-zinc-600'}`}>
                                  {branch}
                                </span>
                                <span className={`text-[10px] sm:text-[11px] font-mono shrink-0 px-1 py-0.5 rounded ${
                                  isChannelActive
                                    ? 'bg-[#00ff88] text-black font-black'
                                    : isHovered
                                    ? 'bg-[#00ff88]/20 text-[#00ff88] font-bold'
                                    : 'text-zinc-500'
                                }`}>
                                  [ CH {channelNum} ]
                                </span>
                                <span className="truncate tracking-wide font-jost text-xs md:text-sm font-semibold uppercase">
                                  {pl.name}
                                </span>
                              </div>

                              {isChannelActive ? (
                                <span className="text-[9px] font-mono font-black ml-2 shrink-0 flex items-center gap-1 bg-[#00ff88] text-black px-1.5 py-0.5 rounded shadow">
                                  <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />
                                  ON AIR
                                </span>
                              ) : (
                                <span className={`text-[9px] font-mono tracking-wider ml-1 transition-opacity ${
                                  isHovered ? 'opacity-100 text-[#00ff88]' : 'opacity-0 group-hover:opacity-100 text-zinc-500'
                                }`}>
                                  TUNE ↵
                                </span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-zinc-500 uppercase font-mono text-xs">
                          {searchTerm ? '> NENHUM SATÉLITE ENCONTRADO PARA ESTA BUSCA' : '> NENHUM CANAL NESTE PLANETA'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3 (Right - Fixed): Dedicated Terminal Screen */}
                  <div className="w-full lg:w-[380px] xl:w-[440px] h-72 sm:h-80 lg:h-full min-h-0 shrink-0">
                    <TerminalManifesto
                      hoveredChannel={
                        hoveredChannel ||
                        filteredPlaylists.find(p => p.name === currentChannelName) ||
                        currentChannelRecord ||
                        filteredPlaylists[0] ||
                        null
                      }
                      channel={
                        hoveredChannel ||
                        filteredPlaylists.find(p => p.name === currentChannelName) ||
                        currentChannelRecord ||
                        filteredPlaylists[0] ||
                        null
                      }
                      videos={currentChannelList}
                      currentChannelName={currentChannelName}
                      activeLang={activeLang}
                      onLanguageChange={setActiveLang}
                    />
                  </div>

                </div>
              </div>
            </div>

          </div>

          {!isManualMode && (
            <div className="shrink-0 mt-1 md:mt-2 text-center opacity-20 hover:opacity-100 transition-opacity duration-500 pointer-events-none select-none">
              <span className="font-vt323 text-xs md:text-sm text-white tracking-widest uppercase">powered by @addri0n4 e @sandrobreaker</span>
            </div>
          )}
        </section>

        {/* RIGHT PANEL: TABLE INTEGRATION */}
        <aside className={`hidden md:flex flex-col justify-start shrink-0 overflow-hidden transition-all duration-500 ease-in-out border-l border-amber-900/20 bg-black/40 backdrop-blur-md h-full ${isAdminSidebarOpen ? 'translate-x-0 opacity-100 w-[520px]' : 'translate-x-full opacity-0 w-0'}`}>
          <div className="w-[520px] h-full overflow-hidden">
            {isAdminSidebarOpen && (
              <AdminPanel
                session={session}
                editId={adminEditId}
                displayMode="table"
                autoFetchMetadata={autoFetchMetadata}
                onAutoFetchMetadataChange={setAutoFetchMetadata}
                onEdit={(id) => {
                  setAdminEditId(id);
                  setIsEditDrawerOpen(true);
                }}
                onClose={() => setIsAdminSidebarOpen(false)}
                playingId={currentVideoData?.video_id || (currentVideoData?.id ? String(currentVideoData.id) : null)}
                initialPlaylist={currentChannelName}
                onSave={(newData) => {
                  fetchGuideData();
                  if (newData) {
                    const savedIdStr = String(newData.id);
                    const videoData = newData as VideoData;
                    setLastSavedRecord(videoData);
                    // Atualiza créditos na tela imediatamente
                    setCurrentVideoData(prev => ({ ...prev, ...videoData }));
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