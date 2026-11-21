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
    walletId: 'nandeesh@mmwallet',
    wallet_id: 'nandeesh@mmwallet',
    upiId: 'nandeesh@mmwallet',
    phone: '+91 98765 43210',
    bankName: 'Safe-Wallet Vault',
    accountLast4: '4821',
    startingBalance: 5000,
    avatarInitials: 'N',
    password: '1234',
    demoPin: '1234',
    demo_pin: '1234',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'usr_anjaneya',
    fullName: 'Anjaneya',
    email: 'anjaneya.9480@gmail.com',
    walletId: 'anjaneya@mmwallet',
    wallet_id: 'anjaneya@mmwallet',
    upiId: 'anjaneya@mmwallet',
    phone: '+91 94801 23456',
    bankName: 'Safe-Wallet Vault',
    accountLast4: '9480',
    startingBalance: 3500,
    avatarInitials: 'A',
    password: '1234',
    demoPin: '5678',
    demo_pin: '5678',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  }
];

export const DEFAULT_USER_TRANSACTIONS = {
  usr_nandeesh: [
    {
      id: 'tx_nan_topup',
      txId: 'tx_topup_1',
      userId: 'usr_nandeesh',
      direction: 'IN',
      amount: 5000,
      counterparty: 'Safe-Wallet Primary Vault',
      counterpartyWalletId: 'vault@mmwallet',
      category: 'Salary',
      txCategory: 'TOPUP',
      message: 'Initial Smart Safe-Wallet Top-up Allocation',
      riskScore: 0,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Bank-to-Wallet simulated vault load.'],
      reasonsKn: ['ವಾಲೆಟ್‌ಗೆ ಆರಂಭಿಕ ಸುರಕ್ಷಿತ ಬ್ಯಾಂಕ್ ಜಮೆ.'],
      isCollectRequest: false,
      isOfflineQueued: false,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'tx_nan_1',
      txId: 'tx_shared_1',
      userId: 'usr_nandeesh',
      direction: 'OUT',
      amount: 1200,
      counterparty: 'Ravi Store',
      counterpartyWalletId: 'ravi.store@mmwallet',
      category: 'Retail',
      txCategory: 'P2P_TRANSFER',
      message: 'Groceries supply payment - Ravi Kirana Store',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Verified merchant offline wallet payment.'],
      reasonsKn: ['ದೃಢೀಕರಿಸಿದ ದಿನಸಿ ಅಂಗಡಿ ವಾಲೆಟ್ ಪಾವತಿ.'],
      isCollectRequest: false,
      isOfflineQueued: false,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'tx_nan_2',
      txId: 'tx_shared_p2p_1',
      userId: 'usr_nandeesh',
      direction: 'OUT',
      amount: 500,
      counterparty: 'Anjaneya',
      counterpartyWalletId: 'anjaneya@mmwallet',
      category: 'Transfer',
      txCategory: 'P2P_TRANSFER',
      message: 'Dinner share reimbursement to Anjaneya',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Peer-to-peer safe-wallet transfer.'],
      reasonsKn: ['ಸ್ನೇಹಿತರಿಗೆ ಸುರಕ್ಷಿತ ವಾಲೆಟ್ ವರ್ಗಾವಣೆ.'],
      isCollectRequest: false,
      isOfflineQueued: false,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'tx_nan_3',
      txId: 'tx_suspicious_1',
      userId: 'usr_nandeesh',
      direction: 'OUT',
      amount: 2500,
      counterparty: 'vip.trades@okaxis',
      counterpartyWalletId: 'vip.trades@okaxis',
      category: 'Investment',
      txCategory: 'INVESTMENT',
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
        'ಅನಧಿಕೃತ ಹೂಡಿಕೆ ಖಾತೆ: SEBI ಮಾನ್ಯತೆ ಪಡೆದ *.brk@valid* ಬದಲು ವೈಯಕ್ತಿಕ ಖಾತೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.',
        'ವಂಚನೆಯ ಪದಗಳು ಪತ್ತೆಯಾಗಿವೆ ("Guaranteed 40% in 7 days").',
        'ಅಪಾಯಕಾರಿ APK ಫೈಲ್ ಲಿಂಕ್ ಸಂದೇಶದಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ.'
      ],
      isCollectRequest: false,
      isOfflineQueued: false,
      createdAt: new Date(Date.now() - 6 * 3600000).toISOString()
    }
  ],
  usr_anjaneya: [
    {
      id: 'tx_anj_topup',
      txId: 'tx_topup_2',
      userId: 'usr_anjaneya',
      direction: 'IN',
      amount: 3500,
      counterparty: 'Safe-Wallet Primary Vault',
      counterpartyWalletId: 'vault@mmwallet',
      category: 'Salary',
      txCategory: 'TOPUP',
      message: 'Initial Smart Safe-Wallet Top-up Allocation',
      riskScore: 0,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Bank-to-Wallet simulated vault load.'],
      reasonsKn: ['ವಾಲೆಟ್‌ಗೆ ಆರಂಭಿಕ ಸುರಕ್ಷಿತ ಬ್ಯಾಂಕ್ ಜಮೆ.'],
      isCollectRequest: false,
      isOfflineQueued: false,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'tx_anj_1',
      txId: 'tx_shared_p2p_1',
      userId: 'usr_anjaneya',
      direction: 'IN',
      amount: 500,
      counterparty: 'Nandeesh',
      counterpartyWalletId: 'nandeesh@mmwallet',
      category: 'Transfer',
      txCategory: 'P2P_TRANSFER',
      message: 'Dinner share reimbursement from Nandeesh',
      riskScore: 5,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Received peer-to-peer safe-wallet reimbursement.'],
      reasonsKn: ['ಸ್ನೇಹಿತರಿಂದ ಪಡೆದ ಸುರಕ್ಷಿತ ವಾಲೆಟ್ ಮರುಪಾವತಿ.'],
      isCollectRequest: false,
      isOfflineQueued: false,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'tx_anj_2',
      txId: 'tx_trap_1',
      userId: 'usr_anjaneya',
      direction: 'IN',
      amount: 1500,
      counterparty: 'olx.buyer99@paytm',
      counterpartyWalletId: 'olx.buyer99@paytm',
      category: 'Retail',
      txCategory: 'COLLECT_REQUEST',
      message: 'OLX sofa advance token - enter upi pin to receive money',
      riskScore: 95,
      riskLevel: 'HIGH_RISK',
      status: 'HELD_FOR_REVIEW',
      reasons: [
        'CRITICAL TRAP: Fake Collect Request! You NEVER need to enter PIN to receive money. Entering PIN transfers money OUT.'
      ],
      reasonsKn: [
        'ಗಂಭೀರ ಎಚ್ಚರಿಕೆ: ನಕಲಿ ಕಲೆಕ್ಟ್ ರಿಕ್ವೆಸ್ಟ್ ಬಲೆ! ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ PIN ನಮೂದಿಸುವ ಅಗತ್ಯವಿಲ್ಲ.'
      ],
      isCollectRequest: true,
      isOfflineQueued: false,
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString()
    }
  ]
};

