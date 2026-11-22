import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  QrCode, 
  Landmark, 
  ShieldCheck, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';

export default function ReceiveQRModal({ isOpen, onClose }) {
  const { currentUser, computedMetrics, language } = useWallet();
  const [copied, setCopied] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState('');
  const qrRef = useRef(null);

  if (!isOpen || !currentUser) return null;

  const activeWalletId = currentUser.walletId || currentUser.wallet_id || currentUser.upiId;
  const numAmount = Number(requestedAmount);
  const walletUri = numAmount > 0
    ? `upi://pay?pa=${activeWalletId}&pn=${encodeURIComponent(currentUser.fullName)}&am=${numAmount}&cu=INR`
    : `upi://pay?pa=${activeWalletId}&pn=${encodeURIComponent(currentUser.fullName)}&cu=INR`;

  const copyWalletId = () => {
    navigator.clipboard.writeText(activeWalletId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUser.fullName.replace(/\s+/g, '_')}_Wallet_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {language === 'kn' ? 'ನನ್ನ UPI QR ಕೋಡ್' : 'My UPI QR Code'}
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                {language === 'kn' ? 'ಹಣ ಸ್ವೀಕರಿಸಲು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Scan to receive payment'}
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

        {/* User Badge & Bank Detail */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-lg font-bold flex items-center justify-center mx-auto shadow-sm">
            {currentUser.avatarInitials}
          </div>
          <h4 className="font-bold text-base text-white">
            {currentUser.fullName}
          </h4>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Safe-Wallet Vault • {activeWalletId}</span>
          </div>
        </div>

        {/* QR Code Canvas Box */}
        <div className="bg-white p-4 rounded-3xl shadow-lg flex flex-col items-center justify-center mx-auto w-fit" ref={qrRef}>
          <QRCodeCanvas
            value={walletUri}
            size={200}
            level="M"
            includeMargin={true}
          />
          <div className="text-center mt-1">
            <span className="text-[10px] text-slate-700 font-mono font-bold tracking-tight">
              {activeWalletId}
            </span>
            {numAmount > 0 && (
              <span className="block text-xs font-bold text-emerald-700 font-mono mt-0.5">
                Requesting ₹{numAmount.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Set Specific Amount (Generates Dynamic QR) */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-300">
              {language === 'kn' ? 'ನಿರ್ದಿಷ್ಟ ಮೊತ್ತ ವಿನಂತಿಸಿ (ಐಚ್ಛಿಕ)' : 'Request Specific Amount (Optional)'}
            </span>
            {requestedAmount && (
              <button
                type="button"
                onClick={() => setRequestedAmount('')}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline"
              >
                {language === 'kn' ? 'ತೆರವುಗೊಳಿಸಿ' : 'Clear'}
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold">₹</span>
            <input
              type="number"
              min="1"
              max="50000"
              placeholder="e.g. 500 (QR updates dynamically)"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-slate-700 font-semibold"
            />
          </div>
          <div className="flex gap-1.5">
            {[100, 250, 500, 1000, 2000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setRequestedAmount(String(amt))}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition ${
                  requestedAmount === String(amt)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* 1-Click Copy Wallet ID pill */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
          <div className="truncate">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
              Safe-Wallet ID
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400 truncate block">
              {activeWalletId}
            </span>
          </div>

          <button
            type="button"
            onClick={copyWalletId}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">
                  {language === 'kn' ? 'ನಕಲಿಸಲಾಗಿದೆ' : 'Copied'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'kn' ? 'ನಕಲಿಸಿ' : 'Copy'}</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons: Download QR */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            type="button"
            onClick={downloadQr}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Download className="w-4 h-4" />
            <span>
              {language === 'kn' ? 'QR ಇಮೇಜ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' : 'Download QR Image'}
            </span>
          </button>
        </div>

        {/* Safety Footer */}
        <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
          <span>
            {language === 'kn'
              ? 'ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ UPI PIN ನಮೂದಿಸುವ ಅಗತ್ಯವಿಲ್ಲ'
              : 'You NEVER need to enter your UPI PIN to receive money'}
          </span>
        </div>

      </div>
    </div>
  );
}
