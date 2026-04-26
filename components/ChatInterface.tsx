import React, { useState, useRef, useEffect, useLayoutEffect, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Message, UserProfile, MediaMetadata } from '../types';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import ImageModal from './ImageModal';
import ParticleBurst from './ParticleBurst';
import LoveAnimation from './LoveAnimation';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Variants } from 'framer-motion';
import { compressImage, getImageDimensions, getVideoMetadata } from '../services/mediaService';


// --- CONSTANTES DE ID ---
const AUTOR_ID = '00000000-0000-0000-0000-000000000001';
const MUSA_ID = '00000000-0000-0000-0000-000000000002';
const STORAGE_URL = 'https://yggpwbvhyieaqvwwjcot.supabase.co/storage/v1/object/public/CapyBook';

// --- EMOJIS DINÂMICOS (LRU LOGIC) ---
const REACTION_EMOJIS = ["❤️", "😂", "😍", "😆", "😮", "😢", "😡", "👍", "🤔", "🙏"];
const RECENT_EMOJIS_KEY = 'capy_recent_emojis';
const DEFAULT_EMOJIS = ["❤️", "😂", "😍", "😆", "😮"];

const loadRecentEmojis = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_EMOJIS;
  } catch {
    return DEFAULT_EMOJIS;
  }
};

// --- VARIANTS FRAMER MOTION ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.4,
      staggerChildren: 0.1
    } as const
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100, duration: 0.5 } as const
  }
};

const menuVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.1 } as const
  }
};

const searchContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    } as const
  },
  exit: { opacity: 0 }
};

const searchItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
} as const;

const bannerVariants: Variants = {
  hidden: { opacity: 0, y: -50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      delay: 0.2
    } as const
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 } as const
  }
};

// --- Interfaces ---
interface ChatInterfaceProps {
  messages: Message[];
  partner: UserProfile;
  onSendMessage: (text: string, type?: 'text' | 'sticker' | 'image' | 'audio' | 'video' | 'document', replyToId?: string, metadata?: MediaMetadata, localId?: string) => void;
  onMarkAsRead: (messageId: string) => void;
  onNavigateToProfile: () => void;
  onLockApp: () => void;
  currentUserId: string;
  isPartnerTyping?: boolean;
  onTyping?: (isTyping: boolean) => void;
  onEditMessage: (id: string, newText: string) => void;
  onDeleteMessage: (id: string) => void;
  onReactMessage: (id: string, emoji: string) => void;
  onLoadMore: () => void;
  onLoadNext: () => void;
  hasMore: boolean;
  hasNewer: boolean;
  isLoadingMore: boolean;
  isLoadingNext: boolean;
  isViewingHistory: boolean;
  newLiveCount: number;
  onJumpToMessage: (msg: Message) => Promise<void>;
  onReloadLatest: () => Promise<void>;
  regime?: 'musa' | 'autor';
  isSleepModeActive?: boolean;
}

const RegimeBanner = memo(({ regime }: { regime: 'musa' | 'autor' }) => {
  const isMusa = regime === 'musa';
  return (
    <motion.div
      variants={bannerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`absolute top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-2.5 rounded-full border shadow-2xl backdrop-blur-md flex items-center gap-3 whitespace-nowrap overflow-hidden
        ${isMusa ? 'bg-[#f4ece1]/80 border-[#c2a182]/30 text-[#3c2f2f]' : 'bg-[#0a0a0a]/80 border-red-900/30 text-white'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMusa ? 'bg-[#c2a182]/20' : 'bg-red-900/20'}`}>
        <i className={`fa-solid ${isMusa ? 'fa-sun text-[#c2a182]' : 'fa-moon text-red-500'} text-sm`}></i>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">Início do Reinado</p>
        <p className="text-sm font-serif font-black tracking-wide">Império de {isMusa ? 'Lizzie' : 'Sandro'} ✨</p>
      </div>
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="text-xl"
      >
        👑
      </motion.div>
    </motion.div>
  );
});

const SleepOverlay = memo(() => {
  const elements = useMemo(() => [
    { id: 1, char: '✨', top: '10%', left: '15%', delay: 0 },
    { id: 2, char: '🌙', top: '25%', left: '80%', delay: 1 },
    { id: 3, char: '✨', top: '60%', left: '10%', delay: 2 },
    { id: 4, char: 'zzz', top: '75%', left: '75%', delay: 0.5 },
    { id: 5, char: '✨', top: '40%', left: '85%', delay: 1.5 },
    { id: 6, char: '🌙', top: '85%', left: '20%', delay: 2.5 },
  ], []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: "easeInOut" }}
      className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center bg-black/40"
      style={{ backdropFilter: 'blur(8px) brightness(0.4) sepia(0.2)' }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {elements.map((el) => (
          <motion.div
            key={el.id}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.2, 0.5],
              y: [0, -40, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: el.delay,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              top: el.top,
              left: el.left,
              fontSize: el.char === 'zzz' ? '14px' : '24px',
              fontWeight: 'bold',
              color: el.char === 'zzz' ? '#a5f3fc' : '#fef08a',
              textShadow: '0 0 10px rgba(0,0,0,0.5)',
              fontFamily: 'serif'
            }}
          >
            {el.char}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 2.5 }}
        className="text-center"
      >
        <p className="text-[#a5f3fc] font-serif italic text-lg tracking-[0.2em] opacity-80 decoration-cyan-500/20 underline underline-offset-8">
          Shhh... hora de descansar
        </p>
      </motion.div>
    </motion.div>
  );
});

// --- Componentes Auxiliares ---

const TypingIndicator = memo(() => (
  <div className="flex items-center gap-1">
    <span className="text-[10px] font-semibold animate-pulse">digitando</span>
    <div className="flex gap-0.5">
      <div className="w-1 h-1 bg-blue-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
      <div className="w-1 h-1 bg-blue-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
      <div className="w-1 h-1 bg-blue-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
    </div>
  </div>
));

const DateDivider = memo(({ date }: { date: string }) => {
  const label = useMemo(() => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  }, [date]);
  return (
    <div className="flex items-center justify-center my-6 select-none animate-in fade-in duration-500">
      <div className="h-[0.5px] flex-1 bg-zinc-800/50"></div>
      <span className="px-3 text-[10px] uppercase font-black text-zinc-600 font-serif italic tracking-widest">{label}</span>
      <div className="h-[0.5px] flex-1 bg-zinc-800/50"></div>
    </div>
  );
});

