import React from 'react';
import { 
  ShieldCheck, 
  Download, 
  Languages, 
  Clock, 
  BarChart3, 
  ChevronDown
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

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
    setIsProfileModalOpen
  } = useWallet();

  const heldCount = computedMetrics.heldTransactions.length;

  return (
    <>
      {/* Main Header */}
      <header className="bg-slate-900/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left: App Brand Logo + Profile Button */}
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
