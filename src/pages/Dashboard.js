import { useState, useEffect } from 'react';
import { supabase, TASK_TYPES, TASK_STATUS, DRIVER_STATUS } from '../lib/supabase';
import NewTaskModal from '../components/NewTaskModal';
import GarageCars from '../components/GarageCars';

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard'); // dashboard | history | cars
  const [drivers, setDrivers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [todayTasks, setTodayTasks] = useState([]);

  useEffect(() => {
    fetchAll();

    // Real-time updates
    const channel = supabase.channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchAll)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchAll = async () => {
    const [{ data: driversData }, { data: tasksData }] = await Promise.all([
      supabase.from('users').select('*').eq('role', 'driver').order('name'),
      supabase.from('tasks').select('*, driver:driver_id(name), driver2:driver2_id(name), sender:sender_id(name)').order('created_at', { ascending: false }),
    ]);
    setDrivers(driversData || []);
    const today = new Date().toISOString().split('T')[0];
    const allTasks = tasksData || [];
    setTasks(allTasks.filter(t => t.status !== 'done'));
    setTodayTasks(allTasks.filter(t => t.created_at?.startsWith(today)));
  };

  const getDriverActiveTasks = (driverId) => {
    return tasks.filter(t => (t.driver_id === driverId || t.driver2_id === driverId) && t.status !== 'done');
  };

  const completedToday = todayTasks.filter(t => t.status === 'done').length;
  const activeNow = tasks.filter(t => t.status !== 'done' && t.status !== 'sent').length;
  const waiting = tasks.filter(t => t.status === 'sent').length;

  return (
    <div style={s.container}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}><span style={{ fontSize: '18px' }}>🔧</span><span style={s.logoText}>מוסך</span></div>
          <div style={s.headerRight}>
            <span style={s.userName}>{user.name}</span>
            <button onClick={onLogout} style={s.logoutBtn}>יציאה</button>
          </div>
        </div>
        <div style={s.tabs}>
          {[['dashboard','תמונת מצב'],['history','היסטוריה'],['cars','רכבי מוסך']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ ...s.tab, ...(tab === id ? s.tabActive : {}) }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={s.content}>
        {tab === 'dashboard' && (
          <>
            {/* Stats */}
            <div style={s.statsRow}>
              {[{ label: 'הושלמו היום', value: completedToday, color: '#10B981' }, { label: 'פעיל עכשיו', value: activeNow, color: '#F59E0B' }, { label: 'ממתין לאישור', value: waiting, color: '#3B82F6' }].map(stat => (
                <div key={stat.label} style={s.statCard}>
                  <p style={{ ...s.statNum, color: stat.color }}>{stat.value}</p>
                  <p style={s.statLabel}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Driver Cards */}
            <div style={s.driversGrid}>
              {drivers.map(driver => {
                const driverTasks = getDriverActiveTasks(driver.id);
                const current = driverTasks.find(t => !t.is_queued);
                const next = driverTasks.find(t => t.is_queued);
                const status = current ? 'busy' : driver.status;
                const cfg = DRIVER_STATUS[status] || DRIVER_STATUS.free;

                return (
                  <div key={driver.id} style={{ ...s.driverCard, borderColor: status === 'busy' ? 'rgba(245,158,11,0.3)' : status === 'free' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)' }}>
                    {status === 'busy' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#F59E0B,#EF4444)', borderRadius: '20px 20px 0 0' }} />}
                    {status === 'free' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#10B981', borderRadius: '20px 20px 0 0' }} />}

                    <div style={s.driverHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ ...s.avatar, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>{driver.name[0]}</div>
                        <div>
                          <p style={s.driverName}>{driver.name}</p>
                          {driver.is_backup && <p style={s.backupLabel}>גיבוי / תפעול</p>}
                        </div>
                      </div>
                      <div style={{ ...s.statusBadge, background: cfg.bg }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot }} />
                        <span style={{ color: cfg.color, fontSize: '12px', fontWeight: '600' }}>{cfg.label}</span>
                      </div>
                    </div>

                    {current ? (
                      <div style={s.taskInfo}>
                        <p style={s.taskType}>{TASK_TYPES[current.type]?.icon} {TASK_TYPES[current.type]?.label}</p>
                        {current.client_name && <p style={s.taskDetail}>👤 {current.client_name}</p>}
                        {current.client_address && <p style={s.taskDetail}>📍 {current.client_address}</p>}
                        {current.car_plate && <p style={{ ...s.taskDetail, fontFamily: 'monospace' }}>🚗 {current.car_plate}</p>}
                        {current.car_plate2 && <p style={{ ...s.taskDetail, fontFamily: 'monospace', color: '#F59E0B' }}>🅿️ רכב מוסך: {current.car_plate2}</p>}
                        {current.sender && <p style={s.taskDetail}>נשלח ע"י: {current.sender.name}</p>}
                        <div style={{ ...s.statusPill, background: `${TASK_STATUS[current.status]?.color}22`, border: `1px solid ${TASK_STATUS[current.status]?.color}44` }}>
                          <span style={{ color: TASK_STATUS[current.status]?.color, fontSize: '12px', fontWeight: '600' }}>{TASK_STATUS[current.status]?.label}</span>
                        </div>
                        {next && (
                          <div style={s.nextTask}>
                            <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '2px' }}>הבא בתור:</p>
                            <p style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '600' }}>{TASK_TYPES[next.type]?.icon} {TASK_TYPES[next.type]?.label}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <p style={{ color: '#334155', fontSize: '13px' }}>אין משימה פעילה</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* New Task Button */}
            <button onClick={() => setShowNewTask(true)} style={s.newTaskBtn}>+ פתח משימה חדשה</button>
          </>
        )}

        {tab === 'history' && (
          <div style={s.historyCard}>
            <h3 style={s.sectionTitle}>היסטוריה – היום</h3>
            {todayTasks.length === 0 ? (
              <p style={{ color: '#64748B', textAlign: 'center', padding: '32px' }}>אין משימות להיום</p>
            ) : todayTasks.map(t => (
              <div key={t.id} style={s.historyRow}>
                <span style={s.historyTime}>{new Date(t.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                <span style={s.historyDriver}>{t.driver?.name || '–'}</span>
                <span style={s.historyType}>{TASK_TYPES[t.type]?.icon} {TASK_TYPES[t.type]?.label}</span>
                {t.car_plate && <span style={{ ...s.historyCar }}>{t.car_plate}</span>}
                <span style={{ ...s.historyStatus, background: `${TASK_STATUS[t.status]?.color}22`, color: TASK_STATUS[t.status]?.color }}>{TASK_STATUS[t.status]?.label}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'cars' && <GarageCars />}
      </div>

      {showNewTask && <NewTaskModal user={user} drivers={drivers} onClose={() => setShowNewTask(false)} onCreated={fetchAll} />}
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#0F172A', fontFamily: 'Heebo, sans-serif', direction: 'rtl' },
  header: { background: '#1E293B', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50 },
  headerInner: { maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoText: { color: 'white', fontWeight: '800', fontSize: '16px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { color: '#94A3B8', fontSize: '13px' },
  logoutBtn: { background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748B', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Heebo, sans-serif' },
  tabs: { maxWidth: '900px', margin: '0 auto', display: 'flex', padding: '0 20px', gap: '4px' },
  tab: { padding: '10px 16px', background: 'transparent', border: 'none', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderBottom: '2px solid transparent', fontFamily: 'Heebo, sans-serif' },
  tabActive: { color: '#3B82F6', borderBottom: '2px solid #3B82F6' },
  content: { maxWidth: '900px', margin: '0 auto', padding: '20px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' },
  statCard: { background: '#1E293B', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' },
  statNum: { fontSize: '28px', fontWeight: '800', marginBottom: '4px' },
  statLabel: { color: '#64748B', fontSize: '12px' },
  driversGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' },
  driverCard: { background: '#1E293B', borderRadius: '20px', padding: '20px', border: '1px solid', position: 'relative', overflow: 'hidden' },
  driverHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '16px', flexShrink: 0 },
  driverName: { color: 'white', fontWeight: '700', fontSize: '15px' },
  backupLabel: { color: '#64748B', fontSize: '11px', marginTop: '2px' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px' },
  taskInfo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  taskType: { color: '#3B82F6', fontWeight: '700', fontSize: '14px' },
  taskDetail: { color: '#94A3B8', fontSize: '12px' },
  statusPill: { alignSelf: 'flex-start', padding: '3px 10px', borderRadius: '20px', marginTop: '4px' },
  nextTask: { background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 10px', marginTop: '6px' },
  newTaskBtn: { width: '100%', padding: '16px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', borderRadius: '16px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' },
  historyCard: { background: '#1E293B', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  sectionTitle: { color: 'white', fontWeight: '700', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  historyRow: { padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  historyTime: { color: '#64748B', fontSize: '12px', fontFamily: 'monospace', minWidth: '40px' },
  historyDriver: { color: '#94A3B8', fontSize: '13px', fontWeight: '600', minWidth: '50px' },
  historyType: { color: 'white', fontSize: '13px', flex: 1 },
  historyCar: { color: '#475569', fontSize: '12px', fontFamily: 'monospace' },
  historyStatus: { padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
};
