import { useState, useEffect, FormEvent, useRef } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { Virtuoso } from 'react-virtuoso';
import RichTextInput from './RichTextInput.tsx';

type MusicEntry = {
  id: number;
  artista: string;
  musica: string;
  album: string;
  ano: string;
  direcao: string;
  video_id: string;
  playlist?: string;
  playlist_group?: string;
};

export type AdminDisplayMode = 'form' | 'table' | 'full';

interface AdminPanelProps {
  session: Session | null;
  editId?: string | null;
  onEdit?: (id: string) => void;
  onClose?: () => void;
  onSave?: (updatedData?: any) => void;
  onPreview?: (videoId: string) => void;
  displayMode?: AdminDisplayMode;
  playingId?: string | null;
  initialPlaylist?: string;
  onRestartPlayer?: () => void;
  lastSavedRecord?: MusicEntry | null;
}

export default function AdminPanel({ 
  session, editId, onEdit, onClose, onSave, onPreview, 
  displayMode = 'full', playingId, initialPlaylist,
  onRestartPlayer, lastSavedRecord 
}: AdminPanelProps) {
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
        artista: videoData.artista || '',
        musica: videoData.musica || '',
        ano: videoData.ano || '',
        album: videoData.album || '',
        direcao: videoData.direcao || '',
        video_id: videoData.video_id || ''
      });
      setIsEditing(true);
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
    
    const payload = {
      album: formData.album ? formData.album.replace(/<[^>]*>?/gm, '').trim() : null,
      direcao: formData.direcao ? formData.direcao.replace(/<[^>]*>?/gm, '').trim() : null,
      video_id: formData.video_id ? formData.video_id.replace(/<[^>]*>?/gm, '').trim() : null
    };

    // Actually, the user wants to save tags. So I should NOT strip them.
    // "Garanta que o Supabase salve as tags de formatação"
    const richPayload = {
      artista: formData.artista.trim(),
      musica: formData.musica.trim(),
      ano: formData.ano ? String(formData.ano) : null,
      album: formData.album.trim() || null,
      direcao: formData.direcao.trim() || null,
      video_id: formData.video_id.trim() || null
    };

    let error = null;

    if (isEditing) {
      const { error: err } = await supabase.from('musicas_backup').update(richPayload).eq('id', formData.id);
      error = err;
      if (!error) {
        showMessage(`REGISTRO #${formData.id} ATUALIZADO!`);
        
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
      }
    } else {
      // For NEW records, if multiple playlists are selected, we might want to insert all of them.
      // But the current logic is to insert one and then we could insert others.
      // Let's stick to the current playlist + newPlaylists.
      const initialPlaylist = selectedPlaylist; // Current filter playlist or empty
      const { data: newRecord, error: err } = await supabase.from('musicas_backup').insert([{
        ...payload,
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
      }
    }

    setIsSaving(false);
    
    if (error) {
      showMessage(`ERRO: ${error.message}`, true);
    } else {
      const savedId = Number(formData.id);
      
      // Update parent if callback provided
      if (onSave) onSave({ ...richPayload, id: savedId });
      
      // Notify parent to restart player immediately
      if (onRestartPlayer) onRestartPlayer();
      
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
      
      // Delay fetchMusics to keep the visual feedback, or just skip if local sync is sufficient.
      // Keeping it but with larger delay to ensure smooth transition.
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
      const uniqueValues = [...new Set(data.map(item => (item[fieldName] as string || '').replace(/<[^>]*>?/gm, '')).filter(Boolean))]
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
            <section className={`${displayMode === 'full' ? 'w-full lg:w-1/3' : 'w-full'} bg-[#0a0a0a] border-r border-amber-900/30 p-6 overflow-y-auto custom-scrollbar flex-shrink-0`}>
              <h3 className="text-2xl mb-6 border-b border-amber-900/30 pb-2 flex justify-between items-center">
                <span className="font-bold">{isEditing ? `EDIT #${formData.id}` : 'NEW UNIT'}</span>
                {isEditing && <button onClick={clearForm} className="text-xs text-amber-700 hover:text-amber-500 transition-colors uppercase underline">Cancel Edit</button>}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <RichTextInput
                  label="ARTISTA *"
                  field="artista"
                  value={formData.artista}
                  onChange={val => setFormData({ ...formData, artista: val })}
                  onFocus={() => setActiveField('artista')}
                  placeholder="Ex: Oasis"
                />
                
                {activeField === 'artista' && suggestions.length > 0 && (
                  <div ref={dropdownRef} className="absolute left-6 right-6 top-[220px] bg-black border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((val, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setFormData({...formData, artista: val});
                          setActiveField(null);
                          setSuggestions([]);
                        }}
                        className="p-2 hover:bg-amber-900/40 cursor-pointer text-amber-500 font-jost text-lg border-b border-amber-900/20 last:border-0"
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
                    <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">ANO</label>
                    <input type="number" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg input-year" placeholder="1995" />
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
                      <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-black border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar">
                        {suggestions.map((val, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              setFormData({...formData, album: val});
                              setActiveField(null);
                              setSuggestions([]);
                            }}
                            className="p-2 hover:bg-amber-900/40 cursor-pointer text-amber-500 font-jost text-lg border-b border-amber-900/20 last:border-0"
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
                    <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-black border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map((val, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            setFormData({...formData, direcao: val});
                            setActiveField(null);
                            setSuggestions([]);
                          }}
                          className="p-2 hover:bg-amber-900/40 cursor-pointer text-amber-500 font-jost text-lg border-b border-amber-900/20 last:border-0"
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">YOUTUBE VIDEO ID</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.video_id} onChange={e => setFormData({...formData, video_id: e.target.value})} className="flex-1 p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg text-white" placeholder="6hzrDeceEKc" />
                    {onPreview && (
                      <button 
                        type="button"
                        onClick={() => onPreview(formData.video_id)}
                        className="bg-cyan-900/30 text-cyan-500 border border-cyan-500/50 px-4 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2 group"
                        title="PREVIEW VIDEO"
                      >
                        <span className="text-xl">▶</span>
                        <span className="text-[10px] font-bold group-hover:block hidden">PREVIEW</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Multi-Playlist Management Section */}
                <div className="space-y-4 pt-4 border-t border-amber-900/30">
                  {/* Current Playlists (Read-Only) */}
                  {currentPlaylists.length > 0 && (
                    <div className="group">
                      <label className="block text-[10px] text-amber-700/60 uppercase mb-2 font-bold tracking-widest">Canais Atuais (Database)</label>
                      <div className="flex flex-wrap gap-2">
                        {currentPlaylists.map(pl => (
                          <span key={pl} className="px-3 py-1 bg-zinc-900 text-zinc-500 border border-zinc-800 text-xs font-jost rounded-full opacity-80">
                            {pl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to New Playlists */}
                  <div className="group relative">
                    <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">Adicionar a outros canais</label>
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
                        className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg font-jost" 
                        placeholder="Buscar canal..." 
                      />
                      {showPlaylistDropdown && playlistSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 bottom-full mb-1 bg-black border border-amber-500/50 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar">
                          {playlistSuggestions.map((pl, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                setNewPlaylistsToAdd(prev => [...prev, pl]);
                                setPlaylistSearch('');
                                setShowPlaylistDropdown(false);
                              }}
                              className="p-2 hover:bg-amber-900/40 cursor-pointer text-amber-500 font-jost text-lg border-b border-amber-900/20 last:border-0"
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
                        <div key={pl} className="flex items-center gap-2 px-3 py-1 bg-amber-900/30 text-amber-500 border border-amber-500/50 text-xs font-jost rounded-full group/tag animate-in fade-in zoom-in duration-300">
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
                              <div className="p-1 w-10 font-mono text-center text-[10px] opacity-40 flex-shrink-0 [writing-mode:vertical-rl] rotate-180 h-16 flex items-center justify-center border-r border-amber-900/20">{item.id}</div>
                              <div className="p-3 flex-1 min-w-0">
                                <div className="text-xl leading-tight text-amber-500 tracking-wide whitespace-normal break-words font-jost" dangerouslySetInnerHTML={{ __html: item.artista }} />
                                <div className="text-xl font-bold text-white mt-1 whitespace-normal break-words font-jost" dangerouslySetInnerHTML={{ __html: item.musica || '---' }} />
                                <div className="text-xs text-cyan-400 mt-1 whitespace-normal break-words font-jost" dangerouslySetInnerHTML={{ __html: item.album || '' }} />
                              </div>
                              <div className="p-3 w-40 hidden sm:block flex-shrink-0">
                                <div className="text-sm font-jost text-orange-500 font-bold">{item.ano || '----'}</div>
                                <div className="text-xs text-orange-400 mt-1 font-jost whitespace-normal break-words max-w-[150px]" dangerouslySetInnerHTML={{ __html: item.direcao || '—' }} />
                              </div>
                              <div className="p-3 w-24 text-center flex-shrink-0">
                                <button onClick={() => {
                                  setFormData({
                                    id: String(item.id),
                                    artista: item.artista || '',
                                    musica: item.musica || '',
                                    ano: item.ano || '',
                                    album: item.album || '',
                                    direcao: item.direcao || '',
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
    </div>
  );
}
