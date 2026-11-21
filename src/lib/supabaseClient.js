import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {});
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

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
    return Boolean(
      isSupabaseConfigured && 
      (typeof navigator === 'undefined' || navigator.onLine !== false)
    );
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

      // Self-healing cloud sync: if any locally registered profile is missing from Supabase, sync it now!
      if (this.isCloudConnected() && supabase) {
        const cloudIds = new Set(cloudProfiles.map(p => p.id));
        localList.forEach(localProf => {
          if (localProf && localProf.id && !cloudIds.has(localProf.id) && localProf.id !== 'usr_nandeesh' && localProf.id !== 'usr_anjaneya') {
            this.syncProfileToSupabase(localProf).catch(e => {
              console.warn('[MoneyMatters] Background profile sync deferred:', e);
            });
          }
        });
      }

      const merged = Array.from(combinedMap.values());
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      return DEFAULT_PROFILES;
    }
  },

  async syncProfileToSupabase(profile) {
    if (!this.isCloudConnected() || !supabase) return false;

    // 1. Attempt Supabase Auth user registration (swallows non-blocking mail/rate errors)
    try {
      if (profile.email && profile.password) {
        await supabase.auth.signUp({
          email: profile.email.trim(),
          password: profile.password.length >= 6 ? profile.password : `${profile.password}1234`,
          options: {
            data: {
              full_name: profile.fullName,
              phone: profile.phone,
              wallet_id: profile.walletId || profile.wallet_id
            }
          }
        });
      }
    } catch (authErr) {
      console.warn('[MoneyMatters] Supabase auth.signUp note:', authErr?.message || authErr);
    }

    // 2. Full upgraded schema payload
    const fullPayload = {
      id: profile.id,
      full_name: profile.fullName,
      email: profile.email,
      wallet_id: profile.walletId || profile.wallet_id || `${profile.email.split('@')[0]}@mmwallet`,
      upi_id: profile.walletId || profile.upiId,
      phone: profile.phone,
      bank_name: profile.bankName || 'Safe-Wallet Vault',
      account_last4: profile.accountLast4 || '8800',
      starting_balance: profile.startingBalance,
      avatar_initials: profile.avatarInitials,
      password: profile.password || '1234',
      demo_pin: profile.demoPin || profile.demo_pin || '0000',
      created_at: profile.createdAt || new Date().toISOString()
    };

    const { error: pErr } = await supabase.from('profiles').upsert(fullPayload);
    if (pErr) {
      console.warn('[MoneyMatters] Supabase profiles full upsert note:', pErr.message);
      // Fallback for live schema without demo_pin / wallet_id
      const basePayload = {
        id: profile.id,
        full_name: profile.fullName,
        email: profile.email,
        upi_id: profile.walletId || profile.upiId,
        phone: profile.phone,
        bank_name: profile.bankName || 'Safe-Wallet Vault',
        account_last4: profile.accountLast4 || '8800',
        starting_balance: profile.startingBalance,
        avatar_initials: profile.avatarInitials,
        password: profile.password || '1234',
        created_at: profile.createdAt || new Date().toISOString()
      };
      const { error: fbErr } = await supabase.from('profiles').upsert(basePayload);
      if (fbErr) {
        console.error('[MoneyMatters] Supabase profiles base fallback error:', fbErr);
        return false;
      }
    }

    console.log('[MoneyMatters] Profile synced successfully to Supabase:', profile.id, profile.email);
    return true;
  },

  async syncTransactionToSupabase(tx) {
    if (!this.isCloudConnected() || !supabase) return false;

    const fullTx = {
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
      risk_score: tx.riskScore ?? 0,
      risk_level: tx.riskLevel || 'SAFE',
      status: tx.status || 'VERIFIED',
      reasons: tx.reasons || [],
      is_collect_request: Boolean(tx.isCollectRequest),
      is_offline_queued: Boolean(tx.isOfflineQueued),
      voucher_signature: tx.voucherSignature || null,
      created_at: tx.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: tErr } = await supabase.from('transactions').upsert(fullTx);
    if (tErr) {
      // Fallback for live schema without tx_id, counterparty_wallet_id, tx_category, is_offline_queued, voucher_signature
      const baseTx = {
        id: tx.id,
        user_id: tx.userId,
        direction: tx.direction,
        amount: tx.amount,
        counterparty: tx.counterparty,
        category: tx.category || 'Transfer',
        message: tx.message || '',
        risk_score: tx.riskScore ?? 0,
        risk_level: tx.riskLevel || 'SAFE',
        status: tx.status || 'VERIFIED',
        reasons: tx.reasons || [],
        is_collect_request: Boolean(tx.isCollectRequest),
        created_at: tx.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { error: fbErr } = await supabase.from('transactions').upsert(baseTx);
      if (fbErr) {
        console.warn('[MoneyMatters] Supabase transaction fallback error:', fbErr);
        return false;
      }
    }
    return true;
  },

  async createProfile(newProfile) {
    const profiles = await this.loadProfiles();
    const updated = [...profiles, newProfile];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));

    // Initialize initial welcome transaction for the new user
    const welcomeTx = {
      id: `tx_welcome_${Date.now()}`,
      txId: `tx_welcome_${Date.now()}`,
      userId: newProfile.id,
      direction: 'IN',
      amount: newProfile.startingBalance,
      counterparty: 'Safe-Wallet Primary Vault',
      counterpartyWalletId: 'vault@mmwallet',
      category: 'Salary',
      txCategory: 'TOPUP',
      message: 'Demo Sandbox Initial Account Setup Credit',
      riskScore: 0,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Initial demo sandbox balance allocation.'],
      reasonsKn: ['ಖಾತೆ ತೆರೆದ ಆರಂಭಿಕ ಡೆಮೊ ಹಣ ಜಮೆ.'],
      isCollectRequest: false,
      isOfflineQueued: false,
      createdAt: new Date().toISOString()
    };
    this.saveLocalUserTransactions(newProfile.id, [welcomeTx]);

    // Sync to Supabase in background or synchronously
    if (this.isCloudConnected() && supabase) {
      try {
        await this.syncProfileToSupabase(newProfile);
        await this.syncTransactionToSupabase(welcomeTx);
      } catch (err) {
        console.warn('[MoneyMatters] Supabase profile sync deferred:', err);
      }
    }

    return newProfile;
  },

  async loadUserTransactions(userId) {
    const fallbackSeed = DEFAULT_USER_TRANSACTIONS[userId] || [];
    const local = this.getLocalUserTransactions(userId);
    const baseTransactions = (local && local.length > 0) ? local : fallbackSeed;

    // 1. Try Supabase
    if (this.isCloudConnected() && supabase) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
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
            reasonsKn: Array.isArray(item.reasons_kn) ? item.reasons_kn : [],
            isCollectRequest: Boolean(item.is_collect_request),
            isOfflineQueued: Boolean(item.is_offline_queued),
            voucherSignature: item.voucher_signature || null,
            createdAt: item.created_at || new Date().toISOString(),
          }));

          // Merge cloud with local storage without losing any local transactions
          const mergedMap = new Map();
          fallbackSeed.forEach(tx => mergedMap.set(tx.id || tx.txId, tx));
          mapped.forEach(tx => mergedMap.set(tx.id || tx.txId, tx));
          baseTransactions.forEach(tx => {
            const key = tx.id || tx.txId;
            if (mergedMap.has(key)) {
              mergedMap.set(key, { ...mergedMap.get(key), ...tx });
            } else {
              mergedMap.set(key, tx);
            }
          });

          const merged = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
          this.saveLocalUserTransactions(userId, merged);
          return merged;
        }
      } catch (err) {
        console.warn('[MoneyMatters] Supabase tx fetch failed:', err);
      }
    }

    // 2. Return local storage transactions
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
    const updated = [tx, ...current.filter(t => t.id !== tx.id && t.txId !== (tx.txId || tx.id))];
    this.saveLocalUserTransactions(userId, updated);

    // Asynchronous non-blocking cloud sync (ultra-fast <15ms transfer experience)
    if (this.isCloudConnected() && supabase) {
      this.syncTransactionToSupabase(tx).catch(err => {
        console.warn('[MoneyMatters] Supabase background insert deferred:', err);
      });
    }
    return updated;
  },

  async syncOfflineTransactionPair(senderDebitTx, receiverCreditTx) {
    if (!this.isCloudConnected() || !supabase) return false;
    try {
      const sOk = await this.syncTransactionToSupabase(senderDebitTx);
      const rOk = await this.syncTransactionToSupabase(receiverCreditTx);
      return sOk && rOk;
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

    // Non-blocking status update to Supabase
    if (this.isCloudConnected() && supabase) {
      supabase
        .from('transactions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[MoneyMatters] Supabase status update note:', error.message);
        })
        .catch(err => {
          console.warn('[MoneyMatters] Supabase status update deferred:', err);
        });
    }
    return updated;
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

