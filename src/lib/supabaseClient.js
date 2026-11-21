import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null;

const STORAGE_KEY = 'money_matters_transactions_v1';

/**
 * Robust storage service supporting both Supabase Cloud and offline LocalStorage fallback
 */
export const storageService = {
  isCloudConnected() {
    return isSupabaseConfigured && navigator.onLine;
  },

  async loadTransactions(defaultSeedData = []) {
    // 1. If online and configured, attempt Supabase fetch
    if (this.isCloudConnected() && supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          // Normalize Supabase snake_case to app camelCase
          const formatted = data.map(item => ({
            id: item.id,
            direction: item.direction,
            amount: Number(item.amount),
            counterparty: item.counterparty,
            category: item.category,
            message: item.message || '',
            riskScore: item.risk_score,
            riskLevel: item.risk_level,
            status: item.status,
            reasons: Array.isArray(item.reasons) ? item.reasons : (item.reasons ? JSON.parse(item.reasons) : []),
            isCollectRequest: Boolean(item.is_collect_request),
            createdAt: item.created_at || new Date().toISOString(),
          }));
          // Sync to localStorage as offline mirror
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
          return formatted;
        }
      } catch (err) {
        console.warn('[MoneyMatters] Supabase fetch failed, falling back to local storage:', err);
      }
    }

    // 2. LocalStorage Fallback
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[MoneyMatters] Error reading localStorage:', e);
    }

    // 3. First load: Seed realistic dummy transactions
    if (defaultSeedData && defaultSeedData.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeedData));
      // Best effort seed to Supabase if configured
      if (this.isCloudConnected() && supabase) {
        this.syncSeedToSupabase(defaultSeedData).catch(() => {});
      }
      return defaultSeedData;
    }

    return [];
  },

  async saveNewTransaction(tx) {
    // 1. Save to LocalStorage immediately (instant optimistic update)
    try {
      const current = await this.getLocalTransactions();
      const updated = [tx, ...current.filter(t => t.id !== tx.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('[MoneyMatters] Local storage write error:', e);
    }

    // 2. Sync to Supabase in background if available
    if (this.isCloudConnected() && supabase) {
      try {
        await supabase.from('transactions').upsert({
          id: tx.id,
          direction: tx.direction,
          amount: tx.amount,
          counterparty: tx.counterparty,
          category: tx.category,
          message: tx.message || '',
          risk_score: tx.riskScore,
          risk_level: tx.riskLevel,
          status: tx.status,
          reasons: tx.reasons,
          is_collect_request: Boolean(tx.isCollectRequest),
          created_at: tx.createdAt,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[MoneyMatters] Supabase sync deferred (offline):', err);
      }
    }
  },

  async updateTransactionStatus(id, newStatus) {
    // 1. Update in LocalStorage
    try {
      const current = await this.getLocalTransactions();
      const updated = current.map(item => 
        item.id === id ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('[MoneyMatters] Error updating local transaction:', e);
    }

    // 2. Update in Supabase
    if (this.isCloudConnected() && supabase) {
      try {
        await supabase
          .from('transactions')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('[MoneyMatters] Supabase status update deferred:', err);
      }
    }
  },

  async resetData(defaultSeedData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeedData));
    if (this.isCloudConnected() && supabase) {
      try {
        await supabase.from('transactions').delete().neq('id', 'preserve_all');
        await this.syncSeedToSupabase(defaultSeedData);
      } catch (err) {
        console.warn('[MoneyMatters] Supabase reset error:', err);
      }
    }
    return defaultSeedData;
  },

  async getLocalTransactions() {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  },

  async syncSeedToSupabase(seedList) {
    if (!this.isCloudConnected() || !supabase) return;
    const records = seedList.map(tx => ({
      id: tx.id,
      direction: tx.direction,
      amount: tx.amount,
      counterparty: tx.counterparty,
      category: tx.category,
      message: tx.message || '',
      risk_score: tx.riskScore,
      risk_level: tx.riskLevel,
      status: tx.status,
      reasons: tx.reasons,
      is_collect_request: Boolean(tx.isCollectRequest),
      created_at: tx.createdAt,
      updated_at: new Date().toISOString()
    }));
    await supabase.from('transactions').upsert(records);
  }
};
