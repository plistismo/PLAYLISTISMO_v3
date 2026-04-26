import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { Message } from '../types';
import { compressImage } from '../services/mediaService';
import ImageModal from './ImageModal';

interface GalleryModalProps {
    onClose: () => void;
    currentUserId?: string;
}

const ITEMS_PER_PAGE = 15;

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
            <div className="bg-black/40 p-2 rounded-full backdrop-blur-md border border-white/10">
                <i className="fa-solid fa-play text-white text-[10px] ml-0.5" />
            </div>
        </div>
    </div>
);

const GalleryModal: React.FC<GalleryModalProps> = ({ onClose, currentUserId }) => {
    const [items, setItems] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const observerTarget = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchItems = useCallback(async (pageNum: number) => {
        if (loading) return;

        setLoading(true);
        setError(null);
        try {
            const from = pageNum * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .eq('type', 'image')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (fetchError) throw fetchError;

            if (data) {
                setItems(prev => {
                    const newItems = data as Message[];
                    const map = new Map<string, Message>();
                    // Combine previous and new, Map ensures uniqueness by id
                    // Prioritize existing items (especially temp ones) or newer versions
                    [...prev, ...newItems].forEach(item => map.set(item.id, item));
                    return Array.from(map.values()).sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                });
                setHasMore(data.length === ITEMS_PER_PAGE);
            }
        } catch (err) {
            console.error('Error fetching gallery items:', err);
            setError('Falha ao carregar galeria.');
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // Realtime subscription to avoid duplicates and keep sync
    useEffect(() => {
        const channel = supabase.channel('gallery_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: "type=eq.image" },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setItems(prev => {
                        const exists = prev.some(item => item.id === newMessage.id);
                        if (exists) return prev;
                        return [newMessage, ...prev];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        fetchItems(0);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => {
                        const nextPage = prev + 1;
                        fetchItems(nextPage);
                        return nextPage;
                    });
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, fetchItems]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !currentUserId) return;

        setUploading(true);
        setError(null);
        try {
            const file = e.target.files[0];
            const { blob, width, height } = await compressImage(file);

            const fileExt = 'webp';
            const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
            const filePath = `gallery/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('CapyBook')
                .upload(filePath, blob, { contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('CapyBook')
                .getPublicUrl(filePath);

            const { data: newMessage, error: insertError } = await supabase
                .from('messages')
                .insert([{
                    sender_id: currentUserId,
                    text: publicUrl,
                    type: 'image',
                    metadata: { width, height, size: blob.size, mimeType: 'image/webp' }
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            if (newMessage) {
                setItems(prev => {
                    const exists = prev.some(item => item.id === (newMessage as Message).id);
                    if (exists) return prev;
                    return [newMessage as Message, ...prev];
                });
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Erro ao enviar imagem.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#030303] flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl sticky top-0 z-10">
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-zinc-400 hover:text-white transition-colors"
                >
                    <i className="fa-solid fa-xmark text-lg" />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-[11px] font-bold tracking-[0.3em] text-zinc-400 uppercase">
                        Galeria de Mídia
                    </h2>
                    {error && <span className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-tighter">{error}</span>}
                </div>
                <div className="w-10 flex items-center justify-center">
                    {uploading ? (
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-circle-notch animate-spin text-blue-500 text-sm" />
                            <span className="text-[9px] text-blue-400 font-bold uppercase animate-pulse">Enviando</span>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <i className="fa-solid fa-camera text-sm" />
                        </button>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <div className="grid grid-cols-3 gap-1 md:gap-2 max-w-2xl mx-auto">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (index % ITEMS_PER_PAGE) * 0.05 }}
                            onClick={() => item.text && setPreviewUrl(item.text)}
                            className="aspect-square bg-zinc-900 overflow-hidden relative group cursor-pointer"
                        >
                            <img
                                src={item.text}
                                alt=""
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {item.id.startsWith('temp-') && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                                    <i className="fa-solid fa-circle-notch animate-spin text-white" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Loading Indicator / Observer Target */}
                <div
                    ref={observerTarget}
                    className="h-20 flex items-center justify-center w-full"
                >
                    {loading && (
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-circle-notch animate-spin text-zinc-600" />
                            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Carregando...</span>
                        </div>
                    )}
                    {!hasMore && items.length > 0 && (
                        <span className="text-[10px] uppercase tracking-widest text-zinc-700 font-bold">Fim da Galeria</span>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewUrl && (
                    <ImageModal
                        url={previewUrl}
                        onClose={() => setPreviewUrl(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default GalleryModal;
