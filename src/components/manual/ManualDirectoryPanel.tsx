import React from 'react';
import { ManualSpread } from '../../data/manualSpreads.ts';

interface ManualDirectoryPanelProps {
  spreads: ManualSpread[];
  activeSpreadIndex: number;
  onSelectSpread: (index: number) => void;
  onExitManual?: () => void;
}

export const ManualDirectoryPanel: React.FC<ManualDirectoryPanelProps> = ({
  spreads,
  activeSpreadIndex,
  onSelectSpread,
  onExitManual,
}) => {
  return (
    <div className="rack-chassis-texture relative w-full h-full max-h-full flex flex-col justify-between border-2 border-[#2b303c] rounded-lg p-2.5 sm:p-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden select-none">
      
      {/* ── RACK MOUNT CORNER FASTENERS ── */}
      <div className="absolute top-1.5 left-2 text-[#464c5a] font-mono-tech text-[10px] leading-none select-none">⊕</div>
      <div className="absolute top-1.5 right-2 text-[#464c5a] font-mono-tech text-[10px] leading-none select-none">⊕</div>
      <div className="absolute bottom-1.5 left-2 text-[#464c5a] font-mono-tech text-[10px] leading-none select-none">⊕</div>
      <div className="absolute bottom-1.5 right-2 text-[#464c5a] font-mono-tech text-[10px] leading-none select-none">⊕</div>

      {/* ── RACK PANEL HEADER ── */}
      <div className="flex items-center justify-between border-b border-[#2b303c] pb-2 mb-2 shrink-0 px-3">
        <div className="flex items-center gap-2">
          {/* Green phosphor active pulse */}
          <span className="w-2 h-2 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66] animate-pulse shrink-0" />
          <div className="flex flex-col">
            <span className="font-mono-tech text-[11px] sm:text-xs font-bold text-white tracking-widest uppercase">
              MANUAL DIRECTORY // TOPICS PANEL
            </span>
            <span className="font-mono-tech text-[8px] text-emerald-400/80 tracking-wider">
              SYS-DOC RACK-04 • SYNCHRONIZED NAVIGATION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono-tech text-[9px] text-amber-400 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30 font-bold hidden sm:inline">
            MOD: 1996.11
          </span>
          {onExitManual && (
            <button
              type="button"
              onClick={onExitManual}
              className="text-zinc-400 hover:text-white hover:bg-red-900/40 text-[10px] font-mono-tech font-bold px-2 py-1 rounded border border-white/10 transition-colors uppercase tracking-wider"
              title="Retornar à Transmissão Normal"
            >
              ✕ EXIT
            </button>
          )}
        </div>
      </div>

      {/* ── TOPICS DIRECTORY LIST ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 py-1 space-y-1.5">
        {spreads.map((spread, idx) => {
          const isActive = idx === activeSpreadIndex;
          const leftPageNum = idx * 2 + 1;
          const rightPageNum = idx * 2 + 2;

          return (
            <button
              key={spread.id}
              type="button"
              onClick={() => onSelectSpread(idx)}
              className={`w-full text-left p-2 sm:p-2.5 rounded transition-all duration-150 flex items-center justify-between group relative border ${
                isActive
                  ? 'bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black/80 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-[#101216] hover:bg-[#181b22] border-[#222630] hover:border-zinc-500 shadow-inner'
              }`}
            >
              {/* Left Notch / Indicator */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className={`font-mono-tech text-xs sm:text-sm font-bold shrink-0 ${
                    isActive ? 'text-amber-400 drop-shadow-[0_0_4px_#f59e0b]' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                >
                  {isActive ? '►' : ' '}
                </span>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono-tech text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate ${
                        isActive ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]' : 'text-zinc-200 group-hover:text-white'
                      }`}
                    >
                      {spread.menuLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[8px] sm:text-[9px] font-mono-tech text-zinc-400 truncate mt-0.5">
                    <span className="text-[#0c5a8c] font-bold">L:</span>
                    <span className="truncate">{spread.left.title}</span>
                    <span className="opacity-40">/</span>
                    <span className="text-[#a82d22] font-bold">R:</span>
                    <span className="truncate">{spread.right.title}</span>
                  </div>
                </div>
              </div>

              {/* Right Page Folio Badge */}
              <div className="shrink-0 flex items-center gap-1.5 ml-2 font-mono-tech">
                <span
                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                    isActive
                      ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-black/60 text-zinc-400 border-zinc-700/60'
                  }`}
                >
                  PP. {String(leftPageNum).padStart(2, '0')}-{String(rightPageNum).padStart(2, '0')}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── RACK PANEL FOOTER (Technical Telemetry OSD) ── */}
      <div className="border-t border-[#2b303c] pt-2 mt-2 shrink-0 px-3 flex flex-wrap items-center justify-between text-[8px] sm:text-[9px] font-mono-tech text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            BUS: SYNCED
          </span>
          <span>SPREADS: 0{spreads.length}</span>
        </div>
        <div className="text-right">
          <span className="text-amber-400 font-bold">KEYBOARD: [◄ / ►] PAGE TURN</span>
        </div>
      </div>

    </div>
  );
};
