import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function ScannerSimulator() {
  const { language, t, submitTransaction, setActiveTab } = useWallet();

  const [direction, setDirection] = useState('OUT'); // 'IN' | 'OUT'
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Investment');
  const [message, setMessage] = useState('');
  const [isCollectRequest, setIsCollectRequest] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [formError, setFormError] = useState('');

  // 1-Click Judge Demo Presets
  const handleApplyPreset = (presetNumber) => {
    setFormError('');
    setScanResult(null);

    switch (presetNumber) {
      case 1:
        // Safe Customer Inflow (₹1,200 from ravi.store@okicici)
        setDirection('IN');
        setCounterparty('ravi.store@okicici');
        setAmount('1200');
        setCategory('Business');
        setMessage('Groceries supply invoice payment from Ravi General Store');
        setIsCollectRequest(false);
        break;

      case 2:
        // Fake Collect-Request Trap (₹8,500 asking PIN to receive)
        setDirection('IN');
        setCounterparty('olx.buyer99@paytm');
        setAmount('8500');
        setCategory('Retail');
        setMessage('OLX buyer token advance: enter upi pin to receive money into account');
        setIsCollectRequest(true);
        break;

      case 3:
        // WhatsApp Fake Stock Group Scam (₹15,000 to vip.trades@okaxis)
        setDirection('OUT');
        setCounterparty('vip.trades@okaxis');
        setAmount('15000');
        setCategory('Investment');
        setMessage('Guaranteed 40% in 7 days VIP stock group deposit link: http://vipstocks.top/bonus.apk');
        setIsCollectRequest(false);
        break;

      case 4:
        // Verified SEBI Broker SIP (₹2,500 to zerodha.brk@validhdfc)
        setDirection('OUT');
        setCounterparty('zerodha.brk@validhdfc');
        setAmount('2500');
        setCategory('Investment');
        setMessage('Monthly Zerodha Nifty LargeCap Index Fund SIP investment');
        setIsCollectRequest(false);
        break;

      default:
        break;
    }
  };

  const handleRunScan = async (e) => {
    e?.preventDefault();
    setFormError('');

    const parsedAmount = Number(amount);
    if (!counterparty.trim() || !parsedAmount || parsedAmount <= 0) {
      setFormError(t.scanner.validationError);
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    // Subtle realistic analysis delay for authentic fintech security scanning UX
    setTimeout(async () => {
      const result = await submitTransaction({
        direction,
        counterparty,
        amount: parsedAmount,
        category,
        message,
        isCollectRequest: direction === 'IN' ? isCollectRequest : false
      });
      setScanResult(result);
      setIsScanning(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Subtitle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {t.scanner.title}
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {t.scanner.subtitle}
            </p>
          </div>

          {/* Direction Toggle Pills */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDirection('OUT');
                setIsCollectRequest(false);
                setScanResult(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                direction === 'OUT'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t.scanner.outgoingTab}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirection('IN');
                setScanResult(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                direction === 'IN'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{t.scanner.incomingTab}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Judge Demo Presets Section */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {t.scanner.presetsTitle}
            </span>
            <span className="text-[11px] text-slate-400">
              {language === 'kn' ? 'ತಕ್ಷಣ ಪರೀಕ್ಷಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Click to auto-populate test cases'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            {/* Preset 1: Safe Inflow */}
            <button
              type="button"
              onClick={() => handleApplyPreset(1)}
              className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  {t.scanner.preset1}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {t.riskLevels.SAFE}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {t.scanner.preset1Desc}
              </p>
            </button>

            {/* Preset 2: Fake Collect Trap */}
            <button
              type="button"
              onClick={() => handleApplyPreset(2)}
              className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/40 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 group-hover:text-rose-300">
                  {t.scanner.preset2}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {t.riskLevels.HIGH_RISK}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {t.scanner.preset2Desc}
              </p>
            </button>

            {/* Preset 3: Fake WhatsApp Scam */}
            <button
              type="button"
              onClick={() => handleApplyPreset(3)}
              className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/40 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 group-hover:text-rose-300">
                  {t.scanner.preset3}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {t.riskLevels.HIGH_RISK}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {t.scanner.preset3Desc}
              </p>
            </button>

            {/* Preset 4: Regulated SEBI SIP */}
            <button
              type="button"
              onClick={() => handleApplyPreset(4)}
              className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  {t.scanner.preset4}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {t.riskLevels.SAFE}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {t.scanner.preset4Desc}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulation Form & Live Risk Analysis Result Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
          <form onSubmit={handleRunScan} className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                {t.scanner.formTitle}
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                direction === 'OUT' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {direction === 'OUT' ? t.scanner.directionOut : t.scanner.directionIn}
              </span>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Counterparty UPI ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.scanner.upiLabel} *
              </label>
              <input
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder={t.scanner.upiPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none font-mono"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {direction === 'OUT' && (
                  <span className="text-slate-400">
                    {language === 'kn'
                      ? 'ಸುರಕ್ಷಿತ ಹೂಡಿಕೆಗೆ SEBI ಹ್ಯಾಂಡಲ್ .brk@valid* ಅಥವಾ .mf@valid* ಬಳಸಿ.'
                      : 'Tip: Regulated SEBI brokers use official .brk@valid* or .mf@valid* handles.'}
                  </span>
                )}
              </p>
            </div>

            {/* Amount & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.scanner.amountLabel} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t.scanner.amountPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 transition outline-none font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.scanner.categoryLabel}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white transition outline-none"
                >
                  <option value="Investment">{t.categories.Investment}</option>
                  <option value="Retail">{t.categories.Retail}</option>
                  <option value="Business">{t.categories.Business}</option>
                  <option value="Utilities">{t.categories.Utilities}</option>
                  <option value="Transfer">{t.categories.Transfer}</option>
                  <option value="Emergency">{t.categories.Emergency}</option>
                  <option value="Salary">{t.categories.Salary}</option>
                  <option value="Other">{t.categories.Other}</option>
                </select>
              </div>
            </div>

            {/* Note / WhatsApp text / link */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.scanner.messageLabel}
              </label>
              <textarea
                rows="2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.scanner.messagePlaceholder}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 transition outline-none resize-none"
              />
            </div>

            {/* Incoming Mode Specific: Collect Request Trap Checkbox */}
            {direction === 'IN' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollectRequest}
                    onChange={(e) => setIsCollectRequest(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-amber-400 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">
                      {t.scanner.collectCheckbox}
                    </span>
                    <span className="text-[11px] text-amber-400/80 block mt-0.5">
                      {t.scanner.collectHelp}
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Submit Scan Button */}
            <button
              type="submit"
              disabled={isScanning}
              className="w-full py-3 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{t.scanner.scanning}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-slate-950" />
                  <span>{t.scanner.scanBtn}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Instant Risk Analysis Result Card */}
        <div className="lg:col-span-5 flex flex-col">
          {scanResult ? (
            <div className={`h-full rounded-2xl p-5 sm:p-7 border shadow-xl flex flex-col justify-between transition-all duration-300 ${
              scanResult.status === 'HELD_FOR_REVIEW'
                ? 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40'
                : 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40'
            }`}>
              <div>
                
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    {scanResult.status === 'HELD_FOR_REVIEW' ? (
                      <ShieldAlert className="w-5 h-5 text-rose-400" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    )}
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      {t.scanner.riskCardTitle}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    scanResult.status === 'HELD_FOR_REVIEW'
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-500 text-slate-950'
                  }`}>
                    {t.statuses[scanResult.status] || scanResult.status}
                  </span>
                </div>

                {/* Risk Gauge & Score */}
                <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 mb-4">
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={scanResult.riskScore >= 60 ? 'text-rose-500' : scanResult.riskScore >= 35 ? 'text-amber-400' : 'text-emerald-400'}
                        strokeDasharray={`${scanResult.riskScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-black text-white">{scanResult.riskScore}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">/ 100</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">
                      {t.scanner.riskScore}
                    </div>
                    <div className={`text-base font-black ${
                      scanResult.riskScore >= 60 ? 'text-rose-400' : scanResult.riskScore >= 35 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {t.riskLevels[scanResult.riskLevel] || scanResult.riskLevel}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {scanResult.status === 'HELD_FOR_REVIEW' ? t.scanner.heldMsg : t.scanner.processedMsg}
                    </p>
                  </div>
                </div>

                {/* Bulleted Explainable Reasons */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.scanner.reasonsTitle}
                  </div>
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(language === 'kn' && scanResult.reasonsKn?.length ? scanResult.reasonsKn : scanResult.reasons).map((reason, idx) => (
                      <li 
                        key={idx}
                        className={`text-xs p-2.5 rounded-lg border flex items-start gap-2 ${
                          scanResult.status === 'HELD_FOR_REVIEW'
                            ? 'bg-rose-950/30 border-rose-500/20 text-rose-200'
                            : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200'
                        }`}
                      >
                        {scanResult.status === 'HELD_FOR_REVIEW' ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                        )}
                        <span className="leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Actions & Shortcuts */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                {scanResult.status === 'HELD_FOR_REVIEW' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('queue')}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
                  >
                    <span>{t.scanner.gotoQueue}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>{language === 'kn' ? 'ನಗದು ಹರಿವಿನ ಲೆಡ್ಜರ್ ವೀಕ್ಷಿಸಿ' : 'View Reconciled Ledger'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <p className="text-[10px] text-slate-400 text-center mt-2.5">
                  {t.disclaimerNotice}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-3">
                <ShieldCheck className="w-8 h-8 text-emerald-500/50" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                {language === 'kn' ? 'ಶೀಲ್ಡ್ ಸಿದ್ಧವಾಗಿದೆ' : 'Shield Scanner Ready'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {language === 'kn'
                  ? 'ಮೇಲಿನ 1-ಕ್ಲಿಕ್ ತೀರ್ಪುಗಾರರ ಪ್ರಿಸೆಟ್‌ಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ನೇರವಾಗಿ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.'
                  : 'Select any of the 4 Judge Demo Presets above or enter custom UPI details to test the deterministic risk scoring engine.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">✓ SEBI @valid Check</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">✓ Collect Request Guard</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">✓ Malware APK Detector</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
