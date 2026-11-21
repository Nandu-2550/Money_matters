import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle2, 
  ArrowRight,
  Smartphone,
  Landmark,
  QrCode,
  CreditCard,
  Send,
  Users,
  X,
  Check,
  Lock,
  Sparkles,
  ExternalLink,
  User,
  Volume2,
  FileText
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { findMatchingProfile } from '../lib/supabaseClient';
import { analyzePaymentContext } from '../utils/fraudEngine';
import QRScannerModal from './QRScannerModal';
import ReceiveQRModal from './ReceiveQRModal';
import DemoPinModal from './DemoPinModal';
import TopUpModal from './TopUpModal';
import OfflineVoucherModal from './OfflineVoucherModal';

export default function ScannerSimulator() {
  const { 
    currentUser, 
    profiles, 
    computedMetrics,
    language, 
    t, 
    submitTransaction, 
    setActiveTab,
    isOnline,
    topUpWallet,
    claimOfflineVoucher,
    isTopUpModalOpen,
    setIsTopUpModalOpen,
    showToast,
    isBalanceRevealed,
    setIsBalanceRevealed,
    setIsProfileModalOpen
  } = useWallet();

  // Form State
  const [direction, setDirection] = useState('OUT'); // 'IN' | 'OUT'
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Transfer');
  const [message, setMessage] = useState('');
  const [isCollectRequest, setIsCollectRequest] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [formError, setFormError] = useState('');

  // Modals
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showReceiveQR, setShowReceiveQR] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [pinModalMode, setPinModalMode] = useState('transfer'); // 'transfer' | 'balance'
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  // Other registered users for contacts bar (memoized)
  const otherUsers = useMemo(() => {
    return profiles.filter(p => p.id !== currentUser?.id);
  }, [profiles, currentUser?.id]);

  // Quick Action 1: Scan Any QR
  const handleActionScanQR = () => {
    setShowQRScanner(true);
  };

  // Quick Action 2: To Mobile / UPI
  const handleActionToMobile = () => {
    setDirection('OUT');
    setIsCollectRequest(false);
    setScanResult(null);
    setFormError('');
    setTimeout(() => {
      const inputEl = document.getElementById('transfer-upi-input');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
    }, 100);
    showToast?.(
      language === 'kn'
        ? 'ಮೊಬೈಲ್ ಅಥವಾ UPI ID ನಮೂದಿಸಿ ಹಣ ಕಳುಹಿಸಿ'
        : 'Enter Mobile Number or UPI ID to send money',
      'info'
    );
  };

  // Quick Action 3: Check Balance (Triggers Demo PIN first)
  const handleActionCheckBalance = () => {
    setPinModalMode('balance');
    setShowPinModal(true);
  };

  // Quick Action 4: Receive Money / My QR
  const handleActionReceive = () => {
    setShowReceiveQR(true);
  };

  // Select contact from horizontal bar
  const handleSelectContact = (contact) => {
    setDirection('OUT');
    setCounterparty(contact.upiId || contact.walletId);
    setCategory('Transfer');
    setMessage(`Transfer to ${contact.fullName}`);
    setIsCollectRequest(false);
    setScanResult(null);
    setFormError('');
    setTimeout(() => {
      const amtEl = document.getElementById('transfer-amount-input');
      if (amtEl) amtEl.focus();
    }, 100);
  };

  // QR Scan successful callback
  const handleQRScanSuccess = ({ upiId, payeeName, amount: qrAmount }) => {
    setShowQRScanner(false);
    setDirection('OUT');
    setCounterparty(upiId);
    if (qrAmount) {
      setAmount(qrAmount);
    }
    setCategory('Transfer');
    setMessage(payeeName ? `Payment to ${payeeName}` : `Payment to ${upiId}`);
    setIsCollectRequest(false);
    setScanResult(null);
    setFormError('');

    // Smoothly scroll down to the payment form and focus input
    setTimeout(() => {
      const formEl = document.getElementById('payment-form-container');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (!qrAmount) {
        const amtEl = document.getElementById('transfer-amount-input');
        if (amtEl) amtEl.focus();
      }
    }, 150);

    showToast?.(
      language === 'kn'
        ? `QR ಸ್ಕ್ಯಾನ್ ಯಶಸ್ವಿಯಾಗಿದೆ: ${payeeName || upiId}`
        : `QR scanned: ${payeeName || upiId}. Enter amount & PIN to pay.`,
      'success'
    );
  };

  // Real-time Context Analysis using user's engine
  const contextAnalysis = useMemo(() => {
    return analyzePaymentContext({
      message,
      recipientId: counterparty,
      amount: Number(amount) || 0,
      txType: isCollectRequest ? 'COLLECT_REQUEST' : (category === 'Investment' ? 'INVESTMENT' : 'P2P_TRANSFER')
    });
  }, [message, counterparty, amount, isCollectRequest, category]);

  // Handle message typing / pasting with extracted handle auto-fill
  const handleMessageChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    // If counterparty field is currently empty, check for extracted handles in pasted text
    if (!counterparty.trim()) {
      const handles = val.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+/g) || [];
      if (handles.length > 0) {
        setCounterparty(handles[0]);
        showToast?.(
          language === 'kn'
            ? `ಸಂದೇಶದಿಂದ ಸ್ವೀಕೃತಿದಾರರ ಹ್ಯಾಂಡಲ್ (${handles[0]}) ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಭರ್ತಿ ಮಾಡಲಾಗಿದೆ!`
            : `Auto-filled recipient handle (${handles[0]}) from pasted message!`,
          'info'
        );
      }
    }
  };

  // Kannada / English Voice Warning
  const playVoiceWarning = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const warningText = language === 'kn'
        ? 'ಎಚ್ಚರಿಕೆ! ಈ ಪಾವತಿಯು ಹೆಚ್ಚಿನ ವಂಚನೆಯ ಅಪಾಯವನ್ನು ಹೊಂದಿದೆ. ಸುರಕ್ಷತಾ ಶೀಲ್ಡ್ ಮೂಲಕ ನೇರ ಪಾವತಿಯನ್ನು ತಡೆಹಿಡಿಯಲಾಗಿದೆ.'
        : 'Warning! High fraud risk detected in this payment. Direct payment has been blocked by the security shield.';
      const utterance = new SpeechSynthesisUtterance(warningText);
      utterance.lang = language === 'kn' ? 'kn-IN' : 'en-US';
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  const hasSpokenRef = useRef(false);
  useEffect(() => {
    if (contextAnalysis.isFraud) {
      if (!hasSpokenRef.current) {
        hasSpokenRef.current = true;
        playVoiceWarning();
      }
    } else {
      hasSpokenRef.current = false;
    }
  }, [contextAnalysis.isFraud, playVoiceWarning]);

  // Route directly to Family Guardian Review Queue
  const handleSendToGuardianQueue = async () => {
    setFormError('');
    const parsedAmount = Number(amount);
    if (!counterparty.trim() || !parsedAmount || parsedAmount <= 0) {
      setFormError(
        language === 'kn'
          ? 'ದಯವಿಟ್ಟು ಸ್ವೀಕೃತಿದಾರರ UPI ID ಮತ್ತು ಮಾನ್ಯ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ'
          : 'Please enter recipient UPI ID / Phone and valid amount'
      );
      return;
    }

    const matchedRecipient = findMatchingProfile(counterparty, profiles);
    const payeeName = matchedRecipient ? matchedRecipient.fullName : counterparty.trim();

    setIsScanning(true);
    setScanResult(null);

    const result = await submitTransaction({
      direction,
      counterparty: counterparty.trim(),
      amount: parsedAmount,
      category,
      message,
      isCollectRequest: direction === 'IN' ? isCollectRequest : false,
      payeeName
    });

    setIsScanning(false);
    setCounterparty('');
    setAmount('');
    setMessage('');

    showToast?.(
      language === 'kn'
        ? 'ವಂಚನೆಯ ವಹಿವಾಟು ಕುಟುಂಬ ರಕ್ಷಕ ಪರಿಶೀಲನಾ ಸರದಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ರವಾನಿಸಲಾಗಿದೆ!'
        : 'Suspicious payment securely routed to Family Guardian Review Queue!',
      'warning'
    );
    setActiveTab('queue');
  };

  // Cancel Payment action
  const handleCancelPayment = () => {
    setMessage('');
    setCounterparty('');
    setAmount('');
    setFormError('');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    showToast?.(
      language === 'kn' ? 'ಪಾವತಿ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.' : 'Payment cancelled safely.',
      'info'
    );
  };

  // Initiate Payment Submission (Validates and triggers Sandbox PIN Modal)
  const handleInitiatePayment = (e) => {
    e?.preventDefault();
    setFormError('');

    // Automatic Payment Gate Check
    if (contextAnalysis.isFraud) {
      setFormError(
        language === 'kn'
          ? 'ಹೆಚ್ಚಿನ ವಂಚನೆಯ ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ! ನೇರ ಪಾವತಿಯನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ರಕ್ಷಕ ಪರಿಶೀಲನಾ ಸರದಿಗೆ ಕಳುಹಿಸಿ.'
          : 'High fraud risk detected! Direct payment execution is blocked. Please route to Family Guardian Review Queue.'
      );
      playVoiceWarning();
      return;
    }

    const parsedAmount = Number(amount);
    if (!counterparty.trim() || !parsedAmount || parsedAmount <= 0) {
      setFormError(t.scanner.validationError || 'Please enter recipient UPI ID / Phone and valid amount');
      return;
    }

    const cleanUpi = counterparty.trim().toLowerCase();
    const cleanDigits = cleanUpi.replace(/\D/g, '');

    // Allow standard UPI format (@), 10-digit mobile, registered profile, or handle prefix
    const matchedRecipient = findMatchingProfile(counterparty, profiles);
    const isProfileMatch = Boolean(matchedRecipient);

    const isFormatValid = cleanUpi.includes('@') || cleanDigits.length === 10 || isProfileMatch || cleanUpi.length >= 3;
    if (!isFormatValid) {
      setFormError(
        language === 'kn'
          ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ UPI ID (ಉದಾ: name@upi) ಅಥವಾ 10-ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.'
          : 'Please enter a valid UPI ID (e.g. name@upi) or 10-digit mobile number.'
      );
      return;
    }

    // Check balance for OUT transfers
    if (direction === 'OUT') {
      if (parsedAmount > computedMetrics.currentBalance) {
        setFormError(
          language === 'kn'
            ? `ಅಪರ್ಯಾಪ್ತ ಬ್ಯಾಲೆನ್ಸ್! ನಿಮ್ಮ ಲಭ್ಯವಿರುವ ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್ ₹${computedMetrics.currentBalance.toLocaleString('en-IN')}. ದಯವಿಟ್ಟು "ಹಣ ಸೇರಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.`
            : `Insufficient balance! Your available wallet balance is ₹${computedMetrics.currentBalance.toLocaleString('en-IN')}. Please click "Add Money" to top up.`
        );
        return;
      }
    }

    const payeeName = matchedRecipient ? matchedRecipient.fullName : counterparty.trim();

    setPendingTransfer({
      direction,
      counterparty: counterparty.trim(),
      amount: parsedAmount,
      category,
      message,
      isCollectRequest: direction === 'IN' ? isCollectRequest : false,
      payeeName
    });

    setPinModalMode('transfer');
    setShowPinModal(true);
  };

  // Handle PIN validation success
  const handlePinSuccess = async () => {
    setShowPinModal(false);

    if (pinModalMode === 'balance') {
      setIsBalanceRevealed(true);
      setShowBalanceModal(true);
      return;
    }

    if (!pendingTransfer) return;

    setIsScanning(true);
    setScanResult(null);

    const result = await submitTransaction(pendingTransfer);
    setIsScanning(false);

    if (result.status === 'VERIFIED') {
      if (!isOnline && result.offlineVoucher) {
        setActiveVoucher(result.offlineVoucher);
        setShowVoucherModal(true);
      } else {
        setSuccessData({
          amount: pendingTransfer.amount,
          payeeName: pendingTransfer.payeeName,
          counterparty: pendingTransfer.counterparty,
          txId: result.txId || `MM-TX-${Date.now().toString().slice(-8)}`,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
          bank: `Safe Wallet • Closed-Loop`
        });
        setShowSuccessModal(true);
      }
      setCounterparty('');
      setAmount('');
      setMessage('');
    } else {
      // Flagged / Held for review
      setScanResult(result);
    }

    setPendingTransfer(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. PhonePe-Style 6-Icon Action Grid (3 in Row 1, 3 in Row 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5 text-center">
          
          {/* 1. Profile / Account (First Icon) */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
            title="Open Profile & Bank Details"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-center group-hover:scale-105 transition shadow-sm font-black text-sm">
              {currentUser?.avatarInitials || <User className="w-5 h-5 text-emerald-400" />}
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.profile || (language === 'kn' ? 'ಪ್ರೊಫೈಲ್' : 'Profile')}
            </span>
          </button>

          {/* 2. Scan Any QR */}
          <button
            type="button"
            onClick={handleActionScanQR}
            className="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.scanQr || 'Scan Any QR'}
            </span>
          </button>

          {/* 3. To Mobile / UPI */}
          <button
            type="button"
            onClick={handleActionToMobile}
            className="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.toMobile}
            </span>
          </button>

          {/* 4. Top-Up Safe Wallet */}
          <button
            type="button"
            onClick={() => setIsTopUpModalOpen(true)}
            className="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {language === 'kn' ? 'ಹಣ ಸೇರಿಸಿ' : 'Add Money'}
            </span>
          </button>

          {/* 5. Check Bank Balance */}
          <button
            type="button"
            onClick={handleActionCheckBalance}
            className="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.checkBalance}
            </span>
          </button>

          {/* 6. Receive Money / QR */}
          <button
            type="button"
            onClick={handleActionReceive}
            className="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.receiveQr}
            </span>
          </button>

        </div>

        {/* Horizontal "Money Matters Contacts" Bar */}
        {otherUsers.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.quickActions.contactsTitle || 'Money Matters Contacts'}</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                {language === 'kn' ? 'ಮುಚ್ಚಿದ-ಲೂಪ್ P2P' : 'Closed-Loop P2P'}
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {otherUsers.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelectContact(contact)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition shrink-0 cursor-pointer ${
                    counterparty.toLowerCase() === contact.upiId.toLowerCase()
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {contact.avatarInitials}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block leading-tight text-white">
                      {contact.fullName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono block leading-tight">
                      {contact.upiId}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {t.scanner.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {t.scanner.subtitle}
            </p>
          </div>

          {/* Direction Pill Selector */}
          <div className="inline-flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setDirection('OUT');
                setIsCollectRequest(false);
                setScanResult(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                direction === 'OUT'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.scanner.outgoingTab}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirection('IN');
                setScanResult(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                direction === 'IN'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.scanner.incomingTab}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Form & Result Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Container */}
        <div id="payment-form-container" className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
          <form onSubmit={handleInitiatePayment} className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.scanner.formTitle}
              </span>
              <span className="text-xs text-slate-400">
                {direction === 'OUT' ? t.scanner.directionOut : t.scanner.directionIn}
              </span>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            {/* UPI ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  {t.scanner.upiLabel}
                </label>
                <button
                  type="button"
                  onClick={handleActionScanQR}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{language === 'kn' ? 'QR ಸ್ಕ್ಯಾನ್' : 'Scan QR'}</span>
                </button>
              </div>
              <input
                id="transfer-upi-input"
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder={t.scanner.upiPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
                required
              />
              {direction === 'OUT' && (
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'kn'
                    ? 'ಮನಿ ಮ್ಯಾಟರ್ಸ್‌ನ ನೋಂದಾಯಿತ ಬಳಕೆದಾರರು ಅಥವಾ ಅಧಿಕೃತ .brk@valid* ಬ್ರೋಕರ್‌ಗಳಿಗೆ ಮಾತ್ರ ಕಳುಹಿಸಬಹುದು.'
                    : 'Closed-loop: Send to registered Money Matters users or official SEBI .brk@valid* handles.'}
                </p>
              )}
            </div>

            {/* Amount & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.scanner.amountLabel}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    id="transfer-amount-input"
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t.scanner.amountPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-2xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.scanner.categoryLabel}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-2xl px-3.5 py-2.5 text-sm text-white outline-none transition"
                >
                  <option value="Transfer">{t.categories.Transfer}</option>
                  <option value="Investment">{t.categories.Investment}</option>
                  <option value="Retail">{t.categories.Retail}</option>
                  <option value="Business">{t.categories.Business}</option>
                  <option value="Utilities">{t.categories.Utilities}</option>
                  <option value="Emergency">{t.categories.Emergency}</option>
                  <option value="Salary">{t.categories.Salary}</option>
                  <option value="Other">{t.categories.Other}</option>
                </select>
              </div>
            </div>

            {/* Paste Received Message / Payment Context (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {language === 'kn' 
                      ? 'ಸ್ವೀಕರಿಸಿದ ಸಂದೇಶ / ಪಾವತಿ ವಿವರ ನಮೂದಿಸಿ (ಐಚ್ಛಿಕ)' 
                      : 'Paste Received Message / Payment Context (Optional)'}
                  </span>
                </label>
                {contextAnalysis.extractedHandles.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="w-2.5 h-2.5" />
                    <span>Handle: {contextAnalysis.extractedHandles[0]}</span>
                  </span>
                )}
              </div>
              <textarea
                id="payment-context-textarea"
                rows="3"
                value={message}
                onChange={handleMessageChange}
                placeholder={
                  language === 'kn'
                    ? 'ವಂಚನೆಯನ್ನು ನೈಜ ಸಮಯದಲ್ಲಿ ಪತ್ತೆಹಚ್ಚಲು WhatsApp ಸ್ಟಾಕ್ ಸಲಹೆ, SMS ಬ್ಯಾಂಕ್ ಎಚ್ಚರಿಕೆ, ನಕಲಿ KYC ಅಥವಾ ಪಾವತಿ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ...'
                    : 'Paste full SMS, WhatsApp tip, fake KYC alert, APK link, or payment request to analyze risk in real-time...'
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition resize-y font-sans leading-relaxed"
              />
            </div>

            {/* Real-Time Context Analysis & Automatic Payment Gate */}
            {message.trim().length > 0 && (
              <>
                {contextAnalysis.isFraud ? (
                  /* Prominent Red Alert Card */
                  <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-left space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-sm">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-rose-300 block">
                            {language === 'kn' ? 'ಗಂಭೀರ ವಂಚನೆಯ ಎಚ್ಚರಿಕೆ' : 'High Fraud Risk Detected'}
                          </span>
                          <span className="text-[11px] text-rose-400 font-mono font-bold">
                            Risk Score: {contextAnalysis.riskScore}/100 • {contextAnalysis.status}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={playVoiceWarning}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                        title={language === 'kn' ? 'ಧ್ವನಿ ಎಚ್ಚರಿಕೆಯನ್ನು ಮತ್ತೆ ಕೇಳಿ' : 'Listen to Voice Warning'}
                      >
                        <Volume2 className="w-3.5 h-3.5 text-rose-300" />
                        <span className="hidden sm:inline">{language === 'kn' ? 'ಧ್ವನಿ ಎಚ್ಚರಿಕೆ' : 'Voice'}</span>
                      </button>
                    </div>

                    {/* Triggered reason flags */}
                    <div className="space-y-1.5 pt-2 border-t border-rose-500/20">
                      <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
                        {language === 'kn' ? 'ಪತ್ತೆಯಾದ ವಂಚನೆ ಅಪಾಯಗಳು:' : 'Triggered Fraud Indicators:'}
                      </span>
                      {contextAnalysis.flags.map((flag, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-rose-200 bg-rose-950/40 p-2 rounded-xl border border-rose-500/20">
                          <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                          <span className="leading-relaxed font-medium">
                            {language === 'kn' && contextAnalysis.flagsKn?.[idx] ? contextAnalysis.flagsKn[idx] : flag}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Gate Action Buttons */}
                    <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSendToGuardianQueue}
                        disabled={isScanning}
                        className="w-full sm:flex-1 py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {language === 'kn' 
                            ? 'ಕುಟುಂಬ ರಕ್ಷಕ ಪರಿಶೀಲನಾ ಸರದಿಗೆ ಕಳುಹಿಸಿ' 
                            : 'Send to Family Guardian Review Queue'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelPayment}
                        className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition cursor-pointer"
                      >
                        {language === 'kn' ? 'ರದ್ದುಗೊಳಿಸಿ' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Green Message Verified Safe Badge */
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold block">
                          {language === 'kn' ? 'ಸಂದೇಶ ಪರಿಶೀಲಿಸಲಾಗಿದೆ: ಸುರಕ್ಷಿತ' : 'Message Verified Safe'}
                        </span>
                        <span className="text-[10px] text-emerald-500/80 block">
                          {language === 'kn' ? 'ಯಾವುದೇ ಅಪಾಯಕಾರಿ ಲಿಂಕ್ ಅಥವಾ ವಂಚನೆಯ ಸೂಚಕಗಳಿಲ್ಲ' : 'No malicious links or harvesting red flags detected'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      Risk: {contextAnalysis.riskScore}/100
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Incoming Mode: Collect Request Checkbox */}
            {direction === 'IN' && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollectRequest}
                    onChange={(e) => setIsCollectRequest(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      {t.scanner.collectCheckbox}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {t.scanner.collectHelp}
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Submit Button (Proceed to Pay) - Blocked when isFraud is true */}
            {!contextAnalysis.isFraud ? (
              <button
                type="submit"
                disabled={isScanning}
                className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{t.scanner.scanning}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 stroke-[2.5]" />
                    <span>{direction === 'OUT' ? (t.scanner.proceedToPay || 'Proceed to Pay') : t.scanner.scanBtn}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-950 border border-rose-500/30 text-center">
                <span className="text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {language === 'kn' 
                      ? 'ನೇರ ಪಾವತಿಯನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ — ರಕ್ಷಕ ಪರಿಶೀಲನಾ ಸರದಿಗೆ ಕಳುಹಿಸಿ' 
                      : 'Direct Payment Blocked — Route to Family Review Queue above'}
                  </span>
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Security Result Card */}
        <div className="lg:col-span-5 flex flex-col">
          {scanResult ? (
            <div className={`h-full rounded-3xl p-5 sm:p-6 border shadow-sm flex flex-col justify-between ${
              scanResult.status === 'HELD_FOR_REVIEW'
                ? 'bg-slate-900 border-amber-500/30'
                : 'bg-slate-900 border-emerald-500/30'
            }`}>
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    {scanResult.status === 'HELD_FOR_REVIEW' ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      {t.scanner.riskCardTitle}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    scanResult.status === 'HELD_FOR_REVIEW'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {t.statuses[scanResult.status]}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{t.scanner.riskScore}</span>
                    <span className={`text-2xl font-bold font-mono ${
                      scanResult.riskScore >= 60
                        ? 'text-rose-400'
                        : scanResult.riskScore >= 30
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {scanResult.riskScore} / 100
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    scanResult.riskLevel === 'HIGH_RISK'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : scanResult.riskLevel === 'SUSPICIOUS'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {t.riskLevels[scanResult.riskLevel]}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    {t.scanner.reasonsTitle}
                  </span>
                  <ul className="space-y-1.5">
                    {(language === 'kn' && scanResult.reasonsKn ? scanResult.reasonsKn : scanResult.reasons).map((r, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800">
                {scanResult.status === 'HELD_FOR_REVIEW' ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-amber-300 leading-relaxed">
                      {t.scanner.heldMsg}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('queue')}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10"
                    >
                      <span>{t.scanner.gotoQueue}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{t.scanner.processedMsg}</span>
                  </p>
                )}
              </div>
            </div>
          ) : message.trim().length > 0 ? (
            /* Live Message Context Telemetry Card on Desktop */
            <div className={`h-full rounded-3xl p-5 sm:p-6 border shadow-sm flex flex-col justify-between animate-fadeIn ${
              contextAnalysis.isFraud 
                ? 'bg-slate-900 border-rose-500/40' 
                : 'bg-slate-900 border-emerald-500/30'
            }`}>
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    {contextAnalysis.isFraud ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      {language === 'kn' ? 'ನೈಜ-ಸಮಯ ಸಂದೇಶ ವಿಶ್ಲೇಷಣೆ' : 'Real-Time Message Analysis'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    contextAnalysis.isFraud
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {contextAnalysis.status}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{t.scanner.riskScore}</span>
                    <span className={`text-2xl font-bold font-mono ${
                      contextAnalysis.riskScore >= 60
                        ? 'text-rose-400'
                        : contextAnalysis.riskScore >= 30
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {contextAnalysis.riskScore} / 100
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    contextAnalysis.isFraud
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {contextAnalysis.isFraud ? 'HIGH RISK' : 'SAFE'}
                  </span>
                </div>

                {contextAnalysis.flags.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">
                      {language === 'kn' ? 'ಪತ್ತೆಯಾದ ಅಂಶಗಳು:' : 'Detected Flags:'}
                    </span>
                    <ul className="space-y-1.5">
                      {contextAnalysis.flags.map((flag, i) => (
                        <li key={i} className="text-xs text-rose-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{language === 'kn' && contextAnalysis.flagsKn?.[i] ? contextAnalysis.flagsKn[i] : flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {language === 'kn' 
                        ? 'ಸಂದೇಶದಲ್ಲಿ ಯಾವುದೇ ವಂಚನೆಯ ಲಿಂಕ್ ಅಥವಾ PIN ಕದಿಯುವ ಸೂಚನೆಗಳಿಲ್ಲ.' 
                        : 'Clean context. No malicious URLs, APK links, or PIN harvesting indicators.'}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 block text-center">
                  {language === 'kn' ? 'ನೈಜ ಸಮಯದಲ್ಲಿ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ' : 'Updating live as you type or paste context'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-3 min-h-[300px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-sm font-bold text-slate-300">
                  {language === 'kn' ? 'ದ್ವಿಮುಖ ಭದ್ರತಾ ವಿಶ್ಲೇಷಣೆ' : 'Two-Way Payment Screen'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {language === 'kn' 
                    ? 'ಹಣ ಕಳುಹಿಸಲು ಅಥವಾ ಸ್ವೀಕರಿಸಲು ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಸ್ಯಾಂಡ್‌ಬಾಕ್ಸ್ PIN ನೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.'
                    : 'Paste any WhatsApp message, SMS tip, or payment request to analyze risk in real time.'}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={handleQRScanSuccess}
          onClaimVoucher={claimOfflineVoucher}
        />
      )}

      {/* MODAL 2: Receive QR Modal */}
      {showReceiveQR && (
        <ReceiveQRModal
          isOpen={showReceiveQR}
          onClose={() => setShowReceiveQR(false)}
        />
      )}

      {/* MODAL 3: Simulated 4-Digit PIN Modal */}
      {showPinModal && (
        <DemoPinModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={handlePinSuccess}
          mode={pinModalMode}
          amount={pendingTransfer?.amount}
          payeeName={pendingTransfer?.payeeName}
          payeeUpi={pendingTransfer?.counterparty}
        />
      )}



      {/* MODAL 5: Signed Offline Payment Voucher QR Modal */}
      {showVoucherModal && (
        <OfflineVoucherModal
          isOpen={showVoucherModal}
          onClose={() => setShowVoucherModal(false)}
          voucher={activeVoucher}
        />
      )}

      {/* MODAL 4: PhonePe Green "Payment Successful" Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-5 animate-scaleUp">
            
            {/* Pulsing Green Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {t.scanner.paymentSuccessful || 'Payment Successful'}
              </h3>
              <p className="text-2xl font-bold text-emerald-400 font-mono">
                ₹{Number(successData.amount).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400">
                {t.scanner.paidSuccessfullyTo || 'Paid successfully to'} <span className="text-white font-semibold">{successData.payeeName}</span>
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t.scanner.debitedFrom || 'Debited from'}:</span>
                <span className="font-semibold text-slate-200">{successData.bank}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">UPI ID:</span>
                <span className="font-mono text-emerald-400 truncate max-w-[170px]">{successData.counterparty}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span className="text-slate-400">{t.scanner.upiTxId || 'UPI Ref ID'}:</span>
                <span className="font-mono text-slate-300 text-[11px]">{successData.txId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'kn' ? 'ಸಮಯ' : 'Time'}:</span>
                <span className="text-slate-400 text-[11px]">{successData.date}</span>
              </div>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              {t.scanner.doneBtn || 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: PhonePe-Style Balance Card Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {language === 'kn' ? 'ಸುರಕ್ಷಿತ ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್' : 'Safe-Wallet Balance Check'}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {currentUser.walletId || currentUser.upiId || 'Personal Safe-Wallet'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBalanceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-400 font-medium block">
                {language === 'kn' ? 'ಲಭ್ಯವಿರುವ ಬ್ಯಾಲೆನ್ಸ್' : 'Available Balance'}
              </span>
              <span className="text-3xl font-extrabold text-white font-mono block">
                ₹{computedMetrics.currentBalance.toLocaleString('en-IN')}.00
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                ✓ 100% Reconciled Double-Entry Ledger
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{language === 'kn' ? 'ಆರಂಭಿಕ ಮೊತ್ತ' : 'Opening Balance'}:</span>
                <span className="font-mono text-slate-200">₹{computedMetrics.startingBalance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-400">{language === 'kn' ? 'ಒಟ್ಟು ಸ್ವೀಕೃತಿ (ಕ್ರೆಡಿಟ್)' : 'Total Received (Credits)'}:</span>
                <span className="font-mono text-emerald-400 font-bold">+ ₹{computedMetrics.totalInflow.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-400">{language === 'kn' ? 'ಒಟ್ಟು ಪಾವತಿ (ಡೆಬಿಟ್)' : 'Total Paid (Debits)'}:</span>
                <span className="font-mono text-rose-400 font-bold">- ₹{computedMetrics.totalOutflow.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBalanceModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              {language === 'kn' ? 'ಮುಚ್ಚಿ' : 'Close'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