const renderMessageText = (text: string, isMe: boolean, searchQuery?: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline break-all transition-opacity hover:opacity-70 text-blue-300`} onClick={(e) => e.stopPropagation()}>{part}</a>;
    }
    if (searchQuery && searchQuery.trim().length > 1) {
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(`(${escapedQuery})`, 'gi');
      const searchParts = part.split(searchRegex);
      return searchParts.map((sPart, j) => {
        if (sPart.toLowerCase() === searchQuery.toLowerCase()) {
          return <span key={`${i}-${j}`} className="bg-yellow-400/80 text-black font-bold rounded-[2px] px-0.5">{sPart}</span>;
        }
        return sPart;
      });
    }
    return part;
  });
};

const AudioPlayer = ({ url, isMe }: { url: string; isMe: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Progressão suave simulando um waveform estético
  const bars = useMemo(() => [25, 40, 65, 90, 75, 45, 30, 50, 85, 100, 80, 55, 35, 20, 40, 60], []);
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };
  return (
    <div className="flex items-center gap-2.5 min-w-[150px] py-1">
      <audio ref={audioRef} src={url} onTimeUpdate={() => setProgress((audioRef.current!.currentTime / audioRef.current!.duration) * 100)} onEnded={() => setIsPlaying(false)} />
      <button onClick={togglePlay} className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${isMe ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}>
        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-[9px]`}></i>
      </button>
      <div className="flex-1 flex items-end gap-[2px] h-5 px-1">
        {bars.map((height, i) => (
          <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${progress > (i / bars.length) * 100 ? (isMe ? 'bg-white' : 'bg-blue-400') : (isMe ? 'bg-white/20' : 'bg-white/10')}`} style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
};

// --- Message Item ---

interface MessageItemProps {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  partner: UserProfile;
  isMenuOpen: boolean;
  isEditing: boolean;
  index: number;
  onReactMessage: (id: string, emoji: string) => void;
  onDeleteMessage: (id: string) => void;
  onEditMessage: (id: string, newText: string) => void;
  onStartReply: (msg: Message) => void;
  onSetMenuOpen: (id: string | null) => void;
  onSetEditing: (id: string | null) => void;
  onPreviewImage: (url: string) => void;
  renderReplyContext: (replyToId: string | undefined, isMe: boolean) => React.ReactNode;
  renderStatus: (msg: Message) => React.ReactNode;
  onMediaLoad?: () => void;
  searchQuery?: string;
  isHighlighted?: boolean;
}

const MessageItem = memo(({
  msg, isMe, currentUserId, partner, isMenuOpen, isEditing, index, onReactMessage, onDeleteMessage, onEditMessage, onStartReply, onSetMenuOpen, onSetEditing, onPreviewImage, renderReplyContext, renderStatus, onMediaLoad, searchQuery, isHighlighted
}: MessageItemProps) => {
  const reactionsList = Object.entries(msg.reactions || {});
  const [editText, setEditText] = useState(msg.text || '');
  const [burst, setBurst] = useState<{ x: number, y: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeIndicatorRef = useRef<HTMLDivElement>(null);

  // Refatoração de Gestos (Framer Motion)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const dragX = useMotionValue(0);
  const indicatorOpacity = useTransform(dragX, [20, 60], [0, 1]);
  const indicatorScale = useTransform(dragX, [0, 70], [0.8, 1.2]);
  const indicatorX = useTransform(dragX, [0, 70], [0, 30]);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.style.height = 'auto';
      editRef.current.style.height = `${editRef.current.scrollHeight}px`;
      const len = editRef.current.value.length;
      editRef.current.setSelectionRange(len, len);
      editRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isMenuOpen) {
      const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) onSetMenuOpen(null); };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isMenuOpen, onSetMenuOpen]);

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = () => {
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      onSetMenuOpen(msg.id);
      if (navigator.vibrate) navigator.vibrate(20);
    }, 500);
  };

  const handlePointerUp = () => {
    clearLongPress();
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    // Clique Único Instantâneo
    if (msg.type === 'image' && !msg.is_deleted) {
      onPreviewImage(msg.text!);
    }
  };

  return (
    <motion.div
      ref={rootRef}
      initial="hidden"
      animate="visible"
      data-id={msg.id}
      variants={itemVariants}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full relative transform-gpu my-1`}
    >
      <motion.div style={{ opacity: indicatorOpacity, x: indicatorX, scale: indicatorScale }} className="absolute left-[-35px] top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <i className="fa-solid fa-reply text-sm text-blue-400 drop-shadow-md"></i>
      </motion.div>
      {burst && <ParticleBurst x={burst.x} y={burst.y} emoji="❤️" onComplete={() => setBurst(null)} />}
      <motion.div
        ref={containerRef}
        className={`relative max-w-[85%] md:max-w-[70%] will-change-transform`}
        drag="x"
        dragConstraints={{ left: 0, right: 100 }}
        dragElastic={0.2}
        style={{ x: dragX }}
        onDragStart={clearLongPress}
        onDragEnd={(e, info) => {
          if (info.offset.x > 70) {
            onStartReply(msg);
            if (navigator.vibrate) navigator.vibrate(30);
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={clearLongPress}
        onPointerMove={(e) => {
          if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5) clearLongPress();
        }}
      >
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={menuRef}
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`absolute z-50 bottom-[calc(100%+8px)] ${isMe ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'} bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl min-w-[200px] overflow-hidden`}
              // CORREÇÃO: Impede a propagação de eventos para o container pai
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Reactions Container */}
              <div className="p-2 border-b border-white/5 bg-white/5">
                <div className="flex flex-wrap justify-center gap-2">
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReactMessage(msg.id, emoji);
                        onSetMenuOpen(null);
                      }}
                      className="hover:scale-125 hover:bg-white/10 rounded-full transition-all text-xl w-8 h-8 flex items-center justify-center active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions List */}
              <div className="flex flex-col p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartReply(msg);
                    onSetMenuOpen(null);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <i className="fa-solid fa-reply text-blue-400"></i>
                  </div>
                  <span className="font-medium">Responder</span>
                </button>

                {isMe && !msg.is_deleted && msg.type === 'text' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetEditing(msg.id);
                      onSetMenuOpen(null);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center group-hover:bg-zinc-600/50 transition-colors">
                      <i className="fa-solid fa-pen text-zinc-300"></i>
                    </div>
                    <span className="font-medium">Editar</span>
                  </button>
                )}

                {isMe && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newStatus = !msg.is_deleted;
                      await supabase.from('messages').update({ is_deleted: newStatus }).eq('id', msg.id);
                      onSetMenuOpen(null);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 rounded-xl flex items-center gap-3 transition-colors group ${msg.is_deleted ? 'text-green-400' : 'text-red-400'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${msg.is_deleted ? 'bg-green-500/10 group-hover:bg-green-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}>
                      <i className={`fa-solid ${msg.is_deleted ? 'fa-rotate-left' : 'fa-trash'}`}></i>
                    </div>
                    <span className="font-medium">{msg.is_deleted ? 'Restaurar' : 'Excluir'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`px-3.5 py-2 shadow-sm relative transition-all active:scale-[0.99] group select-text ${isMe ? 'bg-[#007AFF] text-white rounded-[19px] rounded-tr-[4px]' : 'bg-[#262626] text-white rounded-[19px] rounded-tl-[4px]'} ${isHighlighted ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-black animate-[pulse_1.5s_infinite]' : ''}`} style={{ touchAction: 'pan-y' }}>
          {renderReplyContext(msg.reply_to_id, isMe)}
          {isEditing ? (
            <div className="min-w-[190px]">
              <textarea ref={editRef} value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full bg-black/20 text-white p-2.5 rounded-lg text-[14px] border-none focus:outline-none focus:ring-0 mb-1.5 resize-none overflow-hidden font-serif leading-relaxed" autoFocus />
              <div className="flex justify-end gap-2.5"><button onClick={() => onSetEditing(null)} className="text-[9px] text-white/70 font-black uppercase">Cancelar</button><button onClick={() => { onEditMessage(msg.id, editText); onSetEditing(null); }} className="text-[9px] text-white font-black uppercase">Salvar</button></div>
            </div>
          ) : (
            <>
              {msg.is_deleted ? (
                <div className="flex items-center gap-2 italic opacity-50 px-1 py-0.5 select-none">
                  <i className="fa-solid fa-ban text-xs text-white/70"></i>
                  <span className="text-sm text-white/70 font-serif">mensagem excluída</span>
                </div>
              ) : (
                <>
                  {msg.type === 'audio' ? <AudioPlayer url={msg.text!} isMe={isMe} /> : msg.type === 'image' || msg.type === 'sticker' ? (
                    <div
                      className="relative overflow-hidden rounded-lg bg-white/5"
                      style={{
                        aspectRatio: msg.metadata?.width && msg.metadata?.height
                          ? `${msg.metadata.width} / ${msg.metadata.height}`
                          : msg.type === 'sticker' ? '1/1' : 'auto',
                        width: msg.type === 'sticker' ? '104px' : 'min(100%, 240px)'
                      }}
                    >
                      <img
                        src={msg.text}
                        onLoad={onMediaLoad}
                        className="w-full h-full object-cover cursor-pointer"
                      />
                      {msg.id.startsWith('temp-') && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-md">
                          <div className="relative flex items-center justify-center w-10 h-10 bg-black/30 rounded-full shadow-xl">
                            <i className="fa-solid fa-spinner animate-spin text-white text-lg drop-shadow-md"></i>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : msg.type === 'video' ? (
                    <div
                      className="relative overflow-hidden rounded-lg bg-black/20"
                      style={{
                        aspectRatio: msg.metadata?.width && msg.metadata?.height
                          ? `${msg.metadata.width} / ${msg.metadata.height}`
                          : '16/9',
                        width: 'min(100%, 288px)'
                      }}
                    >
                      <video
                        src={msg.text}
                        controls={!msg.id.startsWith('temp-')}
                        onLoadedData={onMediaLoad}
                        className="w-full h-full object-cover"
                      />
                      {msg.id.startsWith('temp-') && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-md">
                          <div className="relative flex items-center justify-center w-10 h-10 bg-black/30 rounded-full shadow-xl">
                            <i className="fa-solid fa-spinner animate-spin text-white text-lg drop-shadow-md"></i>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : msg.type === 'document' ? (
                    <div className="flex items-center gap-2.5 p-2.5 bg-black/20 rounded-lg min-w-[180px]"><div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white"><i className="fa-solid fa-file-lines text-base"></i></div><div className="flex-1 min-w-0"><p className="text-xs font-bold truncate text-white">Arquivo</p><a href={msg.text} download target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-200 underline">Baixar</a></div><i className="fa-solid fa-download text-[10px] text-white/50"></i></div>
                  ) : <p className="font-serif text-[15px] leading-[1.38] break-words whitespace-pre-wrap select-text">{renderMessageText(msg.text!, isMe, searchQuery)}</p>}
                  {msg.is_edited && <span className="text-[9px] text-white/50 italic block mt-0.5">(editado)</span>}
                </>
              )}
            </>
          )}
          {reactionsList.length > 0 && <div className={`absolute -bottom-2.5 ${isMe ? 'right-2' : 'left-2'} flex bg-[#262626] rounded-full border border-white/10 px-1.5 py-0.5 shadow-lg scale-90 z-10`}>{reactionsList.map(([uid, emoji], idx) => <span key={idx} className="text-[11px] mx-0.5">{emoji}</span>)}</div>}
          <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[9px] font-black uppercase text-white/60 tracking-tighter">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {renderStatus(msg)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

// --- Footer ---
interface ChatInputFooterProps {
  onSendMessage: (text: string, type: 'text' | 'sticker' | 'image' | 'audio' | 'video' | 'document', replyToId?: string, metadata?: MediaMetadata, localId?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  partnerName: string;
  currentUserId: string;
  onFileClick: () => void;
  recentEmojis: string[];
  onEmojiUsed: (emoji: string) => void;
  isViewingHistory: boolean;
  onReloadLatest: () => Promise<void>;
}

const ChatInputFooter = memo(({
  onSendMessage, onTyping, replyingTo, onCancelReply, partnerName, currentUserId, onFileClick, recentEmojis, onEmojiUsed, isViewingHistory, onReloadLatest
}: ChatInputFooterProps) => {
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mimeType, setMimeType] = useState<string>('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaChunks = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const types = [
      'video/mp4; codecs="avc1,mp4a"',
      'video/mp4',
      'video/webm; codecs="vp8,opus"',
      'video/webm',
      'audio/mp4',
      'audio/webm'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        setMimeType(type);
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (showEmojis) {
      const handleClickOutside = (event: MouseEvent) => { if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node) && emojiButtonRef.current && !emojiButtonRef.current.contains(event.target as Node)) setShowEmojis(false); };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojis]);

  useEffect(() => {
    if (replyingTo && !isRecording) {
      textareaRef.current?.focus();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [replyingTo, isRecording]);
  useEffect(() => { const textarea = textareaRef.current; if (textarea) { textarea.style.height = 'auto'; textarea.style.height = `${Math.min(textarea.scrollHeight, 110)}px`; } }, [inputText]);

  // FIX: Garantir que ao desmontar o componente (sair da tela), o status de digitando seja limpo
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        onTyping?.(false); // FORÇA O STOP TYPING AO SAIR
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    if (text.trim().length > 0) {
      if (!typingTimeoutRef.current) onTyping?.(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => { onTyping?.(false); typingTimeoutRef.current = null; }, 2000);
    } else {
      if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
      onTyping?.(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaChunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) mediaChunks.current.push(e.data);
      };
      recorder.onstop = () => { };
      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      if (navigator.vibrate) navigator.vibrate(50);
      if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
      onTyping?.(false);
    } catch (err) { alert("Erro microfone."); }
  };

  const handleStopAndSend = async () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.onstop = async () => {
      clearInterval(timerRef.current);
      const finalMimeType = mediaRecorder.current?.mimeType || mimeType || 'video/webm';
      const fileExt = finalMimeType.includes('video/mp4') || finalMimeType.includes('audio/mp4') ? 'mp4' : 'webm';
      const mediaBlob = new Blob(mediaChunks.current, { type: finalMimeType });

      const type = finalMimeType.startsWith('video') ? 'video' : 'audio';
      const tempUrl = URL.createObjectURL(mediaBlob);
      const localId = `temp-${Date.now()}`;

      // Se estiver visualizando histórico, recarregar o chat live ao enviar
      if (isViewingHistory && onReloadLatest) {
        onReloadLatest();
      }

      let metadata: MediaMetadata = { size: mediaBlob.size };
      if (type === 'video') {
        try {
          const vidMeta = await getVideoMetadata(mediaBlob as File);
          metadata.width = vidMeta.width;
          metadata.height = vidMeta.height;
          metadata.duration = vidMeta.duration;
        } catch (e) {
          console.error("Erro ao obter metadados do vídeo gravado:", e);
          metadata.width = 720;
          metadata.height = 1280;
        }
      }

      onSendMessage(tempUrl, type, replyingTo?.id, metadata, localId);

      // Upload real (Simplificado para manter no componente filho por agora ou mover)
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
      try {
        const { error } = await supabase.storage.from('CapyBook').upload(`chat-media/${fileName}`, mediaBlob, {
          contentType: finalMimeType,
          cacheControl: '3600',
          upsert: false
        });
        if (error) throw error;
        const { data } = supabase.storage.from('CapyBook').getPublicUrl(`chat-media/${fileName}`);
        if (data) {
          onSendMessage(data.publicUrl, type, replyingTo?.id, metadata, localId);
        }
      } catch (e) { console.error("Erro upload gravação:", e); }

      onCancelReply();
      mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
    };
    mediaRecorder.current.stop();
  };

  const handleCancelRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    mediaChunks.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSendText = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim()) {
      // --- INTERCEPTOR DE COMANDO /deploy ---
      if (inputText.startsWith('/deploy')) {
        const parts = inputText.split(' ');
        // Esperado: /deploy [version] [url]
        if (parts.length >= 3) {
          const version = parts[1];
          const url = parts[2];

          // Inserir na tabela app_releases
          supabase.from('app_releases').insert([
            { version: version, download_url: url }
          ]).then(({ error }) => {
            if (error) {
              alert(`Erro ao lançar deploy: ${error.message}`);
            } else {
              alert(`Deployment v${version} lançado com sucesso!`);
            }
          });
        } else {
          alert("Formato inválido. Use: /deploy [version] [url]");
        }

        // Limpar input e não enviar como mensagem
        setInputText('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
        onTyping?.(false);
        return;
      }
      // ---------------------------------------

      // Se estiver visualizando histórico, recarregar o chat live ao enviar
      if (isViewingHistory && onReloadLatest) {
        onReloadLatest();
      }

      const replyId = replyingTo?.id; // Capture ID before cleanup
      onSendMessage(inputText, 'text', replyId);
      setInputText('');
      // Force focus back to input to keep keyboard open
      textareaRef.current?.focus();

      onCancelReply();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
      onTyping?.(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(e); } };

  return (
    // FIX: style calculation uses Math.max to prevent zero padding on desktop
    <footer className="flex-shrink-0 bg-black border-t border-zinc-800/50 z-20 relative pt-2 px-2.5 pb-2 md:pb-3.5 transform-gpu" style={{ paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 0.4rem), 1rem)' }}>
      {replyingTo && !isRecording && (
        <div className="max-w-4xl mx-auto mb-2 bg-[#1c1c1e] border-l-4 border-blue-500 rounded-r-lg p-2.5 flex justify-between items-center shadow-lg animate-in slide-in-from-bottom-2 duration-200">
          <div className="overflow-hidden flex-1"><p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Respondendo</p><p className="text-[12px] text-zinc-300 line-clamp-1 font-serif italic">{replyingTo.text || 'Mídia'}</p></div>
          <button onClick={onCancelReply} className="w-6 h-6 flex items-center justify-center text-zinc-500 bg-white/5 rounded-full"><i className="fa-solid fa-xmark text-xs"></i></button>
        </div>
      )}
      {!isRecording && (
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide mb-2 px-1">
          {recentEmojis.map((e: string) => (
            <button key={e} onClick={() => { setInputText(p => p + e); onEmojiUsed(e); }} className="w-9 h-9 shrink-0 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 rounded-full text-lg transition-colors border border-white/5 shadow-sm">{e}</button>
          ))}
        </div>
      )}
      <div className={`max-w-4xl mx-auto flex items-end gap-2 bg-[#1c1c1e] rounded-[22px] px-2.5 py-1.5 shadow-xl border border-white/5 ${isRecording ? 'border-red-500/30' : ''}`}>
        {!isRecording ? (
          <>
            <button ref={emojiButtonRef} onClick={() => setShowEmojis(!showEmojis)} className="w-9 h-9 flex-shrink-0 text-blue-500 flex items-center justify-center rounded-full"><i className="fa-solid fa-face-smile text-xl"></i></button>
            <button onClick={onFileClick} className="w-9 h-9 flex-shrink-0 text-blue-500 flex items-center justify-center rounded-full"><i className="fa-solid fa-paperclip text-xl"></i></button>
            <textarea ref={textareaRef} value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Mande um carinho..." className="flex-1 bg-transparent border-none focus:ring-0 outline-none focus:outline-none text-white text-[15px] py-2 font-serif placeholder-zinc-500 resize-none max-h-[110px] overflow-y-auto custom-scrollbar leading-snug" rows={1} />
            <div className="w-[1px] h-6 bg-zinc-800/50 mb-1.5 mx-0.5"></div>
            {inputText.trim() ? (
              <button onClick={handleSendText} className="w-9 h-9 mb-0 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform flex-shrink-0 shadow-lg"><i className="fa-solid fa-paper-plane text-[10px]"></i></button>
            ) : (
              <button onClick={handleStartRecording} className="w-9 h-9 mb-0 text-zinc-500 flex items-center justify-center rounded-full active:scale-90 flex-shrink-0 hover:text-red-500 transition-colors"><i className="fa-solid fa-microphone text-lg"></i></button>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-between h-9 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
              <span className="text-white font-mono text-sm tracking-widest">{formatTime(recordingTime)}</span>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black hidden md:block">Gravando...</p>
            <div className="flex items-center gap-3">
              <button onClick={handleCancelRecording} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors px-2">Cancelar</button>
              <button onClick={handleStopAndSend} className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"><i className="fa-solid fa-paper-plane text-[10px]"></i></button>
            </div>
          </div>
        )}
      </div>
      {showEmojis && !isRecording && <div ref={emojiPickerRef} className="absolute bottom-full left-2 mb-2 z-40 shadow-2xl rounded-2xl overflow-hidden border border-zinc-700">
        <EmojiPicker
          onEmojiClick={(d) => {
            setInputText(p => p + d.emoji);
            onEmojiUsed(d.emoji);
          }}
          theme={Theme.DARK} width={280} height={320} previewConfig={{ showPreview: false }}
        />
      </div>}
    </footer>
  );
});

// --- Componente Principal ---

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages, partner, onSendMessage, onMarkAsRead, onNavigateToProfile, onLockApp, currentUserId,
  isPartnerTyping, onTyping, onEditMessage, onDeleteMessage, onReactMessage,
  onLoadMore, onLoadNext, hasMore, hasNewer, isLoadingMore, isLoadingNext,
  isViewingHistory, newLiveCount, onJumpToMessage, onReloadLatest, regime = 'autor',
  isSleepModeActive = false
}) => {
  const [showRegimeBanner, setShowRegimeBanner] = useState(false);
  const prevRegimeRef = useRef(regime);

  useEffect(() => {
    if (prevRegimeRef.current !== regime) {
      setShowRegimeBanner(true);
      const timer = setTimeout(() => setShowRegimeBanner(false), 5000);
      prevRegimeRef.current = regime;
      return () => clearTimeout(timer);
    }
  }, [regime]);

  const isMusaRegime = regime === 'musa';
  const isPartnerLeader = (isMusaRegime && partner.id === MUSA_ID) || (!isMusaRegime && partner.id === AUTOR_ID);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showLoveAnimation, setShowLoveAnimation] = useState(false);

  // Emojis Recentes State
  const [recentEmojis, setRecentEmojis] = useState<string[]>(DEFAULT_EMOJIS);

  // Wallpaper State & Persistence
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(() => localStorage.getItem('capy_wallpaper_url') || '');
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(() => Number(localStorage.getItem('capy_wallpaper_opacity')) || 30);
  const [showWallpaperSelector, setShowWallpaperSelector] = useState(false);
  const [wallpaperTab, setWallpaperTab] = useState<'presets' | 'gallery' | 'upload'>('presets');

  const wallpaperUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('capy_wallpaper_url', wallpaperUrl);
  }, [wallpaperUrl]);

  useEffect(() => {
    localStorage.setItem('capy_wallpaper_opacity', wallpaperOpacity.toString());
  }, [wallpaperOpacity]);

  const WALLPAPER_OPTIONS = [
    { name: 'Dark Academia', url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1288&auto=format&fit=crop' },
    { name: 'Old Books', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1328&auto=format&fit=crop' },
    { name: 'Starry Night', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1342&auto=format&fit=crop' },
    { name: 'Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1287&auto=format&fit=crop' },
    { name: 'Plain Dark', url: '' }
  ];

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isJumpingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const lastScrollHeightRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const isInitialLoad = useRef(true);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lastAnalyzedMsgRef = useRef<string | null>(null);
  const isPaginatingNextRef = useRef(false);

  const isPaginatingOlderRef = useRef(false);
  const isPaginatingNewerRef = useRef(false);

  const handleLoadMore = useCallback(() => {
    isPaginatingOlderRef.current = true;
    lastScrollHeightRef.current = scrollRef.current?.scrollHeight || 0;
    onLoadMore();
  }, [onLoadMore]);

  const handleLoadNext = useCallback(() => {
    isPaginatingNewerRef.current = true;
    onLoadNext();
  }, [onLoadNext]);

  const [internalSleepMode, setInternalSleepMode] = useState(() => {
    const expiry = localStorage.getItem('capy_sleep_mode_expiry');
    return expiry ? Date.now() < parseInt(expiry) : false;
  });

  // Detection useEffect
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.type !== 'text' || !lastMsg.text) return;

    const SLEEP_REGEX = /boa noite|partiu dormir|vou mimi|durma bem/i;
    const WAKE_REGEX = /bom dia|acordei/i;

    if (SLEEP_REGEX.test(lastMsg.text)) {
      const expiry = Date.now() + 5 * 60 * 1000;
      localStorage.setItem('capy_sleep_mode_expiry', expiry.toString());
      setInternalSleepMode(true);
    } else if (WAKE_REGEX.test(lastMsg.text)) {
      localStorage.removeItem('capy_sleep_mode_expiry');
      setInternalSleepMode(false);
    }
  }, [messages]);

  // Persistence Timer
  useEffect(() => {
    const checkExpiry = () => {
      const expiry = localStorage.getItem('capy_sleep_mode_expiry');
      if (expiry) {
        if (Date.now() > parseInt(expiry)) {
          localStorage.removeItem('capy_sleep_mode_expiry');
          setInternalSleepMode(false);
        } else {
          setInternalSleepMode(true);
        }
      }
    };

    const timer = setInterval(checkExpiry, 5000);
    return () => clearInterval(timer);
  }, []);

  const pendingJumpId = useRef<string | null>(null);

  // Ref para guardar o ID da última mensagem renderizada anteriormente
  const previousLastMsgIdRef = useRef<string | null>(null);

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);

  // Carregar Emojis ao montar
  useEffect(() => {
    setRecentEmojis(loadRecentEmojis());
  }, []);

  // Handler para atualizar emojis (LRU)
  const handleEmojiUsage = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const newSet = new Set([emoji, ...prev]);
      const newList = Array.from(newSet).slice(0, 15);
      localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);


  const [dbGalleryImages, setDbGalleryImages] = useState<Message[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  useEffect(() => {
    if (wallpaperTab === 'gallery' && showWallpaperSelector) {
      const fetchGallery = async () => {
        setIsLoadingGallery(true);
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('type', 'image')
            .is('is_deleted', false)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Unicidade garantida por ID
          setDbGalleryImages(data || []);
        } catch (err) {
          console.error("Erro ao buscar galeria:", err);
        } finally {
          setIsLoadingGallery(false);
        }
      };
      fetchGallery();
    }
  }, [wallpaperTab, showWallpaperSelector]);

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    // Remove leading slash if present
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${STORAGE_URL}/${cleanUrl}`;
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !isUploading) {
      try {
        setIsUploading(true);
        setUploadProgress(0);

        const fileExt = 'webp';
        const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
        const filePath = `wallpapers/${fileName}`;

        // Simulação de progresso (já que o supabase js não tem hook nativo simples para .upload)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => prev < 90 ? prev + 10 : prev);
        }, 100);

        const { error: uploadError } = await supabase.storage.from('CapyBook').upload(filePath, file, {
          contentType: 'image/webp',
          upsert: true
        });

        clearInterval(progressInterval);
        if (uploadError) throw uploadError;

        setUploadProgress(100);
        const { data } = supabase.storage.from('CapyBook').getPublicUrl(filePath);
        if (data) {
          setWallpaperUrl(data.publicUrl);
        }
      } catch (err) {
        console.error("Erro no upload do wallpaper:", err);
        alert("Erro ao carregar o papel de parede.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Removido useMemo antigo de galleryImages pois agora usamos dbGalleryImages

  // --- FILTRO PARA MENSAGENS EXCLUÍDAS ---
  const visibleMessages = useMemo(() => {
    return messages.filter(msg => {
      // Se a mensagem não está excluída, mostra para todos
      if (!msg.is_deleted) return true;

      // Se está excluída, só mostra se fui EU que enviei (para ver o placeholder)
      // Se foi o parceiro que enviou e excluiu, ela some completamente
      return msg.sender_id === currentUserId;
    });
  }, [messages, currentUserId]);
  // -------------------------------------------------------

  useEffect(() => {
    if (visibleMessages.length === 0) return;
    const lastMsg = visibleMessages[visibleMessages.length - 1];
    if (lastMsg.id !== lastAnalyzedMsgRef.current && lastMsg.type === 'text' && lastMsg.text) {
      lastAnalyzedMsgRef.current = lastMsg.id;
      const lovePattern = /(te\s+amo|amo\s+(voce|você|vc))/i;
      if (lovePattern.test(lastMsg.text)) setShowLoveAnimation(true);
    }
  }, [visibleMessages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Trigger Load More (Older Messages)
    if (!isLoadingMore && !isJumpingRef.current && hasMore && scrollTop < 100) {
      handleLoadMore();
    }

    const atBottom = scrollHeight - scrollTop - clientHeight < 150;
    isAtBottomRef.current = atBottom;

    if (atBottom) {
      setShowScrollBottom(false);
      if (!isViewingHistory) setNewMessagesCount(0);
      if (hasNewer && !isLoadingNext) {
        handleLoadNext();
      }
    } else {
      setShowScrollBottom(true);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !isLoadingMore && !isJumpingRef.current) {
        handleLoadMore();
      }
    }, { threshold: 0.1 });

    if (sentinelRef.current) observer.observe(sentinelRef.current);

    const bottomObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNewer && !isLoadingNext && !isJumpingRef.current) {
        handleLoadNext();
      }
    }, { threshold: 0.1 });

    if (bottomSentinelRef.current) bottomObserver.observe(bottomSentinelRef.current);

    return () => {
      observer.disconnect();
      bottomObserver.disconnect();
    };
  }, [hasMore, hasNewer, isLoadingMore, isLoadingNext, handleLoadMore, handleLoadNext]);

  const scrollToBottom = useCallback(async (behavior: ScrollBehavior = 'smooth') => {
    if (isViewingHistory && onReloadLatest) {
      setSearchQuery(''); setSearchResults([]); setHighlightedMessageId(null); await onReloadLatest();
      setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: 9999999, behavior }); }, 100);
    } else if (scrollRef.current) { scrollRef.current.scrollTo({ top: 9999999, behavior }); }
    setNewMessagesCount(0); setShowScrollBottom(false); isAtBottomRef.current = true;
  }, [isViewingHistory, onReloadLatest]);

  const scrollToMessage = useCallback((id: string) => {
    if (!scrollRef.current) return;
    const attemptScroll = () => {
      const element = scrollRef.current?.querySelector(`[data-id="${id}"]`);
      if (element) { element.scrollIntoView({ behavior: 'auto', block: 'center' }); setHighlightedMessageId(id); setTimeout(() => setHighlightedMessageId(null), 2500); if (navigator.vibrate) navigator.vibrate(20); return true; }
      return false;
    };
    if (!attemptScroll()) setTimeout(attemptScroll, 100);
  }, []);

  useLayoutEffect(() => {
    if (pendingJumpId.current && scrollRef.current) {
      const targetId = pendingJumpId.current;
      const element = scrollRef.current.querySelector(`[data-id="${targetId}"]`);

      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'center' });

        setHighlightedMessageId(targetId);
        setTimeout(() => setHighlightedMessageId(null), 2500);

        if (navigator.vibrate) navigator.vibrate(20);

        pendingJumpId.current = null;
        setTimeout(() => { isJumpingRef.current = false; }, 500);
      }
    }
  }, [visibleMessages]);

  useEffect(() => {
    // FIX PARA CAPACITOR WEB E TIPAGEM
    if (!Capacitor.isNativePlatform()) return;

    let s1: PluginListenerHandle;
    let s2: PluginListenerHandle;

    const setupListeners = async () => {
      const onShow = () => {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      };

      s1 = await Keyboard.addListener('keyboardWillShow', onShow);
      s2 = await Keyboard.addListener('keyboardDidShow', onShow);
    };

    setupListeners();

    return () => {
      // O Capacitor remove via método .remove() da própria handle
      if (s1) s1.remove();
      if (s2) s2.remove();
    };
  }, []);

  useEffect(() => {
    if (isInitialLoad.current || isViewingHistory) return;
    const lastMsg = visibleMessages[visibleMessages.length - 1];
    if (lastMsg?.sender_id !== currentUserId) {
      if (!isAtBottomRef.current) {
        setNewMessagesCount(prev => prev + 1);
        setShowScrollBottom(true);
      }
    }
  }, [visibleMessages.length, isViewingHistory, currentUserId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (isInitialLoad.current || isAtBottomRef.current) {
        if (!isJumpingRef.current) scrollToBottom('auto');
      }
    });
    resizeObserver.observe(scrollRef.current);

    setTimeout(() => {
      if (isInitialLoad.current && scrollRef.current) {
        scrollToBottom('auto');
        isInitialLoad.current = false;
      }
    }, 100);

    return () => resizeObserver.disconnect();
  }, [visibleMessages.length, scrollToBottom]);

  useLayoutEffect(() => {
    if (isLoadingMore || isLoadingNext) return;
    if (visibleMessages.length === 0) return;

    if (scrollRef.current) {
      if (isPaginatingOlderRef.current && lastScrollHeightRef.current > 0) {
        // --- ANCORAGEM PARA CIMA (MENSAGENS ANTIGAS) ---
        const container = scrollRef.current;
        const lastHeight = lastScrollHeightRef.current;
        const newHeight = container.scrollHeight;
        const diff = newHeight - lastHeight;

        if (diff > 0) {
          container.scrollTop = diff;
        }

        isPaginatingOlderRef.current = false;
        lastScrollHeightRef.current = 0;
      } else if (!isInitialLoad.current) {
        // --- NOVAS MENSAGENS OU PAGINAÇÃO PARA BAIXO ---
        const lastMsg = visibleMessages[visibleMessages.length - 1];
        const prevLastId = previousLastMsgIdRef.current;
        previousLastMsgIdRef.current = lastMsg?.id;

        if (lastMsg) {
          const isNewMessage = lastMsg.id !== prevLastId;
          const isFromMe = lastMsg.sender_id === currentUserId;

          if (isNewMessage) {
            // Se for paginação (onLoadNext), não auto-scrollamos para o fim
            if (isPaginatingNewerRef.current) {
              isPaginatingNewerRef.current = false;
            } else {
              // Somente auto-scroll se for mensagem minha ou se eu já estivesse no fundo (auto-follow)
              // Ignoramos a trava de histórico se for mensagem minha
              const shouldFollow = isFromMe || isAtBottomRef.current;

              if (shouldFollow && !isJumpingRef.current) {
                requestAnimationFrame(() => scrollToBottom('smooth'));
              }
            }
          }
        }
      }
    }
  }, [visibleMessages.length, isLoadingMore, isLoadingNext, currentUserId, scrollToBottom, isViewingHistory]);

  const renderStatus = (msg: Message) => {
    if (msg.sender_id !== currentUserId) return null;
    if (msg.is_pending) return <i className="fa-solid fa-clock text-[10px] text-zinc-500 animate-pulse"></i>;
    if (msg.read_at) return <i className="fa-solid fa-check-double text-[11px] text-blue-500"></i>;
    if (msg.delivered_at) return <i className="fa-solid fa-check-double text-[11px] text-zinc-400"></i>;
    return <i className="fa-solid fa-check text-[11px] text-zinc-600"></i>;
  };

  const handleUploadMedia = async (file: File | Blob, type: 'image' | 'video' | 'audio' | 'document', metadata: MediaMetadata, tempUrl: string) => {
    // Usando um ID temporário único para evitar colisões
    const localId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const replyId = replyingTo?.id;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 1. Enviar mensagem otimista IMEDIATAMENTE com URL local
      if (isViewingHistory && onReloadLatest) {
        onReloadLatest();
      }
      onSendMessage(tempUrl, type, replyId, metadata, localId);
      setReplyingTo(null);

      // 2. Preparar Upload
      const fileExt = type === 'image' ? 'webp' : (file instanceof File ? file.name.split('.').pop() : (type === 'video' ? 'webm' : 'audio/webm'));
      const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
      const filePath = `chat-media/${fileName}`;
      const contentType = type === 'image' ? 'image/webp' : (file instanceof File ? file.type : (type === 'video' ? 'video/webm' : 'audio/webm'));

      // 3. Upload com Progresso
      const { error: uploadError } = await supabase.storage.from('CapyBook').upload(filePath, file, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('CapyBook').getPublicUrl(filePath);
      if (data) {
        // Enviar a confirmação com o mesmo localId para que o App.tsx substitua corretamente
        onSendMessage(data.publicUrl, type, replyId, metadata, localId);
      }
    } catch (err) {
      console.error("Erro no upload:", err);
      alert("Erro ao carregar o arquivo.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.removeItem('capy_is_selecting_file');
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      let type: 'image' | 'video' | 'audio' | 'document' = 'document';
      let metadata: MediaMetadata = { size: file.size, mimeType: file.type };

      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        type = 'image';
        const compressed = await compressImage(file);
        const tempUrl = URL.createObjectURL(compressed.blob);
        metadata.width = compressed.width;
        metadata.height = compressed.height;
        await handleUploadMedia(compressed.blob, type, metadata, tempUrl);
      } else if (['mp4', 'webm', 'mov', 'avi'].includes(fileExt)) {
        type = 'video';
        const vidMeta = await getVideoMetadata(file);
        metadata.width = vidMeta.width;
        metadata.height = vidMeta.height;
        metadata.duration = vidMeta.duration;
        const tempUrl = URL.createObjectURL(file);
        await handleUploadMedia(file, type, metadata, tempUrl);
      } else {
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(fileExt)) type = 'audio';
        const tempUrl = URL.createObjectURL(file);
        await handleUploadMedia(file, type, metadata, tempUrl);
      }
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      alert("Falha ao processar mídia. Verifique as permissões do dispositivo.");
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length <= 2) {
        setSearchResults([]);
        return;
      }

      setIsSearchingDb(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .ilike('text', `%${searchQuery}%`)
          .or(`sender_id.eq.${AUTOR_ID},sender_id.eq.${MUSA_ID}`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error("Erro na busca:", err);
      } finally {
        setIsSearchingDb(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchResultClick = async (msg: Message) => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);

    isJumpingRef.current = true;
    isAtBottomRef.current = false;

    const isAlreadyVisible = visibleMessages.some(m => m.id === msg.id);

    if (isAlreadyVisible) {
      scrollToMessage(msg.id);
      setTimeout(() => { isJumpingRef.current = false; }, 500);
    } else {
      pendingJumpId.current = msg.id;
      if (onJumpToMessage) {
        await onJumpToMessage(msg);
      }
    }
  };

  const handleStartReply = useCallback((msg: Message) => {
    if (!msg) return;
    setReplyingTo(msg);
  }, []);

  const statusLabel = useMemo(() => {
    if (!partner.last_seen) return 'visto recentemente';
    const last = new Date(partner.last_seen);
    const today = new Date().toDateString() === last.toDateString();
    const timeStr = last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return today ? `visto hoje às ${timeStr}` : `visto em ${last.toLocaleDateString('pt-BR')} às ${timeStr}`;
  }, [partner.last_seen]);

  const isOnline = useMemo(() => {
    if (partner.status === 'online') return true;
    if (partner.last_seen) {
      const diff = now - new Date(partner.last_seen).getTime();
      return diff < 15000;
    }
    return false;
  }, [partner.status, partner.last_seen, now]);

  return (
    <div
      className="flex flex-col h-full w-full relative bg-[#000000] overflow-hidden"
      style={{ '--wallpaper-opacity': wallpaperOpacity / 100 } as React.CSSProperties}
    >
      {/* Background Wallpaper Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          {wallpaperUrl ? (
            <motion.img
              key={wallpaperUrl}
              src={wallpaperUrl}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: Number(wallpaperOpacity) / 100, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <motion.div
              key="plain-dark"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
            />
          )}
        </AnimatePresence>
        {/* Subtle Overlay to ensure readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
      </div>

      <AnimatePresence>
        {(isSleepModeActive || internalSleepMode) && <SleepOverlay />}
      </AnimatePresence>
      <header className="flex-shrink-0 h-20 bg-black border-b border-zinc-900 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={partner.avatar_url || `${STORAGE_URL}/lizzie.jpg`} className={`w-14 h-14 rounded-full border border-zinc-800 object-cover shadow-sm transition-all duration-700 ${isPartnerLeader ? 'ring-2 ring-[#c2a182] ring-offset-2 ring-offset-black scale-105' : ''}`} />
            {isPartnerLeader && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute -top-1.5 -right-1.5 bg-[#c2a182] text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-black z-10"
              >
                <i className="fa-solid fa-crown text-[10px]"></i>
              </motion.div>
            )}
            {isPartnerLeader && (
              <motion.div
                animate={{
                  y: [0, -4, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute -bottom-1 -left-1 text-lg pointer-events-none"
              >
                🦦
              </motion.div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-display font-bold text-white text-lg truncate leading-tight">{partner.name}</h2>
              {isPartnerLeader && (
                <span className="bg-[#c2a182]/20 text-[#c2a182] text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#c2a182]/30 uppercase tracking-tighter">Líder</span>
              )}
            </div>
            <div className={`text-[10px] uppercase font-black tracking-widest transition-colors duration-500 flex items-center h-4 ${isPartnerTyping || isOnline ? 'text-blue-500' : 'text-zinc-500'}`}>
              {isPartnerTyping ? <TypingIndicator /> : isOnline ? 'Online' : statusLabel}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {isUploading && (
            <div className="flex items-center gap-2 mr-3 my-auto">
              <span className="text-[10px] text-blue-500 font-mono">{uploadProgress}%</span>
              <i className="fa-solid fa-spinner animate-spin text-blue-500 text-xs"></i>
            </div>
          )}
          <button onClick={() => setIsSearching(true)} className="w-12 h-12 rounded-full bg-zinc-900 text-blue-500 border border-zinc-800 active:scale-95 flex items-center justify-center" title="Pesquisar">
            <i className="fa-solid fa-magnifying-glass text-lg"></i>
          </button>

          <button
            onClick={onLockApp}
            className="w-12 h-12 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 active:scale-95 flex items-center justify-center hover:text-red-500 hover:border-red-500/30 transition-colors"
            title="Bloquear"
          >
            <i className="fa-solid fa-power-off text-lg"></i>
          </button>

          <button onClick={() => setShowWallpaperSelector(true)} className="w-12 h-12 rounded-full bg-zinc-900 text-blue-500 border border-zinc-800 active:scale-95 flex items-center justify-center" title="Papel de Parede">
            <i className="fa-solid fa-image text-lg"></i>
          </button>

          <button onClick={onNavigateToProfile} className="w-12 h-12 rounded-full bg-zinc-900 text-blue-500 border border-zinc-800 active:scale-95 flex items-center justify-center relative" title="Perfil">
            <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
            {!isPartnerLeader && (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 text-sm pointer-events-none"
              >
                👑
              </motion.div>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showRegimeBanner && <RegimeBanner regime={regime} />}
      </AnimatePresence>

      {isSearching && (
        <div className="absolute inset-0 z-[60] bg-black/98 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col">
          <div className="h-13 flex items-center gap-3 px-3 border-b border-zinc-900">
            <button onClick={() => setIsSearching(false)} className="text-blue-500"><i className="fa-solid fa-arrow-left"></i></button>
            <input ref={searchInputRef} autoFocus type="text" placeholder="Pesquisar mensagens..." className="flex-1 bg-transparent border-none text-white placeholder-zinc-700 focus:ring-0 outline-none focus:outline-none text-sm font-serif" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
            {isSearchingDb && <i className="fa-solid fa-circle-notch animate-spin text-blue-500 text-xs"></i>}
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <AnimatePresence mode="wait">
              {searchQuery.length > 0 && searchQuery.length <= 2 ? (
                <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-zinc-600 text-xs font-serif italic mt-10">
                  Digite pelo menos 3 caracteres...
                </motion.p>
              ) : searchResults.length === 0 && searchQuery.length > 2 && !isSearchingDb ? (
                <motion.p key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-zinc-700 text-xs font-serif italic mt-10">
                  Nenhuma mensagem encontrada
                </motion.p>
              ) : (
                <motion.div key="results" variants={searchContainerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-2.5">
                  {searchResults.map(msg => (
                    <motion.div
                      key={msg.id}
                      variants={searchItemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => handleSearchResultClick(msg)}
                      className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 active:scale-95 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{msg.sender_id === currentUserId ? 'Você' : partner.name}</span><span className="text-[8px] text-zinc-600">{new Date(msg.created_at).toLocaleDateString('pt-BR')}</span></div>
                      <p className="text-[12px] text-zinc-300 font-serif line-clamp-2">{renderMessageText(msg.text!, msg.sender_id === currentUserId, searchQuery)}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-hide relative"
        style={{ overflowAnchor: 'none' }}
      >
        <div ref={sentinelRef} className="h-1" />

        {isLoadingMore && (
          <div className="absolute top-2 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="bg-black/60 rounded-full p-1 shadow-md backdrop-blur-sm">
              <i className="fa-solid fa-circle-notch animate-spin text-blue-500 text-[10px]"></i>
            </div>
          </div>
        )}

        {isViewingHistory && !isLoadingMore && <div className="flex items-center justify-center py-1.5 animate-in fade-in duration-500"><span className="px-3 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] text-blue-500 font-black uppercase tracking-widest shadow-sm">Histórico</span></div>}

        <motion.div
          className="contents"
          variants={containerVariants}
          initial={isInitialLoad.current ? "hidden" : "visible"}
          animate="visible"
        >
          {visibleMessages.map((msg, i) => {
            const prevMsg = i > 0 ? visibleMessages[i - 1] : null;
            const showDivider = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDivider && <DateDivider date={msg.created_at} />}
                <MessageItem
                  msg={msg} isMe={msg.sender_id === currentUserId} currentUserId={currentUserId} partner={partner} isMenuOpen={menuOpenId === msg.id} isEditing={editingId === msg.id} index={i}
                  onReactMessage={(id, emoji) => {
                    onReactMessage(id, emoji);
                    handleEmojiUsage(emoji);
                  }}
                  onDeleteMessage={onDeleteMessage} onEditMessage={onEditMessage} onStartReply={handleStartReply} onSetMenuOpen={setMenuOpenId} onSetEditing={setEditingId} onPreviewImage={setPreviewImage}
                  renderReplyContext={(id, me) => {
                    const replyMsg = visibleMessages.find(m => m.id === id);
                    if (!id || !replyMsg) return null;
                    return <div onClick={(e) => { e.stopPropagation(); scrollToMessage(id); }} className={`mb-1.5 p-1.5 rounded-md border-l-2 bg-black/20 text-[11px] font-serif italic line-clamp-2 max-w-[190px] cursor-pointer border-white/40 text-white/80 active:scale-95 transform-gpu`}>{replyMsg.text || 'figurinha'}</div>;
                  }}
                  renderStatus={renderStatus} onMediaLoad={() => { if (isAtBottomRef.current || isInitialLoad.current) scrollToBottom(isInitialLoad.current ? 'auto' : 'smooth'); }} searchQuery={searchQuery} isHighlighted={highlightedMessageId === msg.id}
                />
              </React.Fragment>
            );
          })}
        </motion.div>
        {isLoadingNext && <div className="text-center py-1.5"><i className="fa-solid fa-circle-notch animate-spin text-blue-500 text-[10px]"></i></div>}
        <div ref={bottomSentinelRef} className="h-1" />
      </div>

      {showScrollBottom && (
        <button onClick={() => scrollToBottom('smooth')} className={`absolute ${replyingTo ? 'bottom-40' : 'bottom-24'} right-5 z-40 bg-zinc-800 text-white w-9 h-9 rounded-full shadow-2xl border border-zinc-700 flex items-center justify-center animate-bounce transition-all active:scale-90`}>
          <div className="relative">{isViewingHistory ? <i className="fa-solid fa-angles-down text-xs"></i> : <i className="fa-solid fa-chevron-down text-xs"></i>}{(isViewingHistory ? (newLiveCount > 0) : (newMessagesCount > 0)) && <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black animate-in zoom-in">{isViewingHistory ? (newLiveCount > 9 ? '+9' : newLiveCount) : (newMessagesCount > 9 ? '+9' : newMessagesCount)}</span>}</div>
        </button>
      )}

      <input type="file" ref={imageInputRef} onChange={handleFileSelect} className="hidden" />
      <ChatInputFooter
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        partnerName={partner.name}
        currentUserId={currentUserId}
        onFileClick={() => {
          localStorage.setItem('capy_is_selecting_file', 'true');
          imageInputRef.current?.click();
        }}
        recentEmojis={recentEmojis}
        onEmojiUsed={handleEmojiUsage}
        isViewingHistory={isViewingHistory}
        onReloadLatest={onReloadLatest}
      />

      {/* Wallpaper Selector Modal */}
      <AnimatePresence>
        {showWallpaperSelector && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWallpaperSelector(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-serif font-bold text-white">Personalizar Fundo</h3>
                  <button onClick={() => setShowWallpaperSelector(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white transition-colors">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                  {(['presets', 'gallery', 'upload'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setWallpaperTab(tab)}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${wallpaperTab === tab ? 'bg-blue-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {tab === 'presets' ? 'Padrões' : tab === 'gallery' ? 'Galeria' : 'Upload'}
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  {/* Selector Content */}
                  <div className="max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                    {wallpaperTab === 'presets' && (
                      <div className="grid grid-cols-2 gap-3 pb-2">
                        {WALLPAPER_OPTIONS.map((opt) => (
                          <button
                            key={opt.name}
                            onClick={() => setWallpaperUrl(opt.url)}
                            className={`group relative aspect-video rounded-2xl overflow-hidden border-2 transition-all ${wallpaperUrl === opt.url ? 'border-blue-500 scale-[0.98]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          >
                            {opt.url ? (
                              <img src={opt.url} className="w-full h-full object-cover" alt={opt.name} />
                            ) : (
                              <div className="w-full h-full bg-black flex items-center justify-center border border-white/5">
                                <i className="fa-solid fa-ban text-zinc-700"></i>
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/90">{opt.name}</p>
                            </div>
                            {wallpaperUrl === opt.url && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                <i className="fa-solid fa-check text-[10px] text-white"></i>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {wallpaperTab === 'gallery' && (
                      <div className="grid grid-cols-3 gap-2 pb-2">
                        {isLoadingGallery ? (
                          <div className="col-span-3 py-10 flex flex-col items-center justify-center gap-3">
                            <i className="fa-solid fa-circle-notch animate-spin text-blue-500"></i>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Buscando na nuvem...</span>
                          </div>
                        ) : dbGalleryImages.length === 0 ? (
                          <div className="col-span-3 py-10 text-center text-zinc-600 italic text-xs font-serif">Nenhuma imagem no histórico</div>
                        ) : (
                          dbGalleryImages.map((msg) => (
                            <button
                              key={msg.id}
                              onClick={() => setWallpaperUrl(getFullUrl(msg.text!))}
                              className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${wallpaperUrl === getFullUrl(msg.text!) ? 'border-blue-500 scale-95' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                              <img src={getFullUrl(msg.text!)} className="w-full h-full object-cover" alt="Chat Gallery" />
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {wallpaperTab === 'upload' && (
                      <div
                        className={`py-8 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-white/5 group transition-all relative overflow-hidden ${isUploading ? 'border-blue-500 cursor-wait' : 'border-white/10 hover:border-blue-500/50 cursor-pointer'}`}
                        onClick={() => !isUploading && wallpaperUploadRef.current?.click()}
                      >
                        <input type="file" ref={wallpaperUploadRef} className="hidden" accept="image/*" onChange={handleWallpaperUpload} />

                        {isUploading ? (
                          <>
                            <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                              <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-500 transition-all duration-300" strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - uploadProgress / 100)} />
                              </svg>
                              <span className="text-[10px] font-black font-mono text-blue-400">{uploadProgress}%</span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 animate-pulse">Enviando Arquivo...</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                              <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
                            </div>
                            <p className="text-sm font-bold text-white mb-1">Carregar Imagem</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">JPG, PNG, WEBP</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Slider de Opacidade */}
                  <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Opacidade Fundo</label>
                      <span className="text-xs font-mono text-blue-400 font-bold">{wallpaperOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={wallpaperOpacity}
                      onChange={(e) => setWallpaperOpacity(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[8px] font-black text-zinc-700 uppercase tracking-tighter">
                      <span>Invisível</span>
                      <span>Total</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/40 border-t border-white/5 flex justify-center">
                <button
                  disabled={isUploading}
                  onClick={() => setShowWallpaperSelector(false)}
                  className="px-8 py-3 bg-blue-500 disabled:opacity-50 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImage && <ImageModal url={previewImage} onClose={() => setPreviewImage(null)} />}
      </AnimatePresence>
      {showLoveAnimation && <LoveAnimation onComplete={() => setShowLoveAnimation(false)} />}
    </div>
  );
};

export default ChatInterface;
