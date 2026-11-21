import React from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import Navbar from './components/Navbar';
import ScannerSimulator from './components/ScannerSimulator';
import ReviewQueue from './components/ReviewQueue';
import MoneyFlowDashboard from './components/MoneyFlowDashboard';
import LoginScreen from './components/LoginScreen';
import ProfileModal from './components/ProfileModal';
import TopUpModal from './components/TopUpModal';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

function MainApp() {
  const { 
    activeTab, 
    notification, 
    language, 
    isAuthenticated,
    isTopUpModalOpen,
    setIsTopUpModalOpen,
    topUpWallet
  } = useWallet();

  // If user is not yet verified or logged in, show PhonePe login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 md:pb-8 selection:bg-slate-700">
      {/* Top Navbar */}
      <Navbar />

      {/* Profile & Linked Bank Drawer Modal */}
      <ProfileModal />

      {/* Global Top-Up Safe-Wallet Modal */}
      {isTopUpModalOpen && (
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          onConfirm={topUpWallet}
          onProceedTopUp={topUpWallet}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'scan' && <ScannerSimulator />}
        {activeTab === 'queue' && <ReviewQueue />}
        {activeTab === 'dashboard' && <MoneyFlowDashboard />}
      </main>

      {/* Clean Toast Notification */}
      {notification && (
        <div className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium bg-slate-900 border-slate-700 text-slate-200">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : notification.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 py-6 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-slate-400">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-5 h-5 rounded-md object-cover border border-slate-700/60" 
            />
            <span className="font-semibold text-slate-300">Money Matters</span>
            <span>• Two-Way Payment Security</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'kn' 
              ? 'ಭಾರತೀಯ ಗ್ರಾಹಕರು, ಕುಟುಂಬಗಳು ಮತ್ತು ವ್ಯಾಪಾರಿಗಳ ಸುರಕ್ಷತೆಗಾಗಿ'
              : 'Designed for Indian retail users, families & small merchants'}
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
