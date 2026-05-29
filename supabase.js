import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const CFG = {
  in_garage:      { label:'במוסך',       color:'#10B981', bg:'rgba(16,185,129,0.1)',  icon:'🏠' },
  in_use:         { label:'בנסיעה',      color:'#F59E0B', bg:'rgba(245,158,11,0.1)',  icon:'🚗' },
  parked_outside: { label:'חונה בחוץ',   color:'#EF4444', bg:'rgba(239,68,68,0.1)',   icon:'🅿️' },
};

export default function GarageCars() {
  const [cars, setCars]       = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [plate, setPlate]     = useState('');

  useEffect(() => {
    fetchCars();
    const ch = supabase.channel('cars')
      .on('postgres_changes', { event:'*', schema:'public', table:'garage_cars' }, fetchCars)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const fetchCars = async () => {
    const { data } = await supabase.from('garage_cars').select('*').order('plate');
    setCars(data || []);
  };

  const addCar = async () => {
    if (!plate.trim()) return;
    await supabase.from('garage_cars').insert({ plate: plate.trim() });
    setPlate(''); setShowAdd(false); fetchCars();
  };

  const updateStatus = async (id, status) => {
    await supabase.from('garage_cars').update({ status, updated_at:new Date().toISOString() }).eq('id', id);
    fetchCars();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <h3 style={{ color:'white', fontWeight:'700', fontSize:'15px' }}>רכבי המוסך</h3>
        <button onClick={()=>setShowAdd(!showAdd)} style={{ background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', color:'#3B82F6', padding:'7px 13px', borderRadius:'9px', cursor:'pointer', fontSize:'13px', fontFamily:'Heebo,sans-serif', fontWeight:'600' }}>+ הוסף</button>
      </div>

      {showAdd && (
        <div style={{ background:'#1E293B', borderRadius:'12px', padding:'14px', marginBottom:'14px', border:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:'8px' }}>
          <input value={plate} onChange={e=>setPlate(e.target.value)} placeholder="מס׳ רכב" onKeyDown={e=>e.key==='Enter'&&addCar()}
            style={{ flex:1, padding:'9px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'9px', color:'white', fontSize:'14px', fontFamily:'monospace', outline:'none', direction:'ltr' }} />
          <button onClick={addCar} style={{ padding:'9px 14px', background:'#3B82F6', border:'none', borderRadius:'9px', color:'white', fontFamily:'Heebo,sans-serif', fontWeight:'600', cursor:'pointer' }}>הוסף</button>
        </div>
      )}

      {cars.length === 0
        ? <div style={{ background:'#1E293B', borderRadius:'14px', padding:'28px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color:'#475569', fontSize:'13px' }}>אין רכבים רשומים</p>
          </div>
        : cars.map(car => {
            const cfg = CFG[car.status] || CFG.in_garage;
            return (
              <div key={car.id} style={{ background:'#1E293B', borderRadius:'14px', padding:'14px 18px', marginBottom:'9px', border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'20px' }}>{cfg.icon}</span>
                  <div>
                    <p style={{ color:'white', fontWeight:'700', fontFamily:'monospace', fontSize:'14px', margin:0 }}>{car.plate}</p>
                    {car.parked_address && <p style={{ color:'#F59E0B', fontSize:'11px', marginTop:'2px' }}>📍 {car.parked_address}</p>}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                  <div style={{ background:cfg.bg, padding:'3px 10px', borderRadius:'20px' }}>
                    <span style={{ color:cfg.color, fontSize:'11px', fontWeight:'600' }}>{cfg.label}</span>
                  </div>
                  <select value={car.status} onChange={e=>updateStatus(car.id,e.target.value)}
                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'#94A3B8', padding:'5px 7px', fontSize:'11px', cursor:'pointer', fontFamily:'Heebo,sans-serif', outline:'none' }}>
                    <option value="in_garage">במוסך</option>
                    <option value="in_use">בנסיעה</option>
                    <option value="parked_outside">חונה בחוץ</option>
                  </select>
                </div>
              </div>
            );
          })
      }
    </div>
  );
}
