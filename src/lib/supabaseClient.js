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
      auth: { persistSession: true },
    })
  : null;

export const DEFAULT_PROFILES = [
  {
    id: 'usr_nandeesh',
    fullName: 'Nandeesh',
    email: 'nandunusgavai@gmail.com',
    upiId: 'nandeesh@okicici',
    phone: '+91 98765 43210',
    bankName: 'ICICI Bank',
    accountLast4: '4821',
    startingBalance: 25000,
    avatarInitials: 'N',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'usr_anjaneya',
    fullName: 'Anjaneya',
    email: 'anjaneya.9480@gmail.com',
    upiId: 'anjaneya@oksbi',
    phone: '+91 94801 23456',
    bankName: 'State Bank of India',
    accountLast4: '9480',
    startingBalance: 18500,
    avatarInitials: 'A',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  }
];

export const DEFAULT_USER_TRANSACTIONS = {
  usr_nandeesh: [
    {
      id: 'tx_nan_1',
      userId: 'usr_nandeesh',
      direction: 'IN',
      amount: 45000,
      counterparty: 'techcorp.payroll@icici',
      category: 'Salary',
      message: 'Monthly Software Engineer Salary Credit - Tech Corp',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Standard payroll direct credit from corporate gateway.'],
      reasonsKn: ['ದೃಢೀಕರಿಸಿದ ಕಾರ್ಪೊರೇಟ್ ಗೇಟ್‌ವೇ ಮೂಲಕ ಸಾಮಾನ್ಯ ವೇತನ ಜಮೆ.'],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'tx_nan_2',
      userId: 'usr_nandeesh',
      direction: 'OUT',
      amount: 2350,
      counterparty: 'dmart.pos@icici',
      category: 'Retail',
      message: 'DMart Supermarket Bangalore Groceries',
      riskScore: 10,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Verified retail merchant QR payment.'],
      reasonsKn: ['ದೃಢೀಕರಿಸಿದ ವ್ಯಾಪಾರಿ ಕ್ಯೂಆರ್ ಪಾವತಿ.'],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'tx_nan_3',
      userId: 'usr_nandeesh',
      direction: 'OUT',
      amount: 1500,
      counterparty: 'anjaneya@oksbi',
      category: 'Transfer',
      message: 'Dinner share reimbursement to Anjaneya',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Peer-to-peer payment to known family contact.'],
      reasonsKn: ['ಕುಟುಂಬ ಅಥವಾ ಸ್ನೇಹಿತರಿಗೆ ಸಾಮಾನ್ಯ ವರ್ಗಾವಣೆ.'],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'tx_nan_4',
      userId: 'usr_nandeesh',
      direction: 'OUT',
      amount: 15000,
      counterparty: 'vip.trades@okaxis',
      category: 'Investment',
      message: 'Guaranteed 40% in 7 days VIP stock group deposit link: http://vipstocks.top/bonus.apk',
      riskScore: 95,
      riskLevel: 'HIGH_RISK',
      status: 'HELD_FOR_REVIEW',
      reasons: [
        'UNREGISTERED INVESTMENT: Sent to personal handle @okaxis instead of official SEBI *.brk@valid* handle.',
        'Scam keywords detected ("Guaranteed 40% in 7 days").',
        'Malicious APK link detected in payment remarks.'
      ],
      reasonsKn: [
        'ಅನಧಿಕೃತ ಹೂಡಿಕೆ ಖಾತೆ: SEBI ಮಾನ್ಯತೆ ಪಡೆದ *.brk@valid* ಬದಲು ವೈಯಕ್ತಿಕ UPI ID ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.',
        'ವಂಚನೆಯ ಪದಗಳು ಪತ್ತೆಯಾಗಿವೆ ("Guaranteed 40% in 7 days").',
        'ಅಪಾಯಕಾರಿ APK ಫೈಲ್ ಲಿಂಕ್ ಸಂದೇಶದಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ.'
      ],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString()
    },
    {
      id: 'tx_nan_5',
      userId: 'usr_nandeesh',
      direction: 'OUT',
      amount: 1420,
      counterparty: 'bescom@karnataka',
      category: 'Utilities',
      message: 'BESCOM Electricity Bill Payment',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Bharat BillPay System verified utility payment.'],
      reasonsKn: ['BBPS ಮೂಲಕ ಸರ್ಕಾರಿ ವಿದ್ಯುತ್ ಶುಲ್ಕ ಪಾವತಿ.'],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
    }
  ],
  usr_anjaneya: [
    {
      id: 'tx_anj_1',
      userId: 'usr_anjaneya',
      direction: 'IN',
      amount: 1500,
      counterparty: 'nandeesh@okicici',
      category: 'Transfer',
      message: 'Dinner share reimbursement from Nandeesh',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Received peer-to-peer reimbursement.'],
      reasonsKn: ['ಸ್ನೇಹಿತರಿಂದ ಪಡೆದ ಮರುಪಾವತಿ.'],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'tx_anj_2',
      userId: 'usr_anjaneya',
      direction: 'IN',
      amount: 4200,
      counterparty: 'customer.anitha@oksbi',
      category: 'Business',
      message: 'Tailoring boutique client advance order',
      riskScore: 10,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Verified customer UPI payment for goods/services.'],
      reasonsKn: ['ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಕ್ಕಾಗಿ ಗ್ರಾಹಕರಿಂದ ಸಾಮಾನ್ಯ ಪಾವತಿ.'],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'tx_anj_3',
      userId: 'usr_anjaneya',
      direction: 'OUT',
      amount: 2000,
      counterparty: 'zerodha.brk@validhdfc',
      category: 'Investment',
      message: 'Monthly Nifty 50 Index Fund SIP via Zerodha',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['VERIFIED SEBI BROKER: Receiver handle matches *.brk@valid*.'],
      reasonsKn: ['ದೃಢೀಕರಿಸಿದ SEBI ಸಂಸ್ಥೆ: ಅಧಿಕೃತ ಬ್ರೋಕರ್ ಪ್ರೋಟೋಕಾಲ್ ಹೊಂದಿಕೆಯಾಗಿದೆ.'],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 18 * 3600000).toISOString()
    },
    {
      id: 'tx_anj_4',
      userId: 'usr_anjaneya',
      direction: 'IN',
      amount: 8500,
      counterparty: 'olx.buyer99@paytm',
      category: 'Retail',
      message: 'OLX sofa advance token - enter upi pin to receive money',
      riskScore: 95,
      riskLevel: 'HIGH_RISK',
      status: 'HELD_FOR_REVIEW',
      reasons: [
        'CRITICAL TRAP: Fake Collect Request! You NEVER need to enter UPI PIN to receive money. Entering PIN transfers money OUT.'
      ],
      reasonsKn: [
        'ಗಂಭೀರ ಎಚ್ಚರಿಕೆ: ನಕಲಿ UPI ಕಲೆಕ್ಟ್ ರಿಕ್ವೆಸ್ಟ್ ಬಲೆ! ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ UPI PIN ನಮೂದಿಸುವ ಅಗತ್ಯವಿಲ್ಲ. PIN ನಮೂದಿಸಿದರೆ ಹಣ ಕಡಿತಗೊಳ್ಳುತ್ತದೆ.'
      ],
      isCollectRequest: true,
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString()
    },
    {
      id: 'tx_anj_5',
      userId: 'usr_anjaneya',
      direction: 'OUT',
      amount: 850,
      counterparty: 'apollo.pharmacy@hdfcbank',
      category: 'Emergency',
      message: 'Monthly prescribed medicines Apollo Pharmacy',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Verified retail pharmacy merchant payment.'],
      reasonsKn: ['ದೃಢೀಕರಿಸಿದ ಔಷಧಾಲಯ ವ್ಯಾಪಾರಿ ಪಾವತಿ.'],
      isCollectRequest: false,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
    }
  ]
};

