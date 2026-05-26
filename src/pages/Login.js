import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Login({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSenderName, setNewSenderName] = useState('');
  const [addingSender, setAddingSender] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('role').order('name');
    setUsers(data || []);
    setLoading(false);
  };

  const addSender = async () => {
    if (!newSenderName.trim()) return;
    const { data } = await supabase.from('users').insert({ name: newSenderName.trim(), role: 'sender' }).select().single();
    if (data) { setUsers(prev => [...prev, data]); setNewSenderName(''); setAddingSender(false); }
  };

  const drivers = users.filter(u => u.role === 'driver');
  const senders = users.filter(u => u.role === 'sender');

  return (
    <div style={styles.container}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      
      <div style={styles.card}>
        <div style={styles.logo}>🔧</div>
        <h1 style={styles.title}>מוסך – ניהול נהגים</h1>
        <p style={styles.subtitle}>בחר את המשתמש שלך</p>

        {loading ? <p style={{ color: '#64748B', textAlign: 'center' }}>טוען...</p> : (
          <>
            <Section label="נהגים 🚗">
              {drivers.map(u => (
                <UserBtn key={u.id} user={u} onClick={() => onLogin(u)} color="#3B82F6" />
              ))}
            </Section>

            <Section label="שולחים 📋">
              {senders.map(u => (
                <UserBtn key={u.id} user={u} onClick={() => onLogin(u)} color="#8B5CF6" />
              ))}
              {addingSender ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    value={newSenderName}
                    onChange={e => setNewSenderName(e.target.value)}
                    placeholder="שם מלא..."
                    onKeyDown={e => e.key === 'Enter' && addSender()}
                    style={styles.input}
                    autoFocus
                  />
                  <button onClick={addSender} style={styles.addBtn}>הוסף</button>
                  <button onClick={() => setAddingSender(false)} style={styles.cancelBtn}>ביטול</button>
                </div>
              ) : (
                <button onClick={() => setAddingSender(true)} style={styles.newUserBtn}>+ הוסף שולח חדש</button>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <p style={{ color: '#64748B', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>{label}</p>
      {children}
    </div>
  );
}

function UserBtn({ user, onClick, color }) {
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', textAlign: 'right', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Heebo, sans-serif', transition: 'all 0.15s' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', flexShrink: 0 }}>{user.name[0]}</div>
      <span>{user.name}</span>
      {user.is_backup && <span style={{ marginRight: 'auto', fontSize: '11px', color: '#64748B', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px' }}>גיבוי</span>}
    </button>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Heebo, sans-serif', direction: 'rtl' },
  card: { width: '100%', maxWidth: '400px', background: '#1E293B', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.08)' },
  logo: { fontSize: '40px', textAlign: 'center', marginBottom: '12px' },
  title: { color: 'white', fontSize: '22px', fontWeight: '800', textAlign: 'center', marginBottom: '6px' },
  subtitle: { color: '#64748B', fontSize: '14px', textAlign: 'center', marginBottom: '28px' },
  input: { flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '14px', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none' },
  addBtn: { padding: '10px 16px', background: '#3B82F6', border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', whiteSpace: 'nowrap' },
  cancelBtn: { padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', color: '#94A3B8', fontSize: '14px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', whiteSpace: 'nowrap' },
  newUserBtn: { width: '100%', padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', color: '#64748B', fontSize: '14px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', marginTop: '4px' },
};
