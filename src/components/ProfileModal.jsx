import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  QrCode,
  KeyRound,
  Mail,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import ReceiveQRModal from './ReceiveQRModal';

export default function ProfileModal() {
  const { 
    currentUser, 
    logout, 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    language, 
    t,
    sendEmailVerification,
    verifyEmailOtp,
    updatePaymentPin,
    activeOtpSession
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // PIN Reset / Change State: 'idle' | 'email_code' | 'set_pin' | 'success'
  const [pinStep, setPinStep] = useState('idle');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sentDetails, setSentDetails] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isProfileModalOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(currentUser.walletId || currentUser.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartPinChange = async () => {
    setPinStep('email_code');
    setPinError('');
    setEnteredOtp('');
    setNewPin('');
    setConfirmPin('');
    setOtpSent(false);
    setSentDetails(null);

    // Auto-send verification email
    setIsSendingOtp(true);
    const res = await sendEmailVerification(currentUser.email);
    setIsSendingOtp(false);
    if (res.success) {
      setOtpSent(true);
      setSentDetails(res);
    } else {
      setPinError(res.error || 'Failed to send verification email. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    setPinError('');
    setIsSendingOtp(true);
    const res = await sendEmailVerification(currentUser.email);
    setIsSendingOtp(false);
    if (res.success) {
      setOtpSent(true);
      setSentDetails(res);
    } else {
      setPinError(res.error || 'Failed to resend code');
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setPinError('');
    const cleanOtp = enteredOtp.trim();
    if (cleanOtp.length < 4) {
      setPinError(language === 'kn' ? 'ದಯವಿಟ್ಟು 6-ಅಂಕಿಯ ಪರಿಶೀಲನಾ ಕೋಡ್ ನಮೂದಿಸಿ' : 'Please enter the 6-digit verification code');
      return;
    }

    setIsVerifyingOtp(true);
    const res = await verifyEmailOtp(currentUser.email, cleanOtp);
    setIsVerifyingOtp(false);

    if (res.success) {
      setPinStep('set_pin');
      setPinError('');
    } else {
      setPinError(res.error || (language === 'kn' ? 'ತಪ್ಪಾದ ಕೋಡ್. ದಯವಿಟ್ಟು ಸರಿಯಾದ ಕೋಡ್ ನಮೂದಿಸಿ.' : 'Invalid verification code. Please check your email.'));
    }
  };

  const handleSaveNewPin = async (e) => {
    e?.preventDefault();
    setPinError('');
    const cleanNew = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (cleanNew.length !== 4 || !/^\d{4}$/.test(cleanNew)) {
      setPinError(language === 'kn' ? 'PIN ಕರಾರುವಕ್ಕಾಗಿ 4 ಅಂಕಿಗಳಾಗಿರಬೇಕು.' : 'PIN must be exactly 4 numeric digits.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPinError(language === 'kn' ? 'PIN ಗಳು ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.' : 'PINs do not match. Please re-enter.');
      return;
    }

    setIsSavingPin(true);
    const res = await updatePaymentPin(currentUser.id, cleanNew);
    setIsSavingPin(false);

    if (res.success) {
      setPinStep('success');
      setNewPin('');
      setConfirmPin('');
      setEnteredOtp('');
    } else {
      setPinError(res.error || 'Failed to update PIN');
    }
  };

  const handleClosePinFlow = () => {
    setPinStep('idle');
    setPinError('');
    setEnteredOtp('');
    setNewPin('');
    setConfirmPin('');
    setSentDetails(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={() => {
            handleClosePinFlow();
            setIsProfileModalOpen(false);
          }}
          className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          title={t.profile.close}
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
            {currentUser.avatarInitials}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight truncate">
                {currentUser.fullName}
              </h3>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1 shrink-0">
                <UserCheck className="w-3 h-3" />
                <span>{t.auth.verifiedUserBadge}</span>
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">
              {currentUser.email}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {currentUser.phone}
            </div>
          </div>
        </div>

        {/* Primary Safe-Wallet ID with 1-Click Copy & QR View */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {language === 'kn' ? 'ಸುರಕ್ಷಿತ ವಾಲೆಟ್ ID' : 'Safe-Wallet ID'}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{language === 'kn' ? 'ಸಕ್ರಿಯ ವಾಲೆಟ್' : 'Active Safe Wallet'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-bold text-slate-200 truncate">
              {currentUser.walletId || currentUser.upiId}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium transition cursor-pointer"
                title="View My QR"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR</span>
              </button>

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
        </div>

        {/* Safe-Wallet Payment PIN Management Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {t.profile.securityPinTitle}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {language === 'kn' ? 'ಪಾವತಿ & ಬ್ಯಾಲೆನ್ಸ್ ಪರಿಶೀಲನೆಗೆ ಅಗತ್ಯ' : 'Used for payments & balance checks'}
                </span>
              </div>
            </div>

            {pinStep === 'idle' && (
              <span className="font-mono text-sm tracking-widest text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-bold">
                ••••
              </span>
            )}
          </div>

          {/* STEP: IDLE VIEW */}
          {pinStep === 'idle' && (
            <div className="pt-2 border-t border-slate-900">
              <button
                type="button"
                onClick={handleStartPinChange}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.profile.changePinBtn}</span>
              </button>
            </div>
          )}

          {/* STEP: EMAIL VERIFICATION CODE ENTRY */}
          {pinStep === 'email_code' && (
            <div className="pt-2 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
              {sentDetails?.liveEmailSent ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0 animate-pulse" />
                  <div>
                    <span className="font-bold block">
                      {language === 'kn' ? 'ಲೈವ್ ಇಮೇಲ್ ಕೋಡ್ ಕಳುಹಿಸಲಾಗಿದೆ' : 'Live Verification Email Dispatched'}
                    </span>
                    <span className="text-[11px] text-slate-300 leading-tight">
                      {language === 'kn' 
                        ? `${currentUser.email} ಗೆ 6-ಅಂಕಿಯ ಕೋಡ್ ಕಳುಹಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಇನ್‌ಬಾಕ್ಸ್ ಅಥವಾ ಸ್ಪ್ಯಾಮ್ ಪರಿಶೀಲಿಸಿ.`
                        : `A 6-digit code has been sent via SMTP to ${currentUser.email}. Check your inbox or spam.`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {language === 'kn' ? 'ಇಮೇಲ್ ಪರಿಶೀಲನೆ' : 'Email Verification'}
                      </span>
                      <span className="text-[11px] text-slate-300 leading-tight">
                        {language === 'kn' 
                          ? `${currentUser.email} ಗೆ ಪರಿಶೀಲನಾ ಕೋಡ್ ರಚಿಸಲಾಗಿದೆ.`
                          : `Verification code generated for ${currentUser.email}.`}
                      </span>
                    </div>
                  </div>

                  {/* Fallback OTP Auto-Fill when SMTP returns 500 error */}
                  {(sentDetails?.otp || activeOtpSession?.otp) && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between text-left gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                          {language === 'kn' ? 'ಪರಿಶೀಲನಾ ಕೋಡ್' : 'Verification Code'}
                        </span>
                        <span className="text-base font-bold font-mono tracking-widest text-emerald-400">
                          {sentDetails?.otp || activeOtpSession?.otp}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnteredOtp(sentDetails?.otp || activeOtpSession?.otp || '')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500 hover:text-slate-950 transition cursor-pointer shrink-0"
                      >
                        {language === 'kn' ? 'ಕೋಡ್ ಭರ್ತಿ ಮಾಡಿ' : 'Auto-Fill Code'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {language === 'kn' ? '6-ಅಂಕಿಯ ಇಮೇಲ್ OTP ನಮೂದಿಸಿ' : 'Enter 6-Digit Email OTP'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-center text-base tracking-widest font-mono text-white outline-none transition"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || enteredOtp.length < 4}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.profile.verifyingCode}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.profile.verifyCodeBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClosePinFlow}
                    className="py-2 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    {language === 'kn' ? 'ರದ್ದು' : 'Cancel'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSendingOtp}
                    className="text-indigo-400 hover:text-indigo-300 transition underline underline-offset-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingOtp 
                      ? (language === 'kn' ? 'ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...' : 'Sending...') 
                      : (language === 'kn' ? 'ಕೋಡ್ ಪುನಃ ಕಳುಹಿಸಿ' : 'Resend Code')}
                  </button>
                  <span className="text-slate-500">
                    {language === 'kn' ? 'ಸ್ಪ್ಯಾಮ್ ಫೋಲ್ಡರ್ ಪರಿಶೀಲಿಸಿ' : 'Check Spam if delayed'}
                  </span>
                </div>
              </form>
            </div>
          )}

          {/* STEP: ENTER NEW 4-DIGIT PIN */}
          {pinStep === 'set_pin' && (
            <div className="pt-2 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'kn' ? 'ಇಮೇಲ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ! ಹೊಸ PIN ಹೊಂದಿಸಿ.' : 'Email verified! Please enter your new 4-digit PIN.'}
                </span>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <form onSubmit={handleSaveNewPin} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {t.profile.newPinLabel}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-center text-sm tracking-widest font-mono text-white outline-none transition"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {t.profile.confirmPinLabel}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-center text-sm tracking-widest font-mono text-white outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSavingPin || newPin.length !== 4 || confirmPin.length !== 4}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    {isSavingPin ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'kn' ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.profile.savePinBtn}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClosePinFlow}
                    className="py-2.5 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    {language === 'kn' ? 'ರದ್ದು' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP: SUCCESS NOTIFICATION */}
          {pinStep === 'success' && (
            <div className="pt-2 border-t border-slate-800 space-y-3 text-center animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm text-white">
                  {t.profile.pinUpdatedSuccess}
                </div>
                <div className="text-[11px] text-emerald-400/90 leading-tight">
                  {language === 'kn' 
                    ? 'ನಿಮ್ಮ ಹೊಸ PIN ಪಾವತಿಗಳು ಮತ್ತು ಬ್ಯಾಲೆನ್ಸ್ ಪರಿಶೀಲನೆಗೆ ತಕ್ಷಣವೇ ಸಕ್ರಿಯವಾಗಿದೆ.' 
                    : 'Your new PIN is now active for all payments and balance checks.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePinFlow}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              >
                {language === 'kn' ? 'ಮುಗಿದಿದೆ' : 'Done'}
              </button>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsProfileModalOpen(false);
              logout();
            }}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.auth.logout}</span>
          </button>
        </div>

      </div>

      {/* Embedded Personal QR Modal */}
      <ReceiveQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

    </div>
  );
}