const PROFILES_STORAGE_KEY = 'money_matters_profiles_v2';
const TRANSACTIONS_STORAGE_KEY = 'money_matters_tx_v2';
const ACTIVE_USER_KEY = 'money_matters_active_user_v2';

export const storageService = {
  isCloudConnected() {
    return isSupabaseConfigured && typeof navigator !== 'undefined' && navigator.onLine;
  },

  async getActiveUserId() {
    return localStorage.getItem(ACTIVE_USER_KEY) || DEFAULT_PROFILES[0].id;
  },

  setActiveUserId(userId) {
    localStorage.setItem(ACTIVE_USER_KEY, userId);
  },

  async loadProfiles() {
    // 1. Try Supabase
    if (this.isCloudConnected() && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = data.map(p => ({
            id: p.id,
            fullName: p.full_name,
            email: p.email,
            upiId: p.upi_id,
            phone: p.phone,
            bankName: p.bank_name,
            accountLast4: p.account_last4,
            startingBalance: Number(p.starting_balance),
            avatarInitials: p.avatar_initials,
            createdAt: p.created_at
          }));
          localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn('[MoneyMatters] Profiles fetch from Supabase failed:', err);
      }
    }

    // 2. Try localStorage
    try {
      const local = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // 3. Fallback to default profiles
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
    return DEFAULT_PROFILES;
  },

  async loadUserTransactions(userId) {
    const fallbackSeed = DEFAULT_USER_TRANSACTIONS[userId] || [];

    // 1. Try Supabase
    if (this.isCloudConnected() && supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = data.map(item => ({
            id: item.id,
            userId: item.user_id,
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
          this.saveLocalUserTransactions(userId, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('[MoneyMatters] Supabase tx fetch failed:', err);
      }
    }

    // 2. Try localStorage
    const local = this.getLocalUserTransactions(userId);
    if (local && local.length > 0) {
      return local;
    }

    // 3. Fallback to pre-seeded transactions
    this.saveLocalUserTransactions(userId, fallbackSeed);
    return fallbackSeed;
  },

  async saveNewTransaction(tx) {
    const userId = tx.userId;
    // 1. LocalStorage
    const current = this.getLocalUserTransactions(userId);
    const updated = [tx, ...current.filter(t => t.id !== tx.id)];
    this.saveLocalUserTransactions(userId, updated);

    // 2. Supabase
    if (this.isCloudConnected() && supabase) {
      try {
        await supabase.from('transactions').upsert({
          id: tx.id,
          user_id: tx.userId,
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
        console.warn('[MoneyMatters] Supabase insert deferred:', err);
      }
    }
  },

  async updateTransactionStatus(userId, id, newStatus) {
    // 1. LocalStorage
    const current = this.getLocalUserTransactions(userId);
    const updated = current.map(item => 
      item.id === id ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
    );
    this.saveLocalUserTransactions(userId, updated);

    // 2. Supabase
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

  async resetUserTransactions(userId) {
    const seed = DEFAULT_USER_TRANSACTIONS[userId] || [];
    this.saveLocalUserTransactions(userId, seed);

    if (this.isCloudConnected() && supabase) {
      try {
        await supabase.from('transactions').delete().eq('user_id', userId);
        const records = seed.map(tx => ({
          id: tx.id,
          user_id: tx.userId,
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
      } catch (err) {
        console.warn('[MoneyMatters] Supabase reset error:', err);
      }
    }
    return seed;
  },

  getLocalUserTransactions(userId) {
    try {
      const all = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '{}');
      return Array.isArray(all[userId]) ? all[userId] : [];
    } catch {
      return [];
    }
  },

  saveLocalUserTransactions(userId, txList) {
    try {
      const all = JSON.parse(localStorage.getItem(TRANSACTIONS_STORAGE_KEY) || '{}');
      all[userId] = txList;
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('[MoneyMatters] Local storage write error:', e);
    }
  }
};
