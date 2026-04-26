import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  const isVideo = url.match(/\.(mp4|webm|mov|avi|mkv)$/i);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `capy-media-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  // Se for vídeo, renderiza player simples sem zoom
  if (isVideo) {
    return (
      <div className="absolute inset-0 z-[100] bg-black/95 flex flex-col justify-center items-center animate-in fade-in duration-200" onClick={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/20 rounded-full text-white flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
        <video src={url} className="max-w-full max-h-screen" controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
      </div>
    );
  }

  // Se for imagem, usa o Zoom
  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header Fixo */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center pointer-events-none">
        <button
          onClick={onClose}
          className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md pointer-events-auto active:scale-90 transition-transform"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
        <button
          onClick={handleDownload}
          className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md pointer-events-auto active:scale-90 transition-transform"
        >
          <i className="fa-solid fa-download"></i>
        </button>
      </div>

      {/* Área de Zoom */}
      <div className="flex-1 w-full h-full overflow-hidden">
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={4}
          centerOnInit={true}
          limitToBounds={true}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <React.Fragment>
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <img
                  src={url}
                  alt="Full view"
                  className="max-w-full max-h-screen object-contain"
                  style={{ width: "auto", height: "auto" }}
                />
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
};

export default ImageModal;