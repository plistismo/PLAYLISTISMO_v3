import React from 'react';
import { ManualSpread } from '../../data/manualSpreads.ts';
import { ManualPageRenderer } from './ManualPageRenderer.tsx';

interface ManualSpreadViewerProps {
  spread: ManualSpread;
  spreadIndex: number;
  totalSpreads: number;
  isFullscreen?: boolean;
}

export const ManualSpreadViewer: React.FC<ManualSpreadViewerProps> = ({
  spread,
  spreadIndex,
  totalSpreads,
  isFullscreen = false,
}) => {
  const leftPageNum = spreadIndex * 2 + 1;
  const rightPageNum = spreadIndex * 2 + 2;
  const totalPages = totalSpreads * 2;

  return (
    <div className={`relative w-full h-full flex-1 min-h-0 flex items-center justify-center select-none ${
      isFullscreen ? 'p-2 sm:p-4 max-w-[1400px] mx-auto' : 'p-1 sm:p-2'
    }`}>
      {/* ── BOOKLET CONTAINER (Aged Paper, Shadows, Natural Binding) ── */}
      <div 
        className="manual-paper-aged manual-paper-noise relative w-full h-full max-w-[1250px] flex rounded-md overflow-hidden border border-[#c4baa6] shadow-[0_24px_60px_rgba(0,0,0,0.85),0_2px_4px_rgba(0,0,0,0.5)] !bg-[#EAE6D8] !text-[#111111]"
        style={{ backgroundColor: '#EAE6D8', color: '#111111' }}
      >
        {/* Subtle Organic Corner Vignette / Aging */}
        <div className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_35px_rgba(110,80,35,0.12)] rounded-md" />
        
        {/* Top/Bottom Staple Indent Impressions on Binding */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-7 rounded-sm bg-[#4a4d55] border border-[#27272a] shadow-inner opacity-80 z-40" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-7 rounded-sm bg-[#4a4d55] border border-[#27272a] shadow-inner opacity-80 z-40" />

        {/* ── LEFT PAGE (50%) ── */}
        <div 
          className="flex-1 min-w-0 h-full relative overflow-hidden border-r border-[#111111]/20 !bg-[#EAE6D8] !text-[#111111]"
          style={{ backgroundColor: '#EAE6D8', color: '#111111' }}
        >
          <ManualPageRenderer
            page={spread.left}
            isLeftPage={true}
            pageNumber={leftPageNum}
            totalPageCount={totalPages}
          />
        </div>

        {/* ── CENTRAL SPINE GUTTER SHADOW ── */}
        <div className="manual-spine-gutter w-4 sm:w-6 lg:w-7 h-full shrink-0 relative z-20 pointer-events-none" />

        {/* ── RIGHT PAGE (50%) ── */}
        <div 
          className="flex-1 min-w-0 h-full relative overflow-hidden border-l border-[#111111]/20 !bg-[#EAE6D8] !text-[#111111]"
          style={{ backgroundColor: '#EAE6D8', color: '#111111' }}
        >
          <ManualPageRenderer
            page={spread.right}
            isLeftPage={false}
            pageNumber={rightPageNum}
            totalPageCount={totalPages}
          />
        </div>
      </div>
    </div>
  );
};
