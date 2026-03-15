import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase.ts';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setMessage({ text: `ERROR: ${error.message}`, isError: true });
      setLoading(false);
    } else {
      setMessage({ text: "SIGNAL LOCKED. REDIRECTING...", isError: false });
      setTimeout(() => navigate('/'), 1000);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage({ text: `FAILED: ${error.message}`, isError: true });
      setLoading(false);
    } else {
      setMessage({ text: "SUCCESS! CHECK EMAIL OR LOGIN.", isError: false });
      setTimeout(() => {
        setIsLoginView(true);
        setMessage({ text: "ACCOUNT CREATED. PLEASE LOGIN.", isError: false });
        setLoading(false);
      }, 1500);
    }
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    setMessage({ text: "REDIRECTING...", isError: false });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });

    if (error) {
      setMessage({ text: `GITHUB ERROR: ${error.message}`, isError: true });
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center font-jost overflow-hidden selection:bg-red-900 selection:text-white relative">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #ff0000 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <main className="w-full max-w-md bg-[#111] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,1)] relative z-10 rounded-lg overflow-hidden backdrop-blur-sm">
        <div className="bg-black p-6 border-b border-white/5 flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-[0.2em] font-vt323 text-white drop-shadow-[2px_2px_0_#ff0000] uppercase">
            playlist<span className="text-[#888]">ismo</span>
          </h1>
          <p className="text-[10px] text-gray-500 tracking-[0.3em] mt-1 uppercase">Authentication Protocol</p>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-3 text-center text-xs font-bold tracking-widest uppercase border ${message.isError ? 'bg-red-900/80 border-red-500 text-white' : 'bg-green-900/80 border-green-500 text-white'}`}>
              {message.text}
            </div>
          )}

          {isLoginView ? (
            <div id="view-login" className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/')} className="w-full py-4 bg-black border border-white/20 text-white hover:bg-white/5 hover:border-white transition-all duration-300 font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3 group">
                  <span className="text-xl group-hover:scale-125 transition-transform duration-300">📺</span> PROCEED AS GUEST
                </button>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest my-2">
                  <div className="h-[1px] bg-white/10 flex-1"></div><span>OR INITIALIZE OAUTH</span><div className="h-[1px] bg-white/10 flex-1"></div>
                </div>
                <button onClick={handleGithubLogin} disabled={loading} className="w-full py-4 bg-black border border-white/20 text-white hover:border-[#6e5494] hover:shadow-[0_0_15px_rgba(110,84,148,0.5)] transition-all duration-300 font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3">
                  <span className="text-xl">👾</span> ACCESS VIA GITHUB
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest my-6">
                <div className="h-[1px] bg-white/10 flex-1"></div><span>OR OVERRIDE DIRECTLY</span><div className="h-[1px] bg-white/10 flex-1"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Email Coordinates</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-red-500 transition-colors font-mono text-sm placeholder-white/20" placeholder="admin@domain.com" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Security Code</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-red-500 transition-colors font-mono text-sm tracking-widest" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-red-900/80 text-white border border-red-500 hover:bg-red-500 hover:text-black font-bold tracking-widest text-sm uppercase transition-all duration-300">
                  {loading ? 'TUNING IN...' : 'CONNECT SERVICE'}
                </button>
              </form>
              <div className="text-center mt-6">
                <button type="button" onClick={() => setIsLoginView(false)} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest underline decoration-white/30 underline-offset-4 transition-colors">
                  NEW UNIT? INITIALIZE REGISTRATION
                </button>
              </div>
            </div>
          ) : (
            <div id="view-register" className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="text-center mb-6">
                <h2 className="text-white text-xl font-vt323 tracking-widest uppercase">Register New Unit</h2>
                <div className="w-12 h-1 bg-red-500 mx-auto mt-2"></div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Assigned Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-red-500 transition-colors font-mono text-sm placeholder-white/20" placeholder="user@domain.com" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Create Security Code</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-red-500 transition-colors font-mono text-sm tracking-widest" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-[#111] border border-white/30 text-white font-bold tracking-widest text-sm uppercase hover:border-white hover:bg-white hover:text-black transition-all duration-300">
                  {loading ? 'ACTIVATING...' : 'ACTIVATE ACCOUNT'}
                </button>
              </form>
              <div className="text-center mt-6">
                <button type="button" onClick={() => setIsLoginView(true)} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest underline decoration-white/30 underline-offset-4 transition-colors">
                  RETURN TO LOGIN PROTOCOL
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
