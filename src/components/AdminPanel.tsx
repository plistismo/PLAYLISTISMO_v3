import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';

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

interface AdminPanelProps {
  session: Session | null;
  editId?: string | null;
  onClose?: () => void;
  onSave?: () => void;
}

export default function AdminPanel({ session, editId, onClose, onSave }: AdminPanelProps) {
  const [data, setData] = useState<MusicEntry[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<string[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  
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

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    fetchMusics();
  }, [searchTerm, selectedGroup, selectedPlaylist]);

  useEffect(() => {
    if (editId) {
      loadSpecificVideo(editId);
    }
  }, [editId]);

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
      .limit(100); // Reduced limit for sidebar performance

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
    <div className="flex flex-col h-full text-amber-500 font-vt323 bg-black border-l-2 border-amber-800/50 shadow-[-20px_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
      <div className="p-6 border-b border-amber-800/50 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-4xl font-bold tracking-widest uppercase text-amber-500 drop-shadow-[0_0_8px_rgba(217,119,6,0.3)]">Service Mode</h2>
          <p className="text-amber-700 text-sm uppercase tracking-wider">Database Manipulation Side-Unit // All Access</p>
        </div>
        <button onClick={onClose} className="bg-amber-900/20 text-amber-500 border border-amber-800/50 w-10 h-10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all text-2xl">×</button>
      </div>

      {statusMsg.show && (
        <div className={`p-2 text-center text-xl font-bold border-y shrink-0 z-20 ${statusMsg.isError ? 'bg-red-900 text-white border-red-500' : 'bg-amber-900/40 text-amber-500 border-amber-500'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="p-4 bg-[#0d0d0d] border-b border-amber-900/30 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700">Global Search</label>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="SEARCH DATABASE..." className="bg-black border border-amber-900/50 text-amber-500 outline-none p-2 w-full text-lg focus:border-amber-500 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700">Filter Group</label>
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="bg-black border border-amber-900/50 text-amber-500 outline-none p-2 w-full text-lg cursor-pointer">
                <option value="">ALL GROUPS</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700">Filter Playlist</label>
              <select value={selectedPlaylist} onChange={e => setSelectedPlaylist(e.target.value)} className="bg-black border border-amber-900/50 text-amber-500 outline-none p-2 w-full text-lg cursor-pointer">
                <option value="">ALL PLAYLISTS</option>
                {playlists.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Form Side */}
          <section className="w-full lg:w-1/3 bg-[#0a0a0a] border-r border-amber-900/30 p-6 overflow-y-auto custom-scrollbar flex-shrink-0">
            <h3 className="text-2xl mb-6 border-b border-amber-900/30 pb-2 flex justify-between items-center">
              <span className="font-bold">{isEditing ? `EDIT #${formData.id}` : 'NEW UNIT'}</span>
              {isEditing && <button onClick={clearForm} className="text-xs text-amber-700 hover:text-amber-500 transition-colors uppercase underline">Cancel Edit</button>}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label className="block text-xs text-amber-700 uppercase mb-1 font-bold group-focus-within:text-amber-500 transition-colors">ARTISTA *</label>
                <input type="text" value={formData.artista} onChange={e => setFormData({...formData, artista: e.target.value})} required className="w-full p-2 bg-black border border-amber-900/50 text-amber-500 outline-none focus:border-amber-500 text-lg" placeholder="Ex: Oasis" />
              </div>
              
              <div className="group">
                <label className="block text-xs text-amber-700 uppercase mb-1 font-bold group-focus-within:text-amber-500 transition-colors">MÚSICA</label>
                <input type="text" value={formData.musica} onChange={e => setFormData({...formData, musica: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 text-amber-500 outline-none focus:border-amber-500 text-lg" placeholder="Ex: Wonderwall" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">ANO</label>
                  <input type="number" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 text-amber-500 outline-none focus:border-amber-500 text-lg" placeholder="1995" />
                </div>
                <div className="group">
                  <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">ÁLBUM</label>
                  <input type="text" value={formData.album} onChange={e => setFormData({...formData, album: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 text-amber-500 outline-none focus:border-amber-500 text-lg" placeholder="Optional" />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">DIREÇÃO</label>
                <input type="text" value={formData.direcao} onChange={e => setFormData({...formData, direcao: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 text-amber-500 outline-none focus:border-amber-500 text-lg" placeholder="Music Video Director" />
              </div>

              <div className="group">
                <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">YOUTUBE VIDEO ID</label>
                <input type="text" value={formData.video_id} onChange={e => setFormData({...formData, video_id: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 text-amber-500 outline-none focus:border-amber-500 text-lg font-mono" placeholder="6hzrDeceEKc" />
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-4 bg-amber-900/20 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-bold text-2xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.1)] active:translate-y-1">
                {isSaving ? "TRANSMITTING..." : (isEditing ? "UPDATE RECORDS" : "COMMIT TO DB")}
              </button>
            </form>
          </section>

          {/* Table Side */}
          <section className="flex-1 flex flex-col overflow-hidden bg-black">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#111] z-10 border-b border-amber-500/50 shadow-lg">
                  <tr className="text-[10px] uppercase text-amber-700 font-bold tracking-[0.2em]">
                    <th className="p-3 w-12 text-center">ID</th>
                    <th className="p-3">ARTISTA / MÚSICA / ÁLBUM</th>
                    <th className="p-3 hidden sm:table-cell">DETALHES (ANO/DIR)</th>
                    <th className="p-3 w-20 text-center">AÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10">
                  {loading ? (
                    <tr><td colSpan={4} className="text-center p-20 animate-pulse text-2xl tracking-[0.2em] text-amber-500 uppercase">Accessing Mainframe...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={4} className="text-center p-20 opacity-40 text-xl uppercase tracking-widest text-amber-700">No signals detected.</td></tr>
                  ) : (
                    data.map(item => (
                      <tr key={item.id} className="hover:bg-amber-900/10 transition-colors group">
                        <td className="p-3 font-mono text-center text-xs opacity-50">{item.id}</td>
                        <td className="p-3">
                          <div className="font-bold text-xl leading-none text-[#00ff00] uppercase tracking-wide">{item.artista}</div>
                          <div className="text-sm opacity-90 mt-1">{item.musica || '---'}</div>
                          <div className="text-[10px] opacity-60 mt-1 uppercase italic">{item.album || '(No Album)'}</div>
                        </td>
                        <td className="p-3 hidden sm:table-cell align-middle">
                          <div className="text-sm font-mono text-amber-600">{item.ano || '----'}</div>
                          <div className="text-[10px] opacity-70 mt-1 uppercase truncate max-w-[150px]">{item.direcao ? `DIR: ${item.direcao}` : 'NO DIRECTOR'}</div>
                        </td>
                        <td className="p-3 text-center align-middle">
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
                          }} className="text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/50 px-3 py-1 font-bold transition-all uppercase text-xs">EDIT</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-[#080808] border-t border-amber-900/30 flex justify-between items-center text-[10px] uppercase font-bold text-amber-700 tracking-[0.2em]">
              <span>Status: Active</span>
              <span>Detected Signals: {totalRecords}</span>
            </div>
          </section>
        </div>
      </div>

      <div className="p-4 text-[10px] text-amber-900 text-center uppercase tracking-[0.6em] shrink-0 bg-[#050505] border-t border-amber-900/20 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        Sony Trinitron Service System // Debug Mode Active // All Records Mode
      </div>
    </div>
  );
}
