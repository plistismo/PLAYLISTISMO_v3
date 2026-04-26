import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdateModalProps {
  currentVersion: string;
  newVersion: string;
  downloadUrl: string;
  isOpen: boolean;
  onClose?: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ currentVersion, newVersion, downloadUrl, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#1e293b] border border-blue-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20 animate-bounce">
                <i className="fa-solid fa-rocket text-2xl text-blue-400"></i>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Nova atualização disponível! 🚀</h2>
              <p className="text-zinc-400 text-sm mb-6">
                Uma nova versão do CapyBook está pronta para você.
                <br />
                <span className="text-xs mt-1 block opacity-70">
                  {currentVersion} <i className="fa-solid fa-arrow-right mx-1 text-[10px]"></i> <span className="text-green-400 font-mono">{newVersion}</span>
                </span>
              </p>

              <div className="flex flex-col gap-3 w-full">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-download"></i>
                  Baixar Atualização
                </a>
                
                {onClose && (
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-medium rounded-xl transition-colors text-sm"
                  >
                    Agora não
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpdateModal;
