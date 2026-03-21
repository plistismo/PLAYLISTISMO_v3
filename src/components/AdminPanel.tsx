import { useState, useEffect, FormEvent, useRef } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { Virtuoso } from 'react-virtuoso';

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
  onSave?: () => void;
  onPreview?: (videoId: string) => void;
  displayMode?: AdminDisplayMode;
  playingId?: string | null;
  initialPlaylist?: string;
}

export default function AdminPanel({ session, editId, onEdit, onClose, onSave, onPreview, displayMode = 'full', playingId, initialPlaylist }: AdminPanelProps) {
  const [data, setData] = useState<MusicEntry[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<string[]>([]);
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
  const listRef = useRef<any>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

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
    if (listRef.current?.element && scrollOffset > 0 && !loading) {
      listRef.current.element.scrollTop = scrollOffset;
    }
  }, [data, loading]);

  const loadSpecificVideo = async (id: string) => {
    const { data } = await supabase.from('musicas_backup').select('*').eq('id', id).single();
    if (data) {
      setFormData({
        id: String(data.id),
        artista: data.artista || '',
        musica: data.musica || '',
        ano: data.ano || '',
        album: data.album || '',
        direcao: data.direcao || '',
        video_id: data.video_id || ''
      });
      setIsEditing(true);
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
      setGroups(g);
      setPlaylists(p);
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
      artista: formData.artista.trim(),
      musica: formData.musica.trim(),
      ano: formData.ano ? String(formData.ano) : null,
      album: formData.album.trim() || null,
      direcao: formData.direcao.trim() || null,
      video_id: formData.video_id.trim() || null
    };

    let error = null;

    if (isEditing) {
      const { error: err } = await supabase.from('musicas_backup').update(payload).eq('id', formData.id);
      error = err;
      if (!error) showMessage(`REGISTRO #${formData.id} ATUALIZADO!`);
    } else {
      const { error: err } = await supabase.from('musicas_backup').insert([payload]);
      error = err;
      if (!error) showMessage("NOVO REGISTRO GRAVADO!");
    }

    setIsSaving(false);
    
    if (error) {
      showMessage(`ERRO: ${error.message}`, true);
    } else {
      if (onSave) onSave();
      clearForm();
      fetchMusics();
    }
  };

  const clearForm = () => {
    setFormData({ id: '', artista: '', musica: '', ano: '', album: '', direcao: '', video_id: '' });
    setIsEditing(false);
  };

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
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="IDENTIFY MUSIC..." className="bg-black border border-amber-900/50 text-amber-500 outline-none p-2 pl-8 w-full text-lg focus:border-amber-500 transition-all font-vt323 placeholder:opacity-30" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">🔎</span>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700 font-bold">Signal Source (Playlist)</label>
                <div className="relative">
                  <select value={selectedPlaylist} onChange={e => setSelectedPlaylist(e.target.value)} className="bg-black border border-amber-900/50 text-amber-500 outline-none p-2 pl-8 w-full text-lg cursor-pointer focus:border-amber-500 transition-all font-vt323 appearance-none">
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
                    <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="bg-black border border-amber-900/50 text-amber-500 outline-none p-2 pl-8 w-full text-lg cursor-pointer focus:border-amber-500 transition-all font-vt323 appearance-none">
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
                <div className="group">
                  <label className="block text-xs text-amber-700 uppercase mb-1 font-bold group-focus-within:text-amber-500 transition-colors">ARTISTA *</label>
                  <input type="text" value={formData.artista} onChange={e => setFormData({...formData, artista: e.target.value})} required className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg" placeholder="Ex: Oasis" />
                </div>
                
                <div className="group">
                  <label className="block text-xs text-amber-700 uppercase mb-1 font-bold group-focus-within:text-amber-500 transition-colors">MÚSICA</label>
                  <input type="text" value={formData.musica} onChange={e => setFormData({...formData, musica: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg" placeholder="Ex: Wonderwall" />
                </div>
                
                <div className="flex gap-2">
                  <div className="group w-[100px] shrink-0">
                    <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">ANO</label>
                    <input type="number" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg input-year" placeholder="1995" />
                  </div>
                  <div className="group flex-1">
                    <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">ÁLBUM</label>
                    <input type="text" value={formData.album} onChange={e => setFormData({...formData, album: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg" placeholder="Optional" />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">DIREÇÃO</label>
                  <input type="text" value={formData.direcao} onChange={e => setFormData({...formData, direcao: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg" placeholder="Music Video Director" />
                </div>

                <div className="group">
                  <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">YOUTUBE VIDEO ID</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.video_id} onChange={e => setFormData({...formData, video_id: e.target.value})} className="flex-1 p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg font-mono text-cyan-400" placeholder="6hzrDeceEKc" />
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
                      <div className="p-3 w-16 text-center">ID</div>
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
                        style={{ height: '100%', width: '100%' }}
                        className="custom-scrollbar"
                        initialTopMostItemIndex={0}
                        onScroll={(e: any) => setScrollOffset(e.currentTarget.scrollTop)}
                        itemContent={(index, item) => {
                          if (!item) return null;
                          const isActive = editId === String(item.id);
                          const isPlaying = playingId === String(item.id);
                          return (
                            <div className={`border-b border-amber-900/10 transition-colors group flex items-center font-jost py-2 ${isActive ? 'bg-amber-600/30' : isPlaying ? 'bg-cyan-900/40' : 'hover:bg-amber-900/30'}`}>
                              <div className="p-3 w-16 font-mono text-center text-xs opacity-50 flex-shrink-0">{item.id}</div>
                              <div className="p-3 flex-1 min-w-0">
                                <div className="text-xl leading-tight text-amber-500 tracking-wide whitespace-normal break-words font-jost">{item.artista}</div>
                                <div className="text-xl font-bold text-white mt-1 whitespace-normal break-words font-jost">{item.musica || '---'}</div>
                                <div className="text-[10px] text-cyan-500/80 mt-1 italic whitespace-normal break-words font-jost">{item.album || '(No Album)'}</div>
                              </div>
                              <div className="p-3 w-40 hidden sm:block flex-shrink-0">
                                <div className="text-sm font-jost text-orange-500 font-bold">{item.ano || '----'}</div>
                                <div className="text-[10px] text-orange-700 mt-1 font-jost whitespace-normal break-words max-w-[150px]">{item.direcao ? `DIR: ${item.direcao}` : 'NO DIRECTOR'}</div>
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
                                }} className="text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/50 px-3 py-1 font-bold transition-all uppercase text-xs">EDIT</button>
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
