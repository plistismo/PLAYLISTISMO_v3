import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.ts';
import { Session } from '@supabase/supabase-js';

import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Admin from './pages/Admin.tsx';
import Tv from './pages/Tv.tsx';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="bg-[#050505] min-h-screen flex items-center justify-center text-[#00ff00] font-vt323 text-2xl animate-pulse tracking-widest">INITIALIZING...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home session={session} />} />
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/admin" element={session ? <Admin session={session} /> : <Navigate to="/login" />} />
        <Route path="/tv" element={<Tv session={session} />} />
      </Routes>
    </BrowserRouter>
  );
}
