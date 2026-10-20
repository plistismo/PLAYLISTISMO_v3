import React, { useState } from 'react';
import stageBg from '../assets/music_video_stage.jpg';

export interface IdStudioConfig {
  textPrimary: string;
  textSecondary: string;
  fontFamily: 'font-mono' | 'font-sans' | 'font-serif';
  primaryColor: string;
  blendMode: 'mix-blend-normal' | 'mix-blend-difference' | 'mix-blend-overlay' | 'normal' | 'difference' | 'overlay';
  svgFilter: 'none' | 'rgb-split' | 'liquid-morph' | 'heavy-glitch';
  animation: 'none' | 'slow-flicker' | 'vhs-tracking';
}

interface IdStudioProps {
  initialPrimaryText?: string;
  initialSecondaryText?: string;
  onBackToMatrix?: () => void;
}

export default function IdStudio({
  initialPrimaryText = 'NEW',
  initialSecondaryText = 'CHANNEL',
  onBackToMatrix,
}: IdStudioProps) {
  // ── Local Watermark Configuration Recipe State ─────────────────────────────
  const [idConfig, setIdConfig] = useState<IdStudioConfig>({
    textPrimary: initialPrimaryText || 'NEW',
    textSecondary: initialSecondaryText || 'CHANNEL',
    fontFamily: 'font-mono', // options: font-mono, font-sans (Jost), font-serif
    primaryColor: '#FFFF00',
    blendMode: 'mix-blend-normal', // options: normal, difference, overlay
    svgFilter: 'none', // options: none, rgb-split, liquid-morph, heavy-glitch
    animation: 'none', // options: none, slow-flicker, vhs-tracking
  });

  // UI state for additional testing / conveniences
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [previewBg, setPreviewBg] = useState<'stage' | 'dark' | 'grid'>('stage');
  const [showSafeGuide, setShowSafeGuide] = useState<boolean>(true);

  // Normalize blend mode for both CSS inline style and Tailwind utility class
  const normalizedBlendMode = idConfig.blendMode.replace('mix-blend-', '');
  const blendModeClass = `mix-blend-${normalizedBlendMode}`;

  // Resolve Tailwind typography font class
  const getFontFamilyClass = (font: string) => {
    switch (font) {
      case 'font-sans':
        return "font-sans font-['Jost',sans-serif]";
      case 'font-serif':
        return 'font-serif';
      case 'font-mono':
      default:
        return "font-mono font-['Space_Mono',monospace]";
    }
  };

  // Resolve animation class
  const getAnimationClass = (anim: string) => {
    switch (anim) {
      case 'slow-flicker':
        return 'id-studio-anim-flicker';
      case 'vhs-tracking':
        return 'id-studio-anim-vhs';
      default:
        return '';
    }
  };

  // Copy JSON Recipe
  const handleCopyRecipe = () => {
    navigator.clipboard.writeText(JSON.stringify(idConfig, null, 2));
    setCopyFeedback('JSON Copiado!');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Quick Preset Handlers
  const applyPreset = (preset: Partial<IdStudioConfig>) => {
    setIdConfig(prev => ({ ...prev, ...preset }));
  };

  const resetDefaults = () => {
    setIdConfig({
      textPrimary: 'NEW',
      textSecondary: 'CHANNEL',
      fontFamily: 'font-mono',
      primaryColor: '#FFFF00',
      blendMode: 'mix-blend-normal',
      svgFilter: 'none',
      animation: 'none',
    });
  };

  return (
    <div className="id-studio flex-1 flex flex-col h-full bg-[#030708] text-white overflow-hidden select-none">
      {/* ── Scoped Keyframe Animations ── */}
      <style>{`
        @keyframes idStudioSlowFlicker {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px currentColor); }
          42% { opacity: 1; }
          43% { opacity: 0.35; filter: none; }
          44% { opacity: 0.9; }
          76% { opacity: 1; }
          77% { opacity: 0.2; }
          78% { opacity: 1; }
          91% { opacity: 0.8; }
          92% { opacity: 0.4; }
          93% { opacity: 1; }
        }
        .id-studio-anim-flicker {
          animation: idStudioSlowFlicker 3.2s infinite ease-in-out;
        }

        @keyframes idStudioVhsTracking {
          0% { transform: translateY(0) skewX(0deg); }
          25% { transform: translateY(-1.5px) skewX(-1.5deg); }
          27% { transform: translateY(1.5px) skewX(2deg); }
          29% { transform: translateY(0) skewX(0deg); }
          70% { transform: translateY(0) skewX(0deg); }
          72% { transform: translateY(-2px) skewX(-2.5deg); }
          74% { transform: translateY(2px) skewX(1.8deg); }
          76% { transform: translateY(0) skewX(0deg); }
        }
        .id-studio-anim-vhs {
          animation: idStudioVhsTracking 2.6s infinite ease-in-out;
        }
      `}</style>

      {/* ── Header Bar ── */}
      <div className="shrink-0 px-6 py-3.5 bg-black/80 border-b border-yellow-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToMatrix && (
            <button
              onClick={onBackToMatrix}
              className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-matrix-label/60 hover:text-white border border-white/10 hover:border-white/30 rounded transition-all mr-2"
              title="Voltar para Canais & Curadoria"
            >
              ← MATRIX
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xl font-bold">⚡</span>
            <h1 className="text-lg md:text-xl font-black tracking-[0.2em] uppercase text-yellow-400 drop-shadow-[0_0_8px_rgba(255,255,0,0.3)]">
              ID STUDIO
            </h1>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">
            WATERMARK VISUAL BUILDER // SAFE MODE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {copyFeedback && (
            <span className="text-xs font-mono font-bold text-yellow-400 animate-pulse">
              ✓ {copyFeedback}
            </span>
          )}
          <button
            onClick={handleCopyRecipe}
            className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 rounded transition-all"
            title="Copiar configuração JSON"
          >
            📋 Copiar JSON
          </button>
          <button
            onClick={resetDefaults}
            className="px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white border border-white/10 hover:border-white/20 rounded transition-all uppercase tracking-wider"
            title="Restaurar valores padrão"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* ── Split Screen Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL — CONTROLS (Procedural Configuration)
        ══════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[460px] xl:w-[500px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#04080a] flex flex-col overflow-y-auto matrix-scrollbar p-5 space-y-5">
          {/* Section: Text Fields */}
          <div className="space-y-3 bg-black/60 p-4 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-400">
                01 // TEXT CONTENT
              </span>
              <span className="text-[10px] font-mono text-white/40">Watermark Lines</span>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1 font-bold">
                  TEXT PRIMARY (MAIN ID)
                </label>
                <input
                  type="text"
                  value={idConfig.textPrimary}
                  onChange={e => setIdConfig(prev => ({ ...prev, textPrimary: e.target.value }))}
                  placeholder="Ex: NEW"
                  className="w-full px-3 py-2 text-sm font-mono text-white bg-black/80 border border-white/20 focus:border-yellow-400 focus:outline-none rounded-sm transition-colors uppercase tracking-widest"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1 font-bold">
                  TEXT SECONDARY (SUBTITLE / LABEL)
                </label>
                <input
                  type="text"
                  value={idConfig.textSecondary}
                  onChange={e => setIdConfig(prev => ({ ...prev, textSecondary: e.target.value }))}
                  placeholder="Ex: CHANNEL"
                  className="w-full px-3 py-2 text-sm font-mono text-white bg-black/80 border border-white/20 focus:border-yellow-400 focus:outline-none rounded-sm transition-colors uppercase tracking-widest"
                />
              </div>
            </div>
          </div>

          {/* Section: Typography */}
          <div className="space-y-3 bg-black/60 p-4 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-400">
                02 // TYPOGRAPHY
              </span>
              <span className="text-[10px] font-mono text-white/40">Font Family</span>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1 font-bold">
                FONT FAMILY
              </label>
              <select
                value={idConfig.fontFamily}
                onChange={e => setIdConfig(prev => ({ ...prev, fontFamily: e.target.value as any }))}
                className="w-full px-3 py-2 text-xs font-mono text-white bg-black/80 border border-white/20 focus:border-yellow-400 focus:outline-none rounded-sm transition-colors cursor-pointer"
              >
                <option value="font-mono">font-mono (Space Mono / VT323)</option>
                <option value="font-sans">font-sans (Jost Futuristic)</option>
                <option value="font-serif">font-serif (Classic Editorial)</option>
              </select>
            </div>
          </div>

          {/* Section: Color & Tone */}
          <div className="space-y-3 bg-black/60 p-4 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-400">
                03 // PRIMARY COLOR
              </span>
              <span className="text-[10px] font-mono text-white/40">{idConfig.primaryColor}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={idConfig.primaryColor}
                  onChange={e => setIdConfig(prev => ({ ...prev, primaryColor: e.target.value.toUpperCase() }))}
                  className="w-12 h-10 p-0.5 bg-black border border-white/30 rounded cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={idConfig.primaryColor}
                  onChange={e => setIdConfig(prev => ({ ...prev, primaryColor: e.target.value.toUpperCase() }))}
                  placeholder="#FFFF00"
                  maxLength={7}
                  className="flex-1 px-3 py-2 text-xs font-mono text-white bg-black/80 border border-white/20 focus:border-yellow-400 focus:outline-none rounded-sm uppercase tracking-wider"
                />
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { label: 'MTV Yellow', hex: '#FFFF00' },
                  { label: 'Cyber Green', hex: '#00FF88' },
                  { label: 'Neon Cyan', hex: '#00E5FF' },
                  { label: 'Hot Pink', hex: '#FF007F' },
                  { label: 'Pure White', hex: '#FFFFFF' },
                  { label: 'Radio Orange', hex: '#FF6600' },
                ].map(swatch => (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => setIdConfig(prev => ({ ...prev, primaryColor: swatch.hex }))}
                    className={`w-6 h-6 rounded-sm border transition-transform hover:scale-110 ${
                      idConfig.primaryColor.toUpperCase() === swatch.hex
                        ? 'border-white shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-105'
                        : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                    title={`${swatch.label} (${swatch.hex})`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Section: Blend Mode & Optical Filters */}
          <div className="space-y-3 bg-black/60 p-4 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-400">
                04 // COMPOSITING & FILTERS
              </span>
              <span className="text-[10px] font-mono text-white/40">CSS & SVG</span>
            </div>

            <div className="space-y-3 pt-1">
              {/* Blend Mode */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1 font-bold">
                  BLEND MODE (CSS mix-blend-mode)
                </label>
                <select
                  value={idConfig.blendMode}
                  onChange={e => setIdConfig(prev => ({ ...prev, blendMode: e.target.value as any }))}
                  className="w-full px-3 py-2 text-xs font-mono text-white bg-black/80 border border-white/20 focus:border-yellow-400 focus:outline-none rounded-sm transition-colors cursor-pointer"
                >
                  <option value="mix-blend-normal">normal (Opaque standard)</option>
                  <option value="mix-blend-difference">difference (Chameleon background inversion)</option>
                  <option value="mix-blend-overlay">overlay (High contrast film mix)</option>
                </select>
              </div>

              {/* SVG Filter */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1 font-bold">
                  SVG FILTER (Optical Pipeline)
                </label>
                <select
                  value={idConfig.svgFilter}
                  onChange={e => setIdConfig(prev => ({ ...prev, svgFilter: e.target.value as any }))}
                  className="w-full px-3 py-2 text-xs font-mono text-white bg-black/80 border border-white/20 focus:border-yellow-400 focus:outline-none rounded-sm transition-colors cursor-pointer"
                >
                  <option value="none">none (Clean sharp vector)</option>
                  <option value="rgb-split">rgb-split (Chromatic Aberration / feOffset + feMerge)</option>
                  <option value="liquid-morph">liquid-morph (Gooey Threshold / feGaussianBlur + feColorMatrix)</option>
                  <option value="heavy-glitch">heavy-glitch (Broadcast Tear / feTurbulence + feDisplacementMap)</option>
                </select>
              </div>

              {/* Temporal Animation */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-white/60 mb-1 font-bold">
                  ANIMATION (Temporal Effect)
                </label>
                <select
                  value={idConfig.animation}
                  onChange={e => setIdConfig(prev => ({ ...prev, animation: e.target.value as any }))}
                  className="w-full px-3 py-2 text-xs font-mono text-white bg-black/80 border border-white/20 focus:border-yellow-400 focus:outline-none rounded-sm transition-colors cursor-pointer"
                >
                  <option value="none">none (Static watermark)</option>
                  <option value="slow-flicker">slow-flicker (CRT cathode tube micro-flicker)</option>
                  <option value="vhs-tracking">vhs-tracking (Jittery horizontal head scan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Presets Bank */}
          <div className="space-y-3 bg-black/60 p-4 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-yellow-400">
                05 // PRESET STYLES
              </span>
              <span className="text-[10px] font-mono text-white/40">1-Click Load</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    fontFamily: 'font-mono',
                    primaryColor: '#FFFF00',
                    blendMode: 'mix-blend-normal',
                    svgFilter: 'none',
                    animation: 'slow-flicker',
                  })
                }
                className="p-2 text-left bg-black/40 border border-yellow-400/30 hover:border-yellow-400 rounded transition-all text-xs font-mono"
              >
                <div className="text-yellow-400 font-bold">🟡 MTV '90s</div>
                <div className="text-[10px] text-white/40 truncate">Mono • Yellow • Flicker</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    fontFamily: 'font-mono',
                    primaryColor: '#00FF88',
                    blendMode: 'mix-blend-difference',
                    svgFilter: 'rgb-split',
                    animation: 'vhs-tracking',
                  })
                }
                className="p-2 text-left bg-black/40 border-emerald-500/30 border hover:border-emerald-400 rounded transition-all text-xs font-mono"
              >
                <div className="text-emerald-400 font-bold">🟢 Cyber Intercept</div>
                <div className="text-[10px] text-white/40 truncate">Diff • RGB-Split • VHS</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    fontFamily: 'font-sans',
                    primaryColor: '#FF007F',
                    blendMode: 'mix-blend-overlay',
                    svgFilter: 'liquid-morph',
                    animation: 'none',
                  })
                }
                className="p-2 text-left bg-black/40 border-pink-500/30 border hover:border-pink-400 rounded transition-all text-xs font-mono"
              >
                <div className="text-pink-400 font-bold">🟣 Acid Morph</div>
                <div className="text-[10px] text-white/40 truncate">Sans • Liquid Goo • Overlay</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    fontFamily: 'font-mono',
                    primaryColor: '#00E5FF',
                    blendMode: 'mix-blend-difference',
                    svgFilter: 'heavy-glitch',
                    animation: 'vhs-tracking',
                  })
                }
                className="p-2 text-left bg-black/40 border-cyan-500/30 border hover:border-cyan-400 rounded transition-all text-xs font-mono"
              >
                <div className="text-cyan-400 font-bold">⚡ Heavy Glitch</div>
                <div className="text-[10px] text-white/40 truncate">Turbulence Displacement</div>
              </button>
            </div>
          </div>

          {/* Section: Live Recipe Inspector */}
          <div className="p-3 bg-black/90 border border-white/10 rounded-sm font-mono text-[10px] text-white/60 space-y-1">
            <div className="text-white/40 uppercase tracking-widest font-bold">RECIPE JSON STATE:</div>
            <pre className="text-matrix-label/80 overflow-x-auto p-2 bg-[#020506] rounded border border-white/5">
              {JSON.stringify(idConfig, null, 2)}
            </pre>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL — PREVIEW CANVAS (Simulated TV Screen)
        ══════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#020507] overflow-y-auto">
          {/* Canvas Controls Header */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/60 font-bold uppercase tracking-wider">
                TV MONITOR SIMULATOR // 16:9 1080p
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mr-1">Fundo:</span>
              <button
                type="button"
                onClick={() => setPreviewBg('stage')}
                className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                  previewBg === 'stage' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                Show Clipe
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('dark')}
                className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                  previewBg === 'dark' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setPreviewBg('grid')}
                className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                  previewBg === 'grid' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                Grade
              </button>

              <button
                type="button"
                onClick={() => setShowSafeGuide(prev => !prev)}
                className={`ml-2 px-2 py-0.5 text-[10px] uppercase font-bold border rounded ${
                  showSafeGuide ? 'border-yellow-400/50 text-yellow-300 bg-yellow-400/10' : 'border-white/10 text-white/40'
                }`}
                title="Alternar guias de área de segurança (Safe Area Guides)"
              >
                Guides {showSafeGuide ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* TV Chassis / Monitor Bezel */}
          <div className="w-full max-w-4xl p-2.5 bg-[#121518] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/15">
            {/* TV Screen Container: bg-zinc-900 aspect-video relative overflow-hidden */}
            <div className="bg-zinc-900 aspect-video relative overflow-hidden rounded-lg shadow-inner border border-black/80">
              {/* ── Background Layer ── */}
              {previewBg === 'stage' && (
                <img
                  src={stageBg}
                  alt="Simulated Music Video"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              )}

              {previewBg === 'dark' && (
                <div className="w-full h-full bg-gradient-to-tr from-black via-zinc-950 to-zinc-900 flex items-center justify-center">
                  <div className="text-zinc-800 font-mono text-3xl font-black tracking-widest uppercase">
                    NO SIGNAL // CH 07
                  </div>
                </div>
              )}

              {previewBg === 'grid' && (
                <div
                  className="w-full h-full bg-[#0a0d12]"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }}
                />
              )}

              {/* ── Safe Area Guides (Action & Title Safe Lines) ── */}
              {showSafeGuide && (
                <div className="absolute inset-4 md:inset-8 border border-white/10 border-dashed pointer-events-none z-10">
                  <span className="absolute top-1 left-2 text-[8px] font-mono text-white/20 uppercase tracking-widest">
                    TITLE SAFE 90%
                  </span>
                </div>
              )}

              {/* ── Simulated CRT Scanlines ── */}
              <div className="pointer-events-none absolute inset-0 scanlines opacity-25 z-20" />

              {/* ── Broadcast Lower Third OSD Simulation ── */}
              <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-25 pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                <div className="flex items-center gap-2 text-white/70 font-mono text-[10px] md:text-xs">
                  <span className="px-1.5 py-0.5 bg-yellow-400 text-black font-bold uppercase rounded-xs">
                    NOW PLAYING
                  </span>
                  <span className="font-bold tracking-wider text-white">THE CLASH</span>
                  <span className="opacity-60">•</span>
                  <span className="text-white/80">London Calling (1979)</span>
                </div>
              </div>

              {/* ── Top-Left Broadcast Stamp ── */}
              <div className="absolute top-4 left-4 md:top-6 md:left-6 z-25 pointer-events-none font-mono text-[10px] text-white/50 tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping" />
                <span>REC 00:04:18</span>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  DYNAMIC WATERMARK (Based EXACTLY on idConfig state)
              ══════════════════════════════════════════════════════════ */}
              <div
                className={`id-studio-watermark absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 text-right z-30 select-none ${blendModeClass} ${getFontFamilyClass(
                  idConfig.fontFamily
                )} ${getAnimationClass(idConfig.animation)}`}
                style={{
                  color: idConfig.primaryColor,
                  mixBlendMode: normalizedBlendMode as any,
                  filter: idConfig.svgFilter !== 'none' ? `url(#${idConfig.svgFilter})` : undefined,
                }}
              >
                <div className="text-xl sm:text-2xl md:text-4xl font-extrabold tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  {idConfig.textPrimary || ' '}
                </div>
                {idConfig.textSecondary && (
                  <div className="text-xs sm:text-sm md:text-lg font-semibold tracking-wider leading-tight opacity-90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] mt-0.5">
                    {idConfig.textSecondary}
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════════════
                  SVG FILTER DEFINITIONS (Inside Preview Canvas)
              ══════════════════════════════════════════════════════════ */}
              <svg className="hidden" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                  {/* 1. rgb-split: using <feOffset> and <feMerge> to shift Red and Blue channels */}
                  <filter id="rgb-split" x="-20%" y="-20%" width="140%" height="140%">
                    {/* Shift Red channel to the left */}
                    <feColorMatrix
                      in="SourceGraphic"
                      type="matrix"
                      values="1 0 0 0 0
                              0 0 0 0 0
                              0 0 0 0 0
                              0 0 0 1 0"
                      result="red"
                    />
                    <feOffset in="red" dx="-4" dy="0" result="red-offset" />

                    {/* Green channel unchanged in center */}
                    <feColorMatrix
                      in="SourceGraphic"
                      type="matrix"
                      values="0 0 0 0 0
                              0 1 0 0 0
                              0 0 0 0 0
                              0 0 0 1 0"
                      result="green"
                    />

                    {/* Shift Blue channel to the right */}
                    <feColorMatrix
                      in="SourceGraphic"
                      type="matrix"
                      values="0 0 0 0 0
                              0 0 0 0 0
                              0 0 1 0 0
                              0 0 0 1 0"
                      result="blue"
                    />
                    <feOffset in="blue" dx="4" dy="0" result="blue-offset" />

                    {/* Blend Red + Green + Blue */}
                    <feBlend in="red-offset" in2="green" mode="screen" result="rg" />
                    <feBlend in="rg" in2="blue-offset" mode="screen" result="rgb" />
                    <feMerge>
                      <feMergeNode in="rgb" />
                      <feMergeNode in="SourceGraphic" opacity="0.35" />
                    </feMerge>
                  </filter>

                  {/* 2. heavy-glitch: using <feTurbulence> and <feDisplacementMap> */}
                  <filter id="heavy-glitch" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04 0.95" numOctaves="2" result="noise" />
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="noise"
                      scale="18"
                      xChannelSelector="R"
                      yChannelSelector="G"
                      result="displaced"
                    />
                    <feMerge>
                      <feMergeNode in="displaced" />
                    </feMerge>
                  </filter>

                  {/* 3. liquid-morph: using <feGaussianBlur> and <feColorMatrix> */}
                  <filter id="liquid-morph" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                    <feColorMatrix
                      in="blur"
                      type="matrix"
                      values="1 0 0 0 0
                              0 1 0 0 0
                              0 0 1 0 0
                              0 0 0 20 -8"
                      result="goo"
                    />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                  </filter>
                </defs>
              </svg>
            </div>
          </div>

          {/* Active Configuration Summary Pill Bar */}
          <div className="w-full max-w-4xl mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-[10px] font-mono text-white/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">
                FONT: <span className="text-white/80">{idConfig.fontFamily}</span>
              </span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">
                COLOR: <span className="text-yellow-400 font-bold">{idConfig.primaryColor}</span>
              </span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">
                BLEND: <span className="text-white/80">{normalizedBlendMode}</span>
              </span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">
                FILTER: <span className="text-white/80">{idConfig.svgFilter}</span>
              </span>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">
                ANIM: <span className="text-white/80">{idConfig.animation}</span>
              </span>
            </div>

            <span className="tracking-widest uppercase">
              PLISTISMO PROCEDURAL ID PIPELINE
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
