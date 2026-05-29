import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Board from './pages/Board';
import DriverView from './pages/DriverView';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('gd_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login  = (u) => { localStorage.setItem('gd_user', JSON.stringify(u)); setUser(u); };
  const logout = ()  => { localStorage.removeItem('gd_user'); setUser(null); };

  if (loading) return <Splash />;
  if (!user)   return <Login onLogin={login} />;
  if (user.role === 'driver') return <DriverView user={user} onLogout={logout} />;
  return <Board user={user} onLogout={logout} />;
}

function Splash() {
  return (
    <div style={{ minHeight:'100vh', background:'#0F172A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Heebo,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'12px' }}>🔧</div>
        <p style={{ color:'#475569' }}>טוען...</p>
      </div>
    </div>
  );
}
