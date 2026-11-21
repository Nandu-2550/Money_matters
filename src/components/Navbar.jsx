import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Download, 
  Languages, 
  RotateCcw, 
  ShieldAlert, 
  Clock, 
  BarChart3, 
  Info,
  X,
  CreditCard
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function Navbar() {
  const { 
    language, 
    toggleLanguage, 
    t, 
    isOnline, 
    activeTab, 
    setActiveTab, 
    computedMetrics, 
    promptInstall, 
    isInstalled, 
    resetDemoData 
  } = useWallet();

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const heldCount = computedMetrics.heldTransactions.length;

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
                onClick={resetDemoData}
                title={t.resetDemo}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">{t.resetDemo}</span>
              </button>
              <button 
                onClick={() => setBannerDismissed(true)}
                className="p-1 text-slate-500 hover:text-slate-300 transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Main Navigation Bar */}
      <header className="bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* App Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {t.appName}
                  </h1>
                  <span className="hidden lg:inline-block text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                    {t.securityBadge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  {t.tagline}
                </p>
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
              
              {/* Wallet Balance Card */}
              <div 
                onClick={() => setActiveTab('dashboard')}
                className="cursor-pointer bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 transition"
                title="Wallet Balance"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-slate-400">
                    {t.currentBalanceLabel}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-100">
                    ₹{computedMetrics.currentBalance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Install PWA Button */}
              {!isInstalled && (
                <button
                  onClick={promptInstall}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition"
                  title="Install Progressive Web App"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.installApp}</span>
                </button>
              )}

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition"
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
    </>
  );
}
