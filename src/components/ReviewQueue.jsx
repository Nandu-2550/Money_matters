import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { playUrgencyChime } from '../utils/voiceAlert';

export default function ReviewQueue() {
  const {
    language,
    t,
    computedMetrics,
    approveHeldTransaction,
    blockHeldTransaction,
    generateCyberReport
  } = useWallet();

  const [isSpeakingId, setIsSpeakingId] = useState(null);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakWarning = (tx) => {
    if (isSpeakingId === tx.id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const reasonsList = (language === 'kn' && tx.reasonsKn?.length ? tx.reasonsKn : tx.reasons).join('. ');
    const spokenText = language === 'kn'
      ? `ಎಚ್ಚರಿಕೆ! ${tx.counterparty} ಗೆ ಸಂಬಂಧಿಸಿದ ${tx.amount} ರೂಪಾಯಿಗಳ ಪಾವತಿಯನ್ನು ತಡೆಹಿಡಿಯಲಾಗಿದೆ. ಕಾರಣ: ${reasonsList}`
      : `Notice. A transaction of ${tx.amount} rupees with ${tx.counterparty} has been held for review. Details: ${reasonsList}`;

    const voices = window.speechSynthesis.getVoices();
    const isKnAvailable = language === 'kn' && voices.some(v => v.lang.startsWith('kn') || v.lang.includes('IN'));

    if (isKnAvailable || language === 'en') {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = 0.95;
      if (language === 'kn') {
        utterance.voice = voices.find(v => v.lang.startsWith('kn') || v.lang.includes('IN'));
        utterance.lang = 'kn-IN';
      } else {
        utterance.voice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('en'));
        utterance.lang = 'en-IN';
      }
      utterance.onend = () => setIsSpeakingId(null);
      utterance.onerror = () => setIsSpeakingId(null);
      setIsSpeakingId(tx.id);
      window.speechSynthesis.speak(utterance);
    } else {
      playUrgencyChime();
      setIsSpeakingId(tx.id);
      setTimeout(() => setIsSpeakingId(null), 2000);
    }
  };

  const heldList = computedMetrics.heldTransactions;
  const resolvedList = [...computedMetrics.blockedTransactions, ...computedMetrics.verifiedTransactions].slice(0, 8);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {t.queue.title}
            </h2>
            {heldList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {heldList.length} {language === 'kn' ? 'ಬಾಕಿ' : 'pending'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 max-w-xl">
            {t.queue.subtitle}
          </p>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
            {language === 'kn' ? 'ಖಾತೆಯಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿರುವ ಹಣ' : 'Funds Protected'}
          </span>
          <span className="text-sm font-bold text-emerald-400">
            ₹{computedMetrics.totalSavedFromScams.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Held Transactions List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t.queue.activeAlerts} ({heldList.length})
          </span>
          <span className="text-[11px] text-slate-400">
            {language === 'kn' ? 'ಹಣ ಖಾತೆಯಿಂದ ಕಡಿತಗೊಂಡಿಲ್ಲ' : 'No funds have left your account'}
          </span>
        </div>

        {heldList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              {t.queue.emptyTitle}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {t.queue.emptyDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {heldList.map((tx) => {
              const isSpeaking = isSpeakingId === tx.id;
              const reasonsList = language === 'kn' && tx.reasonsKn?.length ? tx.reasonsKn : tx.reasons;

              return (
                <div 
                  key={tx.id}
                  className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5"
                >
                  {/* Card Header: Amount, Counterparty, Risk Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
                        tx.direction === 'IN' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {tx.direction === 'IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        <span>{tx.direction === 'IN' ? t.queue.directionInBadge : t.queue.directionOutBadge}</span>
                      </span>

                      <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {t.categories[tx.category] || tx.category}
                      </span>

                      <span className="text-[11px] font-semibold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {t.queue.riskBadge}: {tx.riskScore}/100
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base sm:text-lg font-bold text-white">
                        ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* VPA & Note */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">
                        {tx.direction === 'IN' ? 'Sender UPI ID' : 'Recipient UPI ID'}
                      </span>
                      <span className="font-mono text-slate-200 font-medium">
                        {tx.counterparty}
                      </span>
                    </div>

                    {tx.message && (
                      <div className="sm:text-right max-w-sm">
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">
                          {language === 'kn' ? 'ವಿವರ' : 'Description'}
                        </span>
                        <span className="text-slate-300 italic truncate block">
                          "{tx.message}"
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reasons list */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-amber-400/90 block">
                      {t.queue.reasonsHeader}
                    </span>
                    <div className="space-y-1">
                      {reasonsList.map((reason, idx) => (
                        <div 
                          key={idx} 
                          className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800/60 p-2 rounded-lg flex items-start gap-2"
                        >
                          <span className="text-amber-400 font-bold">•</span>
                          <span className="leading-relaxed">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                    
                    {/* TTS Button */}
                    <button
                      type="button"
                      onClick={() => handleSpeakWarning(tx)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        isSpeaking
                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                          <span>{t.queue.stopSpeech}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.queue.readAloud}</span>
                        </>
                      )}
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => blockHeldTransaction(tx.id)}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                      >
                        {t.queue.blockBtn}
                      </button>

                      <button
                        type="button"
                        onClick={() => approveHeldTransaction(tx.id)}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition cursor-pointer"
                      >
                        {t.queue.approveBtn}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

                  {/* Resolved Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t.queue.blockedHistoryTitle}
          </span>
        </div>

        {resolvedList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">
            {t.queue.noHistory}
          </p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {resolvedList.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.status === 'BLOCKED' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                  <div>
                    <span className="font-mono text-slate-300 block">{item.counterparty}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()} • {t.categories[item.category] || item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.status === 'BLOCKED' && (
                    <button
                      type="button"
                      onClick={() => generateCyberReport(item)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 rounded text-[10px] font-semibold flex items-center gap-1 transition"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{language === 'kn' ? '1930 ವರದಿ' : '1930 Report'}</span>
                    </button>
                  )}
                  <div className="text-right">
                    <span className={`font-semibold ${item.status === 'BLOCKED' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      ₹{Number(item.amount).toLocaleString('en-IN')}
                    </span>
                    <span className={`block text-[10px] font-medium ${
                      item.status === 'BLOCKED' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {t.statuses[item.status] || item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
}
