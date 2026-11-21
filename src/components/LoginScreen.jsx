import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Landmark, 
  Languages 
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function LoginScreen() {
  const { 
    profiles, 
    loginAsUser, 
    sendEmailVerification, 
    language, 
    toggleLanguage, 
    t 
  } = useWallet();

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendEmail = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSending(true);
    const res = await sendEmailVerification(email);
    setIsSending(false);

    if (res.success) {
      if (res.isDemo) {
        // Automatically logged in
        return;
      }
      setEmailSent(true);
    } else {
      setErrorMessage(res.error || 'Failed to send verification email. Try demo access below.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* Top Bar with Language Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            {t.appName}
          </span>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-800 transition"
        >
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.auth.loginTitle}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {t.auth.loginSubtitle}
            </p>
          </div>

          {/* Email Verification Form / Confirmation */}
          {emailSent ? (
            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {t.auth.emailSentTitle}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.auth.emailSentDesc.replace('{email}', email)}
              </p>
              <p className="text-[11px] text-slate-500">
                {t.auth.checkSpamNotice}
              </p>
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-xs text-emerald-400 hover:underline pt-1 block mx-auto font-medium"
              >
                {t.auth.backToLogin}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.emailPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{t.auth.sendingEmail}</span>
                  </>
                ) : (
                  <>
                    <span>{t.auth.sendEmailBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Access Section (Hackathon 1-Click bypass) */}
          <div className="pt-5 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {t.auth.quickDemoTitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.auth.quickDemoSubtitle}
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => loginAsUser(profile.id)}
                  className="w-full text-left p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-black text-base flex items-center justify-center shrink-0">
                      {profile.avatarInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                          {profile.fullName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-semibold">
                          {t.auth.verifiedUserBadge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {profile.upiId}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Landmark className="w-3 h-3" />
                        <span>{profile.bankName} •••• {profile.accountLast4}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-medium">Opening Balance</span>
                    <span className="text-xs font-bold text-slate-200">
                      ₹{profile.startingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 pb-2">
        {t.demoBanner}
      </div>

    </div>
  );
}
