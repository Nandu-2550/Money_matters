import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  LogIn, 
  Languages,
  User,
  KeyRound,
  RotateCw,
  Check
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_hw83brg';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_ns3uw2o';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'R1EEOpDBHLYui4x5e';

export default function LoginScreen() {
  const { 
    profiles, 
    loginAsUser, 
    loginWithPassword, 
    registerVerifiedUser,
    sendEmailVerification, 
    verifyEmailOtp,
    activeOtpSession,
    language, 
    toggleLanguage, 
    t,
    showToast
  } = useWallet();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'mpin'
  const [loginStep, setLoginStep] = useState('input'); // 'input' | 'otp'

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [sentDetails, setSentDetails] = useState(null);
  const [loginResendCooldown, setLoginResendCooldown] = useState(0);

  // Register form state (EmailJS 6-Digit OTP Verification)
  const [regStep, setRegStep] = useState('form'); // 'form' | 'otp'
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPin, setRegPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [storedOtp, setStoredOtp] = useState(null);
  const [regInputOtp, setRegInputOtp] = useState('');
  const [regResendCooldown, setRegResendCooldown] = useState(0);

  // Status & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Countdown timer for Login OTP resend
  useEffect(() => {
    if (loginResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setLoginResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loginResendCooldown]);

  // Countdown timer for Register OTP resend
  useEffect(() => {
    if (regResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setRegResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [regResendCooldown]);

  // --------------------------------------------------------------------------
  // LOGIN FLOW (EMAIL OTP OR MPIN)
  // --------------------------------------------------------------------------

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage(
        language === 'kn' 
          ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.' 
          : 'Please enter your Mobile Number or Email.'
      );
      return;
    }

    setIsSubmitting(true);
    const res = await sendEmailVerification(loginIdentifier);
    setIsSubmitting(false);

    if (res.success) {
      setSentDetails(res);
      setLoginStep('otp');
      setInputOtp('');
      setLoginResendCooldown(30);
    } else {
      setErrorMessage(res.error || 'Failed to send OTP. Please check your details or try MPIN login.');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    const cleanOtp = inputOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage(
        language === 'kn' 
          ? 'ದಯವಿಟ್ಟು 6-ಅಂಕಿಯ OTP ಕೋಡ್ ನಮೂದಿಸಿ.' 
          : 'Please enter the complete 6-digit OTP code.'
      );
      return;
    }

    setIsSubmitting(true);
    const res = await verifyEmailOtp(loginIdentifier, cleanOtp);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error);
    }
  };

  // MPIN / Password Login Submit
  const handleMpinSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your Mobile Number, Email, or UPI ID.');
      return;
    }

    if (!loginPassword.trim()) {
      setErrorMessage('Please enter your 4-digit MPIN or password.');
      return;
    }

    setIsSubmitting(true);
    const res = loginWithPassword(loginIdentifier, loginPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error);
    }
  };

  // --------------------------------------------------------------------------
  // REGISTER FLOW: EMAILJS 6-DIGIT OTP & ACTIVATION
  // --------------------------------------------------------------------------

  // Step A: Send 6-Digit OTP via EmailJS
  const handleRegisterSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!regFullName.trim()) {
      setErrorMessage(language === 'kn' ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.' : 'Please enter your Full Name.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage(language === 'kn' ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.' : 'Please enter a valid email address.');
      return;
    }

    const cleanPin = (regPin || '0000').trim() || '0000';
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setErrorMessage(language === 'kn' ? 'PIN 4 ಅಂಕಿಗಳಾಗಿರಬೇಕು (ಉದಾ: 1234 ಅಥವಾ 0000).' : 'PIN must be exactly 4 numeric digits (e.g., 1234 or 0000).');
      return;
    }

    // Generate random 6-digit numeric string
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpData = {
      code,
      email: cleanEmail,
      fullName: regFullName.trim(),
      pin: cleanPin,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
    };

    setIsSubmitting(true);
    try {
      if (emailjs && typeof emailjs.init === 'function') {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: cleanEmail,
          email: cleanEmail,
          user_email: cleanEmail,
          reply_to: cleanEmail,
          to_name: regFullName.trim(),
          name: regFullName.trim(),
          otp_code: code,
          code,
          otp: code
        },
        EMAILJS_PUBLIC_KEY
      );

      setStoredOtp(otpData);
      setRegStep('otp');
      setRegInputOtp('');
      setRegResendCooldown(30);
      showToast(
        language === 'kn'
          ? `6-ಅಂಕಿಯ ಪರಿಶೀಲನಾ OTP ಅನ್ನು ${cleanEmail} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ!`
          : `6-Digit OTP dispatched via EmailJS to ${cleanEmail}!`,
        'success'
      );
    } catch (err) {
      console.error('[MoneyMatters] EmailJS registration OTP send failed:', err);
      // Fail-safe: Keep storedOtp so user can still verify via Demo Helper badge during live presentation
      setStoredOtp(otpData);
      setRegStep('otp');
      setRegInputOtp('');
      setRegResendCooldown(30);
      const msg = err?.text || err?.message || 'Email delivery notice: Use Dev/Demo OTP Helper below to continue.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step A.2: Resend 6-Digit OTP via EmailJS
  const handleRegisterResendOtp = async () => {
    if (regResendCooldown > 0 || !storedOtp) return;
    setErrorMessage('');
    setIsSubmitting(true);

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const updatedOtpData = {
      ...storedOtp,
      code: newCode,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    try {
      if (emailjs && typeof emailjs.init === 'function') {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      }

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: storedOtp.email,
          email: storedOtp.email,
          user_email: storedOtp.email,
          reply_to: storedOtp.email,
          to_name: storedOtp.fullName,
          name: storedOtp.fullName,
          otp_code: newCode,
          code: newCode,
          otp: newCode
        },
        EMAILJS_PUBLIC_KEY
      );

      setStoredOtp(updatedOtpData);
      setRegResendCooldown(30);
      showToast(
        language === 'kn'
          ? `ಹೊಸ 6-ಅಂಕಿಯ ಕೋಡ್ ಅನ್ನು ${storedOtp.email} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ!`
          : `New OTP dispatched to ${storedOtp.email}!`,
        'success'
      );
    } catch (err) {
      console.error('[MoneyMatters] EmailJS resend failed:', err);
      // Keep updated otp data so demo fail-safe helper works
      setStoredOtp(updatedOtpData);
      setRegResendCooldown(30);
      setErrorMessage(err?.text || err?.message || 'Email delivery notice: Use Dev/Demo OTP Helper below.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step B: Verify & Activate Wallet
  const handleRegisterVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!storedOtp) {
      setErrorMessage(language === 'kn' ? 'ಅಧಿವೇಶನ ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Session expired. Please request a new OTP.');
      setRegStep('form');
      return;
    }

    const cleanInput = regInputOtp.trim();
    if (cleanInput.length !== 6) {
      setErrorMessage(language === 'kn' ? 'ದಯವಿಟ್ಟು 6-ಅಂಕಿಯ OTP ಕೋಡ್ ನಮೂದಿಸಿ.' : 'Please enter the 6-digit OTP code.');
      return;
    }

    if (Date.now() > storedOtp.expiresAt) {
      setErrorMessage(language === 'kn' ? 'OTP ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಹೊಸ ಕೋಡ್ ಪಡೆಯಿರಿ.' : 'OTP has expired. Please request a new code.');
      return;
    }

    if (cleanInput !== storedOtp.code) {
      setErrorMessage(language === 'kn' ? 'ತಪ್ಪಾದ OTP ಕೋಡ್! ದಯವಿಟ್ಟು ಸರಿಯಾದ ಕೋಡ್ ನಮೂದಿಸಿ.' : 'Incorrect OTP code! Please enter the code sent to your email.');
      return;
    }

    setIsSubmitting(true);
    const res = await registerVerifiedUser({
      fullName: storedOtp.fullName,
      email: storedOtp.email,
      pin: storedOtp.pin
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to activate wallet.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* Top Header with App Logo & Language Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <img 
            src="/logo.png" 
            alt="Money Matters" 
            className="w-8 h-8 rounded-xl object-cover shadow-sm border border-slate-700/60" 
          />
          <div>
            <span className="font-bold text-sm tracking-tight text-white block leading-none">
              {t.appName}
            </span>
            <span className="text-[10px] text-slate-400 leading-none">
              Two-Way Payment Security
            </span>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          
          {/* Centered Brand Icon */}
          <div className="flex justify-center -mb-1">
            <img 
              src="/logo.png" 
              alt="Money Matters App Logo" 
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-slate-700/80 hover:scale-105 transition"
            />
          </div>
          
          {/* PhonePe-Style Mode Toggle Pill (Sign In vs Register) */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.auth.loginTab}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
                setRegStep('form');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.auth.registerTab}</span>
            </button>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {authMode === 'login' ? t.auth.loginTitle : (language === 'kn' ? 'ಹೊಸ ಸುರಕ್ಷಿತ ವಾಲೆಟ್ ತೆರೆಯಿರಿ' : 'Open Safe-Wallet with Email')}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {authMode === 'login' 
                ? t.auth.loginSubtitle 
                : (language === 'kn' ? '6-ಅಂಕಿಯ ಇಮೇಲ್ OTP ಮೂಲಕ ತ್ವರಿತವಾಗಿ ಸಕ್ರಿಯಗೊಳಿಸಿ' : 'Verify via 6-Digit EmailJS OTP for instant activation')}
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {authMode === 'login' && (
            <>
              {loginStep === 'otp' ? (
                /* STEP 2: ENTER OTP */
                <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <Mail className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      {t.auth.emailSentTitle}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.auth.emailSentDesc.replace('{email}', sentDetails?.email || loginIdentifier)}
                    </p>
                    {sentDetails?.phone && (
                      <span className="inline-block text-[11px] font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full mt-0.5">
                        {t.auth.linkedPhoneNote?.replace('{phone}', sentDetails.phone) || `Linked: ${sentDetails.phone}`}
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                    {/* 6:00 AM Demo Fail-Safe Helper Badge */}
                    {(sentDetails?.otp || activeOtpSession?.otp) && (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Demo OTP Helper: <strong className="text-white tracking-wider">{sentDetails?.otp || activeOtpSession?.otp}</strong></span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setInputOtp(sentDetails?.otp || activeOtpSession?.otp)}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition cursor-pointer"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    )}

                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder={t.auth.otpPlaceholder}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-center text-lg tracking-widest font-mono text-white outline-none transition"
                        autoFocus
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || inputOtp.trim().length !== 6}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/10"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{t.auth.verifyOtpBtn}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginStep('input');
                          setErrorMessage('');
                        }}
                        className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      >
                        ← {t.auth.changeIdentifier}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loginResendCooldown > 0 || isSubmitting}
                        className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:text-slate-500 transition cursor-pointer font-medium"
                      >
                        {loginResendCooldown > 0
                          ? `Resend in ${loginResendCooldown}s`
                          : t.auth.resendOtp}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* STEP 1: LOGIN INPUT (IDENTIFIER + METHOD) */
                <form onSubmit={loginMethod === 'otp' ? handleSendOtp : handleMpinSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {loginMethod === 'otp' ? t.auth.identifierLabel : t.auth.identifierLabel} *
                    </label>
                    <div className="relative">
                      {loginMethod === 'otp' ? (
                        <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      )}
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder={t.auth.identifierPlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  {loginMethod === 'mpin' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-300">
                          {t.auth.passwordLabel} *
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          4-digit PIN
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          maxLength={6}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder={t.auth.passwordPlaceholder}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 outline-none transition font-mono tracking-widest"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/10"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {loginMethod === 'otp' ? (
                          <>
                            <Mail className="w-4 h-4" />
                            <span>{t.auth.sendEmailBtn}</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>{t.auth.signInBtn}</span>
                          </>
                        )}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod(prev => prev === 'otp' ? 'mpin' : 'otp');
                        setErrorMessage('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                    >
                      {loginMethod === 'otp' ? t.auth.passwordLoginToggle : t.auth.sendEmailToggle}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* 2. REGISTER NEW USER FORM (EMAILJS 6-DIGIT OTP VERIFICATION FLOW) */}
          {authMode === 'register' && (
            <>
              {regStep === 'form' ? (
                /* STEP A: USER ENTERS NAME, EMAIL, 4-DIGIT PIN & CLICKS SEND OTP */
                <form onSubmit={handleRegisterSendOtp} className="space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      {t.auth.fullNameLabel} *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder={t.auth.fullNamePlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  {/* 4-Digit Wallet PIN (Default: 0000) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-300">
                        {t.auth.walletPinLabel}
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Default: 0000
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type={showRegPin ? "text" : "password"}
                        maxLength={4}
                        inputMode="numeric"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                        placeholder={t.auth.walletPinPlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 outline-none transition font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPin(!showRegPin)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showRegPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Safe-Wallet Vault Assurance */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-200">
                        {language === 'kn' ? 'ವೈಯಕ್ತಿಕ ಸುರಕ್ಷಿತ ವಾಲೆಟ್ ವಾಲ್ಟ್' : 'Personal Safe-Wallet Vault'}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ₹5,000 Opening Funds
                    </span>
                  </div>

                  {/* Submit: Send 6-Digit OTP */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 shadow-md shadow-emerald-500/10"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>{t.auth.sendOtpBtn}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* STEP B: ENTER 6-DIGIT CODE & VERIFY / ACTIVATE WALLET */
                <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 text-center space-y-4 animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <Mail className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      {language === 'kn' ? 'ಇಮೇಲ್ OTP ಪರಿಶೀಲನೆ' : 'Verify Email Address'}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {language === 'kn'
                        ? `${storedOtp?.email} ಗೆ EmailJS ಮೂಲಕ 6-ಅಂಕಿಯ ಕೋಡ್ ಕಳುಹಿಸಲಾಗಿದೆ.`
                        : `We've sent a 6-digit OTP code to ${storedOtp?.email} via EmailJS.`}
                    </p>
                    <span className="inline-block text-[11px] font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-full mt-0.5">
                      Wallet ID: {storedOtp?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '')}@mmwallet
                    </span>
                  </div>

                  <form onSubmit={handleRegisterVerifyOtp} className="space-y-3 pt-2">
                    {/* 6:00 AM Demo Fail-Safe Helper Badge */}
                    {storedOtp?.code && (
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Demo OTP Helper: <strong className="text-white tracking-wider">{storedOtp.code}</strong></span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setRegInputOtp(storedOtp.code)}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition cursor-pointer"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    )}

                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={regInputOtp}
                        onChange={(e) => setRegInputOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-center text-lg tracking-widest font-mono text-white outline-none transition"
                        autoFocus
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || regInputOtp.trim().length !== 6}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/10"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{t.auth.verifyActivateBtn}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRegStep('form');
                          setErrorMessage('');
                        }}
                        className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      >
                        ← {language === 'kn' ? 'ವಿವರ ಬದಲಾಯಿಸಿ' : 'Edit Details'}
                      </button>

                      <button
                        type="button"
                        onClick={handleRegisterResendOtp}
                        disabled={regResendCooldown > 0 || isSubmitting}
                        className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:text-slate-500 transition cursor-pointer font-medium"
                      >
                        {regResendCooldown > 0
                          ? (language === 'kn' ? `${regResendCooldown}s ನಲ್ಲಿ ಪುನಃ ಕಳುಹಿಸಿ` : `Resend in ${regResendCooldown}s`)
                          : (language === 'kn' ? 'ಕೋಡ್ ಪುನಃ ಕಳುಹಿಸಿ' : 'Resend 6-Digit OTP')}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Footer Notice */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 pb-2 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
        <span>{language === 'kn' ? 'ಎರಡು-ಮಾರ್ಗದ ಮುಚ್ಚಿದ-ಲೂಪ್ NPCI ಸುರಕ್ಷತೆ' : 'Two-Way Closed-Loop Payment Security'}</span>
      </div>

    </div>
  );
}
