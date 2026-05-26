import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const STATUS_CONFIG = {
  in_garage: { label: 'במוסך', color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: '🏠' },
  in_use: { label: 'בנסיעה', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: '🚗' },
  parked_outside: { label: 'חונה בחוץ', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: '🅿️' },
};

export default function GarageCars() {
  const [cars, setCars] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlate, setNewPlate] = useState('');

  useEffect(() => {
    fetchCars();
    const channel = supabase.channel('cars')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'garage_cars' }, fetchCars)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchCars = async () => {
    const { data } = await supabase.from('garage_cars').select('*, parked_by_user:parked_by(name)').order('plate');
    setCars(data || []);
  };

  const addCar = async () => {
    if (!newPlate.trim()) return;
    await supabase.from('garage_cars').insert({ plate: newPlate.trim(), status: 'in_garage' });
    setNewPlate('');
    setShowAdd(false);
    fetchCars();
  };

  const updateStatus = async (car, status) => {
    await supabase.from('garage_cars').update({ status, updated_at: new Date().toISOString() }).eq('id', car.id);
    fetchCars();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>רכבי המוסך</h3>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Heebo, sans-serif', fontWeight: '600' }}>+ הוסף רכב</button>
      </div>

      {showAdd && (
        <div style={{ background: '#1E293B', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px' }}>
          <input value={newPlate} onChange={e => setNewPlate(e.target.value)} placeholder="מס׳ רכב" onKeyDown={e => e.key === 'Enter' && addCar()}
            style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '14px', fontFamily: 'monospace', outline: 'none', direction: 'ltr' }} />
          <button onClick={addCar} style={{ padding: '10px 16px', background: '#3B82F6', border: 'none', borderRadius: '10px', color: 'white', fontFamily: 'Heebo, sans-serif', fontWeight: '600', cursor: 'pointer' }}>הוסף</button>
        </div>
      )}

      {cars.length === 0 ? (
        <div style={{ background: '#1E293B', borderRadius: '16px', padding: '32px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#475569', fontSize: '14px' }}>אין רכבים רשומים. הוסף רכב ראשון.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cars.map(car => {
            const cfg = STATUS_CONFIG[car.status] || STATUS_CONFIG.in_garage;
            return (
              <div key={car.id} style={{ background: '#1E293B', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{cfg.icon}</span>
                  <div>
                    <p style={{ color: 'white', fontWeight: '700', fontFamily: 'monospace', fontSize: '15px' }}>{car.plate}</p>
                    {car.parked_address && <p style={{ color: '#F59E0B', fontSize: '12px', marginTop: '2px' }}>📍 {car.parked_address}</p>}
                    {car.parked_by_user && <p style={{ color: '#64748B', fontSize: '12px' }}>הושאר ע"י: {car.parked_by_user.name}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: cfg.bg, padding: '4px 12px', borderRadius: '20px' }}>
                    <span style={{ color: cfg.color, fontSize: '12px', fontWeight: '600' }}>{cfg.label}</span>
                  </div>
                  <select value={car.status} onChange={e => updateStatus(car, e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94A3B8', padding: '6px 8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', outline: 'none' }}>
                    <option value="in_garage">במוסך</option>
                    <option value="in_use">בנסיעה</option>
                    <option value="parked_outside">חונה בחוץ</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
