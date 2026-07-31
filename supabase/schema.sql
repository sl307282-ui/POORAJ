-- SQL schema for Pooroj CRM

-- 1. Create Leads Table
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT UNIQUE NOT NULL,
  customer_type TEXT CHECK (customer_type IN ('Fresh Lead', 'Visited Customer', 'Existing Customer')),
  profile TEXT CHECK (profile IN ('Govt Job', 'Private Job', 'Business', 'Other')),
  district_state TEXT,
  purpose TEXT CHECK (purpose IN ('Investment', 'Self Use')),
  budget TEXT,
  property_type TEXT CHECK (property_type IN ('Plot', 'Villa', 'Shop', 'Farmhouse', 'Commercial')),
  plot_size TEXT,
  road_size TEXT,
  facing TEXT CHECK (facing IN ('East', 'West', 'North', 'South', 'Corner')),
  preferred_location TEXT,
  loan_requirement TEXT CHECK (loan_requirement IN ('No', 'Partial', 'Maximum')),
  status TEXT CHECK (status IN ('Fresh', 'Follow-up Today', 'Site Visit', 'Negotiation', 'Deal Closed', 'Lost')) DEFAULT 'Fresh',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Follow-ups Table
CREATE TABLE follow_ups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  visit_date DATE,
  next_follow_up_date DATE,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Deals Table
CREATE TABLE deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  deal_date DATE NOT NULL,
  property_size TEXT,
  location TEXT,
  deal_status TEXT CHECK (deal_status IN ('Won', 'Lost', 'Pending')) DEFAULT 'Pending',
  final_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies (For development purposes, allowing all authenticated and anonymous access. UPDATE THIS FOR PRODUCTION)
CREATE POLICY "Allow public read access on leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on leads" ON leads FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on follow_ups" ON follow_ups FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on follow_ups" ON follow_ups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on follow_ups" ON follow_ups FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on deals" ON deals FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on deals" ON deals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on deals" ON deals FOR UPDATE USING (true);
