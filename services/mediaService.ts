import { MediaMetadata } from '../types';

/**
 * Comprime uma imagem e redimensiona se necessário usando Canvas API.
 * Converte para WebP com qualidade 0.8.
 */
export const compressImage = async (file: File, maxWidth = 1280, quality = 0.8): Promise<{ blob: Blob; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Redimensionamento proporcional
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Falha ao obter contexto 2D do Canvas'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve({ blob, width, height });
                        } else {
                            reject(new Error('Falha na compressão da imagem'));
                        }
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * Obtém dimensões de uma imagem a partir de um arquivo ou URL.
 */
export const getImageDimensions = (source: File | string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        if (typeof source === 'string') {
            img.src = source;
        } else {
            img.src = URL.createObjectURL(source);
        }
    });
};

/**
 * Obtém dimensões/duração de um vídeo.
 */
export const getVideoMetadata = (file: File): Promise<{ width: number; height: number; duration: number }> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve({
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration
            });
        };
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
    });
};
