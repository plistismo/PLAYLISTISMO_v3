import { useState, useEffect, FormEvent, useRef } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { Virtuoso } from 'react-virtuoso';
import RichTextInput, { formatCreditsConnectors } from './RichTextInput.tsx';
import { sanitizeHTML, decodeHTMLEntities } from '../lib/sanitize.ts';

type MusicEntry = {
  id: number;
  artista: string;
  musica: string;
  album: string;
  ano: string;
  direcao: string;
  video_id: string;
  plataforma?: string;
  playlist?: string;
  playlist_group?: string;
};

export type AdminDisplayMode = 'form' | 'table' | 'full' | 'drawer';

interface AdminPanelProps {
  session: Session | null;
  editId?: string | null;
  onEdit?: (id: string) => void;
  onClose?: () => void;
  onSave?: (updatedData?: Partial<MusicEntry>) => void;
  onPreview?: (videoId: string) => void;
  displayMode?: AdminDisplayMode;
  playingId?: string | null;
  initialPlaylist?: string;
  onRestartPlayer?: (videoId?: string) => void;
  lastSavedRecord?: MusicEntry | null;
  autoFetchMetadata?: boolean;
  onAutoFetchMetadataChange?: (val: boolean) => void;
}

export default function AdminPanel({ 
  session, editId, onEdit, onClose, onSave, onPreview, 
  displayMode = 'full', playingId, initialPlaylist,
  onRestartPlayer, lastSavedRecord,
  autoFetchMetadata: propAutoFetchMetadata,
  onAutoFetchMetadataChange
}: AdminPanelProps) {
  const [internalAutoFetch, setInternalAutoFetch] = useState(true);
  const autoFetchMetadata = propAutoFetchMetadata !== undefined ? propAutoFetchMetadata : internalAutoFetch;
  const setAutoFetchMetadata = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(autoFetchMetadata) : val;
    setInternalAutoFetch(nextVal);
    if (onAutoFetchMetadataChange) onAutoFetchMetadataChange(nextVal);
  };
  const [data, setData] = useState<MusicEntry[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<string[]>([]);
  const [playlistToGroup, setPlaylistToGroup] = useState<Record<string, string>>({});
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(initialPlaylist || '');
  
  const [formData, setFormData] = useState({
    id: '',
    artista: '',
    musica: '',
    ano: '',
    album: '',
    direcao: '',
    video_id: ''
  });
  const [originalVideoId, setOriginalVideoId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false, show: false });
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<any>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  
  // Multi-Playlist State
  const [currentPlaylists, setCurrentPlaylists] = useState<string[]>([]);
  const [newPlaylistsToAdd, setNewPlaylistsToAdd] = useState<string[]>([]);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [playlistSuggestions, setPlaylistSuggestions] = useState<string[]>([]);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);

  // One-click channel removal
  const handleRemoveChannel = async (channelName: string) => {
    const targetVideoId = originalVideoId || formData.video_id;
    try {
      let query = supabase.from('musicas_backup').delete();
      if (targetVideoId) {
        query = query.eq('video_id', targetVideoId).eq('playlist', channelName);
      } else if (formData.id) {
        query = query.eq('id', Number(formData.id)).eq('playlist', channelName);
      } else {
        return;
      }

      const { error } = await query;
      if (error) {
        showMessage(`ERRO AO REMOVER CANAL: ${error.message}`, true);
        return;
      }

      // Visual removal from current video's playlists
      setCurrentPlaylists(prev => prev.filter(p => p !== channelName));

      // Also sync table data if this item is in the current view
      setData(prev => prev.filter(item => !(item.video_id === targetVideoId && item.playlist === channelName)));

      showMessage(`CANAL "${channelName}" DESVINCULADO!`);
    } catch (err: any) {
      showMessage(`ERRO: ${err?.message || 'Falha ao desvincular canal'}`, true);
    }
  };

  // Video ID Quick Paste & Universal Extraction
  const [videoIdPasted, setVideoIdPasted] = useState(false);
  const [isSyncingMetadata, setIsSyncingMetadata] = useState(false);

  const extractVideoId = (input: string): string => {
    const trimmed = input.trim();
    // YouTube URLs: watch?v=, youtu.be/, shorts/, embed/, v/
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) return ytMatch[1];
    // Vimeo URLs: channels, groups, video, player.vimeo.com
    const vimeoMatch = trimmed.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]+\/videos\/|video\/|)|player\.vimeo\.com\/video\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) return vimeoMatch[1];
    return trimmed;
  };

  const triggerMetadataSync = async (cleanId: string) => {
    if (!cleanId) return;
    setIsSyncingMetadata(true);
    try {
      // 1. Query Supabase musicas_backup for existing record
      const { data: record } = await supabase
        .from('musicas_backup')
        .select('*')
        .eq('video_id', cleanId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (record) {
        setFormData(prev => ({
          ...prev,
          video_id: cleanId,
          artista: formatCreditsConnectors(record.artista || '', 'artista'),
          musica: formatCreditsConnectors(record.musica || '', 'musica'),
          ano: record.ano || prev.ano || '',
          album: record.album ? formatCreditsConnectors(record.album, 'album') : prev.album,
          direcao: record.direcao ? formatCreditsConnectors(record.direcao, 'direcao') : prev.direcao
        }));

        // Link playlists if available
        const { data: related } = await supabase
          .from('musicas_backup')
          .select('playlist')
          .eq('video_id', cleanId);
        if (related && related.length > 0) {
          const uniquePlaylists = [...new Set(related.map(r => r.playlist).filter(Boolean))] as string[];
          setCurrentPlaylists(uniquePlaylists);
        }
      } else {
        // Fallback: Check YouTube oEmbed if not already in database
        const isVimeo = /^\d+$/.test(cleanId);
        if (!isVimeo) {
          try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanId}&format=json`);
            if (res.ok) {
              const ytData = await res.json();
              if (ytData?.title) {
                let artist = ytData.author_name || '';
                let track = ytData.title;
                const splitMatch = ytData.title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
                if (splitMatch) {
                  artist = splitMatch[1].trim();
                  track = splitMatch[2].replace(/\s*\([^)]*(?:official|video|audio|remaster|hd|4k)[^)]*\)/gi, '').trim();
                }
                setFormData(prev => ({
                  ...prev,
                  artista: prev.artista ? prev.artista : formatCreditsConnectors(artist, 'artista'),
                  musica: prev.musica ? prev.musica : formatCreditsConnectors(track, 'musica')
                }));
              }
            }
          } catch (oembedErr) {
            // Silently ignore network/oembed error
          }
        }
      }
    } catch (err) {
      console.warn('Metadata sync notice:', err);
    } finally {
      setIsSyncingMetadata(false);
    }
  };

  const handleVideoIdPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    const cleanId = extractVideoId(text);
    setFormData(prev => ({ ...prev, video_id: cleanId }));
    setVideoIdPasted(true);
    setTimeout(() => setVideoIdPasted(false), 900);

    if (autoFetchMetadata) {
      triggerMetadataSync(cleanId);
    }
  };

  const handlePasteVideoId = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleanId = extractVideoId(text);
        setFormData(prev => ({ ...prev, video_id: cleanId }));
        setVideoIdPasted(true);
        setTimeout(() => setVideoIdPasted(false), 900);

        if (autoFetchMetadata) {
          triggerMetadataSync(cleanId);
        }
      }
    } catch (err) {
      console.warn('Failed to read clipboard for video ID:', err);
    }
  };

  // Click-to-copy metadata in Service Mode database list
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getPlainText = (val: string | null | undefined): string => {
    if (!val) return '';
    return decodeHTMLEntities(val.replace(/<[^>]*>?/gm, '')).trim();
  };

  const handleCopyMetadata = (value: string, key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = getPlainText(value);
    if (!clean || clean === '---' || clean === '----' || clean === '—') return;
    
    navigator.clipboard.writeText(clean).catch(err => console.warn('Clipboard write error:', err));
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(prev => (prev === key ? null : prev));
    }, 1100);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (initialPlaylist) {
      setSelectedPlaylist(initialPlaylist);
    }
  }, [initialPlaylist]);

  useEffect(() => {
    fetchMusics();
  }, [searchTerm, selectedGroup, selectedPlaylist]);

  useEffect(() => {
    if (editId) {
      loadSpecificVideo(editId);
    }
  }, [editId]);

  useEffect(() => {
    if (playingId && data.length > 0) {
      const index = data.findIndex(item => String(item.id) === playingId);
      if (index !== -1 && listRef.current) {
        listRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
      }
    }
  }, [playingId, data.length]);
  
  // Bug Fix: Virtualized Table State Synchronization
  // Listener for external saves (e.g., from the form panel)
  useEffect(() => {
    if (lastSavedRecord) {
      const savedId = Number(lastSavedRecord.id);
      
      // Update local data array by replacing the modified object
      setData(prev => {
        const index = prev.findIndex(item => item.id === savedId);
        if (index === -1) return prev; // Not in this list
        
        const newData = prev.map(item => item.id === savedId ? { ...item, ...lastSavedRecord } : item);
        
        // Trigger auto-scroll to the updated item
        if (listRef.current) {
          listRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
        }
        
        return newData;
      });
      
      // Trigger visual highlight
      setLastSavedId(savedId);
      setTimeout(() => setLastSavedId(null), 3000);
    }
  }, [lastSavedRecord]);

  const loadSpecificVideo = async (id: string) => {
    const { data: videoData } = await supabase.from('musicas_backup').select('*').eq('id', id).single();
    if (videoData) {
      setFormData({
        id: String(videoData.id),
        artista: formatCreditsConnectors(videoData.artista || '', 'artista'),
        musica: formatCreditsConnectors(videoData.musica || '', 'musica'),
        ano: videoData.ano || '',
        album: formatCreditsConnectors(videoData.album || '', 'album'),
        direcao: formatCreditsConnectors(videoData.direcao || '', 'direcao'),
        video_id: videoData.video_id || ''
      });
      setIsEditing(true);
      setOriginalVideoId(videoData.video_id || null);
      setNewPlaylistsToAdd([]); // Reset tags when loading new video
      
      // Fetch all playlists where this video exists
      if (videoData.video_id) {
        const { data: related } = await supabase
          .from('musicas_backup')
          .select('playlist')
          .eq('video_id', videoData.video_id);
        
        if (related) {
          const uniquePlaylists = [...new Set(related.map(r => r.playlist).filter(Boolean))] as string[];
          setCurrentPlaylists(uniquePlaylists);
        }
      } else {
        setCurrentPlaylists(videoData.playlist ? [videoData.playlist] : []);
      }
    }
  };

  const loadFilters = async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('name, group_name')
      .order('name', { ascending: true })
      .limit(1000);

    if (!error && data) {
      const g = [...new Set(data.map(i => i.group_name).filter(Boolean))].sort() as string[];
      const p = data.map(i => i.name).filter(Boolean) as string[];
      const mapping = data.reduce((acc, curr) => {
        if (curr.name && curr.group_name) acc[curr.name] = curr.group_name;
        return acc;
      }, {} as Record<string, string>);
      setGroups(g);
      setPlaylists(p);
      setPlaylistToGroup(mapping);
    }
  };

  const fetchMusics = async () => {
    setLoading(true);
    let query = supabase
      .from('musicas_backup')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(0, 5000); // Increased range to fetch all/most records

    if (selectedGroup) query = query.eq('playlist_group', selectedGroup);
    if (selectedPlaylist) query = query.eq('playlist', selectedPlaylist);
    if (searchTerm) {
      const term = `%${searchTerm}%`;
      query = query.or(`artista.ilike.${term},musica.ilike.${term},direcao.ilike.${term},id.eq.${Number(searchTerm) || 0}`);
    }

    const { data, error, count } = await query;
    if (error) {
      showMessage(`ERRO DE LEITURA: ${error.message}`, true);
    } else {
      setData(data || []);
      setTotalRecords(count || 0);
    }
    setLoading(false);
  };

  const showMessage = (text: string, isError = false) => {
    setStatusMsg({ text, isError, show: true });
    setTimeout(() => setStatusMsg(prev => ({ ...prev, show: false })), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // The user wants to save tags.
    // "Garanta que o Supabase salve as tags de formatação"
    // Detecta plataforma automaticamente antes do insert/update
    const rawVideoId = formData.video_id.trim();
    const plataforma = /^\d+$/.test(rawVideoId) ? 'vimeo' : 'youtube';

    const richPayload = {
      artista: sanitizeHTML(formData.artista).trim(),
      musica: sanitizeHTML(formData.musica).trim(),
      ano: formData.ano ? String(formData.ano) : null,
      album: formData.album.trim() ? sanitizeHTML(formData.album).trim() : null,
      direcao: formData.direcao.trim() ? sanitizeHTML(formData.direcao).trim() : null,
      video_id: rawVideoId || null,
      plataforma,
    };

    let error = null;

    if (isEditing) {
      const targetVideoId = originalVideoId || formData.video_id; 
      
      const { error: err, data: updatedRecords } = await supabase.from('musicas_backup')
        .update(richPayload)
        .eq('video_id', targetVideoId)
        .select();
        
      error = err;
      if (!error) {
        showMessage(`REGISTRO GLOBAL DO VÍDEO ATUALIZADO!`);
        
        // Batch insert for new playlists
        if (newPlaylistsToAdd.length > 0) {
          const inserts = newPlaylistsToAdd.map(plName => ({
            ...richPayload,
            playlist: plName,
            playlist_group: playlistToGroup[plName] || null
          }));
          const { error: batchErr } = await supabase.from('musicas_backup').insert(inserts);
          if (batchErr) {
            console.error("Batch insert error:", batchErr);
            showMessage(`ERRO NO LOTE: ${batchErr.message}`, true);
          } else {
            showMessage(`REGISTRO ATUALIZADO E ADICIONADO A ${newPlaylistsToAdd.length} CANAIS!`);
          }
        }
        
        // Synchronize local data arrays instantly
        setData(prev => prev.map(item => item.video_id === targetVideoId ? { ...item, ...richPayload } : item));
        
        if (updatedRecords && updatedRecords.length > 0) {
          const savedId = Number(updatedRecords[0].id);
          if (onSave) onSave({ ...richPayload, id: savedId, video_id: formData.video_id } as MusicEntry);
          setLastSavedId(savedId);
          setTimeout(() => setLastSavedId(null), 3000);
        }
        if (onRestartPlayer) onRestartPlayer(formData.video_id);
      }
    } else {
      // For NEW records
      const initialPlaylist = selectedPlaylist; // Current filter playlist or empty
      const { data: newRecord, error: err } = await supabase.from('musicas_backup').insert([{
        ...richPayload,
        playlist: initialPlaylist || null,
        playlist_group: initialPlaylist ? playlistToGroup[initialPlaylist] : null
      }]).select().single();
      
      error = err;
      if (!error) {
        showMessage("NOVO REGISTRO GRAVADO!");
        
        // Batch insert for additional playlists if selected
        if (newPlaylistsToAdd.length > 0) {
          const inserts = newPlaylistsToAdd.map(plName => ({
            ...richPayload,
            playlist: plName,
            playlist_group: playlistToGroup[plName] || null
          }));
          await supabase.from('musicas_backup').insert(inserts);
        }
        
        const finalNewRecord = newRecord as MusicEntry;
        const savedId = Number(finalNewRecord.id);
        
        if (onSave) onSave({ ...richPayload, id: savedId, video_id: formData.video_id });
        if (onRestartPlayer) onRestartPlayer(formData.video_id);
        
        setData(prev => [finalNewRecord, ...prev]);
        setLastSavedId(savedId);
        setTimeout(() => setLastSavedId(null), 3000);
        clearForm();
        setTimeout(() => fetchMusics(), 2000);
      }
    }

    setIsSaving(false);
    
    if (error) {
      showMessage(`ERRO: ${error.message}`, true);
    } else if (isEditing) {
      const savedId = Number(formData.id);
      
      // Update parent if callback provided
      if (onSave) onSave({ ...richPayload, id: savedId, video_id: formData.video_id });
      
      // Notify parent to restart player immediately
      if (onRestartPlayer) onRestartPlayer(formData.video_id);
      
      // 1. Instant Local Data Update (preserve other properties)
      setData(prev => {
        const newData = prev.map(item => item.id === savedId ? { ...item, ...richPayload } : item);
        
        // 2. Programmatic Scroll to the updated item
        // Do it inside state update or right after to ensure index is current
        const index = newData.findIndex(item => item.id === savedId);
        if (index !== -1 && listRef.current) {
          listRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
        }
        return newData;
      });
      
      // Feedback Visual
      setLastSavedId(savedId);
      setTimeout(() => setLastSavedId(null), 3000);

      setIsEditing(false); // Reset editing mode
      clearForm();
      
      // Delay fetchMusics to keep the visual feedback
      setTimeout(() => fetchMusics(), 2000);
    }
  };

  const clearForm = () => {
    setFormData({ id: '', artista: '', musica: '', ano: '', album: '', direcao: '', video_id: '' });
    setIsEditing(false);
    setActiveField(null);
    setSuggestions([]);
    setCurrentPlaylists([]);
    setNewPlaylistsToAdd([]);
    setPlaylistSearch('');
    setPlaylistSuggestions([]);
    setShowPlaylistDropdown(false);
  };

  const fetchSuggestions = async (field: string, value: string) => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    const { data, error } = await supabase
      .from('musicas_backup')
      .select(field)
      .ilike(field, `${value}%`)
      .limit(100);

    if (!error && data) {
      const fieldName = field as keyof MusicEntry;
      const uniqueValues = [...new Set(data.map(item => decodeHTMLEntities((item[fieldName] as string || '').replace(/<[^>]*>?/gm, ''))).filter(Boolean))]
        .sort()
        .slice(0, 10);
      setSuggestions(uniqueValues);
    }
  };

  useEffect(() => {
    if (!activeField) return;
    
    const value = formData[activeField as keyof typeof formData];
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(activeField, value);
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.artista, formData.album, formData.direcao, activeField]);

  if (displayMode === 'drawer') {
    return (
      <div className="flex flex-col w-full h-full max-h-full text-neutral-100 font-jost font-['Jost',sans-serif] overflow-hidden [&_.rich-text-input]:!font-jost [&_.rich-text-input]:!text-neutral-100 [&_.rich-text-input]:!normal-case [&_.rich-text-input]:!bg-black [&_.rich-text-input]:!border-amber-500/30 [&_.rich-text-input]:focus:!border-amber-400 [&_label]:!font-jost [&_label]:!text-amber-500/80 [&_label]:!tracking-wider">
        {statusMsg.show && (
          <div className={`p-1.5 px-3 mb-2 text-center text-xs md:text-sm font-bold border rounded font-jost shrink-0 ${statusMsg.isError ? 'bg-red-900/80 text-white border-red-500' : 'bg-amber-900/40 text-amber-300 border-amber-500'}`}>
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden font-jost">
          {/* Scrollable Form Body: horizontal grids with compact inputs */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1 pb-1">
            {/* Row 1: Artist & Track (prominent side-by-side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <RichTextInput
                  label="ARTISTA *"
                  field="artista"
                  value={formData.artista}
                  onChange={val => setFormData({ ...formData, artista: val })}
                  onFocus={() => setActiveField('artista')}
                  placeholder="Ex: Oasis"
                  compact
                  icon="🎤"
                />
                {activeField === 'artista' && suggestions.length > 0 && (
                  <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-36 overflow-y-auto custom-scrollbar rounded-sm font-jost">
                    {suggestions.map((val, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setFormData({...formData, artista: formatCreditsConnectors(val, 'artista')});
                          setActiveField(null);
                          setSuggestions([]);
                        }}
                        className="px-2.5 py-1.5 hover:bg-amber-900/40 cursor-pointer text-neutral-100 hover:text-amber-300 font-jost text-sm border-b border-amber-900/20 last:border-0"
                      >
                        {val}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <RichTextInput
                  label="MÚSICA *"
                  field="musica"
                  value={formData.musica}
                  onChange={val => setFormData({ ...formData, musica: val })}
                  placeholder="Ex: Wonderwall"
                  compact
                  icon="🎼"
                />
              </div>
            </div>

            {/* Row 2: Album, Year (Ano 4-digit), and Direção */}
            <div className="flex flex-col sm:flex-row items-end gap-2">
              <div className="flex-1 min-w-0 w-full sm:w-auto relative">
                <RichTextInput
                  label="ÁLBUM"
                  field="album"
                  value={formData.album}
                  onChange={val => setFormData({ ...formData, album: val })}
                  onFocus={() => setActiveField('album')}
                  placeholder="(What's the Story) Morning Glory?"
                  compact
                  icon="💽"
                />
                {activeField === 'album' && suggestions.length > 0 && (
                  <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-36 overflow-y-auto custom-scrollbar rounded-sm font-jost">
                    {suggestions.map((val, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setFormData({...formData, album: formatCreditsConnectors(val, 'album')});
                          setActiveField(null);
                          setSuggestions([]);
                        }}
                        className="px-2.5 py-1.5 hover:bg-amber-900/40 cursor-pointer text-neutral-100 hover:text-amber-300 font-jost text-sm border-b border-amber-900/20 last:border-0"
                      >
                        {val}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ano Input - Constrained to 4 digits: w-20 max-w-[5.5rem] */}
              <div className="w-20 sm:w-24 shrink-0">
                <label className="block text-[9px] md:text-[10px] text-amber-500/80 uppercase mb-0.5 font-bold tracking-wider font-jost flex items-center gap-1">
                  <span>📅</span> ANO
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={formData.ano} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData({...formData, ano: val});
                  }} 
                  className="w-full px-2 py-1.5 bg-black border border-amber-500/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 text-sm md:text-base text-center text-neutral-100 placeholder:text-neutral-600 font-jost font-bold tracking-wider rounded-sm min-h-[34px]" 
                  placeholder="1995" 
                />
              </div>

              <div className="flex-1 min-w-0 w-full sm:w-auto relative">
                <RichTextInput
                  label="DIREÇÃO"
                  field="direcao"
                  value={formData.direcao}
                  onChange={val => setFormData({ ...formData, direcao: val })}
                  onFocus={() => setActiveField('direcao')}
                  placeholder="Diretor do Videoclipe"
                  compact
                  icon="🎬"
                />
                {activeField === 'direcao' && suggestions.length > 0 && (
                  <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-36 overflow-y-auto custom-scrollbar rounded-sm font-jost">
                    {suggestions.map((val, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setFormData({...formData, direcao: formatCreditsConnectors(val, 'direcao')});
                          setActiveField(null);
                          setSuggestions([]);
                        }}
                        className="px-2.5 py-1.5 hover:bg-amber-900/40 cursor-pointer text-neutral-100 hover:text-amber-300 font-jost text-sm border-b border-amber-900/20 last:border-0"
                      >
                        {val}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Video ID + Multi-Playlist / Canais */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
              {/* Video ID */}
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-0.5 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <label className="text-[9px] md:text-[10px] text-amber-500/80 uppercase font-bold tracking-wider font-jost flex items-center gap-1 shrink-0">
                      <span>📺</span> VIDEO ID
                    </label>
                    {/* Auto-Fetch Metadata Toggle */}
                    <label 
                      className="inline-flex items-center gap-1 cursor-pointer select-none px-1.5 py-0.5 rounded bg-black/70 border border-amber-900/40 hover:border-amber-600/50 transition-colors"
                      title="Auto-Fetch Metadata: Sincroniza metadados do Supabase automaticamente ao colar"
                    >
                      <input
                        type="checkbox"
                        checked={autoFetchMetadata}
                        onChange={e => setAutoFetchMetadata(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-2 rounded-full border transition-all duration-200 relative ${
                        autoFetchMetadata 
                          ? 'bg-amber-600 border-amber-400' 
                          : 'bg-neutral-900 border-neutral-700'
                      }`}>
                        <div className={`w-1 h-1 rounded-full transition-all duration-200 absolute top-0.5 ${
                          autoFetchMetadata ? 'left-2.5 bg-amber-100 shadow-[0_0_3px_#f59e0b]' : 'left-0.5 bg-neutral-400'
                        }`} />
                      </div>
                      <span className={`text-[8px] md:text-[9px] font-mono tracking-tight uppercase whitespace-nowrap ${
                        autoFetchMetadata ? 'text-amber-400 font-semibold' : 'text-neutral-500'
                      }`}>
                        Auto-Fetch Metadata
                      </span>
                    </label>
                  </div>
                  {formData.video_id.trim() && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border font-jost shrink-0 ${
                      /^\d+$/.test(formData.video_id.trim())
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40'
                        : 'bg-red-950/60 text-red-400 border-red-500/40'
                    }`}>
                      {/^\d+$/.test(formData.video_id.trim()) ? '🟦 Vimeo' : '🟥 YouTube'}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    value={formData.video_id} 
                    onChange={e => setFormData({...formData, video_id: e.target.value})} 
                    onPaste={handleVideoIdPaste}
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-black border border-amber-500/30 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 text-sm text-neutral-100 placeholder:text-neutral-600 font-jost rounded-sm min-h-[34px]" 
                    placeholder="6hzrDeceEKc / 76979871" 
                  />
                  <button
                    type="button"
                    onClick={handlePasteVideoId}
                    className="bg-amber-950/40 text-amber-400 border border-amber-500/40 px-2 hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center rounded-sm font-jost shrink-0 min-h-[34px] text-xs relative"
                    title="Colar Video ID (Paste)"
                  >
                    {videoIdPasted ? <span className="text-emerald-400 font-bold">✓</span> : '📋'}
                    {isSyncingMetadata && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </button>
                  {onPreview && (
                    <button 
                      type="button" 
                      onClick={() => onPreview(formData.video_id)} 
                      className="bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 px-2.5 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-1 rounded-sm font-jost shrink-0"
                      title="PREVIEW VIDEO"
                    >
                      <span className="text-xs">▶</span>
                      <span className="text-[10px] font-bold font-jost tracking-wider">PREVIEW</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Playlist section */}
              <div className="sm:col-span-7">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[9px] md:text-[10px] text-amber-500/80 uppercase font-bold tracking-wider font-jost flex items-center gap-1">
                    <span>📡</span> CANAIS (PLAYLISTS)
                  </label>
                  {currentPlaylists.length > 0 && (
                    <span className="text-[9px] text-neutral-400 font-mono">
                      {currentPlaylists.length} vinculado(s)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] p-1 bg-black/60 border border-amber-900/40 rounded-sm">
                  {/* Current Playlists in Database */}
                  {currentPlaylists.map(pl => (
                    <span 
                      key={pl} 
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-900 text-neutral-300 border border-neutral-700/60 text-[10px] font-jost rounded-full shrink-0 group/curpl"
                    >
                      <span>{pl}</span>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveChannel(pl);
                        }}
                        className="text-neutral-400 hover:text-red-400 transition-colors text-xs leading-none ml-0.5 p-0.5 rounded hover:bg-neutral-800"
                        title={`Desvincular canal "${pl}"`}
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {/* New Playlists to Add */}
                  {newPlaylistsToAdd.map(pl => (
                    <span key={pl} className="flex items-center gap-1 px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-500/50 text-[10px] font-jost rounded-full shrink-0">
                      <span>{pl}</span>
                      <button 
                        type="button" 
                        onClick={() => setNewPlaylistsToAdd(prev => prev.filter(p => p !== pl))}
                        className="hover:text-white transition-colors text-xs leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {/* Quick search input to add */}
                  <div className="relative flex-1 min-w-[110px]">
                    <input 
                      type="text" 
                      value={playlistSearch} 
                      onChange={e => {
                        setPlaylistSearch(e.target.value);
                        const search = e.target.value.toLowerCase();
                        if (search.length > 0) {
                          const filtered = playlists.filter(p => 
                            p.toLowerCase().includes(search) && 
                            !currentPlaylists.includes(p) && 
                            !newPlaylistsToAdd.includes(p)
                          ).slice(0, 8);
                          setPlaylistSuggestions(filtered);
                          setShowPlaylistDropdown(true);
                        } else {
                          setShowPlaylistDropdown(false);
                        }
                      }}
                      onFocus={() => {
                        if (playlistSearch.length > 0) setShowPlaylistDropdown(true);
                      }}
                      className="w-full px-2 py-0.5 bg-transparent border-none outline-none text-xs text-neutral-100 placeholder:text-neutral-600 font-jost" 
                      placeholder="+ Vincular canal..." 
                    />
                    {showPlaylistDropdown && playlistSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 bottom-full mb-1 bg-neutral-950 border border-amber-500/50 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] max-h-36 overflow-y-auto custom-scrollbar rounded-sm font-jost">
                        {playlistSuggestions.map((pl, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              setNewPlaylistsToAdd(prev => [...prev, pl]);
                              setPlaylistSearch('');
                              setShowPlaylistDropdown(false);
                            }}
                            className="px-2.5 py-1.5 hover:bg-amber-900/40 cursor-pointer text-neutral-100 hover:text-amber-300 font-jost text-xs border-b border-amber-900/20 last:border-0"
                          >
                            {pl}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button Row - Pinned at bottom, always visible within drawer */}
          <div className="shrink-0 flex items-center gap-2 pt-2 border-t border-amber-500/30">
            <button 
              type="submit" 
              disabled={isSaving} 
              className="flex-1 py-1.5 md:py-2 bg-amber-900/40 border border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-black font-bold text-xl md:text-2xl tracking-widest transition-all shadow-[0_0_12px_rgba(217,119,6,0.25)] active:translate-y-0.5 rounded-sm uppercase font-vt323"
            >
              {isSaving ? "TRANSMITTING..." : (isEditing ? "UPDATE RECORDS" : "COMMIT TO DB")}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={clearForm} 
                className="px-3 py-1.5 md:py-2 bg-black/60 border border-amber-900/50 text-amber-400/90 hover:text-amber-200 hover:bg-amber-950/60 font-vt323 text-lg md:text-xl tracking-wider rounded-sm uppercase transition-all shrink-0"
                title="Limpar formulário para criar nova unidade"
              >
                + New Unit
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all text-lg md:text-xl font-vt323 tracking-wider rounded-sm uppercase shrink-0"
              >
                Close Drawer
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div id="tv-admin-panel" className="flex flex-col h-full text-amber-500 font-vt323 bg-black border-l-2 border-amber-800/50 shadow-[-20px_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
      {displayMode === 'full' && (
        <div className="p-6 border-b border-amber-800/50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-4xl font-bold tracking-widest uppercase text-amber-500 drop-shadow-[0_0_8px_rgba(217,119,6,0.3)]">Service Mode</h2>
            <p className="text-amber-700 text-sm uppercase tracking-wider">Database Manipulation Side-Unit // All Access</p>
          </div>
          <button onClick={onClose} className="bg-amber-900/20 text-amber-500 border border-amber-800/50 w-10 h-10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all text-2xl">×</button>
        </div>
      )}

      {statusMsg.show && (
        <div className={`p-2 text-center text-xl font-bold border-y shrink-0 z-20 ${statusMsg.isError ? 'bg-red-900 text-white border-red-500' : 'bg-amber-900/40 text-amber-500 border-amber-500'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        {displayMode !== 'form' && (
          <div className="p-4 bg-[#0d0d0d] border-b border-amber-900/40 shrink-0 shadow-[inset_0_-2px_10px_rgba(0,0,0,0.5)]">
            <div className={`grid grid-cols-1 ${displayMode === 'full' ? 'md:grid-cols-3' : 'md:grid-cols-[1.5fr_1fr]'} gap-4 items-end`}>
              <div className="relative group flex-1">
                <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700 font-bold">Global Search</label>
                <div className="relative">
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="IDENTIFY MUSIC..." className="bg-black border border-amber-900/50 text-white outline-none p-2 pl-8 w-full text-lg focus:border-amber-500 transition-all placeholder:opacity-30" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">🔎</span>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700 font-bold">Signal Source (Playlist)</label>
                <div className="relative">
                  <select value={selectedPlaylist} onChange={e => setSelectedPlaylist(e.target.value)} className="bg-black border border-amber-900/50 text-white outline-none p-2 pl-8 w-full text-lg cursor-pointer focus:border-amber-500 transition-all appearance-none">
                    <option value="">ALL FREQUENCIES</option>
                    {playlists.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">📼</span>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">▼</span>
                </div>
              </div>

              {displayMode === 'full' && (
                <div className="group">
                  <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700 font-bold">Station Group</label>
                  <div className="relative">
                    <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="bg-black border border-amber-900/50 text-white outline-none p-2 pl-8 w-full text-lg cursor-pointer focus:border-amber-500 transition-all appearance-none">
                      <option value="">ALL NETWORKS</option>
                      {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">📡</span>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">▼</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Form Side */}
          {displayMode !== 'table' && (
            <section className={`${displayMode === 'full' ? 'w-full lg:w-1/3' : 'w-full'} bg-[#0a0a0a] border-r border-amber-900/30 p-6 overflow-y-auto custom-scrollbar flex-shrink-0 font-jost [&_.rich-text-input]:!font-jost [&_.rich-text-input]:!text-neutral-100 [&_.rich-text-input]:!normal-case [&_label]:!font-jost [&_label]:!text-amber-500/80 [&_label]:!tracking-wider`}>
              <h3 className="text-2xl mb-6 border-b border-amber-900/30 pb-2 flex justify-between items-center font-jost">
                <span className="font-bold">{isEditing ? `EDIT #${formData.id}` : 'NEW UNIT'}</span>
                {isEditing && <button onClick={clearForm} className="text-xs text-amber-500/80 hover:text-amber-300 transition-colors uppercase font-jost">Cancel Edit</button>}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5 font-jost">
                <RichTextInput
                  label="ARTISTA *"
                  field="artista"
                  value={formData.artista}
                  onChange={val => setFormData({ ...formData, artista: val })}
                  onFocus={() => setActiveField('artista')}
                  placeholder="Ex: Oasis"
                />
                
                {activeField === 'artista' && suggestions.length > 0 && (
                  <div ref={dropdownRef} className="absolute left-6 right-6 top-[220px] bg-neutral-950 border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar rounded-sm font-jost">
                    {suggestions.map((val, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setFormData({...formData, artista: formatCreditsConnectors(val, 'artista')});
                          setActiveField(null);
                          setSuggestions([]);
                        }}
                        className="px-3 py-2 hover:bg-amber-900/40 cursor-pointer text-neutral-100 hover:text-amber-300 font-jost text-base border-b border-amber-900/20 last:border-0"
                      >
                        {val}
                      </div>
                    ))}
                  </div>
                )}

                <RichTextInput
                  label="MÚSICA"
                  field="musica"
                  value={formData.musica}
                  onChange={val => setFormData({ ...formData, musica: val })}
                  placeholder="Ex: Wonderwall"
                />
                
                <div className="flex gap-2">
                  <div className="group w-[100px] shrink-0">
                    <label className="block text-xs text-amber-500/80 uppercase mb-1 font-bold tracking-wider font-jost">ANO</label>
                    <input 
                      type="number" 
                      value={formData.ano} 
                      onChange={e => setFormData({...formData, ano: e.target.value})} 
                      className="w-full p-2 bg-neutral-900 border border-amber-500/30 outline-none focus:border-amber-400 text-lg text-neutral-200 placeholder:text-neutral-500 font-jost font-semibold tracking-wide input-year rounded-sm" 
                      placeholder="1995" 
                    />
                  </div>
                  <div className="group flex-1 relative">
                    <RichTextInput
                      label="ÁLBUM"
                      field="album"
                      value={formData.album}
                      onChange={val => setFormData({ ...formData, album: val })}
                      onFocus={() => setActiveField('album')}
                      placeholder="Optional"
                    />
                    {activeField === 'album' && suggestions.length > 0 && (
                      <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar rounded-sm font-jost">
                        {suggestions.map((val, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              setFormData({...formData, album: formatCreditsConnectors(val, 'album')});
                              setActiveField(null);
                              setSuggestions([]);
                            }}
                            className="px-3 py-2 hover:bg-amber-900/40 cursor-pointer text-neutral-100 hover:text-amber-300 font-jost text-base border-b border-amber-900/20 last:border-0"
                          >
                            {val}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="group relative">
                  <RichTextInput
                    label="DIREÇÃO"
                    field="direcao"
                    value={formData.direcao}
                    onChange={val => setFormData({ ...formData, direcao: val })}
                    onFocus={() => setActiveField('direcao')}
                    placeholder="Music Video Director"
                  />
                  {activeField === 'direcao' && suggestions.length > 0 && (
                    <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar rounded-sm font-jost">
                      {suggestions.map((val, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            setFormData({...formData, direcao: formatCreditsConnectors(val, 'direcao')});
                            setActiveField(null);
                            setSuggestions([]);
                          }}
                          className="px-3 py-2 hover:bg-amber-900/40 cursor-pointer text-neutral-100 hover:text-amber-300 font-jost text-base border-b border-amber-900/20 last:border-0"
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-amber-500/80 uppercase font-bold tracking-wider font-jost">
                      VIDEO ID (YouTube ou Vimeo)
                    </label>
                    {/* Auto-Fetch Metadata Toggle */}
                    <label 
                      className="inline-flex items-center gap-1.5 cursor-pointer select-none px-1.5 py-0.5 rounded bg-black/60 border border-amber-900/40 hover:border-amber-600/50 transition-colors"
                      title="Auto-Fetch Metadata: Sincroniza metadados do Supabase automaticamente ao colar"
                    >
                      <input
                        type="checkbox"
                        checked={autoFetchMetadata}
                        onChange={e => setAutoFetchMetadata(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-2.5 rounded-full border transition-all duration-200 relative ${
                        autoFetchMetadata 
                          ? 'bg-amber-600 border-amber-400' 
                          : 'bg-neutral-900 border-neutral-700'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 absolute top-0.5 ${
                          autoFetchMetadata ? 'left-2.5 bg-amber-100 shadow-[0_0_3px_#f59e0b]' : 'left-0.5 bg-neutral-400'
                        }`} />
                      </div>
                      <span className={`text-[9px] font-mono tracking-tight uppercase ${
                        autoFetchMetadata ? 'text-amber-400 font-semibold' : 'text-neutral-500'
                      }`}>
                        Auto-Fetch Metadata
                      </span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={formData.video_id} 
                      onChange={e => setFormData({...formData, video_id: e.target.value})} 
                      onPaste={handleVideoIdPaste}
                      className="flex-1 min-w-0 p-2 bg-neutral-900 border border-amber-500/30 outline-none focus:border-amber-400 text-lg text-neutral-100 font-jost rounded-sm" 
                      placeholder="6hzrDeceEKc ou 76979871" 
                    />
                    <button
                      type="button"
                      onClick={handlePasteVideoId}
                      className="bg-amber-950/40 text-amber-400 border border-amber-500/40 px-3 hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center rounded-sm font-jost shrink-0 text-sm relative"
                      title="Colar Video ID (Paste)"
                    >
                      {videoIdPasted ? <span className="text-emerald-400 font-bold">✓</span> : '📋'}
                      {isSyncingMetadata && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </button>
                    {onPreview && (
                      <button 
                        type="button" 
                        onClick={() => onPreview(formData.video_id)} 
                        className="bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 px-4 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2 group font-jost rounded-sm"
                        title="PREVIEW VIDEO"
                      >
                        <span className="text-xl">▶</span>
                        <span className="text-[10px] font-bold group-hover:block hidden font-jost">PREVIEW</span>
                      </button>
                    )}
                  </div>
                  {/* Badge de detecção automática de plataforma */}
                  {formData.video_id.trim() && (
                    <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full border font-jost ${
                      /^\d+$/.test(formData.video_id.trim())
                        ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/40'
                        : 'bg-red-900/30 text-red-400 border-red-500/40'
                    }`}>
                      <span>{/^\d+$/.test(formData.video_id.trim()) ? '🟦 VIMEO detectado' : '🟥 YOUTUBE detectado'}</span>
                    </div>
                  )}
                </div>

                {/* Multi-Playlist Management Section */}
                <div className="space-y-4 pt-4 border-t border-amber-900/30 font-jost">
                  {/* Current Playlists (Read-Only) */}
                  {currentPlaylists.length > 0 && (
                    <div className="group">
                      <label className="block text-[10px] text-amber-500/70 uppercase mb-2 font-bold tracking-widest font-jost">Canais Atuais (Database)</label>
                      <div className="flex flex-wrap gap-2">
                        {currentPlaylists.map(pl => (
                          <span key={pl} className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-neutral-200 border border-zinc-800 text-xs font-jost rounded-full opacity-80 group/pl">
                            <span>{pl}</span>
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveChannel(pl);
                              }}
                              className="text-neutral-400 hover:text-red-400 transition-colors text-sm leading-none ml-0.5 p-0.5 rounded hover:bg-zinc-800"
                              title={`Desvincular canal "${pl}"`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to New Playlists */}
                  <div className="group relative">
                    <label className="block text-xs text-amber-500/80 uppercase mb-1 font-bold tracking-wider font-jost">Adicionar a outros canais</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={playlistSearch} 
                        onChange={e => {
                          setPlaylistSearch(e.target.value);
                          const search = e.target.value.toLowerCase();
                          if (search.length > 0) {
                            const filtered = playlists.filter(p => 
                              p.toLowerCase().includes(search) && 
                              !currentPlaylists.includes(p) && 
                              !newPlaylistsToAdd.includes(p)
                            ).slice(0, 10);
                            setPlaylistSuggestions(filtered);
                            setShowPlaylistDropdown(true);
                          } else {
                            setShowPlaylistDropdown(false);
                          }
                        }}
                        onFocus={() => {
                          if (playlistSearch.length > 0) setShowPlaylistDropdown(true);
                        }}
                        className="w-full p-2 bg-neutral-900 border border-amber-500/30 outline-none focus:border-amber-400 text-lg font-jost text-neutral-100 rounded-sm" 
                        placeholder="Buscar canal..." 
                      />
                      {showPlaylistDropdown && playlistSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 bottom-full mb-1 bg-neutral-950 border border-amber-500/50 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar rounded-sm font-jost">
                          {playlistSuggestions.map((pl, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                setNewPlaylistsToAdd(prev => [...prev, pl]);
                                setPlaylistSearch('');
                                setShowPlaylistDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-amber-900/40 cursor-pointer text-neutral-100 hover:text-amber-300 font-jost text-sm border-b border-amber-900/20 last:border-0"
                            >
                              {pl}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Playlists Tags (to be added) */}
                  {newPlaylistsToAdd.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {newPlaylistsToAdd.map(pl => (
                        <div key={pl} className="flex items-center gap-2 px-3 py-1 bg-amber-950/60 text-amber-300 border border-amber-500/50 text-xs font-jost rounded-full group/tag animate-in fade-in zoom-in duration-300">
                          <span>{pl}</span>
                          <button 
                            type="button" 
                            onClick={() => setNewPlaylistsToAdd(prev => prev.filter(p => p !== pl))}
                            className="hover:text-white transition-colors text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-4 bg-amber-900/20 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-bold text-2xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.1)] active:translate-y-1">
                  {isSaving ? "TRANSMITTING..." : (isEditing ? "UPDATE RECORDS" : "COMMIT TO DB")}
                </button>
              </form>
            </section>
          )}

          {/* Table Side */}
          {displayMode !== 'form' && (
            <section className="flex-1 flex flex-col overflow-hidden bg-black">
              <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col">
                  <div className="bg-[#111] z-10 border-b border-amber-500/50 shadow-lg shrink-0">
                    <div className="flex text-[10px] uppercase text-amber-700 font-bold tracking-[0.2em]">
                      <div className="p-3 w-10 text-center">ID</div>
                      <div className="p-3 flex-1">ARTISTA / MÚSICA / ÁLBUM</div>
                      <div className="p-3 w-40 hidden sm:block">DETALHES (ANO/DIR)</div>
                      <div className="p-3 w-24 text-center">AÇÃO</div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {loading ? (
                      <div className="flex items-center justify-center h-full animate-pulse text-2xl tracking-[0.2em] text-amber-500 uppercase">Accessing Mainframe...</div>
                    ) : data.length === 0 ? (
                      <div className="flex items-center justify-center h-full opacity-40 text-xl uppercase tracking-widest text-amber-700">No signals detected.</div>
                    ) : (
                      <Virtuoso
                        data={data}
                        ref={listRef}
                        style={{ height: '100%', width: '100%' }}
                        className="custom-scrollbar"
                        initialTopMostItemIndex={0}
                        onScroll={(e: any) => setScrollOffset(e.currentTarget.scrollTop)}
                        itemContent={(index, item) => {
                          if (!item) return null;
                          const isActive = editId === String(item.id);
                          const isPlaying = playingId === String(item.id);
                          const isSaved = lastSavedId === item.id;
                          return (
                            <div className={`border-b border-amber-900/10 transition-colors duration-500 group flex items-center font-jost py-2 ${isActive ? 'bg-amber-600/30' : isPlaying ? 'bg-cyan-900/40' : isSaved ? 'bg-green-500/30 animate-pulse border-y-green-500/50' : 'hover:bg-amber-900/30'}`}>
                              <div 
                                onClick={(e) => handleCopyMetadata(String(item.id), `${item.id}-id`, e)}
                                className="relative p-1 w-10 font-mono text-center text-[10px] opacity-40 hover:opacity-100 cursor-pointer transition-opacity flex-shrink-0 [writing-mode:vertical-rl] rotate-180 h-16 flex items-center justify-center border-r border-amber-900/20 select-none"
                                title="Copiar ID"
                              >
                                {item.id}
                                {copiedKey === `${item.id}-id` && (
                                  <span className="copy-balloon font-mono">Copied!</span>
                                )}
                              </div>
                              <div className="p-3 flex-1 min-w-0">
                                <div 
                                  onClick={(e) => handleCopyMetadata(item.artista, `${item.id}-artista`, e)}
                                  className="relative text-xl leading-tight text-amber-500 hover:text-amber-300 transition-colors tracking-wide whitespace-normal break-words font-jost cursor-pointer select-none"
                                  title="Clique para copiar Artista"
                                >
                                  <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.artista) }} />
                                  {copiedKey === `${item.id}-artista` && (
                                    <span className="copy-balloon font-mono">Copied!</span>
                                  )}
                                </div>
                                <div 
                                  onClick={(e) => handleCopyMetadata(item.musica || '', `${item.id}-musica`, e)}
                                  className="relative text-xl font-bold text-white hover:text-amber-200 transition-colors mt-1 whitespace-normal break-words font-jost cursor-pointer select-none"
                                  title="Clique para copiar Música"
                                >
                                  <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.musica || '---') }} />
                                  {copiedKey === `${item.id}-musica` && (
                                    <span className="copy-balloon font-mono">Copied!</span>
                                  )}
                                </div>
                                <div 
                                  onClick={(e) => item.album ? handleCopyMetadata(item.album, `${item.id}-album`, e) : undefined}
                                  className={`relative text-xs text-cyan-400 mt-1 whitespace-normal break-words font-jost ${item.album ? 'hover:text-cyan-200 cursor-pointer select-none' : ''}`}
                                  title={item.album ? "Clique para copiar Álbum" : undefined}
                                >
                                  <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.album || '') }} />
                                  {copiedKey === `${item.id}-album` && (
                                    <span className="copy-balloon font-mono">Copied!</span>
                                  )}
                                </div>
                              </div>
                              <div className="p-3 w-40 hidden sm:block flex-shrink-0">
                                <div 
                                  onClick={(e) => item.ano ? handleCopyMetadata(item.ano, `${item.id}-ano`, e) : undefined}
                                  className={`relative text-sm font-jost text-orange-500 font-bold ${item.ano ? 'hover:text-orange-300 cursor-pointer select-none' : ''}`}
                                  title={item.ano ? "Clique para copiar Ano" : undefined}
                                >
                                  {item.ano || '----'}
                                  {copiedKey === `${item.id}-ano` && (
                                    <span className="copy-balloon font-mono">Copied!</span>
                                  )}
                                </div>
                                <div 
                                  onClick={(e) => item.direcao ? handleCopyMetadata(item.direcao, `${item.id}-direcao`, e) : undefined}
                                  className={`relative text-xs text-orange-400 mt-1 font-jost whitespace-normal break-words max-w-[150px] ${item.direcao ? 'hover:text-orange-200 cursor-pointer select-none' : ''}`}
                                  title={item.direcao ? "Clique para copiar Direção" : undefined}
                                >
                                  <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.direcao || '—') }} />
                                  {copiedKey === `${item.id}-direcao` && (
                                    <span className="copy-balloon font-mono">Copied!</span>
                                  )}
                                </div>
                              </div>
                              <div className="p-3 w-24 text-center flex-shrink-0">
                                <button onClick={() => {
                                  setFormData({
                                    id: String(item.id),
                                    artista: formatCreditsConnectors(item.artista || '', 'artista'),
                                    musica: formatCreditsConnectors(item.musica || '', 'musica'),
                                    ano: item.ano || '',
                                    album: formatCreditsConnectors(item.album || '', 'album'),
                                    direcao: formatCreditsConnectors(item.direcao || '', 'direcao'),
                                    video_id: item.video_id || ''
                                  });
                                  setIsEditing(true);
                                  if (onEdit) onEdit(String(item.id));
                                }} className="text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/50 p-2 font-bold transition-all uppercase text-xs flex items-center justify-center mx-auto rounded-sm group/btn" title="EDIT RECORD">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover/btn:opacity-100"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                              </div>
                            </div>
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-[#080808] border-t border-amber-900/30 flex justify-between items-center text-[10px] uppercase font-bold text-amber-700 tracking-[0.2em]">
                <span>Status: Active</span>
                <span>Detected Signals: {totalRecords}</span>
              </div>
            </section>
          )}
        </div>
      </div>

      {displayMode === 'full' && (
        <div className="p-4 text-[10px] text-amber-900 text-center uppercase tracking-[0.6em] shrink-0 bg-[#050505] border-t border-amber-900/20 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          Sony Trinitron Service System // Debug Mode Active // All Records Mode
        </div>
      )}

      <style>{`
        @keyframes copyBalloon {
          0% {
            opacity: 0;
            transform: translate(-50%, 4px) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -4px) scale(1);
          }
          75% {
            opacity: 1;
            transform: translate(-50%, -8px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -15px) scale(0.9);
          }
        }
        .copy-balloon {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #f59e0b;
          color: #000;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 1px 6px;
          border-radius: 3px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
          pointer-events: none;
          z-index: 50;
          white-space: nowrap;
          animation: copyBalloon 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .copy-balloon::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -3px;
          border-width: 3px;
          border-style: solid;
          border-color: #f59e0b transparent transparent transparent;
        }
      `}</style>
    </div>
  );
}
