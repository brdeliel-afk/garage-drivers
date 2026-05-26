-- =============================================
-- GARAGE DRIVERS - SUPABASE DATABASE SETUP
-- הרץ את זה ב-SQL Editor של Supabase
-- =============================================

-- 1. טבלת משתמשים (נהגים + שולחים)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('driver', 'sender')),
  is_backup BOOLEAN DEFAULT false, -- אורי = true
  status TEXT DEFAULT 'free' CHECK (status IN ('free', 'busy', 'standby')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. טבלת רכבי מוסך
CREATE TABLE garage_cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'in_garage' CHECK (status IN ('in_garage', 'in_use', 'parked_outside')),
  parked_address TEXT,
  parked_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. טבלת משימות
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ride', 'lexus', 'transfer_city', 'transfer_out', 'small')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'arrived', 'done')),
  
  -- נהגים
  driver_id UUID REFERENCES users(id),
  driver2_id UUID REFERENCES users(id), -- לשינוע עיר: נהג שני
  driver2_role TEXT, -- 'escort' = מלווה
  
  -- שולח
  sender_id UUID REFERENCES users(id),
  
  -- פרטי לקוח
  client_name TEXT,
  client_address TEXT,
  
  -- רכבים
  car_plate TEXT, -- רכב ראשי
  car_plate2 TEXT, -- רכב מוסך (שינוע מחוץ לעיר)
  parked_address TEXT, -- כתובת חניה של רכב מוסך
  
  -- לקסוס
  lexus_direction TEXT CHECK (lexus_direction IN ('from_lexus', 'to_lexus')),
  
  -- משימה קטנה
  small_description TEXT,
  
  -- תזמונים
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  received_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ,
  
  -- תור
  is_queued BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. הכנס נהגים ראשוניים
INSERT INTO users (name, role, is_backup, status) VALUES
  ('פליקס', 'driver', false, 'free'),
  ('מייקל', 'driver', false, 'free'),
  ('אורי', 'driver', true, 'standby');

-- 5. Real-time - אפשר עדכונים חיים
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE garage_cars REPLICA IDENTITY FULL;

-- 6. הרשאות גישה פתוחות (לאפליקציה פנימית)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cars" ON garage_cars FOR ALL USING (true) WITH CHECK (true);
