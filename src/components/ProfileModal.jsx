import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Landmark, 
  CreditCard, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Shield
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function ProfileModal() {
  const { 
    currentUser, 
    profiles, 
    loginAsUser, 
    logout, 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    computedMetrics, 
    language, 
    t 
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  if (!isProfileModalOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(currentUser.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const otherProfiles = profiles.filter(p => p.id !== currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          title={t.profile.close}
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
            {currentUser.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentUser.fullName}
              </h3>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>{t.auth.verifiedUserBadge}</span>
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {currentUser.email}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {currentUser.phone}
            </div>
          </div>
        </div>

        {/* Primary UPI ID with 1-Click Copy */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t.profile.upiIdLabel}
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-bold text-slate-200">
              {currentUser.upiId}
            </span>
            <button
              onClick={handleCopyUpi}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{t.profile.copiedUpi}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.profile.copyUpi}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Linked Bank Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                <Landmark className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {currentUser.bankName}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Account •••• {currentUser.accountLast4}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-medium">
              Primary
            </span>
          </div>

          {/* Check Bank Balance Button & Simulated Inquiry */}
          <div className="pt-2 border-t border-slate-900">
            {showBalance ? (
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Available Account Balance</span>
                  <button 
                    onClick={() => setShowBalance(false)}
                    className="text-slate-500 hover:text-slate-300"
                    title="Hide Balance"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-lg font-bold text-emerald-400">
                  ₹{computedMetrics.currentBalance.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {t.profile.simulatedPinNotice}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBalance(true)}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.profile.checkBalanceBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Switch Account Section */}
        {otherProfiles.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block">
              {t.auth.switchUser}
            </span>
            <div className="space-y-2">
              {otherProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    loginAsUser(p.id);
                    setIsProfileModalOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-left transition flex items-center justify-between border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 font-bold text-xs text-white flex items-center justify-center">
                      {p.avatarInitials}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{p.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.upiId}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setIsProfileModalOpen(false);
              logout();
            }}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.auth.logout}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
