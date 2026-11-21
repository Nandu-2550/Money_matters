-- =========================================================================
-- Money Matters: Standalone Smart Safe-Wallet & Two-Way Offline Handshake Schema
-- Supports Closed-Loop Wallets, Cryptographic Offline Vouchers, & Idempotent Dual Settlement
-- =========================================================================

-- 1. Create profiles table (Standalone Smart Safe-Wallet)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  wallet_id TEXT UNIQUE NOT NULL,
  upi_id TEXT,
  phone TEXT,
  bank_name TEXT DEFAULT 'Safe-Wallet Vault',
  account_last4 TEXT DEFAULT '8800',
  starting_balance NUMERIC DEFAULT 5000,
  avatar_initials TEXT NOT NULL,
  password TEXT DEFAULT '1234',
  demo_pin TEXT DEFAULT '0000',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade existing profiles table if already created
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '1234';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS demo_pin TEXT DEFAULT '0000';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'Safe-Wallet Vault';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_last4 TEXT DEFAULT '8800';

-- 2. Create or upgrade transactions table for dual-sided idempotent settlement
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  tx_id TEXT NOT NULL,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  counterparty TEXT NOT NULL,
  counterparty_wallet_id TEXT,
  category TEXT NOT NULL,
  tx_category TEXT DEFAULT 'P2P_TRANSFER' CHECK (tx_category IN ('TOPUP', 'P2P_TRANSFER', 'INVESTMENT', 'COLLECT_REQUEST', 'OTHER')),
  message TEXT,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('SAFE', 'SUSPICIOUS', 'HIGH_RISK')),
  status TEXT NOT NULL CHECK (status IN ('VERIFIED', 'HELD_FOR_REVIEW', 'BLOCKED')),
  reasons JSONB DEFAULT '[]'::jsonb,
  is_collect_request BOOLEAN DEFAULT FALSE,
  is_offline_queued BOOLEAN DEFAULT FALSE,
  voucher_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all offline & dual-settlement columns exist on existing table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tx_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS counterparty_wallet_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tx_category TEXT DEFAULT 'P2P_TRANSFER';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_offline_queued BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voucher_signature TEXT;

-- Backfill tx_id = id where tx_id was null
UPDATE transactions SET tx_id = id WHERE tx_id IS NULL;

