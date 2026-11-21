-- =========================================================================
-- Money Matters: FinTech Two-Way Scam Shield & Reconciled Cash Flow Schema
-- HackSprint 3.0 Production Database Definition
-- =========================================================================

-- Drop existing table if recreating
-- DROP TABLE IF EXISTS transactions;

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
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

-- Index frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Anonymous Hackathon Demonstration Policies (Public Demo Mode)
CREATE POLICY "Allow public read access" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON transactions
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON transactions
  FOR DELETE USING (true);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_transactions_updated_at ON transactions;
CREATE TRIGGER trigger_update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
