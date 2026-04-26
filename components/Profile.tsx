import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, Message } from '../types';
import { supabase } from '../services/supabase';
import { getLatestAvatarUrl } from '../services/avatarService';
import ImageModal from './ImageModal';
import GalleryModal from './GalleryModal';

interface ProfileProps {
  initialProfile: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
  onBack: () => void;
  onOpenGallery?: () => void;
}

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    } as const
  },
  exit: { opacity: 0 }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.98 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 } as const
  }
};

// --- INTERNAL SUB-COMPONENTS ---

const VideoThumbnail: React.FC<{ src: string }> = ({ src }) => (
  <div className="relative w-full h-full bg-zinc-900 group">
    <video
      src={`${src}#t=0.001`}
      className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
      muted
      preload="metadata"
      playsInline
    />
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-black/40 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
        <i className="fa-solid fa-play text-white text-[8px] ml-0.5" />
      </div>
    </div>
  </div>
);

const BentoCard: React.FC<{
  title?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}> = ({ title, icon, children, className = "", action }) => (
  <motion.div
    variants={itemVariants}
    className={`bg-zinc-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-white/10 ${className}`}
  >
    {(title || action) && (
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        {title && (
          <div className="flex items-center gap-2">
            {icon && <i className={`${icon} text-[10px] text-zinc-500`} />}
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase font-sans">
              {title}
            </h3>
          </div>
        )}
        {action}
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </motion.div>
);

const GlassAvatar: React.FC<{
  url: string;
  onEdit: () => void;
  loading: boolean;
}> = ({ url, onEdit, loading }) => (
  <div className="relative group p-1.5 rounded-full bg-gradient-to-tr from-white/5 via-white/20 to-white/5 shadow-2xl overflow-hidden">
    {/* Inner Glow Effect */}
    <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

    <motion.div
      className="w-32 h-32 rounded-full overflow-hidden bg-zinc-950/80 backdrop-blur-2xl relative z-10 p-1"
      whileTap={{ scale: 0.96 }}
    >
      <div className="w-full h-full rounded-full overflow-hidden relative">
        <img
          src={url || 'https://via.placeholder.com/200'}
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
          alt="Avatar"
        />
        {loading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <i className="fa-solid fa-circle-notch animate-spin text-white" />
          </div>
        )}
      </div>
    </motion.div>

    <motion.button
      onClick={onEdit}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      className="absolute bottom-1 right-1 z-20 w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg border-[3px] border-zinc-950 transition-all duration-300"
    >
      <i className="fa-solid fa-camera text-xs" />
    </motion.button>
  </div>
);

// --- MAIN COMPONENT ---

const Profile: React.FC<ProfileProps> = ({ initialProfile, onUpdate, onBack }) => {
  // State: Data
  const [name, setName] = useState(initialProfile.name);
  const [bio, setBio] = useState(initialProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url);
  const [pin, setPin] = useState(initialProfile.pin || '');
  const [securityEnabled, setSecurityEnabled] = useState(true);

  // State: UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [mediaList, setMediaList] = useState<Message[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC ---

  useEffect(() => {
    const savedSecurity = localStorage.getItem('capy_security_enabled');
    setSecurityEnabled(savedSecurity !== 'false');
  }, []);

  const fetchMedia = useCallback(async () => {
    try {
      setLoadingMedia(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('type', 'image')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      if (data) setMediaList(data as Message[]);
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.removeItem('capy_is_selecting_file');
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      setLoading(true);
      setMessage('Processando...');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${initialProfile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('CapyBook').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const latestUrl = await getLatestAvatarUrl(initialProfile.id);
      if (latestUrl) {
        setAvatarUrl(latestUrl);
        setMessage('Foto atualizada ✨');
      }
    } catch (err) {
      console.error('File upload error:', err);
      setIsError(true);
      setMessage('Erro no upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: initialProfile.id,
        display_name: name,
        bio,
        avatar_url: avatarUrl,
        pin
      }, { onConflict: 'id' });

      if (error) throw error;

      localStorage.setItem('capy_security_enabled', String(securityEnabled));
      onUpdate({ ...initialProfile, name, bio, avatar_url: avatarUrl, pin });

      setIsError(false);
      setMessage('Perfil guardado com sucesso.');
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    } catch (err) {
      console.error('Save error:', err);
      setIsError(true);
      setMessage('Falha ao sincronizar.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <motion.div
      className="flex flex-col h-full bg-[#030303] text-zinc-100 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      {/* Decorative Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-blue-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* FIXED HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 bg-[#030303]/40 backdrop-blur-2xl border-b border-white/5">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.9, x: -2 }}
          className="w-10 h-10 flex items-center justify-center -ml-2 text-zinc-400 hover:text-white rounded-full transition-all"
        >
          <i className="fa-solid fa-arrow-left text-lg" />
        </motion.button>
        <h1 className="text-[11px] font-bold tracking-[0.3em] text-zinc-500 uppercase font-sans">
          Perfil
        </h1>
        <div className="w-10" />
      </div>

      {/* SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto pt-24 pb-40 px-5 scroll-smooth scrollbar-hide">
        <div className="max-w-md mx-auto space-y-4">

          {/* 1. HERO SECTION */}
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center py-12 relative">
            {/* Aesthetic Background Effect */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden">
              <img
                src={avatarUrl || 'https://via.placeholder.com/200'}
                className="w-64 h-64 object-cover blur-3xl opacity-20 scale-150"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/60 to-[#030303]" />
            </div>

            <GlassAvatar
              url={avatarUrl}
              onEdit={() => fileInputRef.current?.click()}
              loading={loading}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            <div className="mt-8 space-y-2">
              <h2 className="text-3xl font-display font-medium tracking-tight text-white px-4">
                {name || 'Sem nome'}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Status</span>
              </div>
            </div>
          </motion.div>

          {/* 2. BENTO GRID: PERSONAL DATA */}
          <BentoCard title="Dados Pessoais" icon="fa-solid fa-user">
            <div className="space-y-6">
              <div className="group transition-all">
                <label className="text-[9px] uppercase text-zinc-600 tracking-widest font-bold block mb-2 px-1">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl px-5 py-4 text-[15px] text-zinc-200 placeholder-zinc-800 font-medium focus:outline-none focus:border-white/10 focus:bg-zinc-900/60 transition-all"
                  placeholder="Como gostaria de ser chamado?"
                />
              </div>

              <div className="group transition-all">
                <label className="text-[9px] uppercase text-zinc-600 tracking-widest font-bold block mb-2 px-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-zinc-400 placeholder-zinc-800 resize-none focus:outline-none focus:border-white/10 focus:bg-zinc-900/60 transition-all leading-relaxed"
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
            </div>
          </BentoCard>

          {/* 3. BENTO GRID: PRIVACY & SECURITY */}
          <div className="grid grid-cols-1 gap-4">
            <BentoCard title="Segurança" icon="fa-solid fa-shield-halved">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-[13px] font-medium text-zinc-200 mb-1">PIN de Acesso</h4>
                  <p className="text-[11px] text-zinc-500 font-sans">PIN necessário para entrada</p>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  inputMode="numeric"
                  value={pin}
                  placeholder="••••"
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-20 bg-zinc-950/50 border border-white/10 rounded-2xl py-4 text-center text-lg tracking-[0.4em] text-white font-bold focus:outline-none focus:border-white/30 transition-all placeholder-zinc-800"
                />
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-medium text-zinc-200 mb-1">Privacidade de Mídia</h4>
                  <p className="text-[11px] text-zinc-500 font-sans">Ocultar prévias de mídias</p>
                </div>
                <motion.button
                  onClick={() => setSecurityEnabled(!securityEnabled)}
                  className={`w-14 h-8 rounded-full p-1.5 flex items-center transition-colors duration-500 ${securityEnabled ? 'bg-white' : 'bg-zinc-800'}`}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    layout
                    className={`w-5 h-5 rounded-full shadow-lg ${securityEnabled ? 'bg-zinc-950' : 'bg-zinc-500'}`}
                    animate={{ x: securityEnabled ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                </motion.button>
              </div>
            </BentoCard>
          </div>

          {/* 4. BENTO GRID: GALLERY */}
          <BentoCard
            title="Galeria"
            icon="fa-solid fa-images"
            action={
              mediaList.length > 0 && (
                <motion.button
                  onClick={() => setIsGalleryOpen(true)}
                  whileTap={{ scale: 0.9 }}
                  className="text-[9px] font-bold tracking-widest text-zinc-400 flex items-center gap-1.5 hover:text-white transition-colors uppercase"
                >
                  Ver Tudo <i className="fa-solid fa-chevron-right text-[7px]" />
                </motion.button>
              )
            }
          >
            {loadingMedia ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <i className="fa-solid fa-spinner animate-spin text-zinc-700" />
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Carregando...</span>
              </div>
            ) : mediaList.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-[11px] text-zinc-600 italic font-serif leading-relaxed">Nenhuma mídia encontrada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {mediaList.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.3 }}
                    onClick={() => item.text && setPreviewUrl(item.text)}
                    className="aspect-square bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer relative group border border-white/5"
                    whileTap={{ scale: 0.95 }}
                  >
                    <AnimatePresence mode="wait">
                      {item.type === 'video' ? (
                        <div className={`w-full h-full transition-all duration-500 ${securityEnabled ? 'blur-2xl scale-110' : ''}`}>
                          <VideoThumbnail src={item.text || ''} />
                        </div>
                      ) : (
                        <motion.img
                          src={item.text || ''}
                          loading="lazy"
                          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0 ${securityEnabled ? 'blur-2xl scale-110 opacity-70' : ''}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </BentoCard>

        </div>
      </div>

      {/* PERSISTENT FOOTER */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#030303] via-[#030303] to-transparent z-50 pointer-events-none"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, type: "spring", damping: 25 }}
      >
        <div className="max-w-md mx-auto pointer-events-auto">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-6 text-[10px] text-center font-bold tracking-[0.2em] uppercase ${isError ? 'text-red-400' : 'text-zinc-400'}`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleSave}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full h-16 rounded-[2rem] bg-white text-zinc-950 font-bold tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:bg-zinc-100"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch animate-spin" />
            ) : (
              <span className="flex items-center gap-3">
                <i className="fa-solid fa-check text-xs" />
                SALVAR
              </span>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* PREVIEW MODAL */}
      <AnimatePresence mode="wait">
        {previewUrl && (
          <ImageModal
            key="modal"
            url={previewUrl}
            onClose={() => setPreviewUrl(null)}
          />
        )}
      </AnimatePresence>

      {/* GALLERY MODAL */}
      <AnimatePresence>
        {isGalleryOpen && (
          <GalleryModal
            key="gallery"
            onClose={() => setIsGalleryOpen(false)}
            currentUserId={initialProfile.id}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Profile;
