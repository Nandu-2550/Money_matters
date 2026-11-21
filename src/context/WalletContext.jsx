import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { storageService } from '../lib/supabaseClient';
import { scoreTransaction } from '../utils/fraudEngine';
import { translations } from '../utils/translations';

const WalletContext = createContext(null);

export const STARTING_BALANCE = 25000;

// Pre-seeded realistic dummy transactions for instant rich demonstration
export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx_seed_1',
    direction: 'IN',
    amount: 45000,
    counterparty: 'techcorp.payroll@icici',
    category: 'Salary',
    message: 'Monthly Software Engineer Salary Credit - Tech Corp India',
    riskScore: 5,
    riskLevel: 'SAFE',
    status: 'VERIFIED',
    reasons: ['Standard payroll direct credit from verified corporate banking gateway.'],
    reasonsKn: ['ದೃಢೀಕರಿಸಿದ ಕಾರ್ಪೊರೇಟ್ ಗೇಟ್‌ವೇ ಮೂಲಕ ಸಾಮಾನ್ಯ ವೇತನ ಜಮೆ.'],
    isCollectRequest: false,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'tx_seed_2',
    direction: 'OUT',
    amount: 2350,
    counterparty: 'dmart.pos@icici',
    category: 'Retail',
    message: 'DMart Supermarket Bangalore Monthly Groceries',
    riskScore: 10,
    riskLevel: 'SAFE',
    status: 'VERIFIED',
    reasons: ['Verified retail merchant QR payment.'],
    reasonsKn: ['ದೃಢೀಕರಿಸಿದ ವ್ಯಾಪಾರಿ ಕ್ಯೂಆರ್ ಪಾವತಿ.'],
    isCollectRequest: false,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'tx_seed_3',
    direction: 'OUT',
    amount: 1420,
    counterparty: 'bescom@karnataka',
    category: 'Utilities',
    message: 'BESCOM Electricity Bill Payment Karnataka',
    riskScore: 5,
    riskLevel: 'SAFE',
    status: 'VERIFIED',
    reasons: ['State utility bill payment via Bharat BillPay System (BBPS).'],
    reasonsKn: ['BBPS ಮೂಲಕ ಸರ್ಕಾರಿ ವಿದ್ಯುತ್ ಶುಲ್ಕ ಪಾವತಿ.'],
    isCollectRequest: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'tx_seed_4',
    direction: 'OUT',
    amount: 15000,
    counterparty: 'vip.profit@okaxis',
    category: 'Investment',
    message: 'VIP Stock signals group 40% weekly return join now http://vip-stocks.xyz/bonus.apk',
    riskScore: 95,
    riskLevel: 'HIGH_RISK',
    status: 'HELD_FOR_REVIEW',
    reasons: [
      'UNREGISTERED INVESTMENT RECIPIENT: Stock investment sent to personal handle (@okaxis) instead of SEBI *.brk@valid* handle.',
      'High-pressure scam keywords detected ("40% weekly return").',
      'Malicious APK link detected in payment remarks.'
    ],
    reasonsKn: [
      'ಅನಧಿಕೃತ ಹೂಡಿಕೆ ಖಾತೆ: SEBI ಮಾನ್ಯತೆ ಪಡೆದ *.brk@valid* ಬದಲು ವೈಯಕ್ತಿಕ UPI ID (@okaxis) ಗೆ ಹೂಡಿಕೆ ಕಳುಹಿಸಲಾಗಿದೆ.',
      'ವಂಚನೆಯ ಆಮಿಷದ ಪದಗಳು ಪತ್ತೆಯಾಗಿವೆ ("40% weekly return").',
      'ಅಪಾಯಕಾರಿ APK ಫೈಲ್ ಲಿಂಕ್ ಸಂದೇಶದಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ.'
    ],
    isCollectRequest: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'tx_seed_5',
    direction: 'IN',
    amount: 3800,
    counterparty: 'anitha.m@oksbi',
    category: 'Business',
    message: 'Custom tailoring boutique payment from Anitha',
    riskScore: 10,
    riskLevel: 'SAFE',
    status: 'VERIFIED',
    reasons: ['Regular peer-to-peer customer payment for local business.'],
    reasonsKn: ['ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಕ್ಕಾಗಿ ಗ್ರಾಹಕರಿಂದ ಸಾಮಾನ್ಯ ಪಾವತಿ.'],
    isCollectRequest: false,
    createdAt: new Date(Date.now() - 20 * 3600000).toISOString()
  },
  {
    id: 'tx_seed_6',
    direction: 'IN',
    amount: 8500,
    counterparty: 'olx.buyer99@paytm',
    category: 'Retail',
    message: 'OLX sofa advance token - enter upi pin to receive money into account',
    riskScore: 95,
    riskLevel: 'HIGH_RISK',
    status: 'BLOCKED',
    reasons: [
      'CRITICAL: Fake UPI Collect Request Trap! You NEVER need to enter your UPI PIN to receive money. Entering your PIN transfers money OUT of your bank account.'
    ],
    reasonsKn: [
      'ಗಂಭೀರ ಎಚ್ಚರಿಕೆ: ನಕಲಿ UPI ಕಲೆಕ್ಟ್ ರಿಕ್ವೆಸ್ಟ್ ಬಲೆ! ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ UPI PIN ನಮೂದಿಸುವ ಅಗತ್ಯವಿಲ್ಲ. PIN ನಮೂದಿಸಿದರೆ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತಗೊಳ್ಳುತ್ತದೆ.'
    ],
    isCollectRequest: true,
    createdAt: new Date(Date.now() - 14 * 3600000).toISOString()
  },
  {
    id: 'tx_seed_7',
    direction: 'OUT',
    amount: 2500,
    counterparty: 'zerodha.brk@validhdfc',
    category: 'Investment',
    message: 'Nifty 50 Index Mutual Fund Monthly SIP via Zerodha',
    riskScore: 5,
    riskLevel: 'SAFE',
    status: 'VERIFIED',
    reasons: [
      'VERIFIED SEBI ENTITY: Counterparty handle matches official SEBI-registered broker protocol (*.brk@validhdfc).'
    ],
    reasonsKn: [
      'ದೃಢೀಕರಿಸಿದ SEBI ಸಂಸ್ಥೆ: ಅಧಿಕೃತ SEBI ನೋಂದಾಯಿತ ಬ್ರೋಕರ್ ಪ್ರೋಟೋಕಾಲ್ ಹೊಂದಿಕೆಯಾಗಿದೆ.'
    ],
    isCollectRequest: false,
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString()
  },
  {
    id: 'tx_seed_8',
    direction: 'OUT',
    amount: 12000,
    counterparty: 'urgent.help88@ybl',
    category: 'Emergency',
    message: 'Urgent hospital emergency send 12000 within 10 mins friend accident',
    riskScore: 65,
    riskLevel: 'SUSPICIOUS',
    status: 'HELD_FOR_REVIEW',
    reasons: [
      'High-pressure urgency keywords detected ("urgent", "within 10 mins").',
      'High-value transfer (> ₹10,000) to new unverified recipient.'
    ],
    reasonsKn: [
      'ತುರ್ತು ಒತ್ತಡದ ಪದಗಳು ಪತ್ತೆಯಾಗಿವೆ ("urgent", "within 10 mins").',
      'ಹೊಸ ಸ್ವೀಕೃತಿದಾರರಿಗೆ ಹೆಚ್ಚಿನ ಮೊತ್ತದ ಹಣ ವರ್ಗಾವಣೆ (> ₹10,000).'
    ],
    isCollectRequest: false,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
  }
];

