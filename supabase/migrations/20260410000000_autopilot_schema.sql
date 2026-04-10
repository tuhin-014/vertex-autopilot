-- Vertex Autopilot Schema

-- Organizations (restaurant groups)
CREATE TABLE IF NOT EXISTS va_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid,
  plan text DEFAULT 'trial',
  created_at timestamptz DEFAULT now()
);

-- Locations (individual restaurants)
CREATE TABLE IF NOT EXISTS va_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES va_organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  state text,
  manager_name text,
  manager_email text,
  staff_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Daily Checklists (food safety, opening, closing)
CREATE TABLE IF NOT EXISTS va_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES va_locations(id) ON DELETE CASCADE,
  checklist_type text NOT NULL,
  completed_by text,
  completed_at timestamptz DEFAULT now(),
  score int,
  items jsonb,
  notes text
);

-- Temperature Logs
CREATE TABLE IF NOT EXISTS va_temp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES va_locations(id) ON DELETE CASCADE,
  equipment text NOT NULL,
  temperature decimal(5,1),
  logged_by text,
  logged_at timestamptz DEFAULT now(),
  in_range boolean DEFAULT true
);

-- Training Assignments
CREATE TABLE IF NOT EXISTS va_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES va_locations(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  course_name text NOT NULL,
  status text DEFAULT 'assigned',
  progress int DEFAULT 0,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Incidents
CREATE TABLE IF NOT EXISTS va_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES va_locations(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text DEFAULT 'low',
  description text,
  reported_by text,
  status text DEFAULT 'open',
  resolution text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Hiring Pipeline
CREATE TABLE IF NOT EXISTS va_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES va_locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  role_applied text,
  stage text DEFAULT 'applied',
  ai_score int,
  notes text,
  created_at timestamptz DEFAULT now()
);
