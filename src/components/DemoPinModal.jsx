import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  Delete, 
  Check, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  Landmark, 
  ArrowRight 
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function DemoPinModal({
  isOpen,
  onClose,
  onSuccess,
  mode = 'transfer', // 'transfer' | 'balance'
  amount = null,
  payeeName = '',
  payeeUpi = ''
}) {
  const { currentUser, language, t, setIsProfileModalOpen } = useWallet();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Expected PIN is user's sandbox demo_pin, default fallback '1234'
  const expectedPin = String(
    currentUser?.demoPin || 
    currentUser?.demo_pin || 
    currentUser?.password || 
    (currentUser?.id === 'usr_anjaneya' ? '5678' : '1234')
  ).trim();

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsShaking(false);
    }
  }, [isOpen]);

  // Handle digit press
  const handleDigit = useCallback((digit) => {
    setErrorMsg('');
    setPin(prev => {
      if (prev.length < 4) {
        return prev + digit;
      }
      return prev;
    });
  }, []);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setErrorMsg('');
    setPin(prev => prev.slice(0, -1));
  }, []);

  // Validate PIN
  const handleValidate = useCallback(() => {
    if (pin.length !== 4) {
      setErrorMsg(language === 'kn' ? 'ದಯವಿಟ್ಟು 4-ಅಂಕಿಯ PIN ನಮೂದಿಸಿ' : 'Please enter 4-digit PIN');
      return;
    }

    if (pin === expectedPin) {
      onSuccess();
      setPin('');
      setErrorMsg('');
    } else {
      setIsShaking(true);
      setErrorMsg(
        language === 'kn' 
          ? 'ತಪ್ಪಾದ UPI PIN! ದಯವಿಟ್ಟು ನಿಮ್ಮ 4-ಅಂಕಿಯ PIN ಸರಿಯಾಗಿ ನಮೂದಿಸಿ.'
          : 'Incorrect UPI PIN! Please enter your valid 4-digit PIN.'
      );
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 700);
    }
  }, [pin, expectedPin, onSuccess, language]);

  // Keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleValidate();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleDigit, handleBackspace, handleValidate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 transition-transform duration-200 ${
          isShaking ? 'translate-x-[-8px] animate-shake' : ''
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {language === 'kn' ? 'NPCI / UPI PIN' : 'NPCI / UPI PIN'}
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                {language === 'kn' ? 'NPCI ಸುರಕ್ಷಿತ UPI PIN ದೃಢೀಕರಣ' : 'NPCI Certified 256-Bit Security'}
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

        {/* Transfer or Balance Context Card */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {language === 'kn' ? 'ಸುರಕ್ಷಿತ ವಾಲೆಟ್:' : 'Safe Wallet:'}
            </span>
            <span className="font-semibold text-slate-200 flex items-center gap-1 truncate max-w-[210px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{currentUser.walletId || currentUser.upiId || 'Personal Safe-Wallet'}</span>
            </span>
          </div>

          {mode === 'transfer' && amount && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">
                {language === 'kn' ? 'ಪಾವತಿಸುವ ಮೊತ್ತ:' : 'Sending to:'}
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                ₹{Number(amount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {mode === 'transfer' && (payeeName || payeeUpi) && (
            <div className="text-[11px] text-slate-400 text-right truncate">
              {payeeName ? `${payeeName} (${payeeUpi})` : payeeUpi}
            </div>
          )}

          {mode === 'balance' && (
            <div className="text-[11px] text-amber-400/90 pt-1 border-t border-slate-800/60 text-center font-medium">
              {language === 'kn' ? 'ಬ್ಯಾಲೆನ್ಸ್ ನೋಡಲು PIN ನಮೂದಿಸಿ' : 'Authorizing live balance inquiry'}
            </div>
          )}
        </div>

        {/* UPI Security Badge */}
        <div className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {language === 'kn' 
              ? 'NPCI ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾದ ಸುರಕ್ಷಿತ ಪಾವತಿ ಗೇಟ್‌ವೇ'
              : 'NPCI Encrypted Safe Wallet Verification'}
          </span>
        </div>

        {/* 4 Masked PIN Indicator Dots */}
        <div className="flex justify-center items-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                  isFilled
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/30'
                    : 'border-slate-600 bg-slate-950'
                }`}
              >
                {isFilled && <span className="block w-1.5 h-1.5 rounded-full bg-slate-950" />}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="text-center text-xs text-rose-400 font-medium flex items-center justify-center gap-1.5 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* On-Screen Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(String(digit))}
              className="py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-lg font-bold text-white transition active:scale-95 shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition active:scale-95"
            title="Backspace"
          >
            <Delete className="w-5 h-5 text-slate-400" />
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-lg font-bold text-white transition active:scale-95 shadow-sm"
          >
            0
          </button>

          {/* Submit */}
          <button
            type="button"
            onClick={handleValidate}
            disabled={pin.length !== 4}
            className={`py-3 rounded-2xl border flex items-center justify-center transition active:scale-95 ${
              pin.length === 4
                ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Authorize"
          >
            <Check className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Forgot PIN Link to Email-Verified Profile Reset */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              setIsProfileModalOpen(true);
            }}
            className="text-[11px] text-slate-400 hover:text-emerald-400 transition underline underline-offset-2 cursor-pointer font-medium"
          >
            {language === 'kn' ? 'PIN ಮರೆತಿರುವಿರಾ? ಇಮೇಲ್ ಪರಿಶೀಲನೆ ಮೂಲಕ ಮರುಹೊಂದಿಸಿ' : 'Forgot PIN? Reset via Email in Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
