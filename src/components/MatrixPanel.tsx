import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { Virtuoso } from 'react-virtuoso';
import { sanitizeHTML } from '../lib/sanitize.ts';

// ─── Normalização de Texto (Ignora acentos e maiúsculas/minúsculas) ─────────
export const normalizarTexto = (str: any): string => {
  if (!str) return '';
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// ─── Função de Busca de Clipes para Curadoria (Vanilla JS / Supabase) ───────
export const buscarClipesCuradoria = async (
  termoBusca: string,
  todosVideosAcervo: VideoEntry[] = [],
  supabaseClient?: any
): Promise<VideoEntry[]> => {
  const termoNorm = normalizarTexto(termoBusca);
  if (!termoNorm || termoNorm.length < 2) return [];

  const filtrarLista = (lista: VideoEntry[]) => {
    return lista.filter(item => {
      const titulo = normalizarTexto(item.musica || '');
      const artista = normalizarTexto(item.artista || '');
      const album = normalizarTexto(item.album || '');
      const direcao = normalizarTexto(item.direcao || '');

      return (
        titulo.includes(termoNorm) ||
        artista.includes(termoNorm) ||
        album.includes(termoNorm) ||
        direcao.includes(termoNorm)
      );
    });
  };

  // 1. Prioriza filtragem client-side no acervo completo em memória
  if (todosVideosAcervo && todosVideosAcervo.length > 0) {
    const resultados = filtrarLista(todosVideosAcervo);
    if (resultados.length > 0 || !supabaseClient) {
      return resultados;
    }
  }

  // 2. Busca direta no Supabase com .range(0, 999) como fallback abrangente
  if (supabaseClient) {
    const termoLimpo = termoBusca.trim();
    const { data, error } = await supabaseClient
      .from('musicas_backup')
      .select('id, artista, musica, album, ano, direcao, video_id, playlist, plataforma')
      .or(`musica.ilike.%${termoLimpo}%,artista.ilike.%${termoLimpo}%,album.ilike.%${termoLimpo}%`)
      .range(0, 999);

    if (!error && data) {
      return filtrarLista(data as VideoEntry[]);
    }
  }

  return [];
};

// ─── Types ─────────────────────────────────────────────────────────────────

type ChannelEntry = {
  id: number;
  name: string;
  group_name?: string;
  descricao?: string;
  marca_dagua_url?: string;
};

type VideoEntry = {
  id: number;
  artista?: string;
  musica?: string;
  album?: string;
  ano?: string;
  direcao?: string;
  video_id?: string;
  playlist?: string;
  plataforma?: string;
};

const FIXED_GROUPS = ['UPLOADS', 'GENRES', 'ZONES', 'ERAS', 'OTHERS'];

// ─── Rich Description Editor (inline, no external dep) ─────────────────────

interface DescEditorProps {
  value: string;
  onChange: (v: string) => void;
}

function DescriptionEditor({ value, onChange }: DescEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="group relative">
      <div className="flex justify-between items-end mb-1">
        <label className="text-xs text-matrix-label uppercase font-bold tracking-wider">DESCRIÇÃO</label>
        {/* Toolbar idêntica ao RichTextInput */}
        <div className="flex gap-1 bg-black border border-matrix-border/30 rounded-t px-1 py-0.5 opacity-40 group-focus-within:opacity-100 transition-opacity">
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('bold'); }}
            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-matrix-accent hover:text-black rounded transition-colors text-matrix-accent"
            title="Bold">B</button>
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('italic'); }}
            className="w-5 h-5 flex items-center justify-center text-[10px] italic hover:bg-matrix-accent hover:text-black rounded transition-colors text-matrix-accent"
            title="Italic">I</button>
          <button type="button" onMouseDown={e => { e.preventDefault(); exec('underline'); }}
            className="w-5 h-5 flex items-center justify-center text-[10px] underline hover:bg-matrix-accent hover:text-black rounded transition-colors text-matrix-accent"
            title="Underline">U</button>
          <button type="button" onMouseDown={e => {
            e.preventDefault();
            const sel = window.getSelection();
            if (!sel?.rangeCount) return;
            const range = sel.getRangeAt(0);
            const sym = document.createTextNode('「」');
            range.deleteContents(); range.insertNode(sym);
            range.setStart(sym, 1); range.setEnd(sym, 1);
            sel.removeAllRanges(); sel.addRange(range);
            if (ref.current) onChange(ref.current.innerHTML);
          }}
            className="px-1 h-5 flex items-center justify-center text-[10px] hover:bg-matrix-accent hover:text-black rounded transition-colors text-matrix-accent"
            title="Version brackets">「」</button>
        </div>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        onPaste={handlePaste}
        className="matrix-desc-editor w-full p-2 bg-black border border-matrix-border/40 outline-none focus:border-matrix-accent text-base min-h-[80px] break-words text-white/80 font-jost"
        data-placeholder="Descrição do canal..."
      />
    </div>
  );
}

