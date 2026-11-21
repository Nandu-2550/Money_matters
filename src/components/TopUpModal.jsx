import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Landmark, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function TopUpModal({ isOpen, onClose, onProceedTopUp }) {
  const { currentUser, language } = useWallet();
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const quickChips = [500, 1000, 2000, 5000];

  const handleSubmit = (e) => {
    e?.preventDefault();
    setErrorMsg('');
    const amt = Number(topUpAmount);
    if (!amt || amt <= 0) {
      setErrorMsg(language === 'kn' ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ' : 'Please enter a valid amount');
      return;
    }
    if (amt > 50000) {
      setErrorMsg(language === 'kn' ? 'ಗರಿಷ್ಠ ಟಾಪ್-ಅಪ್ ಮಿತಿ ₹50,000' : 'Maximum wallet load limit is ₹50,000');
      return;
    }
    onProceedTopUp(amt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {language === 'kn' ? 'ವಾಲೆಟ್‌ಗೆ ಹಣ ಸೇರಿಸಿ' : 'Top-Up Safe-Wallet'}
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                {currentUser?.walletId || currentUser?.upiId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source info */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">{language === 'kn' ? 'ಮೂಲ ಖಾತೆ:' : 'Funding Source:'}</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Primary Bank Account</span>
          </span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {language === 'kn' ? 'ಸೇರಿಸಬೇಕಾದ ಮೊತ್ತ (₹)' : 'Top-Up Amount (₹)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-base font-bold">₹</span>
              <input
                type="number"
                min="100"
                max="50000"
                step="50"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl pl-8 pr-3 py-2.5 text-lg font-bold text-white outline-none transition font-mono"
                required
              />
            </div>
          </div>

          {/* Quick chips */}
          <div className="grid grid-cols-4 gap-2">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setTopUpAmount(String(chip))}
                className={`py-1.5 rounded-xl border text-xs font-bold transition ${
                  Number(topUpAmount) === chip
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                +₹{chip}
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <span>{language === 'kn' ? 'PIN ಮೂಲಕ ದೃಢೀಕರಿಸಿ' : 'Authorize via Wallet PIN'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
