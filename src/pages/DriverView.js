import { useState, useEffect } from 'react';
import { supabase, TASK_TYPES, TASK_STATUS, DRIVER_STATUS } from '../lib/supabase';

export default function DriverView({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [driverStatus, setDriverStatus] = useState('free');

  useEffect(() => {
    fetchTasks();
    fetchDriverStatus();

    const channel = supabase.channel(`driver-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe();

    // Request notification permission
    if ('Notification' in window) Notification.requestPermission();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchDriverStatus = async () => {
    const { data } = await supabase.from('users').select('status').eq('id', user.id).single();
    if (data) setDriverStatus(data.status);
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, driver:driver_id(name), driver2:driver2_id(name), sender:sender_id(name)')
      .or(`driver_id.eq.${user.id},driver2_id.eq.${user.id}`)
      .neq('status', 'done')
      .order('created_at');
    setTasks(data || []);
  };

  const advanceStatus = async (task) => {
    const next = TASK_STATUS[task.status]?.next;
    if (!next) return;

    const timeField = { received: 'received_at', arrived: 'arrived_at', done: 'done_at' }[next];
    const updates = { status: next, [timeField]: new Date().toISOString() };

    await supabase.from('tasks').update(updates).eq('id', task.id);

    // Update driver status
    if (next === 'done') {
      const remaining = tasks.filter(t => t.id !== task.id && t.status !== 'done');
      await supabase.from('users').update({ status: remaining.length > 0 ? 'busy' : 'free' }).eq('id', user.id);
    } else if (next === 'received') {
      await supabase.from('users').update({ status: 'busy' }).eq('id', user.id);
    }

    fetchTasks();
    fetchDriverStatus();
  };

  const current = tasks.find(t => !t.is_queued);
  const next = tasks.find(t => t.is_queued);
  const cfg = DRIVER_STATUS[driverStatus] || DRIVER_STATUS.free;

  return (
    <div style={s.container}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ ...s.avatar, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>{user.name[0]}</div>
          <div>
            <h2 style={s.name}>{user.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.dot, ...(driverStatus === 'busy' ? { animation: 'pulse 2s infinite' } : {}) }} />
              <span style={{ color: cfg.color, fontSize: '13px', fontWeight: '600' }}>{cfg.label}</span>
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={s.logoutBtn}>יציאה</button>
      </div>

      <div style={s.content}>
        {current ? (
          <div style={s.taskCard}>
            <div style={s.taskCardTop}>
              <span style={s.taskIcon}>{TASK_TYPES[current.type]?.icon}</span>
              <div>
                <p style={s.taskTypeLabel}>{TASK_TYPES[current.type]?.label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: TASK_STATUS[current.status]?.color }} />
                  <span style={{ color: TASK_STATUS[current.status]?.color, fontSize: '12px', fontWeight: '600' }}>{TASK_STATUS[current.status]?.label}</span>
                </div>
              </div>
            </div>

            <div style={s.divider} />

            <div style={s.taskDetails}>
              {current.client_name && <DetailRow icon="👤" label="לקוח" value={current.client_name} />}
              {current.client_address && <DetailRow icon="📍" label="כתובת" value={current.client_address} />}
              {current.car_plate && <DetailRow icon="🚗" label="רכב" value={current.car_plate} mono />}
              {current.car_plate2 && <DetailRow icon="🅿️" label="רכב מוסך" value={current.car_plate2} mono highlight />}
              {current.parked_address && <DetailRow icon="📌" label="חניה" value={current.parked_address} />}
              {current.lexus_direction && <DetailRow icon="🔄" label="כיוון" value={current.lexus_direction === 'from_lexus' ? 'מלקסוס למוסך' : 'מהמוסך ללקסוס'} />}
              {current.small_description && <DetailRow icon="📝" label="תיאור" value={current.small_description} />}
              {current.driver2 && <DetailRow icon="👨‍✈️" label={current.driver2_role === 'escort' ? 'נהג מלווה' : 'נהג שני'} value={current.driver2.name} />}
              {current.sender && <DetailRow icon="📤" label="נשלח ע״י" value={current.sender.name} />}
              <DetailRow icon="🕐" label="שעת שליחה" value={new Date(current.sent_at || current.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} />
            </div>

            {TASK_STATUS[current.status]?.next && (
              <button onClick={() => advanceStatus(current)} style={{ ...s.actionBtn, background: current.status === 'arrived' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                {TASK_STATUS[current.status]?.nextLabel}
              </button>
            )}
          </div>
        ) : (
          <div style={s.emptyCard}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <p style={s.emptyTitle}>אין משימה פעילה</p>
            <p style={s.emptySubtitle}>ממתין למשימה חדשה</p>
          </div>
        )}

        {next && (
          <div style={s.nextCard}>
            <p style={s.nextLabel}>⏳ הבא בתור</p>
            <p style={s.nextType}>{TASK_TYPES[next.type]?.icon} {TASK_TYPES[next.type]?.label}</p>
            {next.client_name && <p style={s.nextDetail}>👤 {next.client_name}</p>}
            {next.car_plate && <p style={{ ...s.nextDetail, fontFamily: 'monospace' }}>🚗 {next.car_plate}</p>}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
    </div>
  );
}

function DetailRow({ icon, label, value, mono, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: '#64748B', fontSize: '13px' }}>{icon} {label}</span>
      <span style={{ color: highlight ? '#F59E0B' : 'white', fontSize: '13px', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: '500', textAlign: 'left', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#0F172A', fontFamily: 'Heebo, sans-serif', direction: 'rtl' },
  header: { background: '#1E293B', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50 },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '18px', flexShrink: 0 },
  name: { color: 'white', fontSize: '17px', fontWeight: '700' },
  logoutBtn: { background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748B', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Heebo, sans-serif' },
  content: { padding: '20px 16px', maxWidth: '480px', margin: '0 auto' },
  taskCard: { background: '#1E293B', borderRadius: '24px', padding: '24px', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '16px' },
  taskCardTop: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' },
  taskIcon: { fontSize: '36px' },
  taskTypeLabel: { color: 'white', fontSize: '20px', fontWeight: '700' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '16px' },
  taskDetails: { marginBottom: '20px' },
  actionBtn: { width: '100%', padding: '16px', border: 'none', borderRadius: '14px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' },
  emptyCard: { background: '#1E293B', borderRadius: '24px', padding: '48px 24px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.15)', marginBottom: '16px' },
  emptyTitle: { color: '#10B981', fontSize: '20px', fontWeight: '700', marginBottom: '8px' },
  emptySubtitle: { color: '#475569', fontSize: '14px' },
  nextCard: { background: '#1E293B', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.05)' },
  nextLabel: { color: '#64748B', fontSize: '12px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' },
  nextType: { color: 'white', fontSize: '16px', fontWeight: '700', marginBottom: '6px' },
  nextDetail: { color: '#94A3B8', fontSize: '13px', marginTop: '4px' },
};