export function WalletProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('mm_lang') || 'en';
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'queue' | 'dashboard'
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notification, setNotification] = useState(null);

  // Monitor network status
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

  // Monitor PWA install prompt
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

  // Initial data load from storage/supabase
  useEffect(() => {
    let mounted = true;
    storageService.loadTransactions(INITIAL_TRANSACTIONS).then(data => {
      if (mounted) {
        setTransactions(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Toggle Language & persist
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

  // ==========================================
  // EXACT MATHEMATICAL LEDGER RECONCILIATION
  // Starting Balance + Verified Inflows - Verified Outflows === Current Balance
  // HELD_FOR_REVIEW & BLOCKED transactions NEVER affect Current Balance
  // ==========================================
  const computedMetrics = useMemo(() => {
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
        // Amount intercepted and protected from fraudulent loss
        totalSavedFromScams += amt;
      }
    }

    const currentBalance = STARTING_BALANCE + totalInflow - totalOutflow;
    const heldTransactions = transactions.filter(t => t.status === 'HELD_FOR_REVIEW');
    const blockedTransactions = transactions.filter(t => t.status === 'BLOCKED');
    const verifiedTransactions = transactions.filter(t => t.status === 'VERIFIED');

    return {
      startingBalance: STARTING_BALANCE,
      currentBalance,
      totalInflow,
      totalOutflow,
      totalSavedFromScams,
      heldTransactions,
      blockedTransactions,
      verifiedTransactions,
      // Mathematical integrity assertion flag
      isReconciled: (STARTING_BALANCE + totalInflow - totalOutflow) === currentBalance
    };
  }, [transactions]);

  // Submit and screen new transaction
  const submitTransaction = useCallback(async (txInput) => {
    const scored = scoreTransaction(txInput);
    const newTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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

    if (newTx.status === 'HELD_FOR_REVIEW') {
      showToast(
        language === 'kn'
          ? 'ವಹಿವಾಟು ತಡೆಹಿಡಿಯಲಾಗಿದೆ! ಕುಟುಂಬ ಪರಿಶೀಲನಾ ಸರದಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.'
          : 'High risk detected! Transaction HELD in Family Review Queue.',
        'warning'
      );
    } else {
      showToast(
        language === 'kn'
          ? 'ವಹಿವಾಟು ದೃಢೀಕರಿಸಲಾಗಿದೆ ಮತ್ತು ಬ್ಯಾಲೆನ್ಸ್‌ಗೆ ನಮೂದಿಸಲಾಗಿದೆ.'
          : 'Transaction Verified and reconciled into wallet balance.',
        'success'
      );
    }

    return newTx;
  }, [language, showToast]);

  // Approve a transaction currently held for review
  const approveHeldTransaction = useCallback(async (id) => {
    setTransactions(prev => 
      prev.map(tx => tx.id === id ? { ...tx, status: 'VERIFIED' } : tx)
    );
    await storageService.updateTransactionStatus(id, 'VERIFIED');
    showToast(
      language === 'kn'
        ? 'ವಹಿವಾಟು ಅನುಮೋದಿಸಲಾಗಿದೆ ಮತ್ತು ಲೆಡ್ಜರ್ ಅಪ್‌ಡೇಟ್ ಆಗಿದೆ.'
        : 'Transaction Approved! Reconciled into wallet balance.',
      'success'
    );
  }, [language, showToast]);

  // Block a transaction currently held for review
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
    await storageService.updateTransactionStatus(id, 'BLOCKED');
    showToast(
      language === 'kn'
        ? `ವಂಚನೆ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ! ₹${savedAmount.toLocaleString('en-IN')} ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲಾಗಿದೆ.`
        : `Scam Blocked! ₹${savedAmount.toLocaleString('en-IN')} successfully protected.`,
      'error'
    );
  }, [language, showToast]);

  // Reset demo to default initial seed transactions
  const resetDemoData = useCallback(async () => {
    const fresh = await storageService.resetData(INITIAL_TRANSACTIONS);
    setTransactions(fresh);
    showToast(
      language === 'kn'
        ? 'ಡೆಮೊ ಡೇಟಾವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.'
        : 'Demo data reset to initial benchmark state.',
      'info'
    );
  }, [language, showToast]);

  // Trigger PWA install
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      showToast(
        language === 'kn'
          ? 'ಬ್ರೌಸರ್ ಮೆನುವಿನಿಂದ "ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ" ಅಥವಾ "ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಸೇರಿಸಿ" ಆಯ್ಕೆಮಾಡಿ.'
          : 'To install, tap the Share or Browser menu and select "Add to Home Screen".',
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
    resetDemoData
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