// ─── Watermark Preview ──────────────────────────────────────────────────────

function WatermarkPreview({ url }: { url: string }) {
  if (!url) return null;
  const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
  return (
    <div className="mt-2 flex items-center gap-2 p-2 bg-black/60 border border-matrix-border/30 rounded">
      {isVideo ? (
        <video src={url} autoPlay loop muted playsInline className="w-16 h-10 object-contain rounded opacity-80" />
      ) : (
        <img src={url} alt="preview" className="w-16 h-10 object-contain rounded opacity-80" />
      )}
      <span className="text-[10px] text-matrix-label/60 font-jost truncate flex-1">{url.split('/').pop()}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface MatrixPanelProps {
  session: Session | null;
  currentChannelName: string;
  onEditVideo: (id: string) => void;
  onChannelUpdated?: () => void; // notifica Home.tsx para re-fetch do guide
}

export default function MatrixPanel({ session, currentChannelName, onEditVideo, onChannelUpdated }: MatrixPanelProps) {

  // ── Channel list state ──
  const [channels, setChannels] = useState<ChannelEntry[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelEntry | null>(null);
  const [channelStatusMsg, setChannelStatusMsg] = useState({ text: '', isError: false });

  // ── Channel form state ──
  const [formTitle, setFormTitle] = useState('');
  const [formGroup, setFormGroup] = useState('');
  const [formGroupCustom, setFormGroupCustom] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [currentWatermarkUrl, setCurrentWatermarkUrl] = useState('');
  const [isSavingChannel, setIsSavingChannel] = useState(false);
  const [isNewChannel, setIsNewChannel] = useState(false);
  const [existingGroups, setExistingGroups] = useState<string[]>([]);

  // ── Video curation state ──
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videoSearch, setVideoSearch] = useState('');
  const videoListRef = useRef<any>(null);
  const [videoStatusMsg, setVideoStatusMsg] = useState({ text: '', isError: false });

  // ── Available videos for "Add" (Acervo real de clipes) ──
  const [todosVideosAcervo, setTodosVideosAcervo] = useState<VideoEntry[]>([]);
  const [isAcervoLoading, setIsAcervoLoading] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addResults, setAddResults] = useState<VideoEntry[]>([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const addSearchRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const showChannelMsg = (text: string, isError = false) => {
    setChannelStatusMsg({ text, isError });
    setTimeout(() => setChannelStatusMsg({ text: '', isError: false }), 3500);
  };

  const showVideoMsg = (text: string, isError = false) => {
    setVideoStatusMsg({ text, isError });
    setTimeout(() => setVideoStatusMsg({ text: '', isError: false }), 3500);
  };

  // ─── Load channels ────────────────────────────────────────────────────────

  const fetchChannels = useCallback(async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('id, name, group_name, descricao, marca_dagua_url')
      .order('name', { ascending: true });

    if (!error && data) {
      setChannels(data as ChannelEntry[]);
      // Collect unique existing groups from DB
      const groups = [...new Set(data.map((c: any) => c.group_name).filter(Boolean))].sort() as string[];
      // Merge with fixed groups
      const allGroups = [...new Set([...FIXED_GROUPS, ...groups])].sort();
      setExistingGroups(allGroups);
    }
  }, []);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);

  // Pre-select current channel
  useEffect(() => {
    if (currentChannelName && channels.length > 0) {
      const ch = channels.find(c => c.name === currentChannelName);
      if (ch) selectChannel(ch);
    }
  }, [currentChannelName, channels.length]);

  // ─── Select channel ───────────────────────────────────────────────────────

  const selectChannel = (ch: ChannelEntry) => {
    setSelectedChannel(ch);
    setFormTitle(ch.name);
    setFormGroup(ch.group_name || '');
    setFormGroupCustom('');
    setFormDesc(ch.descricao || '');
    setCurrentWatermarkUrl(ch.marca_dagua_url || '');
    setWatermarkFile(null);
    setIsNewChannel(false);
    setVideoSearch('');
  };

  // ─── New channel ──────────────────────────────────────────────────────────

  const startNewChannel = () => {
    setSelectedChannel(null);
    setFormTitle('');
    setFormGroup('OTHERS');
    setFormGroupCustom('');
    setFormDesc('');
    setCurrentWatermarkUrl('');
    setWatermarkFile(null);
    setIsNewChannel(true);
    setVideos([]);
  };

  // ─── Carregar acervo geral (range 0 a 999) para curadoria abrangente ───
  const carregarAcervo = useCallback(async () => {
    setIsAcervoLoading(true);
    const { data, error } = await supabase
      .from('musicas_backup')
      .select('id, artista, musica, album, ano, direcao, video_id, playlist, plataforma')
      .order('id', { ascending: false })
      .range(0, 999);

    if (!error && data) {
      setTodosVideosAcervo(data as VideoEntry[]);
    }
    setIsAcervoLoading(false);
  }, []);

  useEffect(() => {
    carregarAcervo();
  }, [carregarAcervo]);

  // ─── Fetch videos for selected channel ───────────────────────────────────

  useEffect(() => {
    if (!selectedChannel) { setVideos([]); return; }
    fetchChannelVideos(selectedChannel.name);
  }, [selectedChannel]);

  const fetchChannelVideos = async (playlistName: string) => {
    setVideosLoading(true);
    const { data, error } = await supabase
      .from('musicas_backup')
      .select('id, artista, musica, album, ano, direcao, video_id, playlist, plataforma')
      .eq('playlist', playlistName)
      .order('id', { ascending: false })
      .range(0, 2999);

    if (!error && data) setVideos(data as VideoEntry[]);
    setVideosLoading(false);
  };

  // Filtragem da lista do canal atual com normalização de acentos e case
  const displayedVideos = useMemo(() => {
    if (!videoSearch.trim()) return videos;
    const termoNorm = normalizarTexto(videoSearch);
    return videos.filter(v => {
      const titulo = normalizarTexto(v.musica || '');
      const artista = normalizarTexto(v.artista || '');
      const album = normalizarTexto(v.album || '');
      const direcao = normalizarTexto(v.direcao || '');
      return (
        titulo.includes(termoNorm) ||
        artista.includes(termoNorm) ||
        album.includes(termoNorm) ||
        direcao.includes(termoNorm)
      );
    });
  }, [videos, videoSearch]);

  // ─── Upload watermark to Supabase Storage ────────────────────────────────

  const uploadWatermark = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `watermark_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('marca-dagua')
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (error) {
      showChannelMsg(`UPLOAD ERRO: ${error.message}`, true);
      return null;
    }

    const { data: urlData } = supabase.storage.from('marca-dagua').getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  };

  // ─── Save channel ─────────────────────────────────────────────────────────

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) { showChannelMsg('TÍTULO OBRIGATÓRIO', true); return; }

    setIsSavingChannel(true);

    // Determine group: custom text overrides select
    const finalGroup = formGroupCustom.trim()
      ? formGroupCustom.trim().toUpperCase()
      : (formGroup || 'OTHERS');

    let watermarkUrl = currentWatermarkUrl;

    // Upload new file if selected
    if (watermarkFile) {
      const uploaded = await uploadWatermark(watermarkFile);
      if (!uploaded) { setIsSavingChannel(false); return; }
      watermarkUrl = uploaded;
    }

    const payload = {
      name: formTitle.trim(),
      group_name: finalGroup,
      descricao: formDesc || null,
      marca_dagua_url: watermarkUrl || null,
    };

    if (isNewChannel) {
      const { data, error } = await supabase.from('playlists').insert([payload]).select().single();
      if (error) {
        showChannelMsg(`ERRO: ${error.message}`, true);
      } else {
        showChannelMsg('CANAL CRIADO!');
        await fetchChannels();
        if (data) selectChannel(data as ChannelEntry);
        setIsNewChannel(false);
        if (onChannelUpdated) onChannelUpdated();
      }
    } else if (selectedChannel) {
      const { error } = await supabase
        .from('playlists')
        .update(payload)
        .eq('id', selectedChannel.id);

      if (error) {
        showChannelMsg(`ERRO: ${error.message}`, true);
      } else {
        showChannelMsg('CANAL ATUALIZADO!');
        setCurrentWatermarkUrl(watermarkUrl);
        setWatermarkFile(null);
        await fetchChannels();
        if (onChannelUpdated) onChannelUpdated();
      }
    }

    setIsSavingChannel(false);
  };

  // ─── Delete channel ───────────────────────────────────────────────────────

  const handleDeleteChannel = async () => {
    if (!selectedChannel) return;
    if (!confirm(`Excluir canal "${selectedChannel.name}"? Esta ação não pode ser desfeita.`)) return;

    const { error } = await supabase.from('playlists').delete().eq('id', selectedChannel.id);
    if (error) {
      showChannelMsg(`ERRO AO EXCLUIR: ${error.message}`, true);
    } else {
      showChannelMsg('CANAL EXCLUÍDO.');
      setSelectedChannel(null);
      setVideos([]);
      await fetchChannels();
      if (onChannelUpdated) onChannelUpdated();
    }
  };

  // ─── Remove video from channel ────────────────────────────────────────────

  const handleRemoveVideo = async (video: VideoEntry) => {
    const { error } = await supabase
      .from('musicas_backup')
      .update({ playlist: null, playlist_group: null })
      .eq('id', video.id);

    if (error) {
      showVideoMsg(`ERRO: ${error.message}`, true);
    } else {
      showVideoMsg(`"${video.musica || video.artista}" removido do canal.`);
      setVideos(prev => prev.filter(v => v.id !== video.id));
      setTodosVideosAcervo(prev => prev.map(v => v.id === video.id ? { ...v, playlist: undefined } : v));
    }
  };

  // ─── Add video search (Curadoria Abrangente) ───────────────────────────────

  useEffect(() => {
    if (!addSearch.trim() || addSearch.length < 2) {
      setAddResults([]);
      setShowAddDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      const resultados = await buscarClipesCuradoria(addSearch, todosVideosAcervo, supabase);
      setAddResults(resultados.slice(0, 50));
      setShowAddDropdown(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [addSearch, todosVideosAcervo]);

  const handleAddVideo = async (video: VideoEntry) => {
    if (!selectedChannel) return;
    const { error } = await supabase
      .from('musicas_backup')
      .update({ playlist: selectedChannel.name, playlist_group: formGroup || selectedChannel.group_name || null })
      .eq('id', video.id);

    if (error) {
      showVideoMsg(`ERRO AO ADICIONAR: ${error.message}`, true);
    } else {
      showVideoMsg(`"${video.musica || video.artista}" adicionado!`);
      setAddSearch('');
      setShowAddDropdown(false);
      setAddResults([]);
      const updated = { ...video, playlist: selectedChannel.name };
      setVideos(prev => [updated, ...prev]);
      setTodosVideosAcervo(prev => prev.map(v => v.id === video.id ? updated : v));
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="matrix-panel flex h-full font-jost">

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR ESQUERDA — CHANNEL EDITOR
      ══════════════════════════════════════════════════════════ */}
      <aside className="matrix-sidebar-left w-[380px] flex-shrink-0 h-full flex flex-col bg-[#010d06] border-r border-matrix-border/30 overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-matrix-border/30 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-widest uppercase text-matrix-accent drop-shadow-[0_0_8px_rgba(0,255,136,0.4)]">
              ⬡ MATRIX
            </h2>
            <p className="text-[10px] text-matrix-label/50 uppercase tracking-wider">Channel Management System</p>
          </div>
          <span className="text-[10px] font-bold text-matrix-label/40 uppercase tracking-widest border border-matrix-border/30 px-2 py-1">
            {channels.length} CANAIS
          </span>
        </div>

        {/* Status msg */}
        {channelStatusMsg.text && (
          <div className={`shrink-0 px-4 py-2 text-center text-sm font-bold uppercase tracking-widest border-y ${channelStatusMsg.isError ? 'bg-red-900/40 text-red-400 border-red-500/40' : 'bg-matrix-accent/10 text-matrix-accent border-matrix-accent/30'}`}>
            {channelStatusMsg.text}
          </div>
        )}

        {/* Channel List */}
        <div className="shrink-0 px-4 py-3 border-b border-matrix-border/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-matrix-label/50 uppercase tracking-widest font-bold">Canais</span>
            <button
              onClick={startNewChannel}
              className="text-[10px] font-bold text-matrix-accent border border-matrix-accent/50 px-2 py-1 hover:bg-matrix-accent hover:text-black transition-all uppercase tracking-wider"
            >
              + Novo Canal
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto matrix-scrollbar space-y-0.5">
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => selectChannel(ch)}
                className={`w-full text-left px-3 py-2 text-sm transition-all border-l-2 ${
                  selectedChannel?.id === ch.id
                    ? 'bg-matrix-accent/10 border-matrix-accent text-matrix-accent'
                    : 'border-transparent text-white/50 hover:border-matrix-border hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold">{ch.name}</span>
                  {ch.marca_dagua_url && <span className="text-matrix-accent text-[10px] opacity-60 shrink-0">◈ WM</span>}
                </div>
                {ch.group_name && (
                  <div className="text-[10px] opacity-40 uppercase tracking-widest mt-0.5">{ch.group_name}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Channel Form */}
        <div className="flex-1 overflow-y-auto matrix-scrollbar">
          {(selectedChannel || isNewChannel) ? (
            <form onSubmit={handleSaveChannel} className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-matrix-accent/80 uppercase tracking-widest border-b border-matrix-border/20 pb-2">
                {isNewChannel ? '+ NOVO CANAL' : `EDITAR: ${selectedChannel?.name}`}
              </h3>

              {/* Título */}
              <div>
                <label className="block text-[10px] text-matrix-label uppercase mb-1 font-bold tracking-wider">TÍTULO *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="matrix-input w-full"
                  placeholder="Ex: ROCK: 90s Classics"
                  required
                />
              </div>

              {/* Grupo */}
              <div>
                <label className="block text-[10px] text-matrix-label uppercase mb-1 font-bold tracking-wider">GRUPO</label>
                <select
                  value={formGroup}
                  onChange={e => setFormGroup(e.target.value)}
                  className="matrix-input w-full mb-2"
                >
                  <option value="">— Selecionar grupo —</option>
                  {existingGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="__custom__">✎ Criar novo grupo...</option>
                </select>
                {/* Custom group input */}
                {formGroup === '__custom__' && (
                  <input
                    type="text"
                    value={formGroupCustom}
                    onChange={e => setFormGroupCustom(e.target.value)}
                    className="matrix-input w-full"
                    placeholder="Nome do novo grupo (ex: VIBES)"
                  />
                )}
                {formGroup && formGroup !== '__custom__' && (
                  <p className="text-[10px] text-matrix-label/40 mt-1">
                    Ou digite abaixo para criar um grupo novo:
                  </p>
                )}
                {formGroup !== '__custom__' && (
                  <input
                    type="text"
                    value={formGroupCustom}
                    onChange={e => setFormGroupCustom(e.target.value)}
                    className="matrix-input w-full mt-1"
                    placeholder="Novo grupo personalizado (deixe vazio para usar o acima)"
                  />
                )}
              </div>

              {/* Descrição (RichText) */}
              <DescriptionEditor value={formDesc} onChange={setFormDesc} />

              {/* Upload Marca D'água */}
              <div>
                <label className="block text-[10px] text-matrix-label uppercase mb-1 font-bold tracking-wider">
                  MARCA D'ÁGUA
                  <span className="opacity-40 normal-case font-normal ml-2">(png, gif, mp4)</span>
                </label>
                <div
                  className="relative border border-dashed border-matrix-border/40 p-3 text-center cursor-pointer hover:border-matrix-accent/60 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/gif,video/mp4,video/webm"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] || null;
                      setWatermarkFile(f);
                    }}
                  />
                  {watermarkFile ? (
                    <div className="flex items-center justify-center gap-2 text-matrix-accent text-sm">
                      <span>📎</span>
                      <span className="truncate max-w-[200px]">{watermarkFile.name}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setWatermarkFile(null); }}
                        className="text-red-400 hover:text-red-300 ml-1"
                      >×</button>
                    </div>
                  ) : (
                    <span className="text-xs text-matrix-label/40 group-hover:text-matrix-label/70 transition-colors">
                      Clique para selecionar arquivo →
                    </span>
                  )}
                </div>
                {/* Preview da marca atual */}
                {currentWatermarkUrl && !watermarkFile && (
                  <>
                    <p className="text-[10px] text-matrix-label/40 mt-1">Atual:</p>
                    <WatermarkPreview url={currentWatermarkUrl} />
                    <button
                      type="button"
                      onClick={() => setCurrentWatermarkUrl('')}
                      className="mt-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕ Remover marca d'água
                    </button>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingChannel}
                  className="flex-1 py-3 matrix-btn-primary font-bold text-sm uppercase tracking-widest"
                >
                  {isSavingChannel ? 'SALVANDO...' : (isNewChannel ? 'CRIAR CANAL' : 'SALVAR')}
                </button>
                {!isNewChannel && selectedChannel && (
                  <button
                    type="button"
                    onClick={handleDeleteChannel}
                    className="px-4 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-all text-sm font-bold uppercase tracking-wider"
                    title="Excluir canal"
                  >
                    🗑
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-center h-32 opacity-30 text-sm text-matrix-label uppercase tracking-widest">
              Selecione um canal
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR DIREITA — VIDEO CURATION
      ══════════════════════════════════════════════════════════ */}
      <section className="matrix-sidebar-right flex-1 h-full flex flex-col bg-[#010a0e] overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-matrix-border-cyan/30 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-widest uppercase text-matrix-cyan">
              ◈ CURADORIA
            </h2>
            <p className="text-[10px] text-matrix-cyan/40 uppercase tracking-wider">
              {selectedChannel ? selectedChannel.name : 'Selecione um canal à esquerda'}
            </p>
          </div>
          <span className="text-[10px] font-bold text-matrix-cyan/40 uppercase border border-matrix-border-cyan/30 px-2 py-1">
            {videoSearch ? `${displayedVideos.length} / ${videos.length}` : `${videos.length}`} VÍDEOS
          </span>
        </div>

        {/* Video status msg */}
        {videoStatusMsg.text && (
          <div className={`shrink-0 px-4 py-2 text-center text-sm font-bold uppercase tracking-widest border-y ${videoStatusMsg.isError ? 'bg-red-900/40 text-red-400 border-red-500/40' : 'bg-matrix-cyan/10 text-matrix-cyan border-matrix-cyan/30'}`}>
            {videoStatusMsg.text}
          </div>
        )}

        {/* Add Video Bar */}
        {selectedChannel && (
          <div className="shrink-0 px-4 py-3 border-b border-matrix-border-cyan/20 relative">
            <label className="text-[10px] text-matrix-cyan/50 uppercase mb-1 font-bold tracking-wider flex justify-between items-center">
              <span>INCLUIR VÍDEO (CURADORIA DO ACERVO)</span>
              {isAcervoLoading && (
                <span className="text-[9px] text-matrix-cyan/40 font-normal lowercase animate-pulse">carregando acervo...</span>
              )}
            </label>
            <div className="relative">
              <input
                ref={addSearchRef}
                type="text"
                value={addSearch}
                onChange={e => setAddSearch(e.target.value)}
                onFocus={() => addSearch.length >= 2 && setShowAddDropdown(true)}
                className="matrix-input-cyan w-full pr-8"
                placeholder="Buscar música, artista, álbum no acervo..."
              />
              {addSearch && (
                <button type="button" onClick={() => { setAddSearch(''); setShowAddDropdown(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-matrix-cyan/40 hover:text-matrix-cyan text-lg">×</button>
              )}
              {showAddDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#010d12] border border-matrix-border-cyan/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.9)] max-h-60 overflow-y-auto matrix-scrollbar-cyan">
                  {addResults.length > 0 ? (
                    addResults.map(v => (
                      <div
                        key={v.id}
                        onClick={() => handleAddVideo(v)}
                        className="p-3 hover:bg-matrix-cyan/10 cursor-pointer border-b border-matrix-border-cyan/10 last:border-0 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-white font-bold truncate">{v.artista || 'Artista desconhecido'}</div>
                          <div className="text-xs text-matrix-cyan/70 truncate">
                            {v.musica || 'Sem título'}
                            {v.album ? ` • ${v.album}` : ''}
                            {v.ano ? ` (${v.ano})` : ''}
                          </div>
                        </div>
                        {v.playlist ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded border border-matrix-border-cyan/30 text-matrix-cyan/60 uppercase font-mono shrink-0">
                            {v.playlist}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-matrix-cyan/20 text-matrix-cyan uppercase font-mono shrink-0">
                            + ADD
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-matrix-cyan/40 text-center uppercase tracking-wider">
                      Nenhum clipe encontrado no acervo
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Bar */}
        {selectedChannel && (
          <div className="shrink-0 px-4 pb-3 border-b border-matrix-border-cyan/20">
            <label className="block text-[10px] text-matrix-cyan/50 uppercase mb-1 font-bold tracking-wider">FILTRAR LISTA</label>
            <input
              type="text"
              value={videoSearch}
              onChange={e => setVideoSearch(e.target.value)}
              className="matrix-input-cyan w-full"
              placeholder="Artista ou música..."
            />
          </div>
        )}

        {/* Table Header — clone do AdminPanel */}
        {selectedChannel && (
          <div className="shrink-0 bg-[#010d12] border-b border-matrix-cyan/40 z-10">
            <div className="flex text-[10px] uppercase text-matrix-cyan/60 font-bold tracking-[0.2em]">
              <div className="p-3 w-10 text-center">ID</div>
              <div className="p-3 flex-1">ARTISTA / MÚSICA</div>
              <div className="p-3 w-28 hidden sm:block text-center">AÇÕES</div>
            </div>
          </div>
        )}

        {/* Videos List (Virtuoso) */}
        <div className="flex-1 overflow-hidden">
          {!selectedChannel ? (
            <div className="flex items-center justify-center h-full opacity-30 text-sm text-matrix-cyan uppercase tracking-widest">
              Selecione um canal
            </div>
          ) : videosLoading ? (
            <div className="flex items-center justify-center h-full text-matrix-cyan animate-pulse text-xl tracking-widest uppercase">
              Carregando sinais...
            </div>
          ) : displayedVideos.length === 0 ? (
            <div className="flex items-center justify-center h-full opacity-30 text-sm text-matrix-cyan uppercase tracking-widest">
              {videoSearch ? 'Nenhum vídeo corresponde ao filtro.' : 'Nenhum vídeo neste canal.'}
            </div>
          ) : (
            <Virtuoso
              ref={videoListRef}
              data={displayedVideos}
              style={{ height: '100%' }}
              className="matrix-scrollbar-cyan"
              itemContent={(_, video) => {
                if (!video) return null;
                const isVimeo = video.plataforma === 'vimeo' || /^\d+$/.test(String(video.video_id || ''));
                return (
                  <div className="border-b border-matrix-border-cyan/10 hover:bg-matrix-cyan/5 transition-colors group flex items-center py-1.5">
                    {/* ID column */}
                    <div className="p-1 w-10 font-mono text-center text-[10px] opacity-30 flex-shrink-0 [writing-mode:vertical-rl] rotate-180 h-14 flex items-center justify-center border-r border-matrix-border-cyan/10">
                      {video.id}
                    </div>
                    {/* Info column */}
                    <div className="p-3 flex-1 min-w-0">
                      <div
                        className="text-sm leading-tight text-matrix-cyan/80 tracking-wide whitespace-normal break-words"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(video.artista || '') }}
                      />
                      <div
                        className="text-sm font-bold text-white mt-0.5 whitespace-normal break-words"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(video.musica || '---') }}
                      />
                      <div className="flex items-center gap-2 mt-0.5">
                        {video.ano && <span className="text-[10px] text-matrix-cyan/40">{video.ano}</span>}
                        <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border font-bold ${
                          isVimeo
                            ? 'text-cyan-300 border-cyan-500/40 bg-cyan-900/20'
                            : 'text-red-300 border-red-500/40 bg-red-900/20'
                        }`}>
                          {isVimeo ? 'VIM' : 'YT'}
                        </span>
                      </div>
                    </div>
                    {/* Actions column */}
                    <div className="p-2 w-28 flex-shrink-0 flex flex-col gap-1">
                      {/* Edit Video */}
                      <button
                        onClick={() => onEditVideo(String(video.id))}
                        title="Edit Video"
                        className="matrix-action-btn matrix-action-btn--edit text-[9px]"
                      >
                        ✎ EDIT
                      </button>
                      {/* Remove from channel */}
                      <button
                        onClick={() => handleRemoveVideo(video)}
                        title="Remover do canal"
                        className="matrix-action-btn matrix-action-btn--remove text-[9px]"
                      >
                        ✕ REMOVER
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>

        {/* Footer */}
        {selectedChannel && (
          <div className="shrink-0 px-4 py-2 bg-[#010a0e] border-t border-matrix-border-cyan/20 flex justify-between text-[10px] uppercase font-bold text-matrix-cyan/30 tracking-widest">
            <span>Canal: {selectedChannel.name}</span>
            <span>{videoSearch ? `${displayedVideos.length} de ${videos.length}` : `${videos.length}`} registros</span>
          </div>
        )}
      </section>
    </div>
  );
}
