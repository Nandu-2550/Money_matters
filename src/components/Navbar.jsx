import React from 'react';
import { 
  ShieldCheck, 
  Download, 
  Languages, 
  Clock, 
  BarChart3,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function Navbar() {
  const { 
    language, 
    toggleLanguage, 
    t, 
    activeTab, 
    setActiveTab, 
    computedMetrics, 
    promptInstall, 
    isInstalled,
    isOnline,
    isSimulatedOffline,
    toggleSimulateOffline,
    offlineOutboxCount,
    isSyncing,
    syncOfflineOutbox
  } = useWallet();

  const heldCount = computedMetrics.heldTransactions.length;

  return (
    <>
      {/* Main Header */}
      <header className="bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left: App Brand Logo Only */}
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="Money Matters Logo" 
                className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-700/60 hover:scale-105 transition" 
              />
              <div className="leading-tight">
                <span className="text-sm font-bold text-white block tracking-tight">Money Matters</span>
                <span className="text-[10px] text-emerald-400 font-semibold block">Safe Wallet</span>
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
              {/* Online / Offline Status & Sync Count Pill */}
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-medium"
                title={isOnline ? (language === 'kn' ? 'ಆನ್‌ಲೈನ್ - ಕ್ಲೌಡ್ ಸಿಂಕ್ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Online - Cloud Sync Active') : (language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಮೋಡ್ - ಸುರಕ್ಷಿತ ವೋಚರ್ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Offline Mode - Signed Voucher Active')}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className={isOnline ? 'text-emerald-400 font-semibold text-[11px]' : 'text-amber-400 font-semibold text-[11px]'}>
                  {isOnline ? (language === 'kn' ? 'ಆನ್‌ಲೈನ್' : 'Online') : (language === 'kn' ? 'ಆಫ್‌ಲೈನ್' : 'Offline')}
                </span>
                {offlineOutboxCount > 0 && (
                  <button
                    type="button"
                    onClick={() => !isSyncing && syncOfflineOutbox?.()}
                    disabled={isSyncing}
                    className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer flex items-center gap-1 disabled:opacity-60"
                    title={isOnline ? 'Click to sync pending outbox to Supabase' : 'Offline payments queued in outbox'}
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>{isSyncing ? (language === 'kn' ? 'ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...' : 'Syncing...') : `Sync (${offlineOutboxCount})`}</span>
                  </button>
                )}
              </div>

              {/* Presenter Offline Simulator Toggle (For 6:00 AM Live Demo) */}
              <button
                type="button"
                onClick={toggleSimulateOffline}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isSimulatedOffline
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={isSimulatedOffline ? 'Click to restore online mode' : 'Click to simulate offline mode without turning off Wi-Fi'}
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSimulatedOffline ? (language === 'kn' ? 'ಆಫ್‌ಲೈನ್: ಆನ್' : 'Offline: ON') : (language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಪರೀಕ್ಷೆ' : 'Test Offline')}</span>
              </button>

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
    </>
  );
}
