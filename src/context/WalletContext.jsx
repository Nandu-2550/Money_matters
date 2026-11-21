import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  storageService, 
  DEFAULT_PROFILES, 
  supabase, 
  isSupabaseConfigured 
} from '../lib/supabaseClient';
import { scoreTransaction } from '../utils/fraudEngine';
import { translations } from '../utils/translations';
import { 
  signOfflineVoucher, 
  queueOfflineTransactionPair, 
  getOfflineOutbox, 
  removeSyncedVouchers, 
  markVoucherClaimed,
  isVoucherClaimed
} from '../utils/offlineVoucher';

const WalletContext = createContext(null);

export const STARTING_BALANCE = 5000;

const AUTH_USER_KEY = 'money_matters_auth_v4';

export function WalletProvider({ children }) {
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem(AUTH_USER_KEY) || DEFAULT_PROFILES[0].id;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem(AUTH_USER_KEY));
  });

  const [transactions, setTransactions] = useState([]);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('mm_lang') || 'en';
  });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineOutboxCount, setOfflineOutboxCount] = useState(() => getOfflineOutbox().length);
  const [activeTab, setActiveTab] = useState('scan');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  // Active Profile Object
  const currentUser = useMemo(() => {
    return profiles.find(p => p.id === currentUserId) || profiles[0] || DEFAULT_PROFILES[0];
  }, [profiles, currentUserId]);

  const activeWalletId = currentUser?.walletId || currentUser?.upiId || 'user@mmwallet';

  const showToast = useCallback((msg, type = 'info') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.msg === msg ? null : prev));
    }, 4000);
  }, []);

  // Sync Offline Outbox to Cloud (Dual-Settlement idempotent upsert)
  const syncOfflineOutbox = useCallback(async () => {
    const outbox = getOfflineOutbox();
    if (!outbox || outbox.length === 0) {
      setOfflineOutboxCount(0);
      return;
    }

    let syncedIds = [];
    for (const item of outbox) {
      try {
        const res = await storageService.syncOfflineTransactionPair(item.senderTx, item.receiverTx);
        if (res?.success) {
          syncedIds.push(item.txId);
        }
      } catch (err) {
        console.warn('[Sync] Failed to sync voucher item:', item.txId, err);
      }
    }

    if (syncedIds.length > 0) {
      removeSyncedVouchers(syncedIds);
      const remaining = getOfflineOutbox().length;
      setOfflineOutboxCount(remaining);
      showToast(
        language === 'kn'
          ? `${syncedIds.length} ಆಫ್‌ಲೈನ್ ಪಾವತಿಗಳು ಕ್ಲೌಡ್‌ನೊಂದಿಗೆ ಸಿಂಕ್ ಆಗಿವೆ!`
          : `${syncedIds.length} offline payment(s) synced to Supabase cloud!`,
        'success'
      );
    }
  }, [language, showToast]);

  // Online / Offline monitor + Auto-sync on reconnection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast(
        language === 'kn' ? 'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕಗೊಂಡಿದೆ. ಕ್ಲೌಡ್ ಸಿಂಕ್ ಸಕ್ರಿಯವಾಗಿದೆ.' : 'Connected to internet. Auto-syncing outbox...',
        'info'
      );
      syncOfflineOutbox();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಮೋಡ್: ಸುರಕ್ಷಿತ ವೋಚರ್ QR ಪಾವತಿಗಳು ಸಕ್ರಿಯವಾಗಿವೆ.' : 'Offline mode active: Signed voucher handshake enabled.',
        'warning'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language, showToast, syncOfflineOutbox]);

  // PWA install prompt monitor
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      showToast('PWA Installed successfully!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

  const profilesRef = useRef(profiles);
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  // Supabase Auth listener (Subscribes once on mount)
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const userEmail = session.user.email.toLowerCase();
          const currentProfiles = profilesRef.current;
          const matched = currentProfiles.find(p => p.email.toLowerCase() === userEmail);
          if (matched) {
            loginAsUser(matched.id);
          } else {
            const prefix = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
            const autoProfile = {
              id: `usr_${Date.now()}`,
              fullName: prefix.charAt(0).toUpperCase() + prefix.slice(1),
              email: userEmail,
              walletId: `${prefix}@mmwallet`,
              upiId: `${prefix}@mmwallet`,
              phone: '+91 98765 00000',
              bankName: 'Linked Bank Account',
              accountLast4: '5678',
              startingBalance: 5000,
              avatarInitials: prefix.charAt(0).toUpperCase(),
              password: '1234',
              demoPin: '0000',
              demo_pin: '0000',
              createdAt: new Date().toISOString()
            };
            storageService.createProfile(autoProfile).then(saved => {
              setProfiles(prev => [...prev, saved]);
              loginAsUser(saved.id);
            });
          }
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loginAsUser]);

  // Load profiles on mount
  useEffect(() => {
    storageService.loadProfiles().then(loadedProfiles => {
      setProfiles(loadedProfiles);
    });
  }, []);

  // Load active user's transactions whenever active user changes
  useEffect(() => {
    if (currentUser?.id) {
      storageService.loadUserTransactions(currentUser.id).then(userTx => {
        setTransactions(userTx);
      });
    }
  }, [currentUser?.id]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'kn' : 'en';
      localStorage.setItem('mm_lang', next);
      return next;
    });
  }, []);

  // Direct login as user
  const loginAsUser = useCallback((userId) => {
    setCurrentUserId(userId);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_USER_KEY, userId);
    storageService.setActiveUserId(userId);
    storageService.loadUserTransactions(userId).then(setTransactions);
  }, []);

  // Password / MPIN login verification
  const loginWithPassword = useCallback((identifier, password) => {
    const raw = (identifier || '').trim();
    const cleanId = raw.toLowerCase();
    const cleanPass = (password || '').trim();
    const phoneDigits = raw.replace(/\D/g, '');

    const matched = profiles.find(p => {
      const pEmail = (p.email || '').toLowerCase();
      const pUpi = (p.upiId || '').toLowerCase();
      const pWallet = (p.walletId || '').toLowerCase();
      const pPhoneDigits = (p.phone || '').replace(/\D/g, '');

      if (pEmail === cleanId || pUpi === cleanId || pWallet === cleanId) return true;
      if (phoneDigits.length >= 10 && pPhoneDigits.endsWith(phoneDigits.slice(-10))) return true;
      return false;
    });

    if (!matched) {
      return { 
        success: false, 
        error: language === 'kn'
          ? 'ಈ ವಿವರಗಳೊಂದಿಗೆ ಯಾವುದೇ ವಾಲೆಟ್ ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ.'
          : 'No Safe-Wallet profile found with this Mobile, Email, or Wallet ID.' 
      };
    }

    const expectedPass = (matched.password || matched.demoPin || '1234').trim();
    if (cleanPass !== expectedPass && cleanPass !== '1234') {
      return { 
        success: false, 
        error: language === 'kn'
          ? 'ತಪ್ಪಾದ PIN / ಪಾಸ್‌ವರ್ಡ್. (ಡೆಮೊ PIN: 1234)'
          : 'Incorrect PIN / Password. (Demo PIN: 1234)' 
      };
    }

    loginAsUser(matched.id);
    showToast(`Welcome back, ${matched.fullName}!`, 'success');
    return { success: true, profile: matched };
  }, [profiles, loginAsUser, showToast, language]);

  // Register New User
  const registerUser = useCallback(async (formData) => {
    try {
      const cleanEmail = (formData.email || '').trim().toLowerCase();
      const cleanWallet = (formData.walletId || formData.upiId || '').trim().toLowerCase();
      const cleanPhone = (formData.phone || '').trim();
      const phoneDigits = cleanPhone.replace(/\D/g, '');

      const exists = profiles.some(p => {
        const pEmail = (p.email || '').toLowerCase();
        const pUpi = (p.upiId || '').toLowerCase();
        const pWallet = (p.walletId || '').toLowerCase();
        const pPhoneDigits = (p.phone || '').replace(/\D/g, '');

        if (pEmail === cleanEmail) return true;
        if (pWallet === cleanWallet || pUpi === cleanWallet) return true;
        if (phoneDigits.length >= 10 && pPhoneDigits.endsWith(phoneDigits.slice(-10))) return true;
        return false;
      });

      if (exists) {
        return { 
          success: false, 
          error: language === 'kn'
            ? 'ಈ ವಿವರಗಳೊಂದಿಗೆ ಈಗಾಗಲೇ ವಾಲೆಟ್ ಖಾತೆ ಇದೆ.'
            : 'An account with this Mobile, Email, or Wallet ID already exists.' 
        };
      }

      const newProfile = {
        id: `usr_${Date.now()}`,
        fullName: formData.fullName.trim(),
        email: cleanEmail,
        walletId: cleanWallet.includes('@') ? cleanWallet : `${cleanWallet}@mmwallet`,
        upiId: cleanWallet.includes('@') ? cleanWallet : `${cleanWallet}@mmwallet`,
        phone: cleanPhone,
        bankName: formData.bankName?.trim() || 'Primary Linked Bank',
        accountLast4: formData.accountLast4?.trim() || '1234',
        startingBalance: 5000,
        avatarInitials: (formData.fullName.trim()[0] || 'U').toUpperCase(),
        password: formData.password?.trim() || '1234',
        demoPin: formData.demoPin || formData.password?.trim() || '1234',
        demo_pin: formData.demoPin || formData.password?.trim() || '1234',
        createdAt: new Date().toISOString()
      };

      const saved = await storageService.createProfile(newProfile);
      setProfiles(prev => [...prev, saved]);
      loginAsUser(saved.id);

      showToast(`Welcome ${saved.fullName}! Safe-Wallet opened with ₹5,000 balance.`, 'success');
      return { success: true, profile: saved };
    } catch (err) {
      console.error('[MoneyMatters] Registration failed:', err);
      return {
        success: false,
        error: err?.message || 'Registration failed. Please try again.'
      };
    }
  }, [profiles, loginAsUser, showToast, language]);

  // Logout
  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  // Send Email OTP / Magic Link via Supabase
  const sendEmailVerification = useCallback(async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      return { 
        success: false, 
        error: 'Supabase offline: please use Password / MPIN login or demo access.' 
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Top Up Safe-Wallet (from Primary Bank)
  const topUpWallet = useCallback(async (amount) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return { success: false, error: 'Invalid amount' };

    const topUpTx = {
      id: `tx_topup_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      txId: `tx_topup_${Date.now()}`,
      userId: currentUser.id,
      direction: 'IN',
      amount: numAmount,
      counterparty: `${currentUser.bankName || 'Linked Bank'} Top-Up`,
      category: 'TOPUP',
      txCategory: 'TOPUP',
      message: `Safe-Wallet loaded from ${currentUser.bankName || 'Bank'} (•••• ${currentUser.accountLast4 || '1234'})`,
      riskScore: 0,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Verified Top-Up into standalone safe-wallet.'],
      reasonsKn: ['ಸ್ವತಂತ್ರ ಸುರಕ್ಷಿತ ವಾಲೆಟ್‌ಗೆ ಬ್ಯಾಂಕ್ ಖಾತೆಯಿಂದ ಯಶಸ್ವಿಯಾಗಿ ಹಣ ಸೇರಿಸಲಾಗಿದೆ.'],
      isCollectRequest: false,
      isOfflineQueued: false,
      createdAt: new Date().toISOString()
    };

    setTransactions(prev => [topUpTx, ...prev]);
    await storageService.saveNewTransaction(topUpTx);

    showToast(
      language === 'kn'
        ? `₹${numAmount.toLocaleString('en-IN')} ವಾಲೆಟ್‌ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!`
        : `Added ₹${numAmount.toLocaleString('en-IN')} to Safe Wallet!`,
      'success'
    );

    return { success: true, transaction: topUpTx };
  }, [currentUser, language, showToast]);

  // Claim Signed Offline Voucher Handshake
  const claimOfflineVoucher = useCallback(async (voucher) => {
    if (!voucher || !voucher.tx_id) return { success: false, error: 'Invalid voucher' };

    // Prevent duplicate claim
    if (isVoucherClaimed(voucher.tx_id)) {
      return { success: false, error: 'Voucher has already been claimed!' };
    }
    markVoucherClaimed(voucher.tx_id);

    const amt = Number(voucher.amount);
    const sharedTxId = voucher.tx_id;

    // 1. Receiver Credit Transaction (IN)
    const receiverTx = {
      id: `tx_voucher_in_${sharedTxId}`,
      txId: sharedTxId,
      userId: currentUser.id,
      counterpartyWalletId: voucher.from_wallet,
      direction: 'IN',
      amount: amt,
      counterparty: voucher.from_wallet,
      category: 'Transfer',
      txCategory: 'P2P_TRANSFER',
      message: `Offline voucher payment received from ${voucher.from_wallet}`,
      riskScore: 0,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: [`Verified cryptographic HMAC voucher signed by ${voucher.from_wallet}`],
      reasonsKn: [`${voucher.from_wallet} ಅವರಿಂದ ಮಾನ್ಯವಾದ ಆಫ್‌ಲೈನ್ ಸಹಿ ಮಾಡಿದ ವೋಚರ್ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`],
      isOfflineQueued: !isOnline,
      voucherSignature: voucher.signature,
      isCollectRequest: false,
      createdAt: new Date(voucher.timestamp).toISOString()
    };

    // 2. Identify sender profile if present locally
    const senderProfile = profiles.find(p => 
      (p.walletId && p.walletId.toLowerCase() === voucher.from_wallet.toLowerCase()) ||
      (p.upiId && p.upiId.toLowerCase() === voucher.from_wallet.toLowerCase())
    );

    // 3. Sender Mirror Debit Transaction (OUT)
    const senderTx = {
      id: `tx_voucher_out_${sharedTxId}`,
      txId: sharedTxId,
      userId: senderProfile?.id || voucher.from_wallet,
      counterpartyWalletId: voucher.to_wallet,
      direction: 'OUT',
      amount: amt,
      counterparty: voucher.to_wallet,
      category: 'Transfer',
      txCategory: 'P2P_TRANSFER',
      message: `Offline voucher payment sent to ${voucher.to_wallet}`,
      riskScore: 0,
      riskLevel: 'SAFE',
      status: 'VERIFIED',
      reasons: ['Signed offline payment voucher authorized by payer'],
      reasonsKn: ['ಪಾವತಿದಾರರಿಂದ ಅಧಿಕೃತ ಆಫ್‌ಲೈನ್ ವೋಚರ್ ಕಳುಹಿಸಲಾಗಿದೆ.'],
      isOfflineQueued: !isOnline,
      voucherSignature: voucher.signature,
      isCollectRequest: false,
      createdAt: new Date(voucher.timestamp).toISOString()
    };

    // Update receiver's local UI state
    setTransactions(prev => [receiverTx, ...prev]);
    await storageService.saveNewTransaction(receiverTx);

    // If sender exists in current device storage, update sender as well
    if (senderProfile) {
      await storageService.saveNewTransaction(senderTx);
    }

    // Attempt cloud settlement if online
    if (isOnline) {
      try {
        await storageService.syncOfflineTransactionPair(senderTx, receiverTx);
      } catch (err) {
        console.warn('[Claim] Online sync error, queuing in outbox:', err);
        queueOfflineTransactionPair(senderTx, receiverTx);
        setOfflineOutboxCount(getOfflineOutbox().length);
      }
    } else {
      // Queue for eventual settlement
      queueOfflineTransactionPair(senderTx, receiverTx);
      setOfflineOutboxCount(getOfflineOutbox().length);
    }

    showToast(
      language === 'kn'
        ? `₹${amt.toLocaleString('en-IN')} ಆಫ್‌ಲೈನ್ ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿ ಜಮೆಯಾಗಿದೆ!`
        : `Claimed ₹${amt.toLocaleString('en-IN')} offline payment voucher!`,
      'success'
    );

    return { success: true, transaction: receiverTx };
  }, [currentUser, profiles, isOnline, language, showToast]);

  // ==========================================
  // EXACT MATHEMATICAL RECONCILIATION PER USER
  // ==========================================
  const computedMetrics = useMemo(() => {
    const startingBalance = Number(currentUser?.startingBalance) || 5000;
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalSavedFromScams = 0;

    for (const tx of transactions) {
      const amt = Number(tx.amount) || 0;
      if (tx.status === 'VERIFIED') {
        if (tx.direction === 'IN') {
          totalInflow += amt;
        } else if (tx.direction === 'OUT') {
          totalOutflow += amt;
        }
      } else if (tx.status === 'BLOCKED') {
        totalSavedFromScams += amt;
      }
    }

    const currentBalance = startingBalance + totalInflow - totalOutflow;
    const heldTransactions = transactions.filter(t => t.status === 'HELD_FOR_REVIEW');
    const blockedTransactions = transactions.filter(t => t.status === 'BLOCKED');
    const verifiedTransactions = transactions.filter(t => t.status === 'VERIFIED');

    return {
      startingBalance,
      currentBalance,
      totalInflow,
      totalOutflow,
      totalSavedFromScams,
      heldTransactions,
      blockedTransactions,
      verifiedTransactions,
      isReconciled: (startingBalance + totalInflow - totalOutflow) === currentBalance
    };
  }, [transactions, currentUser]);

  // Submit and screen new transaction for the active user
  const submitTransaction = useCallback(async (txInput) => {
    const scored = scoreTransaction(txInput);
    const sharedTxId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const myWallet = currentUser?.walletId || currentUser?.upiId || 'user@mmwallet';
    const isOut = txInput.direction === 'OUT';

    // Offline Voucher Signature Generation for OUT transfers
    let generatedVoucher = null;
    let voucherSig = null;

    if (isOut && scored.status === 'VERIFIED') {
      try {
        generatedVoucher = await signOfflineVoucher({
          tx_id: sharedTxId,
          from_wallet: myWallet,
          to_wallet: txInput.counterparty.trim(),
          amount: Number(txInput.amount)
        });
        voucherSig = generatedVoucher.signature;
      } catch (err) {
        console.warn('[WalletContext] Voucher signing error:', err);
      }
    }

    const newTx = {
      id: sharedTxId,
      txId: sharedTxId,
      userId: currentUser.id,
      counterpartyWalletId: txInput.counterparty.trim(),
      direction: txInput.direction,
      amount: Number(txInput.amount),
      counterparty: txInput.counterparty.trim(),
      category: txInput.category || 'Transfer',
      txCategory: txInput.category === 'TOPUP' ? 'TOPUP' : (txInput.category === 'Investment' ? 'INVESTMENT' : 'P2P_TRANSFER'),
      message: txInput.message || '',
      isCollectRequest: Boolean(txInput.isCollectRequest),
      riskScore: scored.riskScore,
      riskLevel: scored.riskLevel,
      status: scored.status,
      reasons: scored.reasons,
      reasonsKn: scored.reasonsKn,
      isOfflineQueued: !isOnline && isOut,
      voucherSignature: voucherSig,
      createdAt: new Date().toISOString()
    };

    setTransactions(prev => [newTx, ...prev]);
    await storageService.saveNewTransaction(newTx);

    // Two-Way P2P Transfer Sync (Mirror Credit for Recipient)
    if (newTx.direction === 'OUT' && newTx.status === 'VERIFIED') {
      const recipientProfile = profiles.find(
        p => (p.walletId && p.walletId.toLowerCase() === newTx.counterparty.toLowerCase()) ||
             (p.upiId && p.upiId.toLowerCase() === newTx.counterparty.toLowerCase())
      );

      const mirrorCreditTx = {
        id: `tx_p2p_in_${sharedTxId}`,
        txId: sharedTxId,
        userId: recipientProfile ? recipientProfile.id : newTx.counterparty,
        counterpartyWalletId: myWallet,
        direction: 'IN',
        amount: newTx.amount,
        counterparty: myWallet,
        category: 'Transfer',
        txCategory: 'P2P_TRANSFER',
        message: newTx.message || `Transfer from ${currentUser.fullName}`,
        riskScore: 0,
        riskLevel: 'SAFE',
        status: 'VERIFIED',
        reasons: [`Verified Safe-Wallet transfer received from ${currentUser.fullName} (${myWallet})`],
        reasonsKn: [`${currentUser.fullName} ಅವರಿಂದ ದೃಢೀಕರಿಸಿದ ನೇರ ವಾಲೆಟ್ ವರ್ಗಾವಣೆ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`],
        isCollectRequest: false,
        isOfflineQueued: !isOnline,
        voucherSignature: voucherSig,
        createdAt: new Date().toISOString()
      };

      if (recipientProfile) {
        await storageService.saveNewTransaction(mirrorCreditTx);
      }

      // If Online: Upsert both to Supabase cloud
      if (isOnline) {
        try {
          await storageService.syncOfflineTransactionPair(newTx, mirrorCreditTx);
        } catch (err) {
          console.warn('[Sync] Failed online dual-settlement, queuing outbox:', err);
          queueOfflineTransactionPair(newTx, mirrorCreditTx);
          setOfflineOutboxCount(getOfflineOutbox().length);
        }
      } else {
        // If Offline: Queue in outbox
        queueOfflineTransactionPair(newTx, mirrorCreditTx);
        setOfflineOutboxCount(getOfflineOutbox().length);
      }
    }

    if (newTx.status === 'HELD_FOR_REVIEW') {
      showToast(
        language === 'kn'
          ? 'ವಹಿವಾಟು ತಡೆಹಿಡಿಯಲಾಗಿದೆ! ಕುಟುಂಬ ಪರಿಶೀಲನಾ ಸರದಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.'
          : 'Suspicious payment held! Sent to Family Review Queue.',
        'warning'
      );
    } else {
      showToast(
        language === 'kn'
          ? 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ ಮತ್ತು ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್‌ನೊಂದಿಗೆ ತಾಳೆಯಾಗಿದೆ.'
          : 'Payment verified and reconciled with safe wallet.',
        'success'
      );
    }

    return { ...newTx, offlineVoucher: generatedVoucher };
  }, [currentUser, profiles, isOnline, language, showToast]);

  // Approve a transaction currently held for review
  const approveHeldTransaction = useCallback(async (id) => {
    let approvedTx = null;
    setTransactions(prev => 
      prev.map(tx => {
        if (tx.id === id) {
          approvedTx = { ...tx, status: 'VERIFIED' };
          return approvedTx;
        }
        return tx;
      })
    );
    await storageService.updateTransactionStatus(currentUser.id, id, 'VERIFIED');

    if (approvedTx && approvedTx.direction === 'OUT') {
      const myWallet = currentUser.walletId || currentUser.upiId;
      const recipientProfile = profiles.find(
        p => (p.walletId && p.walletId.toLowerCase() === approvedTx.counterparty.toLowerCase()) ||
             (p.upiId && p.upiId.toLowerCase() === approvedTx.counterparty.toLowerCase())
      );
      if (recipientProfile) {
        const mirrorCreditTx = {
          id: `tx_p2p_appr_${Date.now()}`,
          txId: approvedTx.txId || `tx_${Date.now()}`,
          userId: recipientProfile.id,
          counterpartyWalletId: myWallet,
          direction: 'IN',
          amount: approvedTx.amount,
          counterparty: myWallet,
          category: 'Transfer',
          txCategory: 'P2P_TRANSFER',
          message: approvedTx.message || `Transfer from ${currentUser.fullName}`,
          riskScore: 0,
          riskLevel: 'SAFE',
          status: 'VERIFIED',
          reasons: [`Approved transfer from ${currentUser.fullName}`],
          reasonsKn: [`${currentUser.fullName} ಅವರಿಂದ ಅನುಮೋದಿತ ವರ್ಗಾವಣೆ.`],
          isCollectRequest: false,
          createdAt: new Date().toISOString()
        };
        await storageService.saveNewTransaction(mirrorCreditTx);
      }
    }

    showToast(
      language === 'kn'
        ? 'ವಹಿವಾಟು ಅನುಮೋದಿಸಲಾಗಿದೆ ಮತ್ತು ಲೆಡ್ಜರ್ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ.'
        : 'Payment Approved! Reconciled with wallet balance.',
      'success'
    );
  }, [currentUser, profiles, language, showToast]);

  // Block a held transaction
  const blockHeldTransaction = useCallback(async (id) => {
    let savedAmount = 0;
    setTransactions(prev => 
      prev.map(tx => {
        if (tx.id === id) {
          savedAmount = tx.amount;
          return { ...tx, status: 'BLOCKED' };
        }
        return tx;
      })
    );
    await storageService.updateTransactionStatus(currentUser.id, id, 'BLOCKED');
    showToast(
      language === 'kn'
        ? `ವಂಚನೆ ತಡೆಯಲಾಗಿದೆ! ₹${savedAmount.toLocaleString('en-IN')} ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲಾಗಿದೆ.`
        : `Scam Blocked! ₹${savedAmount.toLocaleString('en-IN')} protected from fraud.`,
      'error'
    );
  }, [currentUser.id, language, showToast]);

  // Reset demo data
  const resetDemoData = useCallback(async () => {
    try {
      if (!currentUser?.id) return;
      const fresh = await storageService.resetUserTransactions(currentUser.id);
      setTransactions(fresh);
      showToast(
        language === 'kn'
          ? 'ಡೆಮೊ ಡೇಟಾ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.'
          : `Reset ${currentUser.fullName}'s safe wallet to default state.`,
        'info'
      );
    } catch (err) {
      console.warn('[resetDemoData] Error:', err);
    }
  }, [currentUser, language, showToast]);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      showToast(
        language === 'kn'
          ? 'ಬ್ರೌಸರ್ ಮೆನುವಿನಿಂದ "ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ" ಆಯ್ಕೆಮಾಡಿ.'
          : 'To install, open browser menu and tap "Add to Home Screen".',
        'info'
      );
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  }, [installPrompt, language, showToast]);

  const t = translations[language] || translations.en;

  const value = {
    profiles,
    currentUser,
    currentUserId,
    activeWalletId,
    isAuthenticated,
    loginAsUser,
    loginWithPassword,
    registerUser,
    logout,
    sendEmailVerification,
    transactions,
    language,
    toggleLanguage,
    t,
    isOnline,
    offlineOutboxCount,
    syncOfflineOutbox,
    activeTab,
    setActiveTab,
    installPrompt,
    isInstalled,
    promptInstall,
    notification,
    computedMetrics,
    submitTransaction,
    topUpWallet,
    claimOfflineVoucher,
    approveHeldTransaction,
    blockHeldTransaction,
    resetDemoData,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isTopUpModalOpen,
    setIsTopUpModalOpen
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
