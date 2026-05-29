import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://krmvaulqmaahmmtjiuxb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j2BKRvq0-9gM1pcpmASgdw_zK8yBp0o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const TASK_TYPES = {
  ride:          { label: 'הסעת לקוח',         icon: '🚶' },
  lexus:         { label: 'לקסוס',              icon: '🔄' },
  transfer_city: { label: 'שינוע – עיר',        icon: '🏙️' },
  transfer_out:  { label: 'שינוע – מחוץ לעיר', icon: '🛣️' },
  small:         { label: 'משימה קטנה',         icon: '📦' },
};

export const STATUS = {
  waiting:  { label: 'ממתינה',    color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  active:   { label: 'בביצוע',   color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'  },
  arrived:  { label: 'הגיע ליעד',color: '#3B82F6', bg: 'rgba(59,130,246,0.15)'  },
  done:     { label: 'הושלם',    color: '#10B981', bg: 'rgba(16,185,129,0.15)'  },
};

export const formatTime = (ts) => {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export const timeDiff = (from, to) => {
  if (!from || !to) return null;
  const diff = Math.round((new Date(to) - new Date(from)) / 60000);
  if (diff < 60) return `${diff} דק׳`;
  const h = Math.floor(diff / 60), m = diff % 60;
  return m > 0 ? `${h}ש׳ ${m}דק׳` : `${h}ש׳`;
};
