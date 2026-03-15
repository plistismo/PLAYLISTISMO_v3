import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel.tsx';

export default function Admin({ session }: { session: Session | null }) {
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen">
      <AdminPanel 
        session={session} 
        onClose={() => navigate('/')} 
      />
    </div>
  );
}
