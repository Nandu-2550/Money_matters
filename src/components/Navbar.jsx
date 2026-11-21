import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Languages, 
  RotateCcw, 
  Clock, 
  BarChart3, 
  X,
  CreditCard,
  User,
  ChevronDown,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import DemoPinModal from './DemoPinModal';

export default function Navbar() {
  const { 
    currentUser, 
    language, 
    toggleLanguage, 
    t, 
    activeTab, 
    setActiveTab, 
    computedMetrics, 
    promptInstall, 
    isInstalled, 
    resetDemoData, 
    setIsProfileModalOpen,
    isOnline,
    offlineOutboxCount,
    syncOfflineOutbox,
    setIsTopUpModalOpen,
    isBalanceRevealed,
    setIsBalanceRevealed
  } = useWallet();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const heldCount = computedMetrics.heldTransactions.length;

  const handleManualSync = async (e) => {
    e.stopPropagation();
    if (!isOnline) return;
    setIsSyncing(true);
    await syncOfflineOutbox();
    setIsSyncing(false);
  };

  const handleBalanceClick = () => {
    if (isBalanceRevealed) {
      setIsBalanceRevealed(false);
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setIsBalanceRevealed(true);
    setTimeout(() => {
      setIsBalanceRevealed(false);
    }, 15000);
  };

  return (
    <>
      {/* 1. Subtle, Clean Security Advisory Notice (Non-intrusive) */}
      {!bannerDismissed && (
        <aside 
          aria-label="Security Notice"
          className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs py-2 px-3 sm:px-6 sticky top-0 z-50 transition-all"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-normal text-[11px] sm:text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-slate-400 font-semibold">
                {language === 'kn' ? 'ಸುರಕ್ಷತಾ ಮಾಹಿತಿ:' : 'Notice:'}
              </span>
              <span className="text-slate-300">
                {t.demoBanner}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => resetDemoData?.()}
                title={t.resetDemo}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">{t.resetDemo}</span>
              </button>
              <button 
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="p-1 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Main PhonePe-Style Header */}
      <header className="bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left: App Brand Logo + PhonePe-Style Profile Button + Status Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Brand Logo */}
              <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
                <img 
                  src="/logo.png" 
                  alt="Money Matters Logo" 
                  className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-700/60 hover:scale-105 transition" 
                />
                <div className="hidden lg:block leading-tight">
                  <span className="text-xs font-bold text-white block">Money Matters</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block">Safe Wallet</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2.5 p-1 pr-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 transition text-left cursor-pointer group"
                title="Open Profile & Bank Details"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                  {currentUser?.avatarInitials || 'U'}
                </div>
                <div className="hidden min-[440px]:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white leading-tight">
                      {currentUser?.fullName}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition" />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono leading-none">
                    {currentUser?.walletId || currentUser?.upiId}
                  </span>
                </div>
              </button>

              {/* Online / Offline Sync Status Badge */}
              <div className="flex items-center gap-1.5">
                <div 
                  className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-semibold border ${
                    isOnline 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                  title={isOnline ? 'Connected to cloud' : 'Operating offline with signed vouchers'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="hidden sm:inline">
                    {isOnline ? (language === 'kn' ? 'ಆನ್‌ಲೈನ್' : 'Online') : (language === 'kn' ? 'ಆಫ್‌ಲೈನ್' : 'Offline')}
                  </span>
                </div>

                {/* Pending Offline Sync Badge */}
                {offlineOutboxCount > 0 && (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={!isOnline || isSyncing}
                    className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border transition ${
                      isOnline
                        ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 cursor-pointer'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                    title={isOnline ? 'Click to sync pending transactions now' : 'Will sync automatically when back online'}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                    <span>
                      {offlineOutboxCount} {language === 'kn' ? 'ಬಾಕಿ' : 'Queued'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'scan'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.tabs.scan}</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'queue'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t.tabs.queue}</span>
                {heldCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {heldCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{t.tabs.dashboard}</span>
              </button>
            </nav>

            {/* Right Utility Actions */}
            <div className="flex items-center gap-2">
              
              {/* Standalone Safe-Wallet Balance Card (Masked by Default) + Quick Add Money */}
              <div className="flex items-center gap-1">
                <div 
                  onClick={handleBalanceClick}
                  className="cursor-pointer bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center gap-2 transition group"
                  title={isBalanceRevealed ? "Click to mask balance" : "Click to check balance with PIN"}
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                    {isBalanceRevealed ? <CreditCard className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <span>{t.currentBalanceLabel}</span>
                      {isBalanceRevealed ? (
                        <EyeOff className="w-2.5 h-2.5 text-slate-500 group-hover:text-slate-300" />
                      ) : (
                        <Eye className="w-2.5 h-2.5 text-slate-500 group-hover:text-slate-300" />
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-100 font-mono">
                      {isBalanceRevealed ? (
                        `₹${computedMetrics.currentBalance.toLocaleString('en-IN')}`
                      ) : (
                        <span className="text-slate-400 tracking-wider text-xs font-semibold">
                          ₹ • • • •
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Add Money Button */}
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Top-Up Safe Wallet from Bank"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">
                    {language === 'kn' ? 'ಹಣ ಸೇರಿಸಿ' : 'Top-Up'}
                  </span>
                </button>
              </div>

              {/* Install PWA Button */}
              {!isInstalled && (
                <button
                  type="button"
                  onClick={() => promptInstall?.()}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition cursor-pointer"
                  title="Install Progressive Web App"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.installApp}</span>
                </button>
              )}

              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => toggleLanguage?.()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition cursor-pointer"
                title="Switch Language / ಭಾಷೆ ಬದಲಿಸಿ"
              >
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Mobile Bottom Navigation Bar (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl px-4 py-2 pb-safe">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition ${
              activeTab === 'scan' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px]">{t.tabs.scan}</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition ${
              activeTab === 'queue' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">{t.tabs.queue}</span>
            {heldCount > 0 && (
              <span className="absolute -top-0.5 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                {heldCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px]">{t.tabs.dashboard}</span>
          </button>
        </div>
      </div>

      {/* Demo PIN Modal for Secure Balance Inquiry */}
      {showPinModal && (
        <DemoPinModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={handlePinSuccess}
          mode="balance"
        />
      )}
    </>
  );
}
