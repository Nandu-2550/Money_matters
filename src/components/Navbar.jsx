import React from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Download, 
  Languages, 
  RotateCcw, 
  Radar, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Wallet
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

  const heldCount = computedMetrics.heldTransactions.length;

  return (
    <>
      {/* 1. Mandatory Persistent Demo Safety Banner */}
      <aside 
        aria-label="Simulation Safety Notice"
        className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/30 text-amber-300 text-xs py-2 px-3 sm:px-6 sticky top-0 z-50 backdrop-blur-md shadow-sm"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong className="text-amber-200">
                {language === 'kn' ? 'ಡೆಮೊ ಸಿಮ್ಯುಲೇಶನ್ ಮೋಡ್:' : 'Demo Simulation Mode:'}
              </strong>{' '}
              {t.demoBanner}
            </span>
          </div>
          <button
            onClick={resetDemoData}
            title={t.resetDemo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-[11px] font-semibold transition shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">{t.resetDemo}</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Top Application Header */}
      <header className="bg-slate-900/95 border-b border-slate-800/80 sticky top-[37px] z-40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    {t.appName}
                  </h1>
                  <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {t.hackathonBadge}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block line-clamp-1">
                  {t.tagline}
                </p>
              </div>
            </div>

            {/* Desktop Center Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'scan'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Radar className="w-4 h-4" />
                <span>{t.tabs.scan}</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'queue'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t.tabs.queue}</span>
                {heldCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                    {heldCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>{t.tabs.dashboard}</span>
              </button>
            </nav>

            {/* Right Side: Balance Badge, Online Indicator, PWA Install & Language Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Live Current Balance Badge */}
              <div 
                onClick={() => setActiveTab('dashboard')}
                className="cursor-pointer bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2 transition group shadow-inner"
                title="Current Reconciled Balance"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {t.currentBalanceLabel}
                  </div>
                  <div className="text-xs sm:text-base font-black text-emerald-400">
                    ₹{computedMetrics.currentBalance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Online / Offline Sync Indicator */}
              <div 
                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isOnline 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {isOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <Wifi className="w-3.5 h-3.5" />
                    <span>{t.cloudOnline}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>{t.offlineCache}</span>
                  </>
                )}
              </div>

              {/* PWA Install Button */}
              {!isInstalled && (
                <button
                  onClick={promptInstall}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 text-xs font-bold transition shadow-sm"
                  title="Install Progressive Web App"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{t.installApp}</span>
                </button>
              )}

              {/* 1-Click EN / ಕನ್ನಡ Bilingual Toggle Button */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold transition shadow-sm"
                title="Switch Language / ಭಾಷೆ ಬದಲಿಸಿ"
              >
                <Languages className="w-4 h-4 text-emerald-400" />
                <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Mobile-First Bottom Navigation Bar (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-4 py-2 pb-safe">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'scan' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Radar className="w-5 h-5" />
            <span className="text-[11px]">{t.tabs.scan}</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'queue' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px]">{t.tabs.queue}</span>
            {heldCount > 0 && (
              <span className="absolute top-1 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white animate-pulse">
                {heldCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[11px]">{t.tabs.dashboard}</span>
          </button>
        </div>
      </div>
    </>
  );
}
