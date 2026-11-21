import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Store,
  Smartphone,
  TrendingUp,
  Landmark,
  QrCode,
  CreditCard,
  Send,
  Link as LinkIcon,
  X,
  Copy,
  Check
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function ScannerSimulator() {
  const { 
    currentUser, 
    profiles, 
    language, 
    t, 
    submitTransaction, 
    setActiveTab, 
    setIsProfileModalOpen 
  } = useWallet();

  const [direction, setDirection] = useState('OUT'); // 'IN' | 'OUT'
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Investment');
  const [message, setMessage] = useState('');
  const [isCollectRequest, setIsCollectRequest] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [formError, setFormError] = useState('');

  // Modals for PhonePe-style quick actions
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Identify counterpart contact (Anjaneya if Nandeesh, Nandeesh if Anjaneya)
  const peerContact = profiles.find(p => p.id !== currentUser.id) || profiles[1];

  // Quick Action Buttons Handlers
  const handleActionToMobile = () => {
    setDirection('OUT');
    setIsCollectRequest(false);
    setScanResult(null);
    setFormError('');
  };

  const handleActionReceive = () => {
    setShowQrModal(true);
  };

  const handleActionCheckBalance = () => {
    setIsProfileModalOpen(true);
  };

  const handleActionScamScanner = () => {
    setDirection('OUT');
    setCategory('Investment');
    setCounterparty('vip.trading@okaxis');
    setAmount('10000');
    setMessage('Guaranteed 50% weekly return VIP stocks group download http://vipstocks.xyz/bonus.apk');
    setScanResult(null);
    setFormError('');
  };

  // 1-Click Peer-to-Peer Transfer Handler
  const handleQuickP2P = (peer) => {
    setDirection('OUT');
    setCounterparty(peer.upiId);
    setAmount('1000');
    setCategory('Transfer');
    setMessage(`Transfer to ${peer.fullName}`);
    setIsCollectRequest(false);
    setScanResult(null);
    setFormError('');
  };

  // Quick Scenarios
  const handleApplyPreset = (presetNumber) => {
    setFormError('');
    setScanResult(null);

    switch (presetNumber) {
      case 1:
        setDirection('IN');
        setCounterparty('ravi.store@okicici');
        setAmount('1200');
        setCategory('Business');
        setMessage('Groceries supply invoice payment from Ravi General Store');
        setIsCollectRequest(false);
        break;

      case 2:
        setDirection('IN');
        setCounterparty('olx.buyer99@paytm');
        setAmount('8500');
        setCategory('Retail');
        setMessage('OLX buyer token advance: enter upi pin to receive money into account');
        setIsCollectRequest(true);
        break;

      case 3:
        setDirection('OUT');
        setCounterparty('vip.trades@okaxis');
        setAmount('15000');
        setCategory('Investment');
        setMessage('Guaranteed 40% in 7 days VIP stock group deposit link: http://vipstocks.top/bonus.apk');
        setIsCollectRequest(false);
        break;

      case 4:
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
    }, 350);
  };

  const copyUpiText = () => {
    navigator.clipboard.writeText(currentUser.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. PhonePe-Style 4-Icon Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          
          {/* Action 1: To Mobile / UPI */}
          <button
            type="button"
            onClick={handleActionToMobile}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.toMobile}
            </span>
          </button>

          {/* Action 2: Receive Money / QR */}
          <button
            type="button"
            onClick={handleActionReceive}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.receiveQr}
            </span>
          </button>

          {/* Action 3: Check Bank Balance */}
          <button
            type="button"
            onClick={handleActionCheckBalance}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.checkBalance}
            </span>
          </button>

          {/* Action 4: Scam & Link Scanner */}
          <button
            type="button"
            onClick={handleActionScamScanner}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-800/60 transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 group-hover:text-white leading-tight">
              {t.quickActions.linkScanner}
            </span>
          </button>

        </div>

        {/* 1-Click P2P Transfer Banner (e.g. Nandeesh -> Anjaneya or Anjaneya -> Nandeesh) */}
        {peerContact && (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-xs font-bold text-white flex items-center justify-center shrink-0">
                {peerContact.avatarInitials}
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block">{t.quickActions.quickP2PTitle}:</span>
                <span className="font-semibold text-slate-200">{peerContact.fullName} ({peerContact.upiId})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickP2P(peerContact)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.quickActions.sendToContact.replace('{name}', peerContact.fullName).replace('{upi}', peerContact.upiId)}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {t.scanner.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {t.scanner.subtitle}
            </p>
          </div>

          {/* Direction Pill Selector */}
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setDirection('OUT');
                setIsCollectRequest(false);
                setScanResult(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                direction === 'OUT'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.scanner.outgoingTab}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDirection('IN');
                setScanResult(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                direction === 'IN'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.scanner.incomingTab}</span>
            </button>
          </div>
        </div>

        {/* Quick Test Scenarios Cards */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            {t.scanner.presetsTitle}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => handleApplyPreset(1)}
              className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/70 border border-slate-800/90 transition text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200 group-hover:text-white truncate">
                  {t.scanner.preset1}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {t.scanner.preset1Desc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset(2)}
              className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/70 border border-slate-800/90 transition text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-slate-200 group-hover:text-white truncate">
                  {t.scanner.preset2}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {t.scanner.preset2Desc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset(3)}
              className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/70 border border-slate-800/90 transition text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-semibold text-slate-200 group-hover:text-white truncate">
                  {t.scanner.preset3}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {t.scanner.preset3Desc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset(4)}
              className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/70 border border-slate-800/90 transition text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200 group-hover:text-white truncate">
                  {t.scanner.preset4}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                {t.scanner.preset4Desc}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Form & Result Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Container */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <form onSubmit={handleRunScan} className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.scanner.formTitle}
              </span>
              <span className="text-xs text-slate-400">
                {direction === 'OUT' ? t.scanner.directionOut : t.scanner.directionIn}
              </span>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* UPI ID */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t.scanner.upiLabel}
              </label>
              <input
                type="text"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder={t.scanner.upiPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
                required
              />
              {direction === 'OUT' && (
                <p className="text-[11px] text-slate-400 mt-1">
                  {language === 'kn'
                    ? 'ಅಧಿಕೃತ SEBI ಹೂಡಿಕೆ ಬ್ರೋಕರ್‌ಗಳು .brk@valid* ಅಥವಾ .mf@valid* ಹ್ಯಾಂಡಲ್ ಬಳಸುತ್ತಾರೆ.'
                    : 'Tip: Regulated SEBI brokers use official .brk@valid* or .mf@valid* handles.'}
                </p>
              )}
            </div>

            {/* Amount & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.scanner.amountLabel}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t.scanner.amountPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.scanner.categoryLabel}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition"
                >
                  <option value="Investment">{t.categories.Investment}</option>
                  <option value="Transfer">{t.categories.Transfer}</option>
                  <option value="Retail">{t.categories.Retail}</option>
                  <option value="Business">{t.categories.Business}</option>
                  <option value="Utilities">{t.categories.Utilities}</option>
                  <option value="Emergency">{t.categories.Emergency}</option>
                  <option value="Salary">{t.categories.Salary}</option>
                  <option value="Other">{t.categories.Other}</option>
                </select>
              </div>
            </div>

            {/* Notes / Message */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t.scanner.messageLabel}
              </label>
              <textarea
                rows="2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.scanner.messagePlaceholder}
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-600 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition resize-none"
              />
            </div>

            {/* Incoming Mode: Collect Request Checkbox */}
            {direction === 'IN' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollectRequest}
                    onChange={(e) => setIsCollectRequest(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      {t.scanner.collectCheckbox}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {t.scanner.collectHelp}
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isScanning}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>{t.scanner.scanning}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.scanner.scanBtn}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Result Card */}
        <div className="lg:col-span-5 flex flex-col">
          {scanResult ? (
            <div className={`h-full rounded-2xl p-5 sm:p-6 border shadow-sm flex flex-col justify-between ${
              scanResult.status === 'HELD_FOR_REVIEW'
                ? 'bg-slate-900 border-amber-500/30'
                : 'bg-slate-900 border-emerald-500/30'
            }`}>
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    {scanResult.status === 'HELD_FOR_REVIEW' ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      {t.scanner.riskCardTitle}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    scanResult.status === 'HELD_FOR_REVIEW'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {t.statuses[scanResult.status] || scanResult.status}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shrink-0">
                    <span className="text-base font-bold text-white leading-none">{scanResult.riskScore}</span>
                    <span className="text-[9px] text-slate-500 font-medium">/ 100</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-300">
                      {t.riskLevels[scanResult.riskLevel] || scanResult.riskLevel}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {scanResult.status === 'HELD_FOR_REVIEW' ? t.scanner.heldMsg : t.scanner.processedMsg}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {t.scanner.reasonsTitle}
                  </div>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(language === 'kn' && scanResult.reasonsKn?.length ? scanResult.reasonsKn : scanResult.reasons).map((reason, idx) => (
                      <li 
                        key={idx}
                        className="text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800">
                {scanResult.status === 'HELD_FOR_REVIEW' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('queue')}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{t.scanner.gotoQueue}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{language === 'kn' ? 'ಲೆಡ್ಜರ್ ವೀಕ್ಷಿಸಿ' : 'View Ledger'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <p className="text-[10px] text-slate-500 text-center mt-2">
                  {t.disclaimerNotice}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[260px] bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <ShieldCheck className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">
                {language === 'kn' ? 'ಪಾವತಿ ಪರಿಶೀಲನೆ ಸಿದ್ಧವಾಗಿದೆ' : 'Ready to verify'}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs">
                {language === 'kn'
                  ? 'ಮೇಲಿನ ತ್ವರಿತ ಆಯ್ಕೆಗಳನ್ನು ಬಳಸಿ ಅಥವಾ ಹೊಸ ಪಾವತಿ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ ಪರಿಶೀಲಿಸಿ.'
                  : 'Select an action above or enter UPI payment details to verify safety.'}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Receive Money / QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t.quickActions.qrModalTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser.fullName} • {currentUser.bankName}
              </p>
            </div>

            {/* Clean SVG QR Code Representation */}
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
              <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="#ffffff" />
                {/* Outer corners */}
                <rect x="10" y="10" width="25" height="25" rx="3" stroke="#0f172a" strokeWidth="4" />
                <rect x="16" y="16" width="13" height="13" fill="#0f172a" />
                
                <rect x="65" y="10" width="25" height="25" rx="3" stroke="#0f172a" strokeWidth="4" />
                <rect x="71" y="16" width="13" height="13" fill="#0f172a" />
                
                <rect x="10" y="65" width="25" height="25" rx="3" stroke="#0f172a" strokeWidth="4" />
                <rect x="16" y="71" width="13" height="13" fill="#0f172a" />
                
                {/* QR Data Pattern Blocks */}
                <rect x="42" y="12" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="12" width="6" height="12" fill="#0f172a" />
                <rect x="42" y="24" width="16" height="6" fill="#0f172a" />
                <rect x="12" y="42" width="6" height="16" fill="#0f172a" />
                <rect x="24" y="42" width="12" height="6" fill="#0f172a" />
                <rect x="24" y="52" width="6" height="6" fill="#0f172a" />
                <rect x="42" y="42" width="16" height="16" fill="#10b981" />
                <rect x="65" y="42" width="10" height="6" fill="#0f172a" />
                <rect x="80" y="42" width="10" height="16" fill="#0f172a" />
                <rect x="65" y="52" width="8" height="16" fill="#0f172a" />
                <rect x="42" y="65" width="8" height="10" fill="#0f172a" />
                <rect x="55" y="65" width="10" height="8" fill="#0f172a" />
                <rect x="42" y="80" width="16" height="8" fill="#0f172a" />
                <rect x="65" y="80" width="12" height="8" fill="#0f172a" />
                <rect x="82" y="74" width="8" height="14" fill="#0f172a" />
              </svg>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-slate-200 truncate">
                {currentUser.upiId}
              </span>
              <button
                onClick={copyUpiText}
                className="p-1 px-2 rounded-lg bg-slate-800 text-slate-300 text-xs flex items-center gap-1 hover:text-white"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              {t.quickActions.qrModalDesc}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
