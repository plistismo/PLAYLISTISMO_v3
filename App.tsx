import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, UserProfile } from './types';
import ChatInterface from './components/ChatInterface';
import AuthScreen from './components/AuthScreen';
import Profile from './components/Profile';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { getLatestAvatarUrl } from './services/avatarService';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import UpdateModal from './components/UpdateModal';
import { useRegime } from './hooks/useRegime';
import pkg from './package.json';

export type ViewState = 'chat' | 'profile';

export const AUTOR_ID = '00000000-0000-0000-0000-000000000001';
export const MUSA_ID = '00000000-0000-0000-0000-000000000002';

const AUTO_LOCK_TIMEOUT = 3 * 60 * 1000;
const PAGE_SIZE = 30;
const HEARTBEAT_INTERVAL = 10000;

const pageVariants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  }),
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('chat');
  const [direction, setDirection] = useState(0);
  const [isLocked, setIsLocked] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [hasNewerMessages, setHasNewerMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [newLiveMessagesCount, setNewLiveMessagesCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSleepModeActive, setIsSleepModeActive] = useState(false);

  // Update System
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null);
  const CURRENT_APP_VERSION = pkg.version;
  const { regime, isMusaTurn, leaderId } = useRegime();

  const isNewerVersion = (cleanRemote: string, cleanLocal: string) => {
    const v1 = cleanRemote.split('.').map(Number);
    const v2 = cleanLocal.split('.').map(Number);
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 > num2) return true;
      if (num1 < num2) return false;
    }
    return false;
  };

  useEffect(() => {
    const checkForUpdates = async () => {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from('app_releases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        if (isNewerVersion(data.version, CURRENT_APP_VERSION)) {
          setUpdateInfo({ version: data.version, url: data.download_url });
          setShowUpdateModal(true);
        }
      }
    };
    checkForUpdates();
  }, []);

  const channelRef = useRef<any>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partnerTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const partnerRef = useRef<UserProfile | null>(null);
  useEffect(() => { partnerRef.current = partner; }, [partner]);

  const navigateTo = (view: ViewState) => {
    if (activeView === 'chat' && view === 'profile') setDirection(1);
    else if (activeView === 'profile' && view === 'chat') setDirection(-1);
    else setDirection(1);
    setActiveView(view);
  };

  const updatePresence = useCallback(async (status: 'online' | 'offline') => {
    if (!currentUser?.id || !isSupabaseConfigured) return;
    try {
      await supabase
        .from('profiles')
        .update({
          status: status,
          last_seen: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (status === 'offline' && channelRef.current) {
        channelRef.current.untrack();
      }
    } catch (e) {
      console.debug("Status de presença falhou.");
    }
  }, [currentUser?.id]);

  const lockApp = useCallback(() => {
    if (isLocked) return;
    setIsLocked(true);
    updatePresence('offline');
  }, [isLocked, updatePresence]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (!isLocked) {
      // Feature Flag Check: Só arma o timer se a segurança estiver ATIVADA
      const securityEnabled = localStorage.getItem('capy_security_enabled') !== 'false';
      if (securityEnabled) {
        inactivityTimerRef.current = setTimeout(lockApp, AUTO_LOCK_TIMEOUT);
      }
    }
  }, [isLocked, lockApp]);

  useEffect(() => {
    if (!currentUser?.id || isLocked || activeView !== 'chat') {
      if (currentUser?.id) updatePresence('offline');
      return;
    }

    updatePresence('online');
    const interval = setInterval(() => {
      updatePresence('online');
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
      updatePresence('offline');
    };
  }, [currentUser?.id, isLocked, activeView, updatePresence]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isSelectingFile = localStorage.getItem('capy_is_selecting_file') === 'true';

      if (document.visibilityState === 'hidden') {
        if (isSelectingFile) return;
        updatePresence('offline');

        // Feature Flag Check: Só bloqueia ao minimizar se a segurança estiver ATIVADA
        const securityEnabled = localStorage.getItem('capy_security_enabled') !== 'false';
        if (securityEnabled) {
          lockApp();
        }
      } else if (document.visibilityState === 'visible') {
        setTimeout(() => localStorage.removeItem('capy_is_selecting_file'), 2000);
        if (!isLocked && activeView === 'chat') {
          updatePresence('online');
        }
      }
    };

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    const handleUserActivity = () => resetInactivityTimer();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('focus', handleUserActivity);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    resetInactivityTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('focus', handleUserActivity);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [lockApp, resetInactivityTimer, updatePresence, isLocked, activeView]);

  useEffect(() => {
    if (isOnline && currentUser && isSupabaseConfigured) {
      const syncPendingMessages = async () => {
        const pending = messages.filter(m => m.is_pending);
        if (pending.length === 0) return;

        for (const msg of pending) {
          try {
            const { error } = await supabase.from('messages').insert([{
              sender_id: currentUser.id,
              text: msg.text,
              type: msg.type,
              reply_to_id: msg.reply_to_id
            }]);

            if (!error) {
              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pending: false } : m));
            }
          } catch (e) { }
        }
      };
      syncPendingMessages();
    }
  }, [isOnline, currentUser, messages.length]);

  // Sleep Mode Logic
  useEffect(() => {
    if (messages.length < 2) {
      if (isSleepModeActive) setIsSleepModeActive(false);
      return;
    }

    const SLEEP_TRIGGERS = /boa noite|dorme|dormir|beijo|beijos/i;
    const FIVE_MINUTES = 5 * 60 * 1000;
    const THIRTY_MINUTES = 30 * 60 * 1000;

    const lastMsg = messages[messages.length - 1];

    // Se a última mensagem não tem gatilho, desativa o modo sono
    if (lastMsg.type === 'text' && lastMsg.text && !SLEEP_TRIGGERS.test(lastMsg.text)) {
      if (isSleepModeActive) setIsSleepModeActive(false);
      return;
    }

    const lastAutorMsg = [...messages].reverse().find(m => m.sender_id === AUTOR_ID && m.type === 'text');
    const lastMusaMsg = [...messages].reverse().find(m => m.sender_id === MUSA_ID && m.type === 'text');

    if (lastAutorMsg?.text && lastMusaMsg?.text) {
      const autorHasTrigger = SLEEP_TRIGGERS.test(lastAutorMsg.text);
      const musaHasTrigger = SLEEP_TRIGGERS.test(lastMusaMsg.text);

      if (autorHasTrigger && musaHasTrigger) {
        const timeDiff = Math.abs(new Date(lastAutorMsg.created_at).getTime() - new Date(lastMusaMsg.created_at).getTime());

        if (timeDiff <= FIVE_MINUTES) {
          if (!isSleepModeActive) {
            setIsSleepModeActive(true);
            // Auto-reset after 30 minutes
            const timer = setTimeout(() => setIsSleepModeActive(false), THIRTY_MINUTES);
            return () => clearTimeout(timer);
          }
        } else if (isSleepModeActive) {
          setIsSleepModeActive(false);
        }
      } else if (isSleepModeActive) {
        setIsSleepModeActive(false);
      }
    }
  }, [messages, isSleepModeActive]);

  const getDefaultPartner = (currentId: string): UserProfile => {
    const savedPartner = localStorage.getItem('capy_partner');
    if (savedPartner) {
      const parsed = JSON.parse(savedPartner) as UserProfile;
      if (parsed.id !== currentId) return parsed;
    }
    return {
      id: currentId === AUTOR_ID ? MUSA_ID : AUTOR_ID,
      name: 'Parceiro(a)',
      avatar_url: '',
      bio: '...',
      status: 'offline'
    };
  };



  useEffect(() => {
    const savedUser = localStorage.getItem('capy_active_user');
    if (savedUser && isSupabaseConfigured) {
      const user = JSON.parse(savedUser) as UserProfile;
      setCurrentUser(user);
      setPartner(getDefaultPartner(user.id));
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id && !isLocked && isSupabaseConfigured) {
      fetchMessages();
    }
  }, [currentUser?.id, isLocked]);

  const fetchLatestProfiles = useCallback(async (userId?: string) => {
    const activeId = userId || currentUser?.id;
    if (!activeId || !isSupabaseConfigured) return;
    try {
      const { data } = await supabase.from('profiles').select('*').in('id', [AUTOR_ID, MUSA_ID]);
      if (data) {
        const me = data.find(p => p.id === activeId);
        const them = data.find(p => p.id !== activeId);

        const [myLatestAvatar, theirLatestAvatar] = await Promise.all([
          getLatestAvatarUrl(activeId),
          them ? getLatestAvatarUrl(them.id) : null
        ]);

        if (me) {
          setCurrentUser(prev => {
            const current = prev || me;
            const effectiveAvatar = myLatestAvatar || me.avatar_url || current.avatar_url;
            const updated = { ...current, name: me.display_name, avatar_url: effectiveAvatar, bio: me.bio, pin: me.pin };
            localStorage.setItem('capy_active_user', JSON.stringify(updated));
            return updated;
          });
        }
        if (them) {
          setPartner(prev => {
            const base = prev || getDefaultPartner(activeId);
            const effectiveAvatar = theirLatestAvatar || them.avatar_url || base.avatar_url;
            const updatedPartner = {
              ...base,
              name: them.display_name,
              avatar_url: effectiveAvatar,
              bio: them.bio,
              status: them.status,
              last_seen: them.last_seen
            };
            localStorage.setItem('capy_partner', JSON.stringify(updatedPartner));
            return updatedPartner;
          });
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar perfis:", e);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id && !isLocked && isSupabaseConfigured) {
      fetchLatestProfiles();
    }
  }, [currentUser?.id, isLocked, fetchLatestProfiles]);

  const fetchMessages = useCallback(async (isLoadMore = false) => {
    if (!isSupabaseConfigured || !currentUser || isLoadingMore) return;
    try {
      if (isLoadMore) setIsLoadingMore(true);
      const query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (isLoadMore && messages.length > 0) {
        query.lt('created_at', messages[0].created_at);
      }

      const { data, error } = await query.limit(PAGE_SIZE);
      if (error) throw error;

      if (data) {
        const sorted = data.reverse();
        if (isLoadMore) {
          setMessages(prev => {
            const combined = [...sorted, ...prev];
            return Array.from(new Map(combined.map(m => [m.id, m])).values());
          });
        } else {
          setMessages(sorted);
          setHasNewerMessages(false);
          setIsViewingHistory(false);
          setNewLiveMessagesCount(0);
        }
        setHasMoreMessages(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    } finally {
      if (isLoadMore) setIsLoadingMore(false);
    }
  }, [currentUser, messages, isLoadingMore]);

  const fetchNextMessages = useCallback(async () => {
    if (!isSupabaseConfigured || !currentUser || isLoadingNext || !hasNewerMessages) return;
    try {
      setIsLoadingNext(true);
      const query = supabase
        .from('messages')
        .select('*')
        .gt('created_at', messages[messages.length - 1].created_at)
        .order('created_at', { ascending: true });

      const { data, error } = await query.limit(PAGE_SIZE);
      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(prev => {
          const combined = [...prev, ...data];
          return Array.from(new Map(combined.map(m => [m.id, m])).values());
        });
        setHasNewerMessages(data.length === PAGE_SIZE);
      } else {
        setHasNewerMessages(false);
        setIsViewingHistory(false);
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens posteriores:", err);
    } finally {
      setIsLoadingNext(false);
    }
  }, [currentUser, messages, isLoadingNext, hasNewerMessages]);

  const handleReloadLatest = useCallback(async () => {
    setHasNewerMessages(false);
    setIsViewingHistory(false);
    setNewLiveMessagesCount(0);
    setMessages([]);
    await fetchMessages(false);
  }, [fetchMessages]);

  const handleEditMessage = async (id: string, text: string) => {
    if (!isSupabaseConfigured) return;
    await supabase.from('messages').update({ text, is_edited: true }).eq('id', id);
  };

  const handleDeleteMessage = async (id: string) => {
    if (!isSupabaseConfigured) return;
    await supabase.from('messages').update({ is_deleted: true }).eq('id', id);
  };

  const handleReactMessage = async (id: string, emoji: string) => {
    if (!isSupabaseConfigured || !currentUser) return;
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}), [currentUser.id]: emoji };
    if (msg.reactions?.[currentUser.id] === emoji) delete reactions[currentUser.id];
    await supabase.from('messages').update({ reactions }).eq('id', id);
  };

  const handleMarkAsRead = async (id: string) => {
    if (!isSupabaseConfigured || id.startsWith('temp-')) return;
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).match({ id }).is('read_at', null);
  };

  const handleMarkAsDelivered = async (id: string) => {
    if (!isSupabaseConfigured || id.startsWith('temp-')) return;
    await supabase.from('messages').update({ delivered_at: new Date().toISOString() }).match({ id }).is('delivered_at', null);
  };

  useEffect(() => {
    if (currentUser && isSupabaseConfigured) {
      const channel = supabase.channel('room_capy_main')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMessage.id);
            if (exists) return prev;

            if (newMessage.sender_id === currentUser.id) {
              const tempIndex = prev.findIndex(m =>
                m.id.startsWith('temp-') &&
                ((newMessage.metadata?.localId && m.id === newMessage.metadata.localId) ||
                  (!newMessage.metadata?.localId && m.text === newMessage.text))
              );

              if (tempIndex !== -1) {
                const newMessages = [...prev];
                newMessages[tempIndex] = newMessage;
                return newMessages;
              }
              if (isViewingHistory) {
                handleReloadLatest();
                return prev;
              }
              return [...prev, newMessage];
            }

            if (isViewingHistory || hasNewerMessages) {
              setNewLiveMessagesCount(prevCount => prevCount + 1);
              return prev;
            }

            handleMarkAsDelivered(newMessage.id);
            return [...prev, newMessage];
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
          const updated = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
          const updated = payload.new;
          if (updated.id !== currentUser.id) {
            setPartner(prev => {
              const newState = prev ? ({ ...prev, status: updated.status, last_seen: updated.last_seen, name: updated.display_name || prev.name, avatar_url: updated.avatar_url || prev.avatar_url, bio: updated.bio || prev.bio }) : null;
              if (newState) localStorage.setItem('capy_partner', JSON.stringify(newState));
              return newState;
            });
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const partnerId = currentUser.id === AUTOR_ID ? MUSA_ID : AUTOR_ID;
          const partnerPresence = Object.values(presenceState).flat().find((p: any) => p.user_id === partnerId);

          setPartner(prev => {
            if (!prev) return prev;
            const newStatus = partnerPresence ? 'online' : 'offline';
            if (prev.status === newStatus) return prev;
            return { ...prev, status: newStatus };
          });
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.userId !== currentUser.id) {
            if (partnerTypingTimerRef.current) clearTimeout(partnerTypingTimerRef.current);

            setIsPartnerTyping(payload.isTyping);

            if (payload.isTyping) {
              partnerTypingTimerRef.current = setTimeout(() => {
                setIsPartnerTyping(false);
              }, 5000);
            }
          }
        })
        .on('broadcast', { event: 'nudge' }, ({ payload }) => { if (payload.senderId !== currentUser.id) setIsShaking(true); setTimeout(() => setIsShaking(false), 500); })
        .subscribe();

      channelRef.current = channel;
      return () => {
        supabase.removeChannel(channel);
        if (partnerTypingTimerRef.current) clearTimeout(partnerTypingTimerRef.current);
      };
    }
  }, [currentUser?.id, isLocked, isViewingHistory, hasNewerMessages, handleReloadLatest]);

  useEffect(() => {
    if (activeView === 'chat' && !isLocked && currentUser && partner && isSupabaseConfigured && document.visibilityState === 'visible') {
      const unreadMessages = messages.filter(m =>
        m.sender_id === partner.id &&
        !m.read_at &&
        !m.id.startsWith('temp-')
      );

      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(m => m.id);

        const markAsRead = async () => {
          setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m));
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);
        };
        markAsRead();
      }
    }
  }, [messages, activeView, isLocked, currentUser, partner]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !currentUser) return;

    const trackPresence = async () => {
      const shouldBeOnline = !isLocked && activeView === 'chat' && document.visibilityState === 'visible';
      if (shouldBeOnline) {
        await channel.track({ user_id: currentUser.id, online_at: new Date().toISOString() });
      } else {
        await channel.untrack();
      }
    };

    trackPresence();
    const handleActivity = () => trackPresence();
    document.addEventListener('visibilitychange', handleActivity);
    window.addEventListener('focus', handleActivity);

    return () => {
      document.removeEventListener('visibilitychange', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, [currentUser, isLocked, activeView]);

  const handleUnlock = (user: UserProfile) => {
    setCurrentUser(user);
    setPartner(getDefaultPartner(user.id));
    setIsLocked(false);
    localStorage.setItem('capy_active_user', JSON.stringify(user));
    fetchLatestProfiles(user.id);
  };

  const addMessage = async (text: string, type: 'text' | 'image' | 'audio' | 'sticker' | 'video' | 'document' = 'text', replyToId?: string, metadata?: any, localId?: string) => {
    if (!currentUser || !text.trim()) return;

    const targetReplyId = replyToId;

    if (isViewingHistory || hasNewerMessages) {
      setIsViewingHistory(false);
      setHasNewerMessages(false);
      setNewLiveMessagesCount(0);
    }

    const tempId = localId || `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: currentUser.id,
      text,
      type,
      created_at: new Date().toISOString(),
      reply_to_id: targetReplyId,
      is_pending: !isOnline,
      metadata
    };

    setMessages(prev => {
      const existsIdx = prev.findIndex(m => m.id === tempId);
      if (existsIdx !== -1) {
        const newMsgs = [...prev];
        newMsgs[existsIdx] = optimistic;
        return newMsgs;
      }
      return [...prev, optimistic];
    });

    if (isOnline) {
      if (text.startsWith('blob:')) return;

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: currentUser.id,
          text,
          type,
          reply_to_id: targetReplyId,
          metadata: {
            ...metadata,
            localId: tempId
          }
        }])
        .select()
        .single();

      if (error) {
        console.error("Erro ao enviar mensagem:", error);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, is_pending: true } : m));
      } else if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      }
    }
  };

  const handleJumpToMessage = useCallback(async (msg: Message) => {
    if (!isSupabaseConfigured || !currentUser) return;
    try {
      setIsLoadingMore(true);
      setIsLoadingNext(true);
      const [before, after] = await Promise.all([
        supabase.from('messages').select('*').lt('created_at', msg.created_at).order('created_at', { ascending: false }).limit(20),
        supabase.from('messages').select('*').gt('created_at', msg.created_at).order('created_at', { ascending: true }).limit(20)
      ]);
      if (before.error || after.error) throw new Error("Erro ao saltar");
      const messagesWindow = [...(before.data || []).reverse(), msg, ...(after.data || [])];
      setMessages(messagesWindow);
      setHasMoreMessages(before.data?.length === 20);
      setHasNewerMessages(after.data?.length === 20);
      setIsViewingHistory(true);
      setNewLiveMessagesCount(0);
    } catch (err) { console.error(err); } finally { setIsLoadingMore(false); setIsLoadingNext(false); }
  }, [currentUser]);

  if (isLocked) return <AuthScreen onUnlock={handleUnlock} />;

  return (
    <div className={`flex flex-col h-full bg-[#000000] overflow-hidden relative ${isShaking ? 'animate-shake' : ''} ${isMusaTurn ? 'theme-musa' : ''}`}>
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction}>
          {activeView === 'chat' && partner && currentUser && (
            <motion.div
              key="chat"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full w-full absolute top-0 left-0"
            >
              <ChatInterface
                messages={messages} partner={partner} onSendMessage={addMessage} onMarkAsRead={handleMarkAsRead}
                onNavigateToProfile={() => navigateTo('profile')} currentUserId={currentUser.id} isPartnerTyping={isPartnerTyping}
                onTyping={(isTyping) => {
                  resetInactivityTimer();
                  channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser.id, isTyping } });
                }}
                onEditMessage={handleEditMessage} onDeleteMessage={handleDeleteMessage} onReactMessage={handleReactMessage}
                onLoadMore={() => fetchMessages(true)} onLoadNext={fetchNextMessages} hasMore={hasMoreMessages} hasNewer={hasNewerMessages}
                isLoadingMore={isLoadingMore} isLoadingNext={isLoadingNext} isViewingHistory={isViewingHistory} newLiveCount={newLiveMessagesCount}
                onJumpToMessage={handleJumpToMessage} onReloadLatest={handleReloadLatest}
                onLockApp={lockApp}
                regime={regime}
                isSleepModeActive={isSleepModeActive}
              />
            </motion.div>
          )}

          {activeView === 'profile' && currentUser && (
            <motion.div
              key="profile"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full w-full absolute top-0 left-0"
            >
              <Profile
                initialProfile={currentUser}
                onUpdate={(u) => { setCurrentUser(u); localStorage.setItem('capy_active_user', JSON.stringify(u)); }}
                onBack={() => navigateTo('chat')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Update Modal */}
      {updateInfo && (
        <UpdateModal
          isOpen={showUpdateModal}
          currentVersion={CURRENT_APP_VERSION}
          newVersion={updateInfo.version}
          downloadUrl={updateInfo.url}
          onClose={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  );
};

export default App;