-- 3. Indexes & Composite Unique Constraint for Idempotent Dual Settlement
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_id ON transactions(tx_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_id ON profiles(wallet_id);

-- Composite Unique Index so either device can safely upsert both sides of a transaction
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_tx_user_unique ON transactions(tx_id, user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Public Demo Policies (idempotent)
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

-- 6. Pre-seed Default Smart Safe-Wallets (Nandeesh: ₹5,000, PIN 1234 & Anjaneya: ₹3,500, PIN 5678)
INSERT INTO profiles (id, full_name, email, wallet_id, upi_id, phone, bank_name, account_last4, starting_balance, avatar_initials, password, demo_pin)
VALUES
  ('usr_nandeesh', 'Nandeesh', 'nandunusgavai@gmail.com', 'nandeesh@mmwallet', 'nandeesh@mmwallet', '+91 98765 43210', 'Safe-Wallet Vault', '4821', 5000, 'N', '1234', '1234'),
  ('usr_anjaneya', 'Anjaneya', 'anjaneya.9480@gmail.com', 'anjaneya@mmwallet', 'anjaneya@mmwallet', '+91 94801 23456', 'Safe-Wallet Vault', '9480', 3500, 'A', '1234', '5678')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  wallet_id = EXCLUDED.wallet_id,
  upi_id = EXCLUDED.upi_id,
  bank_name = EXCLUDED.bank_name,
  account_last4 = EXCLUDED.account_last4,
  starting_balance = EXCLUDED.starting_balance,
  password = EXCLUDED.password,
  demo_pin = EXCLUDED.demo_pin;

-- 7. Pre-seed Realistic Sample Safe-Wallet Transactions
INSERT INTO transactions (id, tx_id, user_id, direction, amount, counterparty, counterparty_wallet_id, category, tx_category, message, risk_score, risk_level, status, reasons, is_collect_request, is_offline_queued, created_at)
VALUES
  -- Nandeesh Transactions
  ('tx_nan_topup', 'tx_topup_1', 'usr_nandeesh', 'IN', 5000, 'Safe-Wallet Primary Vault', 'vault@mmwallet', 'Salary', 'TOPUP', 'Initial Smart Safe-Wallet Top-up Allocation', 0, 'SAFE', 'VERIFIED', '["Bank-to-Wallet simulated vault load."]'::jsonb, FALSE, FALSE, NOW() - INTERVAL '3 days'),
  ('tx_nan_1', 'tx_shared_1', 'usr_nandeesh', 'OUT', 1200, 'Ravi Store', 'ravi.store@mmwallet', 'Retail', 'P2P_TRANSFER', 'Groceries supply payment - Ravi Kirana Store', 5, 'SAFE', 'VERIFIED', '["Verified offline merchant store payment."]'::jsonb, FALSE, FALSE, NOW() - INTERVAL '2 days'),
  ('tx_nan_2', 'tx_shared_p2p_1', 'usr_nandeesh', 'OUT', 500, 'Anjaneya', 'anjaneya@mmwallet', 'Transfer', 'P2P_TRANSFER', 'Dinner share reimbursement to Anjaneya', 5, 'SAFE', 'VERIFIED', '["Peer-to-peer safe-wallet transfer."]'::jsonb, FALSE, FALSE, NOW() - INTERVAL '1 day'),
  ('tx_nan_3', 'tx_suspicious_1', 'usr_nandeesh', 'OUT', 2500, 'vip.trades@okaxis', 'vip.trades@okaxis', 'Investment', 'INVESTMENT', 'Guaranteed 40% in 7 days VIP stock group deposit link: http://vipstocks.top/bonus.apk', 95, 'HIGH_RISK', 'HELD_FOR_REVIEW', '["UNREGISTERED INVESTMENT: Sent to personal handle instead of official SEBI *.brk@valid* handle.", "Scam keywords detected.", "Malicious APK link detected."]'::jsonb, FALSE, FALSE, NOW() - INTERVAL '6 hours'),

  -- Anjaneya Transactions
  ('tx_anj_topup', 'tx_topup_2', 'usr_anjaneya', 'IN', 3500, 'Safe-Wallet Primary Vault', 'vault@mmwallet', 'Salary', 'TOPUP', 'Initial Smart Safe-Wallet Top-up Allocation', 0, 'SAFE', 'VERIFIED', '["Bank-to-Wallet simulated vault load."]'::jsonb, FALSE, FALSE, NOW() - INTERVAL '3 days'),
  ('tx_anj_1', 'tx_shared_p2p_1', 'usr_anjaneya', 'IN', 500, 'Nandeesh', 'nandeesh@mmwallet', 'Transfer', 'P2P_TRANSFER', 'Dinner share reimbursement from Nandeesh', 5, 'SAFE', 'VERIFIED', '["Received peer-to-peer safe-wallet reimbursement."]'::jsonb, FALSE, FALSE, NOW() - INTERVAL '1 day'),
  ('tx_anj_2', 'tx_trap_1', 'usr_anjaneya', 'IN', 1500, 'olx.buyer99@paytm', 'olx.buyer99@paytm', 'Retail', 'COLLECT_REQUEST', 'OLX advance token - enter upi pin to receive money', 95, 'HIGH_RISK', 'HELD_FOR_REVIEW', '["CRITICAL TRAP: Fake Collect Request! You NEVER need to enter PIN to receive money."]'::jsonb, TRUE, FALSE, NOW() - INTERVAL '8 hours')
ON CONFLICT (id) DO UPDATE SET
  tx_id = EXCLUDED.tx_id,
  user_id = EXCLUDED.user_id,
  direction = EXCLUDED.direction,
  amount = EXCLUDED.amount,
  counterparty = EXCLUDED.counterparty,
  counterparty_wallet_id = EXCLUDED.counterparty_wallet_id,
  category = EXCLUDED.category,
  tx_category = EXCLUDED.tx_category,
  message = EXCLUDED.message,
  risk_score = EXCLUDED.risk_score,
  risk_level = EXCLUDED.risk_level,
  status = EXCLUDED.status,
  reasons = EXCLUDED.reasons,
  is_collect_request = EXCLUDED.is_collect_request;
