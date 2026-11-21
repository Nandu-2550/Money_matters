-- =========================================================================
-- Money Matters: Multi-User FinTech Two-Way Scam Shield & Reconciled Schema
-- Supports PhonePe-style Profiles, Registration, & Isolated Ledgers
-- =========================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  upi_id TEXT UNIQUE NOT NULL,
  phone TEXT,
  bank_name TEXT NOT NULL,
  account_last4 TEXT NOT NULL,
  starting_balance NUMERIC DEFAULT 25000,
  avatar_initials TEXT NOT NULL,
  password TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure password column exists if table was already created
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '1234';

-- 2. Create or upgrade transactions table with user_id
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  counterparty TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('SAFE', 'SUSPICIOUS', 'HIGH_RISK')),
  status TEXT NOT NULL CHECK (status IN ('VERIFIED', 'HELD_FOR_REVIEW', 'BLOCKED')),
  reasons JSONB DEFAULT '[]'::jsonb,
  is_collect_request BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_upi_id ON profiles(upi_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Public Demo Policies
DROP POLICY IF EXISTS "Allow public read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow public delete profiles" ON profiles;

CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete profiles" ON profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON transactions;
DROP POLICY IF EXISTS "Allow public insert access" ON transactions;
DROP POLICY IF EXISTS "Allow public update access" ON transactions;
DROP POLICY IF EXISTS "Allow public delete access" ON transactions;

CREATE POLICY "Allow public read access" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON transactions FOR DELETE USING (true);

-- 6. Pre-seed Default Users (Nandeesh & Anjaneya with default MPIN 1234)
INSERT INTO profiles (id, full_name, email, upi_id, phone, bank_name, account_last4, starting_balance, avatar_initials, password)
VALUES
  ('usr_nandeesh', 'Nandeesh', 'nandunusgavai@gmail.com', 'nandeesh@okicici', '+91 98765 43210', 'ICICI Bank', '4821', 25000, 'N', '1234'),
  ('usr_anjaneya', 'Anjaneya', 'anjaneya.9480@gmail.com', 'anjaneya@oksbi', '+91 94801 23456', 'State Bank of India', '9480', 18500, 'A', '1234')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  upi_id = EXCLUDED.upi_id,
  bank_name = EXCLUDED.bank_name,
  account_last4 = EXCLUDED.account_last4,
  starting_balance = EXCLUDED.starting_balance,
  password = EXCLUDED.password;

-- 7. Pre-seed Realistic Sample Transactions (with Risk Scores, Review Queue items & P2P)
INSERT INTO transactions (id, user_id, direction, amount, counterparty, category, message, risk_score, risk_level, status, reasons, is_collect_request, created_at)
VALUES
  -- Nandeesh Transactions
  ('tx_nan_1', 'usr_nandeesh', 'IN', 45000, 'techcorp.payroll@icici', 'Salary', 'Monthly Software Engineer Salary Credit - Tech Corp', 5, 'SAFE', 'VERIFIED', '["Standard payroll direct credit from corporate gateway."]'::jsonb, FALSE, NOW() - INTERVAL '3 days'),
  ('tx_nan_2', 'usr_nandeesh', 'OUT', 2350, 'dmart.pos@icici', 'Retail', 'DMart Supermarket Bangalore Groceries', 10, 'SAFE', 'VERIFIED', '["Verified retail merchant QR payment."]'::jsonb, FALSE, NOW() - INTERVAL '2 days'),
  ('tx_nan_3', 'usr_nandeesh', 'OUT', 1500, 'anjaneya@oksbi', 'Transfer', 'Dinner share reimbursement to Anjaneya', 5, 'SAFE', 'VERIFIED', '["Peer-to-peer payment to known family contact."]'::jsonb, FALSE, NOW() - INTERVAL '1 day'),
  ('tx_nan_4', 'usr_nandeesh', 'OUT', 15000, 'vip.trades@okaxis', 'Investment', 'Guaranteed 40% in 7 days VIP stock group deposit link: http://vipstocks.top/bonus.apk', 95, 'HIGH_RISK', 'HELD_FOR_REVIEW', '["UNREGISTERED INVESTMENT: Sent to personal handle @okaxis instead of official SEBI *.brk@valid* handle.", "Scam keywords detected: Guaranteed 40% in 7 days.", "Malicious APK link detected in payment remarks."]'::jsonb, FALSE, NOW() - INTERVAL '8 hours'),
  ('tx_nan_5', 'usr_nandeesh', 'OUT', 1420, 'bescom@karnataka', 'Utilities', 'BESCOM Electricity Bill Payment', 5, 'SAFE', 'VERIFIED', '["Bharat BillPay System verified utility payment."]'::jsonb, FALSE, NOW() - INTERVAL '4 hours'),

  -- Anjaneya Transactions
  ('tx_anj_1', 'usr_anjaneya', 'IN', 1500, 'nandeesh@okicici', 'Transfer', 'Dinner share reimbursement from Nandeesh', 5, 'SAFE', 'VERIFIED', '["Received peer-to-peer reimbursement."]'::jsonb, FALSE, NOW() - INTERVAL '1 day'),
  ('tx_anj_2', 'usr_anjaneya', 'IN', 4200, 'customer.anitha@oksbi', 'Business', 'Tailoring boutique client advance order', 10, 'SAFE', 'VERIFIED', '["Verified customer UPI payment for goods/services."]'::jsonb, FALSE, NOW() - INTERVAL '2 days'),
  ('tx_anj_3', 'usr_anjaneya', 'OUT', 2000, 'zerodha.brk@validhdfc', 'Investment', 'Monthly Nifty 50 Index Fund SIP via Zerodha', 5, 'SAFE', 'VERIFIED', '["VERIFIED SEBI BROKER: Receiver handle matches *.brk@valid*."]'::jsonb, FALSE, NOW() - INTERVAL '18 hours'),
  ('tx_anj_4', 'usr_anjaneya', 'IN', 8500, 'olx.buyer99@paytm', 'Retail', 'OLX sofa advance token - enter upi pin to receive money', 95, 'HIGH_RISK', 'HELD_FOR_REVIEW', '["CRITICAL TRAP: Fake Collect Request! You NEVER need to enter UPI PIN to receive money. Entering PIN transfers money OUT."]'::jsonb, TRUE, NOW() - INTERVAL '6 hours'),
  ('tx_anj_5', 'usr_anjaneya', 'OUT', 850, 'apollo.pharmacy@hdfcbank', 'Emergency', 'Monthly prescribed medicines Apollo Pharmacy', 5, 'SAFE', 'VERIFIED', '["Verified retail pharmacy merchant payment."]'::jsonb, FALSE, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  direction = EXCLUDED.direction,
  amount = EXCLUDED.amount,
  counterparty = EXCLUDED.counterparty,
  category = EXCLUDED.category,
  message = EXCLUDED.message,
  risk_score = EXCLUDED.risk_score,
  risk_level = EXCLUDED.risk_level,
  status = EXCLUDED.status,
  reasons = EXCLUDED.reasons,
  is_collect_request = EXCLUDED.is_collect_request;
