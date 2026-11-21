import React, { useState } from 'react';
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
  Landmark, 
  Languages,
  User,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function LoginScreen() {
  const { 
    profiles, 
    loginAsUser, 
    loginWithPassword, 
    registerUser, 
    sendEmailVerification, 
    language, 
    toggleLanguage, 
    t 
  } = useWallet();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [useEmailOtp, setUseEmailOtp] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('nandunusgavai@gmail.com');
  const [loginPassword, setLoginPassword] = useState('1234');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUpiId, setRegUpiId] = useState('');
  const [regBankName, setRegBankName] = useState('HDFC Bank');
  const [regAccountLast4, setRegAccountLast4] = useState('');
  const [regPassword, setRegPassword] = useState('1234');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Auto-generate suggested UPI ID when full name or email changes in register mode
  const handleNameChange = (name) => {
    setRegFullName(name);
    if (!regUpiId || regUpiId.includes('@')) {
      const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean) setRegUpiId(`${clean}@okaxis`);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your Email or UPI ID.');
      return;
    }

    if (useEmailOtp) {
      setIsSubmitting(true);
      const res = await sendEmailVerification(loginIdentifier);
      setIsSubmitting(false);

      if (res.success) {
        setEmailSent(true);
      } else {
        setErrorMessage(res.error || 'Failed to send verification email. Try Password/MPIN login.');
      }
      return;
    }

    // Password / MPIN Login
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

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!regFullName.trim() || !regEmail.trim() || !regUpiId.trim()) {
      setErrorMessage('Please fill in your Name, Email, and desired UPI ID.');
      return;
    }

    if (!regUpiId.includes('@')) {
      setErrorMessage('Please enter a valid UPI ID (e.g., yourname@okaxis or yourname@oksbi).');
      return;
    }

    setIsSubmitting(true);
    const res = await registerUser({
      fullName: regFullName,
      email: regEmail,
      phone: regPhone || '+91 98765 00000',
      upiId: regUpiId,
      bankName: regBankName,
      accountLast4: regAccountLast4 || '5678',
      password: regPassword || '1234'
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* Top Header with App Logo & Language Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition"
        >
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          
          {/* PhonePe-Style Mode Toggle Pill (Sign In vs Register) */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
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
                setEmailSent(false);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
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
              {authMode === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {authMode === 'login' ? t.auth.loginSubtitle : t.auth.registerSubtitle}
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {authMode === 'login' && (
            <>
              {emailSent ? (
                <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {t.auth.emailSentTitle}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t.auth.emailSentDesc.replace('{email}', loginIdentifier)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {t.auth.checkSpamNotice}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSent(false);
                      setUseEmailOtp(false);
                    }}
                    className="text-xs text-emerald-400 hover:underline pt-1 block mx-auto font-medium"
                  >
                    {t.auth.passwordLoginToggle}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  {/* Email or UPI ID */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t.auth.emailOrUpiLabel}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder={t.auth.emailOrUpiPlaceholder}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Password or MPIN Input */}
                  {!useEmailOtp && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">
                          {t.auth.passwordLabel}
                        </label>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          {t.auth.passwordHint}
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder={t.auth.passwordPlaceholder}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition font-mono tracking-widest"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{useEmailOtp ? t.auth.sendEmailBtn : t.auth.signInBtn}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Toggle between Password Login and Email Magic Link */}
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setUseEmailOtp(!useEmailOtp)}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 transition"
                    >
                      {useEmailOtp ? t.auth.passwordLoginToggle : t.auth.sendEmailToggle}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* 2. REGISTER NEW USER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
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
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={t.auth.fullNamePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {t.auth.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder={t.auth.phonePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Desired UPI ID */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  {t.auth.upiIdLabel} *
                </label>
                <input
                  type="text"
                  value={regUpiId}
                  onChange={(e) => setRegUpiId(e.target.value)}
                  placeholder={t.auth.upiIdPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition font-mono text-emerald-400"
                  required
                />
              </div>

              {/* Bank Name & Last 4 Digits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {t.auth.bankNameLabel}
                  </label>
                  <select
                    value={regBankName}
                    onChange={(e) => setRegBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl px-2.5 py-2 text-xs text-white outline-none transition"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Canara Bank">Canara Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {t.auth.accountLast4Label}
                  </label>
                  <input
                    type="text"
                    maxLength="4"
                    value={regAccountLast4}
                    onChange={(e) => setRegAccountLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder={t.auth.accountLast4Placeholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Security PIN / Password */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  {t.auth.createPasswordLabel} *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t.auth.createPasswordPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 outline-none transition font-mono tracking-widest"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t.auth.registerBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Profiles (1-Click bypass) */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {t.auth.quickDemoTitle}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                PIN: 1234
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {profiles.slice(0, 2).map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => loginAsUser(profile.id)}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {profile.avatarInitials}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 block truncate">
                      {profile.fullName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {profile.upiId}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Notice */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 pb-2">
        {t.demoBanner}
      </div>

    </div>
  );
}
