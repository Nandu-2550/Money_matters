import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  ShieldX, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertTriangle, 
  Lock,
  History,
  Info
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export default function ReviewQueue() {
  const { 
    language, 
    t, 
    computedMetrics, 
    approveHeldTransaction, 
    blockHeldTransaction 
  } = useWallet();

  const [isSpeakingId, setIsSpeakingId] = useState(null);

  // Clean up speech synthesis if component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakWarning = (tx) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeakingId === tx.id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Construct spoken text in English or Kannada
    let spokenText = '';
    const reasonsList = (language === 'kn' && tx.reasonsKn?.length ? tx.reasonsKn : tx.reasons).join('. ');

    if (language === 'kn') {
      spokenText = `ಎಚ್ಚರಿಕೆ! ${tx.counterparty} ಗೆ ಸಂಬಂಧಿಸಿದ ${tx.amount} ರೂಪಾಯಿಗಳ ವಹಿವಾಟು ಹೆಚ್ಚಿನ ಅಪಾಯದ ಕಾರಣ ತಡೆಹಿಡಿಯಲಾಗಿದೆ. ಕಾರಣ: ${reasonsList}`;
    } else {
      spokenText = `Warning! A transaction of rupees ${tx.amount} involving ${tx.counterparty} has been intercepted with a high risk score of ${tx.riskScore} out of 100. Reasons: ${reasonsList}`;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.95;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    if (language === 'kn') {
      const knVoice = voices.find(v => v.lang.startsWith('kn') || v.lang.includes('IN'));
      if (knVoice) utterance.voice = knVoice;
      utterance.lang = 'kn-IN';
    } else {
      const inVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en-GB') || v.lang.startsWith('en'));
      if (inVoice) utterance.voice = inVoice;
      utterance.lang = 'en-IN';
    }

    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(tx.id);
    window.speechSynthesis.speak(utterance);
  };

  const heldList = computedMetrics.heldTransactions;
  const resolvedList = [...computedMetrics.blockedTransactions, ...computedMetrics.verifiedTransactions].slice(0, 10);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {t.queue.title}
                </h2>
                {heldList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                    {heldList.length} {language === 'kn' ? 'ಬಾಕಿ' : 'HELD'}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                {t.queue.subtitle}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 shrink-0 flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-400 block font-medium">
                {language === 'kn' ? 'ವಂಚನೆ ತಡೆ ಕವಚ:' : 'Funds Guard Status:'}
              </span>
              <span className="text-emerald-400 font-extrabold">
                {language === 'kn' ? '100% ಸುರಕ್ಷಿತ ರಕ್ಷಣೆ' : 'Zero Loss Guarantee'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Held Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>{t.queue.activeAlerts}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {heldList.length}
            </span>
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {language === 'kn' ? 'ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತಗೊಂಡಿಲ್ಲ' : 'Money has NOT moved from wallet'}
          </span>
        </div>

        {heldList.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">
              {t.queue.emptyTitle}
            </h4>
            <p className="text-sm text-slate-400 max-w-md">
              {t.queue.emptyDesc}
            </p>
          </div>
        ) : (
          /* List of Held Cards */
          <div className="grid grid-cols-1 gap-4">
            {heldList.map((tx) => {
              const isSpeaking = isSpeakingId === tx.id;
              const reasonsList = language === 'kn' && tx.reasonsKn?.length ? tx.reasonsKn : tx.reasons;

              return (
                <div 
                  key={tx.id}
                  className="bg-slate-900 border-2 border-rose-500/40 hover:border-rose-500/70 rounded-2xl p-5 sm:p-6 shadow-xl transition space-y-4"
                >
                  {/* Top Bar: Risk Tag, Direction, Amount, Time */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t.queue.riskBadge}: {tx.riskScore}/100</span>
                      </span>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        tx.direction === 'IN' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {tx.direction === 'IN' ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>{t.queue.directionInBadge}</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>{t.queue.directionOutBadge}</span>
                          </>
                        )}
                      </span>

                      <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                        {t.categories[tx.category] || tx.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {language === 'kn' ? 'ತಡೆಹಿಡಿದ ಮೊತ್ತ' : 'Held Amount'}
                        </span>
                        <span className="text-xl font-black text-white">
                          ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Metadata & Counterparty */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-400 block">
                        {tx.direction === 'IN' ? 'Sender UPI ID' : 'Target Recipient UPI ID'}
                      </span>
                      <span className="text-sm font-mono font-bold text-emerald-300">
                        {tx.counterparty}
                      </span>
                    </div>

                    {tx.message && (
                      <div className="sm:text-right max-w-md">
                        <span className="text-[11px] font-bold uppercase text-slate-400 block">
                          {language === 'kn' ? 'ಲಗತ್ತಿಸಲಾದ ಸಂದೇಶ / ವಿವರ' : 'Payment Remarks / Link'}
                        </span>
                        <span className="text-xs text-slate-300 italic line-clamp-2">
                          "{tx.message}"
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Explanatory Reasons Bullet Points */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      {t.queue.reasonsHeader}
                    </span>
                    <div className="space-y-1.5">
                      {reasonsList.map((reason, idx) => (
                        <div 
                          key={idx} 
                          className="text-xs text-rose-200 bg-rose-950/30 border border-rose-500/20 p-2.5 rounded-xl flex items-start gap-2"
                        >
                          <span className="text-rose-400 font-bold">•</span>
                          <span className="leading-relaxed">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons: TTS Audio, Block Scam, Approve Anyway */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    
                    {/* Read Warning Aloud (TTS) Button */}
                    <button
                      type="button"
                      onClick={() => handleSpeakWarning(tx)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        isSpeaking
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30 hover:border-amber-500/60'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-4 h-4 animate-bounce" />
                          <span>{t.queue.stopSpeech}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>{t.queue.readAloud}</span>
                        </>
                      )}
                    </button>

                    {/* Block Scam & Approve Anyway Decisions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => blockHeldTransaction(tx.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95"
                      >
                        <ShieldX className="w-4 h-4" />
                        <span>{t.queue.blockBtn}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => approveHeldTransaction(tx.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.queue.approveBtn}</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Blocked & Resolved Alerts Log (History) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            {t.queue.blockedHistoryTitle}
          </h3>
          <span className="text-xs text-emerald-400 font-bold">
            {language === 'kn' ? 'ಉಳಿಸಿದ ಒಟ್ಟು ಮೊತ್ತ:' : 'Total Scams Thwarted:'}{' '}
            ₹{computedMetrics.totalSavedFromScams.toLocaleString('en-IN')}
          </span>
        </div>

        {resolvedList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            {t.queue.noHistory}
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {resolvedList.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`p-1.5 rounded-lg ${
                    item.status === 'BLOCKED' 
                      ? 'bg-rose-500/10 text-rose-400' 
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {item.status === 'BLOCKED' ? <ShieldX className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </span>
                  <div>
                    <span className="font-mono text-slate-200 block font-semibold">{item.counterparty}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()} • {t.categories[item.category] || item.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-black ${item.status === 'BLOCKED' ? 'text-rose-400 line-through' : 'text-emerald-400'}`}>
                    ₹{Number(item.amount).toLocaleString('en-IN')}
                  </span>
                  <span className={`block text-[10px] font-bold uppercase ${
                    item.status === 'BLOCKED' ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {t.statuses[item.status] || item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
