import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';

type TvState = {
  isOn: boolean;
  mode: 'OFF' | 'BLUE_SCREEN' | 'VIDEO' | 'IMAGE';
  currentImage: string | null;
  originalImage: string | null;
  videoSrc: string | null;
  isProcessing: boolean;
  statusMessage: string;
};

export default function Tv({ session }: { session: Session | null }) {
  const navigate = useNavigate();
  const [tvState, setTvState] = useState<TvState>({
    isOn: false,
    mode: 'OFF',
    currentImage: null,
    originalImage: null,
    videoSrc: null,
    isProcessing: false,
    statusMessage: '',
  });

  const [time, setTime] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (tvState.mode === 'VIDEO' && tvState.videoSrc && videoRef.current) {
      videoRef.current.play().catch(e => console.log('Autoplay blocked', e));
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [tvState.mode, tvState.videoSrc]);

  const setStatus = (msg: string) => {
    setTvState(prev => ({ ...prev, statusMessage: msg }));
  };

  const clearStatus = () => {
    setTvState(prev => ({ ...prev, statusMessage: '' }));
  };

  const togglePower = () => {
    if (tvState.isOn) {
      setTvState(prev => ({ ...prev, isOn: false, mode: 'OFF', isProcessing: false }));
      clearStatus();
    } else {
      setTvState(prev => ({ ...prev, isOn: true, mode: 'BLUE_SCREEN', isProcessing: false }));
      setStatus("INITIALIZING...");
      setTimeout(() => setStatus("READY"), 1500);
      setTimeout(clearStatus, 2500);
    }
  };

  const handleUploadClick = () => {
    if (tvState.isOn && !tvState.isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        setTvState(prev => ({
          ...prev,
          originalImage: result,
          currentImage: result,
          videoSrc: null,
          mode: 'IMAGE',
        }));
        setStatus("IMAGE LOADED");
        setTimeout(clearStatus, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    if (!tvState.isOn || tvState.isProcessing) return;
    
    if (tvState.mode === 'VIDEO') {
      setTvState(prev => ({ ...prev, mode: 'BLUE_SCREEN', videoSrc: null }));
      setStatus("EJECT");
    } else if (tvState.mode === 'IMAGE' && tvState.originalImage) {
      setTvState(prev => ({ ...prev, currentImage: prev.originalImage }));
      setStatus("RESET OK");
    }
    setTimeout(clearStatus, 1500);
  };

  return (
    <div className="bg-[#111] min-h-screen overflow-x-hidden flex flex-col items-center justify-center p-4 selection:bg-green-500 selection:text-black font-vt323">
      <div id="top-controls" className="fixed top-4 right-4 z-[9990] flex gap-2">
        {!session && (
          <button onClick={() => navigate('/login')} className="bg-zinc-900/20 text-zinc-500 border border-zinc-600/50 px-3 py-1 font-vt323 text-lg tracking-widest hover:bg-zinc-600 hover:text-white transition-colors uppercase shadow-[0_0_10px_rgba(255,255,255,0.1)] backdrop-blur-sm flex items-center gap-2 opacity-50 hover:opacity-100">🔑 LOGIN</button>
        )}
        {session?.user?.id === ADMIN_UID && (
          <button onClick={() => navigate('/admin')} className="bg-amber-900/20 text-amber-500 border border-amber-600/50 px-3 py-1 font-vt323 text-lg tracking-widest hover:bg-amber-600 hover:text-black transition-colors uppercase shadow-[0_0_10px_rgba(217,119,6,0.2)] backdrop-blur-sm flex items-center gap-2">⚙ SERVICE MODE</button>
        )}
      </div>
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] pointer-events-none">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#444 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl flex flex-col md:flex-row items-center justify-center gap-16 pt-10">
        
        {/* TV UNIT */}
        <div className="relative w-full max-w-4xl transition-transform duration-500 perspective-[1500px] group">
          <div className="relative bg-[#1a1a1a] texture-plastic rounded-[24px] p-8 pb-12 shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15)] border-t border-[#333] tv-3d-tilt transform-style-3d">
            <div className="absolute inset-0 bg-[#111] translate-z-back rounded-[20px] z-[-1] shadow-2xl"></div>
            
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3/4 h-6 flex justify-center space-x-1 opacity-30 rotate-x-20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-1 h-full bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)] mx-[1px]"></div>
              ))}
            </div>

            <div className="flex bg-[#111] rounded-[2.5rem] p-6 shadow-[inset_0_0_20px_rgba(0,0,0,1)] border-b-8 border-r-8 border-[#050505] border-t border-l border-[#222]">
              <div className="hidden md:flex flex-col justify-center w-12 mr-3 space-y-0.5 opacity-60">
                {Array.from({ length: 36 }).map((_, i) => <div key={`ls-${i}`} className="w-full h-[2px] bg-[#050505]"></div>)}
              </div>

              <div className="relative flex-1 aspect-[4/3] bg-[#050505] rounded-[3rem] overflow-hidden screen-container border-[4px] border-[#080808] z-10">
                <div className="absolute inset-0 z-50 rounded-[3rem] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-[3rem] z-50 pointer-events-none opacity-40"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.4)_100%)] z-40 pointer-events-none"></div>

                {!tvState.isOn && (
                  <div className="absolute inset-0 bg-[#020202] flex items-center justify-center z-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-30 pointer-events-none"></div>
                  </div>
                )}

                {tvState.isOn && (
                  <div className="relative w-full h-full crt-flicker rounded-[2rem] overflow-hidden bg-black scale-[1.02]">
                    <video ref={videoRef} playsInline loop className={`w-full h-full object-cover vhs-filter pointer-events-auto ${tvState.mode === 'VIDEO' ? '' : 'hidden'}`} />
                    <img src={tvState.currentImage || ''} className={`w-full h-full object-cover vhs-filter ${tvState.mode === 'IMAGE' ? '' : 'hidden'}`} alt="TV Content" />

                    {tvState.mode === 'BLUE_SCREEN' && (
                      <div className="w-full h-full bg-[#0000aa] flex flex-col items-center justify-center text-white/90">
                        <div className="text-4xl md:text-6xl font-mono mb-4 text-center vhs-text-shadow font-bold">VIDEO 1</div>
                        <div className="vhs-text-shadow text-xl animate-pulse tracking-widest">AUTO TRACKING</div>
                      </div>
                    )}

                    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-8 pointer-events-none font-mono text-white/80">
                      <div className="flex justify-between items-start">
                        <div className="vhs-text-shadow text-3xl md:text-5xl tracking-widest uppercase font-bold text-green-500/80 drop-shadow-md">PLAY ►</div>
                        <div className="vhs-text-shadow text-xl md:text-2xl">CH 03</div>
                      </div>
                      <div className="flex justify-between items-end vhs-text-shadow text-xl md:text-2xl">
                        <span>SP</span>
                        <div className="flex flex-col items-end">
                          <span>{time || '00:00 AM'}</span>
                          <span className="tracking-wider text-lg">JUL 04 1996</span>
                        </div>
                      </div>
                    </div>

                    {tvState.statusMessage && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full text-center pointer-events-none">
                        <div className="inline-block text-[#00ff00] font-pixel text-xl md:text-3xl bg-black/80 px-6 py-3 border-y-2 border-[#00ff00]/50 tracking-widest uppercase shadow-lg backdrop-blur-sm transform rotate-1">
                          {tvState.statusMessage}
                        </div>
                      </div>
                    )}

                    <div className="vhs-noise z-10 mix-blend-overlay pointer-events-none"></div>
                    <div className="vhs-tracking z-10 pointer-events-none"></div>
                    <div className="absolute inset-0 scanlines pointer-events-none z-40 opacity-40"></div>
                  </div>
                )}
              </div>

              <div className="hidden md:flex flex-col justify-center w-12 ml-3 space-y-0.5 opacity-60">
                {Array.from({ length: 36 }).map((_, i) => <div key={`rs-${i}`} className="w-full h-[2px] bg-[#050505]"></div>)}
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center px-10 relative">
              <div className="flex flex-col items-start group cursor-default">
                <div className="flex space-x-0.5 mb-1 opacity-80">
                  <div className="w-3 h-1 bg-red-600 rounded-sm"></div>
                  <div className="w-3 h-1 bg-green-600 rounded-sm"></div>
                  <div className="w-3 h-1 bg-blue-600 rounded-sm"></div>
                </div>
                <span className="font-serif italic font-bold text-[#aaa] tracking-wider text-xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)] font-sans">Playli<span className="text-[#888]">trinitron</span></span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center font-sans tracking-widest">
                  <div className={`w-2 h-2 rounded-full border border-black transition-all duration-300 ${tvState.isOn ? 'bg-red-500 shadow-[0_0_8px_#ff0000] saturate-200' : 'bg-red-900'}`}></div>
                  <span className="text-[8px] text-gray-500 mt-1 font-bold">POWER</span>
                </div>
                <button onClick={togglePower} className="w-10 h-10 rounded bg-[#1a1a1a] border-b-4 border-r-4 border-black shadow-lg flex items-center justify-center active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 transition-all">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                </button>
              </div>
            </div>
            
            <div className="absolute -bottom-4 left-16 w-24 h-5 bg-[#111] rounded-b shadow-[0_5px_10px_black]"></div>
            <div className="absolute -bottom-4 right-16 w-24 h-5 bg-[#111] rounded-b shadow-[0_5px_10px_black]"></div>
          </div>
        </div>

        {/* CONTROLLER UNIT */}
        <div className="relative transform flex-shrink-0 -rotate-3 select-none perspective-[500px]">
          <div className="bg-[#222] texture-plastic w-64 rounded-[0_0_24px_24px] shadow-[20px_20px_50px_rgba(0,0,0,0.7),inset_1px_1px_1px_rgba(255,255,255,0.1)] border-l border-t border-[#444] relative z-10 pb-8 overflow-hidden font-sans">
            
            <div className="h-10 bg-[#151515] rounded-[12px_12px_0_0] relative overflow-hidden border-b border-[#333] shadow-md">
                 <div className="absolute inset-0 bg-red-900/30"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full shadow-[inset_0_0_8px_rgba(255,0,0,0.6)] border border-red-900/50"></div>
            </div>

            <div className="p-5 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-8 border-b border-[#333] pb-3">
                    <span className="text-gray-500 font-bold italic text-xs tracking-widest drop-shadow-[0_1px_1px_black]">UNIVERSAL</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-900"></div>
                </div>

                <div className="flex justify-end w-full mb-8 px-2">
                    <div className="flex flex-col items-center">
                        <button onClick={togglePower} className="w-12 h-12 rounded-full bg-[#cc2222] text-white flex justify-center items-center remote-btn hover:bg-[#dd3333] active:scale-95 transition-transform">
                            <svg className="w-5 h-5 drop-shadow-md opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                        </button>
                        <span className="text-[8px] text-gray-500 mt-1 font-bold tracking-wider pt-1">POWER</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-6 w-full mb-8 px-2">
                     <div className="flex flex-col items-center space-y-2">
                        <span className="text-[9px] text-gray-500 font-bold tracking-wider">SOURCE</span>
                        <button onClick={handleUploadClick} disabled={!tvState.isOn || tvState.isProcessing} className="w-14 h-14 rounded-lg bg-[#2a4a80] text-gray-200 remote-btn disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center active:scale-95 transition-transform">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </button>
                     </div>
                     <div className="flex flex-col items-center space-y-2">
                        <span className="text-[9px] text-gray-500 font-bold tracking-wider">RESET</span>
                        <button onClick={handleReset} disabled={!tvState.isOn || tvState.isProcessing} className="w-14 h-14 rounded-lg bg-[#b07d15] text-gray-100 remote-btn disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center active:scale-95 transition-transform">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                        </button>
                     </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}
