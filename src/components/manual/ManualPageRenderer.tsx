import React from 'react';
import { ManualPageData } from '../../data/manualSpreads.ts';
import { ManualIsometricSchematic } from './ManualIsometricSchematic.tsx';

interface ManualPageRendererProps {
  page: ManualPageData;
  isLeftPage: boolean;
  pageNumber: number;
  totalPageCount: number;
  cavityRef?: React.RefObject<HTMLDivElement | null>;
}

export const ManualPageRenderer: React.FC<ManualPageRendererProps> = ({
  page,
  isLeftPage,
  pageNumber,
  totalPageCount,
  cavityRef,
}) => {
  const isCover = page.type === 'cover';
  const isInsideCover = page.type === 'cover-inside';
  const isSchematic = page.type === 'schematic';

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-4 sm:p-5 md:p-6 lg:p-7 overflow-hidden select-none font-['Jost',sans-serif] !bg-[#EAE6D8] !text-[#111111] ${
        isLeftPage ? 'manual-page-left' : 'manual-page-right'
      }`}
      style={{ backgroundColor: '#EAE6D8', color: '#111111' }}
    >
      {/* ── TOP PAGE HEADER (Folio & Technical Stamp) ── */}
      <div className="flex items-center justify-between border-b-2 border-[#111111]/30 pb-2 shrink-0 text-[#111111]">
        {/* Left header: Folio or unit ID */}
        <div className="flex items-center gap-2 font-mono-tech text-[10px] sm:text-[11px] tracking-wider">
          <span className="font-bold text-[#084c78]">PLIST CRT-90</span>
          <span className="opacity-40">|</span>
          <span className="text-[#333333] font-semibold uppercase truncate max-w-[140px] sm:max-w-none">
            {page.serial || `SEC-${String(pageNumber).padStart(2, '0')}`}
          </span>
        </div>

        {/* Right header: Section category or stamp */}
        <div className="flex items-center gap-2.5 font-mono-tech text-[10px] sm:text-[11px]">
          {page.stamp && (
            <span
              className={`px-2 py-0.5 border text-[9px] font-bold tracking-widest ${
                page.stamp.includes('QC') || page.stamp.includes('APPROVED')
                  ? 'border-[#b31b1b] text-[#b31b1b] bg-[#b31b1b]/8'
                  : 'border-[#084c78] text-[#084c78] bg-[#084c78]/8'
              }`}
            >
              {page.stamp}
            </span>
          )}
          <span className="font-bold text-[#111111]">
            {String(pageNumber).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT BODY (With Die-Cut Aperture on Right Page) ── */}
      <div className="flex-1 min-h-0 py-2.5 sm:py-3.5 overflow-hidden text-[#111111] relative">
        {/* ── PHYSICAL DIE-CUT CAVITY (Right Page Flow Anchor) ── */}
        {!isLeftPage && (
          <div
            id="manual-die-cut-cavity"
            ref={cavityRef}
            className="die-cut-cavity float-right ml-3.5 mb-2.5 w-[210px] sm:w-[250px] md:w-[290px] lg:w-[330px] aspect-[4/3] rounded-2xl relative select-none pointer-events-none clear-none z-10"
            style={{
              shapeOutside: 'margin-box',
            }}
          >
            {/* Paper cut edge bevel, recessed drop shadow, technical registration marks */}
            <div className="w-full h-full rounded-2xl border-2 border-[#b8ae9c] shadow-[inset_0_4px_14px_rgba(0,0,0,0.85),inset_0_1px_3px_rgba(0,0,0,0.95),0_1px_1px_rgba(255,255,255,0.7)] bg-[#080808] relative overflow-hidden flex flex-col justify-between p-2">
              <div className="flex justify-between items-center opacity-70">
                <span className="font-mono-tech text-[7px] text-[#084c78] font-bold tracking-wider">✛ APERTURE REF-90</span>
                <span className="font-mono-tech text-[7px] text-amber-500 font-bold uppercase tracking-widest">NTSC 4:3</span>
              </div>
              <div className="flex justify-between items-end opacity-60">
                <span className="font-mono-tech text-[6px] text-zinc-400 font-semibold uppercase">CRT PHOSPHOR CAVITY</span>
                <span className="font-mono-tech text-[7px] text-[#084c78] font-bold">✛</span>
              </div>
            </div>
          </div>
        )}

        {isCover ? (
          /* ── COVER PAGE ── */
          <div className="h-full flex flex-col justify-between py-1">
            <div>
              <div className="inline-block px-2.5 py-1 mb-2 bg-[#111111] text-[#f4f1ea] font-mono-tech text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
                {page.badge || "OFFICIAL OPERATING MONOGRAPH"}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-[#111111] font-['Jost',sans-serif] uppercase mb-1">
                {page.title}
              </h1>
              <div className="text-xs sm:text-sm font-bold tracking-widest text-[#084c78] font-mono-tech border-b-2 border-[#111111] pb-1.5 mb-2.5">
                {page.subtitle || "OWNER'S INSTRUCTION MANUAL"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm leading-relaxed text-[#111111] font-['Jost',sans-serif] italic font-medium">
                {page.placeholder}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[#111111]/30 font-mono-tech text-[9px] sm:text-[10px] text-[#222222]">
                <span className="font-bold">SERIAL: {page.serial || 'PLIST-96-001'}</span>
                <span className="text-[#b31b1b] font-bold">STRICTLY NON-COMMERCIAL</span>
              </div>
            </div>
          </div>
        ) : isInsideCover ? (
          /* ── INSIDE COVER / REGULATORY ── */
          <div className="h-full flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111] uppercase">
                  {page.title}
                </h2>
                <div className="rubber-stamp text-[10px]">QC PASSED</div>
              </div>
              <div className="text-xs sm:text-sm font-mono-tech text-[#084c78] font-bold tracking-wider mb-2.5">
                {page.subtitle}
              </div>
            </div>

            {/* Warning Callout Box */}
            <div className="border-2 border-[#b31b1b] bg-[#b31b1b]/8 p-2.5 sm:p-3 rounded-sm mb-3 text-[#b31b1b]">
              <div className="font-mono-tech text-[10px] sm:text-xs font-bold flex items-center gap-1.5 mb-1 tracking-wide">
                <span>⚠</span> CAUTION: HIGH VOLTAGE CRT CHASSIS
              </div>
              <p className="text-[10px] sm:text-xs leading-relaxed font-['Jost',sans-serif] font-medium text-[#111111]">
                Do not remove rear chassis panel. No user-serviceable parts inside. Refer servicing to qualified PlayListismo broadcast engineers.
              </p>
            </div>

            {/* Regulatory Sections */}
            <div className="space-y-2.5">
              {page.sections?.map((sec, i) => (
                <div key={i} className="text-xs leading-relaxed">
                  {sec.heading && (
                    <div className="font-mono-tech font-bold text-[10px] sm:text-xs text-[#111111] mb-0.5 uppercase tracking-wide">
                      {sec.heading}
                    </div>
                  )}
                  {sec.body && <p className="text-[#111111] font-medium mb-1">{sec.body}</p>}
                  {sec.bullets && (
                    <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-xs font-mono-tech font-medium text-[#222222]">
                      {sec.bullets.map((b, bi) => (
                        <li key={bi} className="truncate">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="font-mono-tech text-[9px] text-[#444444] pt-2 border-t border-[#111111]/20 flex justify-between font-semibold">
              <span>DOC REF: {page.serial}</span>
              <span>STANDARDS COMPLIANT (NTSC/PAL)</span>
            </div>
          </div>
        ) : isSchematic ? (
          /* ── SCHEMATIC PAGE ── */
          <div className="h-full flex flex-col justify-between">
            <div className="mb-1.5">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#111111] uppercase">
                {page.title}
              </h2>
              <div className="text-[10px] sm:text-xs font-mono-tech text-[#084c78] font-bold tracking-wider">
                {page.subtitle}
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-white/70 border-2 border-[#084c78]/40 rounded-sm overflow-hidden shadow-inner">
              <ManualIsometricSchematic />
            </div>

            <div className="mt-1.5 font-mono-tech text-[9px] sm:text-[10px] text-[#333333] flex justify-between pt-1.5 border-t border-[#111111]/20 font-bold">
              <span>CIRCUIT BOARD: PCB-REV-96</span>
              <span className="text-[#084c78]">1PX WIREFRAME STANDARD</span>
            </div>
          </div>
        ) : (
          /* ── GENERAL EDITORIAL / CHANNELS / COLOPHON ── */
          <div className="h-full flex flex-col justify-between py-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#111111] uppercase leading-tight">
                  {page.title}
                </h2>
                {page.type === 'channels' && (
                  <span className="rubber-stamp-cyan text-[9px] font-mono-tech">BROADCAST ACTIVE</span>
                )}
              </div>
              {page.subtitle && (
                <div className="text-[10px] sm:text-xs font-mono-tech text-[#084c78] font-bold tracking-wider mb-2.5">
                  {page.subtitle}
                </div>
              )}
            </div>

            {/* Sections & Body Content */}
            <div className="space-y-3 overflow-hidden">
              {page.sections?.map((sec, i) => (
                <div key={i} className="text-xs sm:text-sm leading-relaxed">
                  {sec.heading && (
                    <div className="font-mono-tech font-bold text-[10px] sm:text-xs text-[#111111] mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-[#084c78]">■</span>
                      <span>{sec.heading}</span>
                    </div>
                  )}
                  {sec.body && (
                    <p className="text-[#111111] font-medium leading-relaxed font-['Jost',sans-serif]">
                      {sec.body}
                    </p>
                  )}
                  {sec.callout && (
                    <div className="my-2 p-2.5 bg-[#084c78]/8 border-l-4 border-[#084c78] text-xs sm:text-sm font-['Jost',sans-serif] italic text-[#084c78] font-semibold">
                      {sec.callout}
                    </div>
                  )}
                  {sec.bullets && (
                    <ul className="list-disc list-inside space-y-1 text-[10px] sm:text-xs font-mono-tech text-[#222222] font-semibold mt-1.5">
                      {sec.bullets.map((b, bi) => (
                        <li key={bi} className="truncate">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* If no sections provided, show placeholder */}
              {(!page.sections || page.sections.length === 0) && (
                <p className="text-xs sm:text-sm text-[#111111] leading-relaxed font-['Jost',sans-serif] font-medium">
                  {page.placeholder}
                </p>
              )}
            </div>

            {/* Page Bottom Technical Stamp */}
            <div className="pt-2 border-t border-[#111111]/20 font-mono-tech text-[9px] sm:text-[10px] text-[#333333] flex justify-between items-center font-bold">
              <span>REF: {page.serial || 'SEC-PLIST'}</span>
              <span className="text-[#111111]">ARCHIVAL BROADCAST RECORD</span>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM PAGE FOOTER (Folio & Page Indicator) ── */}
      <div className="flex items-center justify-between border-t-2 border-[#111111]/30 pt-2 shrink-0 font-mono-tech text-[10px] sm:text-[11px] text-[#111111] font-bold">
        <div>
          {isLeftPage ? (
            <span>PAGE {String(pageNumber).padStart(2, '0')}</span>
          ) : (
            <span className="text-[#444444]">PLAYLISTISMO CRT-90 MANUAL</span>
          )}
        </div>
        <div>
          {!isLeftPage ? (
            <span>PAGE {String(pageNumber).padStart(2, '0')}</span>
          ) : (
            <span className="text-[#444444]">PLAYLISTISMO CRT-90 MANUAL</span>
          )}
        </div>
      </div>
    </div>
  );
};
