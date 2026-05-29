import { useState } from 'react';
import { supabase, TASK_TYPES, STATUS, formatTime, timeDiff } from '../lib/supabase';

export default function TaskCard({ task, drivers, currentUser, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const isDriver = currentUser.role === 'driver';
  const isMine   = task.driver_id === currentUser.id;

  const takeTask = async () => {
    setLoading(true);
    await supabase.from('tasks').update({
      driver_id: currentUser.id,
      status:    'active',
      taken_at:  new Date().toISOString(),
    }).eq('id', task.id);
    setLoading(false);
    onUpdate();
  };

  const advance = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    let updates = {};
    if (task.status === 'active')   updates = { status:'arrived', arrived_at: now };
    if (task.status === 'arrived')  updates = { status:'done',    done_at:    now };
    await supabase.from('tasks').update(updates).eq('id', task.id);
    setLoading(false);
    onUpdate();
  };

  const cfg = STATUS[task.status] || STATUS.waiting;
  const type = TASK_TYPES[task.type] || {};

  const btnLabel = {
    active:  '📍 הגעתי ליעד',
    arrived: '✅ סיימתי',
  }[task.status];

  return (
    <div style={{ ...s.card, borderColor: task.status === 'active' ? 'rgba(245,158,11,0.3)' : task.status === 'arrived' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)' }}>
      {/* Top row */}
      <div style={s.top}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
          <span style={{ fontSize:'18px' }}>{type.icon}</span>
          <span style={{ color:'white', fontWeight:'700', fontSize:'14px' }}>{type.label}</span>
        </div>
        <div style={{ ...s.pill, background:cfg.bg, color:cfg.color }}>{cfg.label}</div>
      </div>

      {/* Details */}
      <div style={s.details}>
        {task.client_name    && <Row icon="👤" val={task.client_name} />}
        {task.client_address && <Row icon="📍" val={task.client_address} />}
        {task.car_plate      && <Row icon="🚗" val={task.car_plate} mono />}
        {task.car_plate2     && <Row icon="🅿️" val={`רכב מוסך: ${task.car_plate2}`} mono highlight />}
        {task.lexus_direction && <Row icon="🔄" val={task.lexus_direction === 'from_lexus' ? 'מלקסוס → מוסך' : 'מוסך → לקסוס'} />}
        {task.small_description && <Row icon="📝" val={task.small_description} />}
        {task.driver         && <Row icon="🧑‍✈️" val={task.driver.name} color="#3B82F6" />}
        {task.sender         && <Row icon="📤" val={task.sender.name} color="#64748B" small />}
      </div>

      {/* Times */}
      <div style={s.times}>
        <Chip label="נפתחה" time={formatTime(task.opened_at)} color="#6B7280" />
        {task.taken_at   && <Chip label="התחיל"  time={formatTime(task.taken_at)}   color="#F59E0B" />}
        {task.arrived_at && <Chip label="הגיע"   time={formatTime(task.arrived_at)} color="#3B82F6" />}
        {task.done_at    && <Chip label="סיים"   time={formatTime(task.done_at)}    color="#10B981" />}
        {task.done_at    && <Chip label="⏱️"      time={timeDiff(task.opened_at, task.done_at)} color="#8B5CF6" />}
      </div>

      {/* Actions */}
      {isDriver && (
        <div style={{ marginTop:'10px' }}>
          {task.status === 'waiting' && (
            <button onClick={takeTask} disabled={loading} style={{ ...s.btn, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
              {loading ? '...' : '✋ אני לוקח'}
            </button>
          )}
          {(task.status === 'active' || task.status === 'arrived') && isMine && (
            <button onClick={advance} disabled={loading} style={{ ...s.btn, background: task.status === 'arrived' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
              {loading ? '...' : btnLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ icon, val, mono, highlight, color, small }) {
  return (
    <div style={{ display:'flex', gap:'5px', alignItems:'flex-start', marginBottom:'3px' }}>
      <span style={{ fontSize:'12px', marginTop:'1px' }}>{icon}</span>
      <span style={{ color: highlight ? '#F59E0B' : color || '#94A3B8', fontSize: small ? '11px' : '13px', fontFamily: mono ? 'monospace' : 'inherit', lineHeight:'1.4' }}>{val}</span>
    </div>
  );
}

function Chip({ label, time, color }) {
  if (!time) return null;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', background:'rgba(255,255,255,0.04)', borderRadius:'7px', padding:'3px 7px', minWidth:'46px' }}>
      <span style={{ color:'#475569', fontSize:'9px' }}>{label}</span>
      <span style={{ color, fontSize:'11px', fontWeight:'700', fontFamily:'monospace' }}>{time}</span>
    </div>
  );
}

const s = {
  card:    { background:'#0F172A', borderRadius:'14px', padding:'14px', border:'1px solid', position:'relative' },
  top:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' },
  pill:    { padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:'600' },
  details: { marginBottom:'8px' },
  times:   { display:'flex', gap:'5px', flexWrap:'wrap' },
  btn:     { width:'100%', padding:'10px', border:'none', borderRadius:'10px', color:'white', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo,sans-serif' },
};
