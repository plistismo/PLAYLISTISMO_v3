import React, { useState, useEffect, useRef } from 'react';
import { ManualSpread, manualSpreads } from '../../data/manualSpreads.ts';
import { ManualPageRenderer } from './ManualPageRenderer.tsx';

interface ManualSpreadViewerProps {
  spread: ManualSpread;
  spreadIndex: number;
  totalSpreads: number;
  cavityRef?: React.RefObject<HTMLDivElement | null>;
  zoomLevel?: number;
}

interface FlipState {
  direction: 'next' | 'prev';
  fromIndex: number;
  toIndex: number;
  isFlipping: boolean;
}

export const ManualSpreadViewer: React.FC<ManualSpreadViewerProps> = ({
  spread,
  spreadIndex,
  totalSpreads: totalSpreadsProp,
  cavityRef,
  zoomLevel = 1,
}) => {
  const totalSpreadsCount = manualSpreads.length || totalSpreadsProp || 4;
  const totalPages = totalSpreadsCount * 2;
  const isZoomed = zoomLevel > 1;
  const lastIndexRef = useRef(spreadIndex);
  const [flipState, setFlipState] = useState<FlipState | null>(null);

  useEffect(() => {
    if (spreadIndex !== lastIndexRef.current) {
      const from = lastIndexRef.current;
      const to = spreadIndex;
      const dir: 'next' | 'prev' = to > from ? 'next' : 'prev';
      lastIndexRef.current = to;

      setFlipState({
        direction: dir,
        fromIndex: from,
        toIndex: to,
        isFlipping: false,
      });

      // Frame delay to initiate CSS 3D rotate transition
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlipState(prev => (prev ? { ...prev, isFlipping: true } : null));
        });
      });

      const timer = setTimeout(() => {
        setFlipState(null);
      }, 670);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [spreadIndex]);

  const getLeftPage = (s?: any) => s?.leftPage || s?.left;
  const getRightPage = (s?: any) => s?.rightPage || s?.right;

  // Determine what spreads are displayed on the base pages
  const baseLeftSpread = flipState
    ? flipState.direction === 'next'
      ? manualSpreads[flipState.fromIndex]
      : manualSpreads[flipState.toIndex]
    : spread;

  const baseLeftPageNum = flipState
    ? flipState.direction === 'next'
      ? flipState.fromIndex * 2 + 1
      : flipState.toIndex * 2 + 1
    : spreadIndex * 2 + 1;

  const baseRightSpread = flipState
    ? flipState.direction === 'next'
      ? manualSpreads[flipState.toIndex]
      : manualSpreads[flipState.fromIndex]
    : spread;

  const baseRightPageNum = flipState
    ? flipState.direction === 'next'
      ? flipState.toIndex * 2 + 2
      : flipState.fromIndex * 2 + 2
    : spreadIndex * 2 + 2;

  return (
    <div className={`relative w-full ${isZoomed ? 'min-h-full max-w-[1400px] my-auto py-2' : 'h-full max-w-[1250px]'} flex-1 min-h-0 flex items-center justify-center select-none p-2 sm:p-4 mx-auto`}>
      {/* ── BOOKLET CONTAINER (3D Perspective Stage, Aged Paper, Natural Binding) ── */}
      <div 
        className={`manual-paper-aged manual-paper-noise book-perspective-stage relative w-full ${isZoomed ? 'min-h-full' : 'h-full'} max-w-[1250px] flex rounded-md overflow-hidden border border-[#c4baa6] shadow-[0_24px_60px_rgba(0,0,0,0.85),0_2px_4px_rgba(0,0,0,0.5)] !bg-[#EAE6D8] !text-[#111111] transition-all duration-300`}
        style={{ 
          backgroundColor: '#EAE6D8', 
          color: '#111111',
          zoom: isZoomed ? zoomLevel : 1,
        }}
      >
        {/* Subtle Organic Corner Vignette / Aging */}
        <div className="absolute inset-0 pointer-events-none z-30 shadow-[inset_0_0_35px_rgba(110,80,35,0.12)] rounded-md" />
        
        {/* Top/Bottom Staple Indent Impressions on Binding */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-7 rounded-sm bg-[#4a4d55] border border-[#27272a] shadow-inner opacity-80 z-40" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-7 rounded-sm bg-[#4a4d55] border border-[#27272a] shadow-inner opacity-80 z-40" />

        {/* ── BASE LEFT PAGE (50%) ── */}
        <div 
          className="flex-1 min-w-0 h-full relative overflow-hidden border-r border-[#111111]/20 !bg-[#EAE6D8] !text-[#111111]"
          style={{ backgroundColor: '#EAE6D8', color: '#111111' }}
        >
          <ManualPageRenderer
            page={getLeftPage(baseLeftSpread)}
            isLeftPage={true}
            pageNumber={baseLeftPageNum}
            totalPageCount={totalPages}
            zoomLevel={zoomLevel}
          />

          {/* Dynamic shadow cast on left page as turning leaf approaches */}
          {flipState && flipState.direction === 'next' && (
            <div 
              className="leaf-cast-shadow-left"
              style={{ opacity: flipState.isFlipping ? 0.75 : 0 }}
            />
          )}
        </div>

        {/* ── CENTRAL SPINE GUTTER SHADOW ── */}
        <div className="manual-spine-gutter w-4 sm:w-6 lg:w-7 h-full shrink-0 relative z-20 pointer-events-none" />

        {/* ── BASE RIGHT PAGE (50% - ALWAYS ANCHORS STATIONARY CAVITY) ── */}
        <div 
          className="flex-1 min-w-0 h-full relative overflow-hidden border-l border-[#111111]/20 !bg-[#EAE6D8] !text-[#111111]"
          style={{ backgroundColor: '#EAE6D8', color: '#111111' }}
        >
          <ManualPageRenderer
            page={getRightPage(baseRightSpread)}
            isLeftPage={false}
            pageNumber={baseRightPageNum}
            totalPageCount={totalPages}
            cavityRef={cavityRef}
            zoomLevel={zoomLevel}
          />

          {/* Dynamic shadow cast on right page as turning leaf approaches */}
          {flipState && flipState.direction === 'prev' && (
            <div 
              className="leaf-cast-shadow-right"
              style={{ opacity: flipState.isFlipping ? 0.75 : 0 }}
            />
          )}
        </div>

        {/* ── 3D FLIPPING LEAF (Physical Sheet of Paper Turning Across Spine) ── */}
        {flipState && flipState.direction === 'next' && (
          <div className={`book-turning-leaf leaf-next ${flipState.isFlipping ? 'is-flipping' : ''}`}>
            {/* Front Face of turning leaf: fromSpread's right page */}
            <div className="leaf-face leaf-face-front border-l border-[#111111]/20 shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
              <ManualPageRenderer
                page={getRightPage(manualSpreads[flipState.fromIndex])}
                isLeftPage={false}
                pageNumber={flipState.fromIndex * 2 + 2}
                totalPageCount={totalPages}
                zoomLevel={zoomLevel}
              />
              <div 
                className="leaf-lighting-overlay leaf-shadow-spine-next"
                style={{ opacity: flipState.isFlipping ? 0.7 : 0 }}
              />
            </div>

            {/* Back Face of turning leaf: toSpread's left page (lands on left side) */}
            <div className="leaf-face leaf-face-back-next border-r border-[#111111]/20 shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
              <ManualPageRenderer
                page={getLeftPage(manualSpreads[flipState.toIndex])}
                isLeftPage={true}
                pageNumber={flipState.toIndex * 2 + 1}
                totalPageCount={totalPages}
                zoomLevel={zoomLevel}
              />
              <div 
                className="leaf-lighting-overlay leaf-shadow-spine-prev"
                style={{ opacity: flipState.isFlipping ? 0.5 : 0 }}
              />
            </div>
          </div>
        )}

        {flipState && flipState.direction === 'prev' && (
          <div className={`book-turning-leaf leaf-prev ${flipState.isFlipping ? 'is-flipping' : ''}`}>
            {/* Front Face of turning leaf: fromSpread's left page */}
            <div className="leaf-face leaf-face-front border-r border-[#111111]/20 shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
              <ManualPageRenderer
                page={getLeftPage(manualSpreads[flipState.fromIndex])}
                isLeftPage={true}
                pageNumber={flipState.fromIndex * 2 + 1}
                totalPageCount={totalPages}
                zoomLevel={zoomLevel}
              />
              <div 
                className="leaf-lighting-overlay leaf-shadow-spine-prev"
                style={{ opacity: flipState.isFlipping ? 0.7 : 0 }}
              />
            </div>

            {/* Back Face of turning leaf: toSpread's right page (lands on right side) */}
            <div className="leaf-face leaf-face-back-prev border-l border-[#111111]/20 shadow-[0_12px_35px_rgba(0,0,0,0.5)]">
              <ManualPageRenderer
                page={getRightPage(manualSpreads[flipState.toIndex])}
                isLeftPage={false}
                pageNumber={flipState.toIndex * 2 + 2}
                totalPageCount={totalPages}
                zoomLevel={zoomLevel}
              />
              <div 
                className="leaf-lighting-overlay leaf-shadow-spine-next"
                style={{ opacity: flipState.isFlipping ? 0.5 : 0 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
