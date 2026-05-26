import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://krmvaulqmaahmmtjiuxb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j2BKRvq0-9gM1pcpmASgdw_zK8yBp0o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// סוגי משימות
export const TASK_TYPES = {
  ride: { label: 'הסעת לקוח', icon: '🚶' },
  lexus: { label: 'לקסוס', icon: '🔄' },
  transfer_city: { label: 'שינוע – עיר', icon: '🏙️' },
  transfer_out: { label: 'שינוע – מחוץ לעיר', icon: '🛣️' },
  small: { label: 'משימה קטנה', icon: '📦' },
};

// סטטוסי משימה
export const TASK_STATUS = {
  sent: { label: 'נשלחה', color: '#6B7280', next: 'received', nextLabel: 'קיבלתי ✋' },
  received: { label: 'קיבלתי', color: '#3B82F6', next: 'arrived', nextLabel: 'הגעתי ליעד 📍' },
  arrived: { label: 'הגעתי ליעד', color: '#F59E0B', next: 'done', nextLabel: 'סיימתי ✅' },
  done: { label: 'הושלם', color: '#10B981', next: null, nextLabel: null },
};

// סטטוסי נהג
export const DRIVER_STATUS = {
  free: { label: 'פנוי', color: '#10B981', bg: '#D1FAE5', dot: '#10B981' },
  busy: { label: 'בנסיעה', color: '#F59E0B', bg: '#FEF3C7', dot: '#F59E0B' },
  standby: { label: 'גיבוי', color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};
