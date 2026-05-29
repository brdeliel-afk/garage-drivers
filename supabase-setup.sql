-- =============================================
-- GARAGE DRIVERS V2 - עדכון מסד נתונים
-- הרץ את זה ב-SQL Editor של Supabase
-- =============================================

-- מחק טבלאות קיימות אם יש
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS garage_cars CASCADE;

-- טבלת משתמשים
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('driver', 'sender')),
  is_backup BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת רכבי מוסך
CREATE TABLE garage_cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'in_garage' CHECK (status IN ('in_garage', 'in_use', 'parked_outside')),
  parked_address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת משימות
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ride', 'lexus', 'transfer_city', 'transfer_out', 'small')),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'arrived', 'done')),

  -- מי פתח
  sender_id UUID REFERENCES users(id),

  -- מי לוקח (נהג ראשי)
  driver_id UUID REFERENCES users(id),
  driver2_id UUID REFERENCES users(id),

  -- פרטי משימה
  client_name TEXT,
  client_address TEXT,
  car_plate TEXT,
  car_plate2 TEXT,
  parked_address TEXT,
  lexus_direction TEXT CHECK (lexus_direction IN ('from_lexus', 'to_lexus')),
  small_description TEXT,

  -- זמנים
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  taken_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  done_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- נהגים ראשוניים
INSERT INTO users (name, role, is_backup) VALUES
  ('פליקס', 'driver', false),
  ('מייקל', 'driver', false),
  ('אורי',  'driver', true);

-- Real-time
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE garage_cars REPLICA IDENTITY FULL;

-- הרשאות
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON garage_cars FOR ALL USING (true) WITH CHECK (true);