/**
 * Robust multi-attribute profile matcher.
 * Matches by ID, wallet handle, UPI ID, email, full name, wallet handle prefix, or phone number.
 */
export function findMatchingProfile(target, profiles = []) {
  if (!target || !Array.isArray(profiles) || profiles.length === 0) return null;
  const raw = String(target).trim();
  const clean = raw.toLowerCase();
  const cleanDigits = clean.replace(/\D/g, '');

  return profiles.find(p => {
    if (!p) return false;
    const pId = (p.id || '').toLowerCase();
    const pName = (p.fullName || '').toLowerCase();
    const pWallet = (p.walletId || p.wallet_id || '').toLowerCase();
    const pUpi = (p.upiId || '').toLowerCase();
    const pEmail = (p.email || '').toLowerCase();
    const pPhone = (p.phone || '').replace(/\D/g, '');

    // 1. Direct ID match
    if (pId === clean) return true;

    // 2. Exact UPI, Wallet, or Email match
    if (pWallet === clean || pUpi === clean || pEmail === clean) return true;

    // 3. Exact Full Name match
    if (pName === clean) return true;

    // 4. Wallet prefix match (e.g. 'anjaneya' matches 'anjaneya@mmwallet')
    const walletPrefix = pWallet.split('@')[0];
    const upiPrefix = pUpi.split('@')[0];
    const cleanPrefix = clean.split('@')[0];
    if (clean === walletPrefix || clean === upiPrefix) return true;
    if (cleanPrefix && (cleanPrefix === walletPrefix || cleanPrefix === upiPrefix)) return true;

    // 5. Name contains or starts with (e.g. 'Anjan' or 'Nandeesh')
    if (clean.length >= 3 && (pName === clean || pName.startsWith(clean) || clean.startsWith(pName))) return true;

    // 6. Phone number match (last 10 digits)
    if (cleanDigits.length >= 10 && pPhone.endsWith(cleanDigits.slice(-10))) return true;

    return false;
  }) || null;
}
