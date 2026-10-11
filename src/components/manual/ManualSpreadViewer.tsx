import React from 'react';
import { ManualSpread } from '../../data/manualSpreads.ts';
import { ManualPageRenderer } from './ManualPageRenderer.tsx';

interface ManualSpreadViewerProps {
  spread: ManualSpread;
  spreadIndex: number;
  totalSpreads: number;
}

export const ManualSpreadViewer: React.FC<ManualSpreadViewerProps> = ({
  spread,
  spreadIndex,
  totalSpreads,
}) => {
  const leftPageNum = spreadIndex * 2 + 1;
  const rightPageNum = spreadIndex * 2 + 2;
  const totalPages = totalSpreads * 2;

  return (
    <div className="relative w-full h-full max-h-[38vh] min-h-[180px] flex items-center justify-center p-1 sm:p-2 select-none">
      {/* ── BOOKLET CONTAINER (Aged Paper, Shadows, Non-uniform Wear) ── */}
      <div 
        className="manual-paper-aged manual-paper-noise relative w-full h-full max-w-[1200px] flex rounded-md overflow-hidden border border-[#b8ab94] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_1px_2px_rgba(0,0,0,0.6)]"
      >
        {/* Subtle Organic Corner Vignette / Aging */}
        <div className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_40px_rgba(110,80,35,0.22)] rounded-md" />
        
        {/* Top/Bottom Staple Indent Impressions on Binding */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-6 rounded-sm bg-[#52525b] border border-[#27272a] shadow-inner opacity-75 z-40" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-6 rounded-sm bg-[#52525b] border border-[#27272a] shadow-inner opacity-75 z-40" />

        {/* ── LEFT PAGE (50%) ── */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden border-r border-[#1a1918]/20">
          <ManualPageRenderer
            page={spread.left}
            isLeftPage={true}
            pageNumber={leftPageNum}
            totalPageCount={totalPages}
          />
        </div>

        {/* ── CENTRAL SPINE GUTTER SHADOW ── */}
        <div className="manual-spine-gutter w-4 sm:w-6 h-full shrink-0 relative z-20 pointer-events-none" />

        {/* ── RIGHT PAGE (50%) ── */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden border-l border-[#1a1918]/20">
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
