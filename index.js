import { useState } from 'react';
import { supabase, TASK_TYPES } from '../lib/supabase';

export default function NewTaskModal({ user, drivers, onClose, onCreated }) {
  const [step, setStep]   = useState(1);
  const [task, setTask]   = useState({ type:'', car_plate:'', car_plate2:'', client_name:'', client_address:'', parked_address:'', lexus_direction:'', small_description:'' });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setTask(p=>({...p,[k]:v}));

  const submit = async () => {
    setLoading(true);
    await supabase.from('tasks').insert({ ...task, sender_id:user.id, opened_at:new Date().toISOString() });
    setLoading(false);
    onCreated();
    onClose();
  };

  return (
    <div style={s.overlay}>
      <div style={s.sheet}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap');`}</style>
        <div style={s.handle} />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h2 style={{ color:'white', fontWeight:'700', fontSize:'18px' }}>משימה חדשה</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Step 1 – type */}
        {step === 1 && <>
          <p style={s.label}>סוג משימה:</p>
          <div style={s.typeGrid}>
            {Object.entries(TASK_TYPES).map(([id,t])=>(
              <button key={id} onClick={()=>set('type',id)} style={{ ...s.typeBtn, borderColor:task.type===id?'#3B82F6':'rgba(255,255,255,0.08)', background:task.type===id?'rgba(59,130,246,0.15)':'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize:'22px' }}>{t.icon}</span>
                <span style={{ color:task.type===id?'white':'#94A3B8', fontSize:'12px', fontWeight:'600', marginTop:'4px' }}>{t.label}</span>
              </button>
            ))}
          </div>
          <button disabled={!task.type} onClick={()=>setStep(2)} style={{ ...s.nextBtn, opacity:task.type?1:0.4 }}>המשך →</button>
        </>}

        {/* Step 2 – details */}
        {step === 2 && <>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', padding:'10px 12px', background:'rgba(59,130,246,0.1)', borderRadius:'10px' }}>
            <span style={{ fontSize:'18px' }}>{TASK_TYPES[task.type]?.icon}</span>
            <span style={{ color:'#3B82F6', fontWeight:'600', fontSize:'14px' }}>{TASK_TYPES[task.type]?.label}</span>
          </div>

          {(task.type==='ride'||task.type==='transfer_city'||task.type==='transfer_out') && <>
            <Field label="שם לקוח" value={task.client_name} onChange={v=>set('client_name',v)} placeholder="כהן דוד" />
            <Field label="כתובת" value={task.client_address} onChange={v=>set('client_address',v)} placeholder="רח׳ הרצל 12, באר שבע" />
          </>}

          {task.type === 'lexus' && <>
            <p style={s.label}>כיוון:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
              {[['from_lexus','מלקסוס → מוסך'],['to_lexus','מוסך → לקסוס']].map(([id,label])=>(
                <button key={id} onClick={()=>set('lexus_direction',id)} style={{ padding:'13px 16px', borderRadius:'12px', border:`2px solid ${task.lexus_direction===id?'#3B82F6':'rgba(255,255,255,0.08)'}`, background:task.lexus_direction===id?'rgba(59,130,246,0.15)':'rgba(255,255,255,0.03)', color:task.lexus_direction===id?'white':'#94A3B8', fontFamily:'Heebo,sans-serif', fontSize:'14px', fontWeight:'600', cursor:'pointer', textAlign:'right' }}>{label}</button>
              ))}
            </div>
          </>}

          {task.type !== 'small' && (
            <Field label={task.type==='transfer_out'?'מס׳ רכב לקוח':'מס׳ רכב'} value={task.car_plate} onChange={v=>set('car_plate',v)} placeholder="123-45-678" mono />
          )}

          {task.type === 'transfer_out' && <>
            <Field label="מס׳ רכב מוסך (נשאר אצל לקוח)" value={task.car_plate2} onChange={v=>set('car_plate2',v)} placeholder="987-65-432" mono highlight />
            <Field label="כתובת חניה – רכב מוסך" value={task.parked_address} onChange={v=>set('parked_address',v)} placeholder="רח׳ הרצל 12, ערד" />
          </>}

          {task.type === 'small' && <>
            <Field label="תיאור" value={task.small_description} onChange={v=>set('small_description',v)} placeholder="להביא חלב מהסניף..." />
            <Field label="מס׳ רכב מוסך" value={task.car_plate} onChange={v=>set('car_plate',v)} placeholder="123-45-678" mono />
          </>}

          <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
            <button onClick={()=>setStep(1)} style={s.backBtn}>← חזרה</button>
            <button onClick={submit} disabled={loading} style={{ ...s.submitBtn, opacity:loading?0.7:1 }}>
              {loading?'שולח...':'שלח משימה ✅'}
            </button>
          </div>
        </>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono, highlight }) {
  return (
    <div style={{ marginBottom:'12px' }}>
      <label style={{ color:'#64748B', fontSize:'12px', fontWeight:'600', display:'block', marginBottom:'5px' }}>{label}</label>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'11px 13px', background:'rgba(255,255,255,0.05)', border:`1px solid ${highlight?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.1)'}`, borderRadius:'10px', color:highlight?'#F59E0B':'white', fontSize:'14px', fontFamily:mono?'monospace':'Heebo,sans-serif', outline:'none', direction:'rtl' }} />
    </div>
  );
}

const s = {
  overlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 },
  sheet:    { background:'#1E293B', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'500px', padding:'12px 22px 32px', maxHeight:'90vh', overflowY:'auto', fontFamily:'Heebo,sans-serif', direction:'rtl', border:'1px solid rgba(255,255,255,0.1)' },
  handle:   { width:'40px', height:'4px', background:'rgba(255,255,255,0.15)', borderRadius:'2px', margin:'0 auto 16px' },
  closeBtn: { background:'rgba(255,255,255,0.08)', border:'none', color:'#94A3B8', width:'30px', height:'30px', borderRadius:'8px', cursor:'pointer', fontSize:'15px' },
  label:    { color:'#64748B', fontSize:'12px', fontWeight:'600', marginBottom:'8px', display:'block' },
  typeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'9px', marginBottom:'18px' },
  typeBtn:  { padding:'14px 8px', borderRadius:'14px', border:'2px solid', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', background:'transparent' },
  nextBtn:  { width:'100%', padding:'13px', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', border:'none', borderRadius:'12px', color:'white', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo,sans-serif' },
  backBtn:  { flex:1, padding:'13px', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'12px', color:'#94A3B8', fontSize:'14px', cursor:'pointer', fontFamily:'Heebo,sans-serif' },
  submitBtn:{ flex:2, padding:'13px', background:'linear-gradient(135deg,#10B981,#059669)', border:'none', borderRadius:'12px', color:'white', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'Heebo,sans-serif' },
};