const PROFILES_STORAGE_KEY = 'money_matters_profiles_v3';
const TRANSACTIONS_STORAGE_KEY = 'money_matters_tx_v3';
const ACTIVE_USER_KEY = 'money_matters_active_user_v3';

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
    let cloudProfiles = [];
    if (this.isCloudConnected() && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudProfiles = data.map(p => ({
            id: p.id,
            fullName: p.full_name,
            email: p.email,
            walletId: p.wallet_id || p.upi_id || `${p.email.split('@')[0]}@mmwallet`,
            wallet_id: p.wallet_id || p.upi_id || `${p.email.split('@')[0]}@mmwallet`,
            upiId: p.wallet_id || p.upi_id,
            phone: p.phone,
            bankName: p.bank_name || 'Safe-Wallet Vault',
            accountLast4: p.account_last4 || '8800',
            startingBalance: Number(p.starting_balance) || 5000,
            avatarInitials: p.avatar_initials,
            password: p.password || '1234',
            demoPin: p.demo_pin || p.demoPin || (p.id === 'usr_anjaneya' ? '5678' : (p.id === 'usr_nandeesh' ? '1234' : '0000')),
            demo_pin: p.demo_pin || p.demoPin || (p.id === 'usr_anjaneya' ? '5678' : (p.id === 'usr_nandeesh' ? '1234' : '0000')),
            createdAt: p.created_at
          }));
        }
      } catch (err) {
        console.warn('[MoneyMatters] Profiles fetch from Supabase failed:', err);
      }
    }

    // Merge with LocalStorage to preserve any newly created users
    try {
      const local = localStorage.getItem(PROFILES_STORAGE_KEY);
      const localList = local ? JSON.parse(local) : [];
      const combinedMap = new Map();

      // Priority 1: Default benchmark profiles
      DEFAULT_PROFILES.forEach(p => combinedMap.set(p.id, p));
      // Priority 2: Cloud profiles
      cloudProfiles.forEach(p => combinedMap.set(p.id, p));
      // Priority 3: Newly registered local profiles
      localList.forEach(p => combinedMap.set(p.id, p));

      const merged = Array.from(combinedMap.values());
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      return DEFAULT_PROFILES;
    }
  },

  async createProfile(newProfile) {
    const profiles = await this.loadProfiles();
    const updated = [...profiles, newProfile];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));

    // Initialize initial welcome transaction for the new user
    const welcomeTx = {
      id: `tx_welcome_${Date.now()}`,
      userId: newProfile.id,
      direction: 'IN',
      amount: newProfile.startingBalance,
      counterparty: 'reserve.sandbox@fintech',
      category: 'Salary',
      message: 'Demo Sandbox Initial Account Setup Credit',
      riskScore: 0,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Initial demo sandbox balance allocation.'],
      reasonsKn: ['ಖಾತೆ ತೆರೆದ ಆರಂಭಿಕ ಡೆಮೊ ಹಣ ಜಮೆ.'],
      isCollectRequest: false,
      createdAt: new Date().toISOString()
    };
    this.saveLocalUserTransactions(newProfile.id, [welcomeTx]);

    // Sync to Supabase in background if available
    if (this.isCloudConnected() && supabase) {
      try {
        const profilePayload = {
          id: newProfile.id,
          full_name: newProfile.fullName,
          email: newProfile.email,
          wallet_id: newProfile.walletId || newProfile.wallet_id || `${newProfile.email.split('@')[0]}@mmwallet`,
          upi_id: newProfile.walletId || newProfile.upiId,
          phone: newProfile.phone,
          bank_name: newProfile.bankName || 'Safe-Wallet Vault',
          account_last4: newProfile.accountLast4 || '8800',
          starting_balance: newProfile.startingBalance,
          avatar_initials: newProfile.avatarInitials,
          password: newProfile.password || '1234',
          demo_pin: newProfile.demoPin || newProfile.demo_pin || '0000',
          created_at: newProfile.createdAt
        };

        const { error: pErr } = await supabase.from('profiles').upsert(profilePayload);
        if (pErr && pErr.message && (pErr.message.includes('demo_pin') || pErr.message.includes('wallet_id'))) {
          const fallbackPayload = { ...profilePayload };
          delete fallbackPayload.demo_pin;
          delete fallbackPayload.wallet_id;
          await supabase.from('profiles').upsert(fallbackPayload);
        }

        await supabase.from('transactions').upsert({
          id: welcomeTx.id,
          tx_id: welcomeTx.txId || welcomeTx.id,
          user_id: welcomeTx.userId,
          direction: welcomeTx.direction,
          amount: welcomeTx.amount,
          counterparty: welcomeTx.counterparty,
          counterparty_wallet_id: welcomeTx.counterpartyWalletId || 'vault@mmwallet',
          category: welcomeTx.category,
          tx_category: welcomeTx.txCategory || 'TOPUP',
          message: welcomeTx.message,
          risk_score: welcomeTx.riskScore,
          risk_level: welcomeTx.riskLevel,
          status: welcomeTx.status,
          reasons: welcomeTx.reasons,
          is_collect_request: false,
          created_at: welcomeTx.createdAt
        });
      } catch (err) {
        console.warn('[MoneyMatters] Supabase profile sync deferred:', err);
      }
    }

    return newProfile;
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
            txId: item.tx_id || item.id,
            userId: item.user_id,
            direction: item.direction,
            amount: Number(item.amount),
            counterparty: item.counterparty,
            counterpartyWalletId: item.counterparty_wallet_id || item.counterparty,
            category: item.category,
            txCategory: item.tx_category || 'P2P_TRANSFER',
            message: item.message || '',
            riskScore: item.risk_score,
            riskLevel: item.risk_level,
            status: item.status,
            reasons: Array.isArray(item.reasons) ? item.reasons : (item.reasons ? JSON.parse(item.reasons) : []),
            isCollectRequest: Boolean(item.is_collect_request),
            isOfflineQueued: Boolean(item.is_offline_queued),
            voucherSignature: item.voucher_signature || null,
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
    const current = this.getLocalUserTransactions(userId);
    const updated = [tx, ...current.filter(t => t.id !== tx.id)];
    this.saveLocalUserTransactions(userId, updated);

    if (this.isCloudConnected() && supabase) {
      try {
        await supabase.from('transactions').upsert({
          id: tx.id,
          tx_id: tx.txId || tx.id,
          user_id: tx.userId,
          direction: tx.direction,
          amount: tx.amount,
          counterparty: tx.counterparty,
          counterparty_wallet_id: tx.counterpartyWalletId || tx.counterparty,
          category: tx.category,
          tx_category: tx.txCategory || 'P2P_TRANSFER',
          message: tx.message || '',
          risk_score: tx.riskScore,
          risk_level: tx.riskLevel,
          status: tx.status,
          reasons: tx.reasons,
          is_collect_request: Boolean(tx.isCollectRequest),
          is_offline_queued: Boolean(tx.isOfflineQueued),
          voucher_signature: tx.voucherSignature || null,
          created_at: tx.createdAt,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[MoneyMatters] Supabase insert deferred:', err);
      }
    }
  },

  async syncOfflineTransactionPair(senderDebitTx, receiverCreditTx) {
    if (!this.isCloudConnected() || !supabase) return false;
    try {
      const rows = [senderDebitTx, receiverCreditTx].map(tx => ({
        id: tx.id,
        tx_id: tx.txId || tx.id,
        user_id: tx.userId,
        direction: tx.direction,
        amount: tx.amount,
        counterparty: tx.counterparty,
        counterparty_wallet_id: tx.counterpartyWalletId || tx.counterparty,
        category: tx.category || 'Transfer',
        tx_category: tx.txCategory || 'P2P_TRANSFER',
        message: tx.message || '',
        risk_score: tx.riskScore || 0,
        risk_level: tx.riskLevel || 'SAFE',
        status: tx.status || 'VERIFIED',
        reasons: tx.reasons || [],
        is_collect_request: Boolean(tx.isCollectRequest),
        is_offline_queued: false,
        voucher_signature: tx.voucherSignature || null,
        created_at: tx.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
      if (error) {
        console.warn('[MoneyMatters] syncOfflineTransactionPair error:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[MoneyMatters] syncOfflineTransactionPair exception:', err);
      return false;
    }
  },

  async updateTransactionStatus(userId, id, newStatus) {
    const current = this.getLocalUserTransactions(userId);
    const updated = current.map(item => 
      item.id === id ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
    );
    this.saveLocalUserTransactions(userId, updated);

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
