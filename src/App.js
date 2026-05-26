import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DriverView from './pages/DriverView';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('garage_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('garage_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('garage_user');
    setUser(null);
  };

  if (loading) return <Splash />;
  if (!user) return <Login onLogin={login} />;
  if (user.role === 'driver') return <DriverView user={user} onLogout={logout} />;
  return <Dashboard user={user} onLogout={logout} />;
}

function Splash() {
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔧</div>
        <p style={{ color: '#64748B', fontFamily: 'Heebo, sans-serif' }}>טוען...</p>
      </div>
    </div>
  );
}
