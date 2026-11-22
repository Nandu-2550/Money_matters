import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyC3yvfgG_UT7FqMpAPdUf7F-i04-ak_Rnk",
  authDomain: "money-matters-2026.firebaseapp.com",
  projectId: "money-matters-2026",
  storageBucket: "money-matters-2026.firebasestorage.app",
  messagingSenderId: "872070736412",
  appId: "1:872070736412:web:f03e4576dfd39a1483cdd9",
  measurementId: "G-615MZKRCFQ"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const PROFILES_STORAGE_KEY = 'money_matters_profiles_v3';
const TRANSACTIONS_KEY_PREFIX = 'money_matters_tx_';
const ACTIVE_USER_KEY = 'money_matters_active_user';

export const firebaseStorageService = {
  isCloudConnected() {
    return typeof navigator === 'undefined' || navigator.onLine !== false;
  },

  async getActiveUserId() {
    return localStorage.getItem(ACTIVE_USER_KEY) || 'usr_nandeesh';
  },

  setActiveUserId(userId) {
    localStorage.setItem(ACTIVE_USER_KEY, userId);
  },

  async loadProfiles() {
    try {
      const snap = await getDocs(collection(db, 'profiles'));
      if (!snap.empty) {
        const list = snap.docs.map(d => {
          const p = d.data();
          return {
            id: p.id || d.id,
            fullName: p.full_name || p.fullName || 'User',
            full_name: p.full_name || p.fullName || 'User',
            email: p.email,
            walletId: p.wallet_id || p.upi_id || p.walletId || `${(p.email || 'user').split('@')[0]}@mmwallet`,
            wallet_id: p.wallet_id || p.upi_id || p.walletId || `${(p.email || 'user').split('@')[0]}@mmwallet`,
            upiId: p.upi_id || p.wallet_id || p.walletId,
            phone: p.phone || '+91 98765 00000',
            bankName: p.bank_name || p.bankName || 'Safe-Wallet Vault',
            accountLast4: p.account_last4 || p.accountLast4 || '8800',
            startingBalance: Number(p.starting_balance || p.startingBalance || 5000),
            starting_balance: Number(p.starting_balance || p.startingBalance || 5000),
            avatarInitials: p.avatar_initials || p.avatarInitials || (p.full_name ? p.full_name[0].toUpperCase() : 'U'),
            demoPin: p.password || p.demo_pin || p.demoPin || '1234',
            demo_pin: p.password || p.demo_pin || p.demoPin || '1234',
            password: p.password || p.demo_pin || p.demoPin || '1234',
            createdAt: p.created_at || p.createdAt || new Date().toISOString()
          };
        });
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('[Firebase] loadProfiles warning, using local cache:', err);
    }
    const local = localStorage.getItem(PROFILES_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  },

  async createProfile(newProfile) {
    const docId = newProfile.id;
    const payload = {
      id: docId,
      full_name: newProfile.fullName || newProfile.full_name,
      email: newProfile.email,
      upi_id: newProfile.upiId || newProfile.walletId || newProfile.wallet_id,
      wallet_id: newProfile.walletId || newProfile.wallet_id || newProfile.upiId,
      phone: newProfile.phone || '+91 98765 00000',
      bank_name: newProfile.bankName || 'Safe-Wallet Vault',
      account_last4: newProfile.accountLast4 || '8800',
      starting_balance: Number(newProfile.startingBalance || 5000),
      avatar_initials: newProfile.avatarInitials || 'U',
      password: newProfile.demoPin || newProfile.password || '1234',
      demo_pin: newProfile.demoPin || newProfile.password || '1234',
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'profiles', docId), payload, { merge: true });
    } catch (err) {
      console.warn('[Firebase] createProfile warning:', err);
    }

    const current = await this.loadProfiles();
    const updated = [...current.filter(p => p.id !== docId), newProfile];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));
    return newProfile;
  },

  async updatePaymentPin(userId, cleanPin) {
    try {
      await setDoc(doc(db, 'profiles', userId), {
        password: cleanPin,
        demo_pin: cleanPin
      }, { merge: true });
    } catch (err) {
      console.warn('[Firebase] updatePaymentPin warning:', err);
    }
  },

  async loadUserTransactions(userId) {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, 'transactions'),
        where('user_id', '==', userId)
      );
      const snap = await getDocs(q);
      const mapped = snap.docs.map(d => {
        const item = d.data();
        return {
          id: item.id || d.id,
          txId: item.tx_id || item.id || d.id,
          userId: item.user_id,
          direction: item.direction,
          amount: Number(item.amount),
          counterparty: item.counterparty,
          counterpartyWalletId: item.counterparty_wallet_id || item.counterparty,
          category: item.category || 'Transfer',
          txCategory: item.tx_category || 'P2P_TRANSFER',
          message: item.message || '',
          riskScore: item.risk_score ?? 0,
          riskLevel: item.risk_level || 'SAFE',
          status: item.status || 'VERIFIED',
          reasons: Array.isArray(item.reasons) ? item.reasons : [],
          isCollectRequest: Boolean(item.is_collect_request),
          isOfflineQueued: Boolean(item.is_offline_queued),
          voucherSignature: item.voucher_signature || null,
          createdAt: item.created_at || new Date().toISOString()
        };
      });

      // Sort newest first
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      localStorage.setItem(TRANSACTIONS_KEY_PREFIX + userId, JSON.stringify(mapped));
      return mapped;
    } catch (err) {
      console.warn('[Firebase] loadUserTransactions warning, using cache:', err);
      const local = localStorage.getItem(TRANSACTIONS_KEY_PREFIX + userId);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveNewTransaction(tx) {
    const rawTxId = tx.txId || tx.tx_id || tx.id || `tx_${Date.now()}`;
    const docId = tx.id || rawTxId;
    const userId = tx.userId || tx.user_id;

    const row = {
      id: docId,
      tx_id: rawTxId,
      user_id: userId,
      direction: tx.direction,
      amount: Number(tx.amount),
      counterparty: tx.counterparty,
      counterparty_wallet_id: tx.counterpartyWalletId || tx.counterparty_wallet_id || tx.counterparty,
      category: tx.category || 'Transfer',
      tx_category: tx.txCategory || tx.tx_category || 'P2P_TRANSFER',
      message: tx.message || '',
      risk_score: tx.riskScore ?? tx.risk_score ?? 0,
      risk_level: tx.riskLevel || tx.risk_level || 'SAFE',
      status: tx.status || 'VERIFIED',
      reasons: Array.isArray(tx.reasons) ? tx.reasons : [],
      is_collect_request: Boolean(tx.isCollectRequest || tx.is_collect_request),
      is_offline_queued: Boolean(tx.isOfflineQueued || tx.is_offline_queued),
      voucher_signature: tx.voucherSignature || tx.voucher_signature || null,
      created_at: tx.createdAt || tx.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to local storage first (<2ms)
    try {
      const local = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY_PREFIX + userId) || '[]');
      const updated = [tx, ...local.filter(t => t.id !== docId && t.txId !== rawTxId)];
      localStorage.setItem(TRANSACTIONS_KEY_PREFIX + userId, JSON.stringify(updated));
    } catch (e) {
      console.warn('[Firebase] local cache write error:', e);
    }

    // Write to Firebase
    try {
      await setDoc(doc(db, 'transactions', docId), row, { merge: true });
    } catch (err) {
      console.warn('[Firebase] saveNewTransaction cloud write deferred:', err);
    }
    return row;
  },

  async syncOfflineTransactionPair(senderDebitTx, receiverCreditTx) {
    try {
      const batch = writeBatch(db);
      if (senderDebitTx) {
        const sId = senderDebitTx.id || senderDebitTx.txId || `tx_${Date.now()}`;
        const sRow = {
          id: sId,
          tx_id: senderDebitTx.tx_id || senderDebitTx.txId || sId,
          user_id: senderDebitTx.userId || senderDebitTx.user_id,
          direction: senderDebitTx.direction,
          amount: Number(senderDebitTx.amount),
          counterparty: senderDebitTx.counterparty,
          category: senderDebitTx.category || 'Transfer',
          message: senderDebitTx.message || '',
          risk_score: senderDebitTx.riskScore ?? 0,
          risk_level: senderDebitTx.riskLevel || 'SAFE',
          status: senderDebitTx.status || 'VERIFIED',
          reasons: Array.isArray(senderDebitTx.reasons) ? senderDebitTx.reasons : [],
          created_at: senderDebitTx.createdAt || new Date().toISOString()
        };
        batch.set(doc(db, 'transactions', sId), sRow, { merge: true });
      }

      if (receiverCreditTx) {
        const rId = receiverCreditTx.id || receiverCreditTx.txId || `tx_recv_${Date.now()}`;
        const rRow = {
          id: rId,
          tx_id: receiverCreditTx.tx_id || receiverCreditTx.txId || rId,
          user_id: receiverCreditTx.userId || receiverCreditTx.user_id,
          direction: receiverCreditTx.direction,
          amount: Number(receiverCreditTx.amount),
          counterparty: receiverCreditTx.counterparty,
          category: receiverCreditTx.category || 'Transfer',
          message: receiverCreditTx.message || '',
          risk_score: receiverCreditTx.riskScore ?? 0,
          risk_level: receiverCreditTx.riskLevel || 'SAFE',
          status: receiverCreditTx.status || 'VERIFIED',
          reasons: Array.isArray(receiverCreditTx.reasons) ? receiverCreditTx.reasons : [],
          created_at: receiverCreditTx.createdAt || new Date().toISOString()
        };
        batch.set(doc(db, 'transactions', rId), rRow, { merge: true });
      }

      await batch.commit();
      return true;
    } catch (err) {
      console.error('[Firebase] syncOfflineTransactionPair error:', err);
      return false;
    }
  },

  subscribeToUserTransactions(userId, onUpdate) {
    if (!userId) return () => {};
    const q = query(
      collection(db, 'transactions'),
      where('user_id', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => {
        const item = d.data();
        return {
          id: item.id || d.id,
          txId: item.tx_id || item.id || d.id,
          userId: item.user_id,
          direction: item.direction,
          amount: Number(item.amount),
          counterparty: item.counterparty,
          counterpartyWalletId: item.counterparty_wallet_id || item.counterparty,
          category: item.category || 'Transfer',
          txCategory: item.tx_category || 'P2P_TRANSFER',
          message: item.message || '',
          riskScore: item.risk_score ?? 0,
          riskLevel: item.risk_level || 'SAFE',
          status: item.status || 'VERIFIED',
          reasons: Array.isArray(item.reasons) ? item.reasons : [],
          isCollectRequest: Boolean(item.is_collect_request),
          isOfflineQueued: Boolean(item.is_offline_queued),
          voucherSignature: item.voucher_signature || null,
          createdAt: item.created_at || new Date().toISOString()
        };
      });
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      onUpdate(list);
    }, (error) => {
      console.warn('[Firebase Realtime] onSnapshot listener warning:', error);
    });
  }
};
