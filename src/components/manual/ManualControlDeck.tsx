import React from 'react';

interface ManualControlDeckProps {
  currentSpreadIndex: number;
  totalSpreads: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  volume: number; // 0 to 100
  onVolumeChange: (val: number) => void;
  onClose?: () => void;
  zoomLevel?: number; // 1 | 1.25 | 1.5
  onCycleZoom?: () => void;
}

export const ManualControlDeck: React.FC<ManualControlDeckProps> = ({
  currentSpreadIndex,
  totalSpreads,
  onPrevPage,
  onNextPage,
  volume,
  onVolumeChange,
  onClose,
  zoomLevel = 1,
  onCycleZoom,
}) => {
  const currentLeftPage = currentSpreadIndex * 2 + 1;
  const currentRightPage = currentSpreadIndex * 2 + 2;
  const totalPages = totalSpreads * 2;

  const isFirstSpread = currentSpreadIndex === 0;
  const isLastSpread = currentSpreadIndex === totalSpreads - 1;
  const isZoomed = zoomLevel > 1;
  const zoomLabel = zoomLevel === 1 ? '1.0x' : zoomLevel === 1.25 ? '1.25x' : `${zoomLevel}x`;

  // Visual rotary knob angle (-135deg to +135deg)
  const knobAngle = -135 + (volume / 100) * 270;

  return (
    <div className="w-full max-w-[1250px] mx-auto bg-[#121418] border border-[#2b303a] rounded-md p-2 sm:p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.08)] select-none">
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3.5">
        
        {/* ── LEFT: PREV PAGE BUTTON & DIE-CUT APERTURE STATUS ── */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            id="btn-manual-prev"
            onClick={onPrevPage}
            disabled={isFirstSpread}
            className="btn-mech-deck px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
            title="Voltar Página Anterior"
          >
            <span>◄</span>
            <span>PREV PAGE</span>
          </button>

          {/* Aperture / PiP Live Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#0b0c0e] border border-amber-500/30 rounded-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${isZoomed ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]' : 'bg-amber-400 animate-pulse'}`} />
            <span className={`font-mono-tech text-[9px] font-bold uppercase tracking-wider ${isZoomed ? 'text-sky-300' : 'text-amber-300'}`}>
              {isZoomed ? `PiP MODE // FLOATING (${zoomLabel})` : 'DIE-CUT CAVITY // ACTIVE'}
            </span>
          </div>

          {/* Zoom Toggle / Cycle Button (1.0x -> 1.25x -> 1.5x -> 1.0x) */}
          {onCycleZoom && (
            <button
              type="button"
              id="btn-manual-zoom"
              onClick={onCycleZoom}
              className={`btn-mech-deck px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer transition-all ${
                isZoomed
                  ? '!bg-amber-400 !text-black !border-amber-300 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'text-zinc-300 hover:text-amber-400'
              }`}
              title={`Ajustar Zoom de Leitura (Atual: ${zoomLabel} • Clique para alternar 1.0x / 1.25x / 1.5x)`}
            >
              <span>{`🔍 ZOOM: ${zoomLabel}`}</span>
            </button>
          )}
        </div>

        {/* ── CENTER: CRT VOLUME ROTARY KNOB & SLIDER CONTROL ── */}
        <div className="flex-1 flex items-center justify-center gap-2.5 sm:gap-4 px-2 py-1 bg-[#0b0c0e] border border-[#1f232b] rounded-sm shadow-inner min-w-[180px]">
          
          {/* Rotary Knob Graphic */}
          <div className="flex items-center gap-2">
            <div 
              className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#3c4048] to-[#16181c] border-2 border-[#545b66] shadow-[0_2px_4px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-center cursor-pointer shrink-0"
              title={`CRT Master Gain: ${volume}%`}
            >
              {/* Pointer tick line */}
              <div 
                className="absolute top-0.5 sm:top-1 w-0.5 h-2 sm:h-2.5 bg-amber-400 rounded-full shadow-[0_0_4px_#f59e0b] transition-transform duration-75"
                style={{ transform: `rotate(${knobAngle}deg)`, transformOrigin: '50% 12px' }}
              />
              <div className="w-2 h-2 rounded-full bg-[#181a1e] border border-[#30343c]" />
            </div>

            <div className="flex flex-col text-left">
              <span className="font-mono-tech text-[7px] sm:text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                CRT VOLUME
              </span>
              <span className="font-mono-tech text-[9px] sm:text-[10px] md:text-[11px] font-bold text-amber-400">
                {String(volume).padStart(3, ' ')}%
              </span>
            </div>
          </div>

          {/* Master Gain Horizontal Slider */}
          <div className="flex-1 max-w-[140px] sm:max-w-[200px] flex flex-col justify-center gap-0.5">
            <input
              type="range"
              id="crt-volume-slider"
              min="0"
              max="100"
              step="1"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="crt-vol-slider w-full cursor-pointer"
              title={`Ajustar Volume CRT (${volume}%)`}
            />
            <div className="flex justify-between font-mono-tech text-[6px] sm:text-[7px] text-zinc-500 uppercase px-0.5">
              <span>MIN</span>
              <span>-12dB</span>
              <span>-6dB</span>
              <span>0dB</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: NUMERIC SPREAD INDICATOR & NEXT BUTTON ── */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Numeric Indicator */}
          <div className="bg-[#0b0c0e] border border-[#2a2e38] px-2 sm:px-3 py-1 rounded-sm flex flex-col items-center justify-center shadow-inner">
            <span className="font-mono-tech text-[6px] sm:text-[7px] text-zinc-500 tracking-wider uppercase font-bold">
              SPREAD {String(currentSpreadIndex + 1).padStart(2, '0')} / {String(totalSpreads).padStart(2, '0')}
            </span>
            <span className="font-mono-tech text-[10px] sm:text-xs font-bold text-emerald-400 tracking-wider">
              PAGE {String(currentLeftPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
            </span>
          </div>

          {/* Next Button */}
          <button
            type="button"
            id="btn-manual-next"
            onClick={onNextPage}
            disabled={isLastSpread}
            className="btn-mech-deck px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs flex items-center gap-1.5 active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
            title="Avançar Próxima Página"
          >
            <span>NEXT PAGE</span>
            <span>►</span>
          </button>

          {/* Exit / Close button (Return to broadcast view) */}
          {onClose && (
            <button
              type="button"
              id="btn-manual-close-deck"
              onClick={onClose}
              className="ml-0.5 px-2 py-1.5 bg-red-950/40 hover:bg-red-800 text-red-300 hover:text-white border border-red-700/50 rounded-sm font-mono-tech text-[10px] tracking-wider transition-all uppercase cursor-pointer"
              title="Fechar Manual e Retornar ao Modo Broadcast"
            >
              ✕ EXIT
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
