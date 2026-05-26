import { useState } from 'react';
import { supabase, TASK_TYPES } from '../lib/supabase';

const LEXUS_DIRECTIONS = [
  { id: 'from_lexus', label: 'מלקסוס → למוסך' },
  { id: 'to_lexus', label: 'מהמוסך → ללקסוס' },
];

export default function NewTaskModal({ user, drivers, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [task, setTask] = useState({
    type: '', driver_id: '', driver2_id: '', car_plate: '', car_plate2: '',
    client_name: '', client_address: '', parked_address: '',
    lexus_direction: '', small_description: '', is_queued: false,
  });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setTask(p => ({ ...p, [key]: val }));

  const submit = async () => {
    setLoading(true);
    await supabase.from('tasks').insert({
      ...task,
      sender_id: user.id,
      sent_at: new Date().toISOString(),
    });

    // Update driver status to busy
    if (task.driver_id && !task.is_queued) {
      await supabase.from('users').update({ status: 'busy' }).eq('id', task.driver_id);
    }
    if (task.driver2_id) {
      await supabase.from('users').update({ status: 'busy' }).eq('id', task.driver2_id);
    }

    setLoading(false);
    onCreated();
    onClose();
  };

  const canProceed1 = !!task.type;
  const canProceed2 = !!task.driver_id;
  const canSubmit = task.car_plate || task.small_description || task.lexus_direction;

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>משימה חדשה</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={s.steps}>
          {['סוג', 'נהג', 'פרטים'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ ...s.stepDot, background: step > i + 1 ? '#10B981' : step === i + 1 ? '#3B82F6' : 'rgba(255,255,255,0.1)', color: step >= i + 1 ? 'white' : '#475569' }}>{step > i + 1 ? '✓' : i + 1}</div>
              <span style={{ color: step === i + 1 ? 'white' : '#475569', fontSize: '13px', fontWeight: step === i + 1 ? '600' : '400' }}>{label}</span>
              {i < 2 && <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />}
            </div>
          ))}
        </div>

        {/* Step 1 - Task type */}
        {step === 1 && (
          <>
            <div style={s.grid2}>
              {Object.entries(TASK_TYPES).map(([id, t]) => (
                <button key={id} onClick={() => set('type', id)} style={{ ...s.typeBtn, borderColor: task.type === id ? '#3B82F6' : 'rgba(255,255,255,0.08)', background: task.type === id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{t.icon}</div>
                  <span style={{ color: task.type === id ? 'white' : '#94A3B8', fontSize: '13px', fontWeight: '600' }}>{t.label}</span>
                </button>
              ))}
            </div>
            <Btns onNext={() => setStep(2)} nextDisabled={!canProceed1} showBack={false} />
          </>
        )}

        {/* Step 2 - Driver */}
        {step === 2 && (
          <>
            <p style={s.label}>בחר נהג ראשי:</p>
            <div style={s.grid3}>
              {drivers.map(d => (
                <button key={d.id} onClick={() => set('driver_id', d.id)} style={{ ...s.driverBtn, borderColor: task.driver_id === d.id ? '#3B82F6' : 'rgba(255,255,255,0.08)', background: task.driver_id === d.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  <div style={s.driverAvatar}>{d.name[0]}</div>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{d.name}</span>
                  {d.is_backup && <span style={{ fontSize: '10px', color: '#64748B' }}>גיבוי</span>}
                </button>
              ))}
            </div>

            {task.type === 'transfer_city' && (
              <>
                <p style={{ ...s.label, marginTop: '16px' }}>נהג מלווה (לשינוע עיר):</p>
                <div style={s.grid3}>
                  {drivers.filter(d => d.id !== task.driver_id).map(d => (
                    <button key={d.id} onClick={() => set('driver2_id', d.id)} style={{ ...s.driverBtn, borderColor: task.driver2_id === d.id ? '#8B5CF6' : 'rgba(255,255,255,0.08)', background: task.driver2_id === d.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)' }}>
                      <div style={{ ...s.driverAvatar, background: '#8B5CF6' }}>{d.name[0]}</div>
                      <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{d.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Queue option */}
            <button onClick={() => set('is_queued', !task.is_queued)} style={{ ...s.queueToggle, borderColor: task.is_queued ? '#F59E0B' : 'rgba(255,255,255,0.08)', background: task.is_queued ? 'rgba(245,158,11,0.1)' : 'transparent' }}>
              <span style={{ fontSize: '16px' }}>{task.is_queued ? '✅' : '⬜'}</span>
              <span style={{ color: task.is_queued ? '#F59E0B' : '#64748B', fontSize: '13px', fontWeight: '600' }}>הכנס לתור (משימה ממתינה)</span>
            </button>

            <Btns onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!canProceed2} />
          </>
        )}

        {/* Step 3 - Details */}
        {step === 3 && (
          <>
            {(task.type === 'ride' || task.type === 'transfer_city' || task.type === 'transfer_out') && (
              <>
                <Field label="שם לקוח" value={task.client_name} onChange={v => set('client_name', v)} placeholder="כהן דוד" />
                <Field label="כתובת יעד" value={task.client_address} onChange={v => set('client_address', v)} placeholder="רח׳ הרצל 12, באר שבע" />
              </>
            )}

            {task.type === 'lexus' && (
              <>
                <p style={s.label}>כיוון:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {LEXUS_DIRECTIONS.map(d => (
                    <button key={d.id} onClick={() => set('lexus_direction', d.id)} style={{ ...s.optionBtn, borderColor: task.lexus_direction === d.id ? '#3B82F6' : 'rgba(255,255,255,0.08)', background: task.lexus_direction === d.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)' }}>
                      <span style={{ color: task.lexus_direction === d.id ? 'white' : '#94A3B8', fontWeight: '600', fontSize: '14px' }}>{d.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {task.type !== 'small' && (
              <Field label={task.type === 'transfer_out' ? 'מס׳ רכב לקוח' : 'מס׳ רכב'} value={task.car_plate} onChange={v => set('car_plate', v)} placeholder="123-45-678" mono />
            )}

            {task.type === 'transfer_out' && (
              <>
                <Field label="מס׳ רכב מוסך (נשאר אצל לקוח)" value={task.car_plate2} onChange={v => set('car_plate2', v)} placeholder="987-65-432" mono highlight />
                <Field label="כתובת חניה של רכב מוסך" value={task.parked_address} onChange={v => set('parked_address', v)} placeholder="רח׳ הרצל 12, ערד" />
              </>
            )}

            {task.type === 'small' && (
              <>
                <Field label="תיאור המשימה" value={task.small_description} onChange={v => set('small_description', v)} placeholder="להביא חלב מהסניף..." />
                <Field label="מס׳ רכב מוסך" value={task.car_plate} onChange={v => set('car_plate', v)} placeholder="123-45-678" mono />
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setStep(2)} style={s.backBtn}>← חזרה</button>
              <button onClick={submit} disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'שולח...' : 'שלח משימה ✅'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, highlight }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${highlight ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: highlight ? '#F59E0B' : 'white', fontSize: '14px', fontFamily: mono ? 'monospace' : 'Heebo, sans-serif', outline: 'none', direction: 'rtl' }} />
    </div>
  );
}

function Btns({ onBack, onNext, nextDisabled, showBack = true }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
      {showBack && <button onClick={onBack} style={s.backBtn}>← חזרה</button>}
      <button onClick={onNext} disabled={nextDisabled} style={{ ...s.nextBtn, opacity: nextDisabled ? 0.4 : 1, flex: showBack ? 2 : 1 }}>המשך →</button>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, padding: '0' },
  modal: { background: '#1E293B', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '500px', padding: '28px 24px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Heebo, sans-serif', direction: 'rtl' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { color: 'white', fontWeight: '700', fontSize: '18px' },
  closeBtn: { background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94A3B8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' },
  steps: { display: 'flex', alignItems: 'center', marginBottom: '24px' },
  stepDot: { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' },
  typeBtn: { padding: '16px 10px', borderRadius: '14px', border: '2px solid', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  driverBtn: { padding: '14px 8px', borderRadius: '14px', border: '2px solid', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: 'transparent' },
  driverAvatar: { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '16px' },
  queueToggle: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', background: 'transparent' },
  optionBtn: { padding: '14px 16px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', textAlign: 'right', background: 'transparent' },
  label: { color: '#64748B', fontSize: '12px', fontWeight: '600', marginBottom: '8px', display: 'block' },
  backBtn: { flex: 1, padding: '14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '12px', color: '#94A3B8', fontSize: '15px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' },
  nextBtn: { padding: '14px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' },
  submitBtn: { flex: 2, padding: '14px', background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' },
};
