import React from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import Navbar from './components/Navbar';
import ScannerSimulator from './components/ScannerSimulator';
import ReviewQueue from './components/ReviewQueue';
import MoneyFlowDashboard from './components/MoneyFlowDashboard';
import { ShieldCheck, Heart, AlertCircle, CheckCircle, Info } from 'lucide-react';

function MainApp() {
  const { activeTab, notification, language, t } = useWallet();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 md:pb-12">
      {/* Navigation Header & Banners */}
      <Navbar />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'scan' && <ScannerSimulator />}
        {activeTab === 'queue' && <ReviewQueue />}
        {activeTab === 'dashboard' && <MoneyFlowDashboard />}
      </main>

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-8 z-50 animate-bounce">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-bold backdrop-blur-xl ${
            notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : notification.type === 'warning'
              ? 'bg-amber-950/90 text-amber-200 border-amber-500/50'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
          }`}>
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : notification.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">Money Matters — HackSprint 3.0</span>
            <span>• Bilingual FinTech Two-Way Fraud Shield</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'kn' 
              ? 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್ ಭಾಷೆಗಳಲ್ಲಿ ಭಾರತೀಯ ಕುಟುಂಬಗಳ ಸುರಕ್ಷತೆಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ'
              : 'Engineered for Indian families, retail shops & retail investors.'}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
}
