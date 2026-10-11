import React from 'react';
import { ManualPageData } from '../../data/manualSpreads.ts';
import { ManualIsometricSchematic } from './ManualIsometricSchematic.tsx';

interface ManualPageRendererProps {
  page: ManualPageData;
  isLeftPage: boolean;
  pageNumber: number;
  totalPageCount: number;
}

export const ManualPageRenderer: React.FC<ManualPageRendererProps> = ({
  page,
  isLeftPage,
  pageNumber,
  totalPageCount,
}) => {
  const isCover = page.type === 'cover';
  const isInsideCover = page.type === 'cover-inside';
  const isSchematic = page.type === 'schematic';

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-3.5 sm:p-5 md:p-6 overflow-hidden select-none font-['Jost',sans-serif] ${
        isLeftPage ? 'manual-page-left' : 'manual-page-right'
      } ${isCover ? 'bg-[#e7dfce]' : ''}`}
    >
      {/* ── TOP PAGE HEADER (Folio & Technical Stamp) ── */}
      <div className="flex items-center justify-between border-b border-[#1a1918]/20 pb-1.5 shrink-0 text-[#1a1918]">
        {/* Left header: Folio or unit ID */}
        <div className="flex items-center gap-2 font-mono-tech text-[9px] sm:text-[10px] tracking-wider">
          <span className="font-bold text-[#0c5a8c]">PLIST CRT-90</span>
          <span className="opacity-40">|</span>
          <span className="text-zinc-600 uppercase truncate max-w-[140px] sm:max-w-none">
            {page.serial || `SEC-${String(pageNumber).padStart(2, '0')}`}
          </span>
        </div>

        {/* Right header: Section category or stamp */}
        <div className="flex items-center gap-2 font-mono-tech text-[9px] sm:text-[10px]">
          {page.stamp && (
            <span
              className={`px-1.5 py-0.5 border text-[8px] font-bold tracking-widest ${
                page.stamp.includes('QC') || page.stamp.includes('APPROVED')
                  ? 'border-[#a82d22] text-[#a82d22] bg-[#a82d22]/5'
                  : 'border-[#0c5a8c] text-[#0c5a8c] bg-[#0c5a8c]/5'
              }`}
            >
              {page.stamp}
            </span>
          )}
          <span className="font-bold text-[#1a1918]/80">
            {String(pageNumber).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT BODY (Decoupled by Type) ── */}
      <div className="flex-1 min-h-0 flex flex-col justify-start py-2 sm:py-3 overflow-hidden text-[#1a1918]">
        {isCover ? (
          /* ── COVER PAGE ── */
          <div className="h-full flex flex-col justify-between py-1 sm:py-2">
            <div>
              <div className="inline-block px-2 py-0.5 mb-2 bg-[#1a1918] text-[#ece6d9] font-mono-tech text-[8px] sm:text-[9px] font-bold tracking-widest uppercase">
                {page.badge || "OFFICIAL OPERATING MONOGRAPH"}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none text-[#1a1918] font-['Jost',sans-serif] uppercase mb-1">
                {page.title}
              </h1>
              <div className="text-xs sm:text-sm md:text-base font-bold tracking-widest text-[#0c5a8c] font-mono-tech border-b-2 border-[#1a1918] pb-2 mb-3">
                {page.subtitle || "OWNER'S INSTRUCTION MANUAL"}
              </div>
            </div>

            {/* Cover Graphic: CRT Graphic & Warning Box */}
            <div className="my-auto flex items-center justify-center p-2 bg-[#1a1918]/5 border border-[#1a1918]/20 rounded-sm">
              <div className="text-center space-y-1">
                <div className="font-mono-tech text-base sm:text-lg font-bold tracking-[0.2em] text-[#1a1918]">
                  [ 4:3 BROADCAST CHASSIS ]
                </div>
                <div className="text-[9px] sm:text-[10px] text-zinc-600 font-mono-tech tracking-wide">
                  SERIES 1996 • ALL-SOLID-STATE VIDEO MATRIX
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] sm:text-xs leading-relaxed text-[#1a1918]/90 font-['Jost',sans-serif] italic">
                {page.placeholder}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[#1a1918]/30 font-mono-tech text-[8px] sm:text-[9px] text-zinc-600">
                <span>SERIAL: {page.serial || 'PLIST-96-001'}</span>
                <span className="text-[#a82d22] font-bold">STRICTLY NON-COMMERCIAL</span>
              </div>
            </div>
          </div>
        ) : isInsideCover ? (
          /* ── INSIDE COVER / REGULATORY ── */
          <div className="h-full flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1a1918] uppercase">
                  {page.title}
                </h2>
                <div className="rubber-stamp text-[9px]">QC PASSED</div>
              </div>
              <div className="text-[10px] sm:text-xs font-mono-tech text-[#0c5a8c] font-bold tracking-wider mb-2">
                {page.subtitle}
              </div>
            </div>

            {/* Warning Callout Box */}
            <div className="border border-[#a82d22] bg-[#a82d22]/5 p-2 rounded-sm mb-2 text-[#a82d22]">
              <div className="font-mono-tech text-[9px] sm:text-[10px] font-bold flex items-center gap-1.5 mb-1">
                <span>⚠</span> CAUTION: HIGH VOLTAGE CRT CHASSIS
              </div>
              <p className="text-[9px] sm:text-[10px] leading-snug font-['Jost',sans-serif]">
                Do not remove rear chassis panel. No user-serviceable parts inside. Refer servicing to qualified PlayListismo broadcast engineers.
              </p>
            </div>

            {/* Regulatory Sections */}
            <div className="space-y-2">
              {page.sections?.map((sec, i) => (
                <div key={i} className="text-[10px] sm:text-xs leading-relaxed">
                  {sec.heading && (
                    <div className="font-mono-tech font-bold text-[9px] sm:text-[10px] text-[#1a1918] mb-0.5 uppercase tracking-wide">
                      {sec.heading}
                    </div>
                  )}
                  {sec.body && <p className="text-[#1a1918]/85 mb-1">{sec.body}</p>}
                  {sec.bullets && (
                    <ul className="list-disc list-inside space-y-0.5 text-[9px] sm:text-[10px] font-mono-tech text-zinc-700">
                      {sec.bullets.map((b, bi) => (
                        <li key={bi} className="truncate">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="font-mono-tech text-[8px] text-zinc-500 pt-1 border-t border-[#1a1918]/15 flex justify-between">
              <span>DOC REF: {page.serial}</span>
              <span>STANDARDS COMPLIANT (NTSC/PAL)</span>
            </div>
          </div>
        ) : isSchematic ? (
          /* ── SCHEMATIC PAGE ── */
          <div className="h-full flex flex-col justify-between">
            <div className="mb-1">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#1a1918] uppercase">
                {page.title}
              </h2>
              <div className="text-[9px] sm:text-[10px] font-mono-tech text-[#0c5a8c] font-bold tracking-wider">
                {page.subtitle}
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-white/30 border border-[#0c5a8c]/30 rounded-sm overflow-hidden">
              <ManualIsometricSchematic />
            </div>

            <div className="mt-1 font-mono-tech text-[8px] sm:text-[9px] text-zinc-600 flex justify-between pt-1 border-t border-[#1a1918]/15">
              <span>CIRCUIT BOARD: PCB-REV-96</span>
              <span className="text-[#0c5a8c] font-bold">1PX WIREFRAME STANDARD</span>
            </div>
          </div>
        ) : (
          /* ── GENERAL EDITORIAL / CHANNELS / COLOPHON ── */
          <div className="h-full flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#1a1918] uppercase leading-tight">
                  {page.title}
                </h2>
                {page.type === 'channels' && (
                  <span className="rubber-stamp-cyan text-[8px] font-mono-tech">BROADCAST ACTIVE</span>
                )}
              </div>
              {page.subtitle && (
                <div className="text-[9px] sm:text-[10px] font-mono-tech text-[#0c5a8c] font-bold tracking-wider mb-2">
                  {page.subtitle}
                </div>
              )}
            </div>

            {/* Sections & Body Content */}
            <div className="space-y-2 sm:space-y-2.5 overflow-hidden">
              {page.sections?.map((sec, i) => (
                <div key={i} className="text-[10px] sm:text-xs leading-relaxed">
                  {sec.heading && (
                    <div className="font-mono-tech font-bold text-[9px] sm:text-[10px] text-[#1a1918] mb-0.5 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-[#0c5a8c]">■</span>
                      <span>{sec.heading}</span>
                    </div>
                  )}
                  {sec.body && (
                    <p className="text-[#1a1918]/90 text-[10px] sm:text-xs leading-relaxed font-['Jost',sans-serif]">
                      {sec.body}
                    </p>
                  )}
                  {sec.callout && (
                    <div className="my-1.5 p-2 bg-[#0c5a8c]/5 border-l-2 border-[#0c5a8c] text-[10px] sm:text-xs font-['Jost',sans-serif] italic text-[#0c5a8c]">
                      {sec.callout}
                    </div>
                  )}
                  {sec.bullets && (
                    <ul className="list-disc list-inside space-y-0.5 text-[9px] sm:text-[10px] font-mono-tech text-zinc-700 mt-1">
                      {sec.bullets.map((b, bi) => (
                        <li key={bi} className="truncate">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* If no sections provided, show placeholder */}
              {(!page.sections || page.sections.length === 0) && (
                <p className="text-[10px] sm:text-xs text-zinc-700 leading-relaxed font-['Jost',sans-serif]">
                  {page.placeholder}
                </p>
              )}
            </div>

            {/* Page Bottom Technical Stamp */}
            <div className="pt-1.5 border-t border-[#1a1918]/15 font-mono-tech text-[8px] sm:text-[9px] text-zinc-500 flex justify-between items-center">
              <span>REF: {page.serial || 'SEC-PLIST'}</span>
              <span className="text-[#1a1918]/70">ARCHIVAL BROADCAST RECORD</span>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM PAGE FOOTER (Folio & Page Indicator) ── */}
      <div className="flex items-center justify-between border-t border-[#1a1918]/20 pt-1.5 shrink-0 font-mono-tech text-[9px] sm:text-[10px] text-[#1a1918]">
        <div>
          {isLeftPage ? (
            <span className="font-bold">PAGE {String(pageNumber).padStart(2, '0')}</span>
          ) : (
            <span className="text-zinc-500">PLAYLISTISMO CRT-90 MANUAL</span>
          )}
        </div>
        <div>
          {!isLeftPage ? (
            <span className="font-bold">PAGE {String(pageNumber).padStart(2, '0')}</span>
          ) : (
            <span className="text-zinc-500">PLAYLISTISMO CRT-90 MANUAL</span>
          )}
        </div>
      </div>
    </div>
  );
};
