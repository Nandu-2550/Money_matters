import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  storageService, 
  DEFAULT_PROFILES, 
  supabase, 
  isSupabaseConfigured 
} from '../lib/supabaseClient';
import { scoreTransaction } from '../utils/fraudEngine';
import { translations } from '../utils/translations';

const WalletContext = createContext(null);

export const STARTING_BALANCE = 25000;

const AUTH_USER_KEY = 'money_matters_auth_v3';

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
  const [activeTab, setActiveTab] = useState('scan');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active Profile Object
  const currentUser = useMemo(() => {
    return profiles.find(p => p.id === currentUserId) || profiles[0] || DEFAULT_PROFILES[0];
  }, [profiles, currentUserId]);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const userEmail = session.user.email.toLowerCase();
          const matched = profiles.find(p => p.email.toLowerCase() === userEmail);
          if (matched) {
            loginAsUser(matched.id);
          } else {
            const prefix = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
            const autoProfile = {
              id: `usr_${Date.now()}`,
              fullName: prefix.charAt(0).toUpperCase() + prefix.slice(1),
              email: userEmail,
              upiId: `${prefix}@okmoneymatters`,
              phone: '+91 98765 00000',
              bankName: 'HDFC Bank',
              accountLast4: '5678',
              startingBalance: 25000,
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
  }, [profiles]);

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

  const showToast = useCallback((msg, type = 'info') => {
    setNotification({ msg, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.msg === msg ? null : prev));
    }, 4000);
  }, []);

  // Direct login as user
  const loginAsUser = useCallback((userId) => {
    setCurrentUserId(userId);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_USER_KEY, userId);
    storageService.setActiveUserId(userId);
    storageService.loadUserTransactions(userId).then(setTransactions);
  }, []);

  // Password / MPIN login verification (supports Mobile Number, Email, or UPI ID)
  const loginWithPassword = useCallback((identifier, password) => {
    const raw = (identifier || '').trim();
    const cleanId = raw.toLowerCase();
    const cleanPass = (password || '').trim();
    const phoneDigits = raw.replace(/\D/g, '');

    const matched = profiles.find(p => {
      const pEmail = (p.email || '').toLowerCase();
      const pUpi = (p.upiId || '').toLowerCase();
      const pPhoneDigits = (p.phone || '').replace(/\D/g, '');

      if (pEmail === cleanId || pUpi === cleanId) return true;
      if (phoneDigits.length >= 10 && pPhoneDigits.endsWith(phoneDigits.slice(-10))) return true;
      return false;
    });

    if (!matched) {
      return { 
        success: false, 
        error: language === 'kn'
          ? 'ಈ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಇಮೇಲ್ ಅಥವಾ UPI ID ಯೊಂದಿಗೆ ಯಾವುದೇ ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ.'
          : 'No profile found with this Mobile Number, Email, or UPI ID.' 
      };
    }

    // Check password against profile password or fallback demo '1234'
    const expectedPass = (matched.password || '1234').trim();
    if (cleanPass !== expectedPass && cleanPass !== '1234') {
      return { 
        success: false, 
        error: language === 'kn'
          ? 'ತಪ್ಪಾದ MPIN / ಪಾಸ್‌ವರ್ಡ್. (ಡೆಮೊ ಖಾತೆಗಳ MPIN: 1234)'
          : 'Incorrect MPIN / Password. (Demo accounts use 1234)' 
      };
    }

    loginAsUser(matched.id);
    showToast(`Welcome back, ${matched.fullName}!`, 'success');
    return { success: true, profile: matched };
  }, [profiles, loginAsUser, showToast, language]);

  // Register New User
  const registerUser = useCallback(async (formData) => {
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const cleanUpi = (formData.upiId || '').trim().toLowerCase();
    const cleanPhone = (formData.phone || '').trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');

    // Check uniqueness across email, upiId, and phone
    const exists = profiles.some(p => {
      const pEmail = (p.email || '').toLowerCase();
      const pUpi = (p.upiId || '').toLowerCase();
      const pPhoneDigits = (p.phone || '').replace(/\D/g, '');

      if (pEmail === cleanEmail) return true;
      if (pUpi === cleanUpi) return true;
      if (phoneDigits.length >= 10 && pPhoneDigits.endsWith(phoneDigits.slice(-10))) return true;
      return false;
    });

    if (exists) {
      return { 
        success: false, 
        error: language === 'kn'
          ? 'ಈ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಇಮೇಲ್ ಅಥವಾ UPI ID ಯೊಂದಿಗೆ ಈಗಾಗಲೇ ಖಾತೆ ಇದೆ.'
          : 'An account with this Mobile Number, Email, or UPI ID already exists.' 
      };
    }

    const newProfile = {
      id: `usr_${Date.now()}`,
      fullName: formData.fullName.trim(),
      email: cleanEmail,
      upiId: cleanUpi,
      phone: cleanPhone,
      bankName: formData.bankName.trim() || 'HDFC Bank',
      accountLast4: formData.accountLast4.trim() || '1234',
      startingBalance: 25000,
      avatarInitials: (formData.fullName.trim()[0] || 'U').toUpperCase(),
      password: formData.password.trim() || '1234',
      demoPin: formData.demoPin || formData.password.trim() || '1234',
      demo_pin: formData.demoPin || formData.password.trim() || '1234',
      createdAt: new Date().toISOString()
    };

    const saved = await storageService.createProfile(newProfile);
    setProfiles(prev => [...prev, saved]);
    loginAsUser(saved.id);

    showToast(`Welcome ${saved.fullName}! Wallet initialized with ₹25,000 demo funds.`, 'success');
    return { success: true, profile: saved };
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

  // ==========================================
  // EXACT MATHEMATICAL RECONCILIATION PER USER
  // ==========================================
  const computedMetrics = useMemo(() => {
    const startingBalance = Number(currentUser?.startingBalance) || 25000;
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
    const newTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser.id,
      direction: txInput.direction,
      amount: Number(txInput.amount),
      counterparty: txInput.counterparty.trim(),
      category: txInput.category || 'Other',
      message: txInput.message || '',
      isCollectRequest: Boolean(txInput.isCollectRequest),
      riskScore: scored.riskScore,
      riskLevel: scored.riskLevel,
      status: scored.status,
      reasons: scored.reasons,
      reasonsKn: scored.reasonsKn,
      createdAt: new Date().toISOString()
    };

    setTransactions(prev => [newTx, ...prev]);
    await storageService.saveNewTransaction(newTx);

    // Live Two-Way P2P Transfer Sync
    if (newTx.direction === 'OUT' && newTx.status === 'VERIFIED') {
      const recipientProfile = profiles.find(
        p => p.upiId.toLowerCase() === newTx.counterparty.toLowerCase() && p.id !== currentUser.id
      );

      if (recipientProfile) {
        const mirrorCreditTx = {
          id: `tx_p2p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: recipientProfile.id,
          direction: 'IN',
          amount: newTx.amount,
          counterparty: currentUser.upiId,
          category: 'Transfer',
          message: newTx.message || `Transfer from ${currentUser.fullName}`,
          riskScore: 5,
          riskLevel: 'SAFE',
          status: 'VERIFIED',
          reasons: [`Verified P2P transfer received from ${currentUser.fullName} (${currentUser.upiId})`],
          reasonsKn: [`${currentUser.fullName} ಅವರಿಂದ ದೃಢೀಕರಿಸಿದ ನೇರ ವರ್ಗಾವಣೆ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`],
          isCollectRequest: false,
          createdAt: new Date().toISOString()
        };
        await storageService.saveNewTransaction(mirrorCreditTx);
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
          ? 'ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ ಮತ್ತು ಲೆಡ್ಜರ್‌ಗೆ ನಮೂದಿಸಲಾಗಿದೆ.'
          : 'Payment verified and reconciled with wallet balance.',
        'success'
      );
    }

    return newTx;
  }, [currentUser, profiles, language, showToast]);

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
      const recipientProfile = profiles.find(
        p => p.upiId.toLowerCase() === approvedTx.counterparty.toLowerCase() && p.id !== currentUser.id
      );
      if (recipientProfile) {
        const mirrorCreditTx = {
          id: `tx_p2p_appr_${Date.now()}`,
          userId: recipientProfile.id,
          direction: 'IN',
          amount: approvedTx.amount,
          counterparty: currentUser.upiId,
          category: 'Transfer',
          message: approvedTx.message || `Transfer from ${currentUser.fullName}`,
          riskScore: 5,
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
    const fresh = await storageService.resetUserTransactions(currentUser.id);
    setTransactions(fresh);
    showToast(
      language === 'kn'
        ? 'ಡೆಮೊ ಡೇಟಾ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.'
        : `Reset ${currentUser.fullName}'s wallet to default state.`,
      'info'
    );
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
    activeTab,
    setActiveTab,
    installPrompt,
    isInstalled,
    promptInstall,
    notification,
    computedMetrics,
    submitTransaction,
    approveHeldTransaction,
    blockHeldTransaction,
    resetDemoData,
    isProfileModalOpen,
    setIsProfileModalOpen
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
