import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  WifiOff, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  QrCode
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';

export default function OfflineVoucherModal({ isOpen, onClose, voucher }) {
  const { language } = useWallet();
  const [copied, setCopied] = useState(false);
  const canvasContainerRef = useRef(null);

  if (!isOpen || !voucher) return null;

  const voucherJsonString = JSON.stringify(voucher);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucherJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `MM_Voucher_${voucher.tx_id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಪಾವತಿ ರಸೀದಿ QR' : 'Offline Payment Voucher'}
              </h3>
              <p className="text-[10px] text-amber-400 font-semibold leading-tight">
                {language === 'kn' ? 'ಸ್ವೀಕೃತಿದಾರರಿಗೆ ಈ QR ತೋರಿಸಿ' : 'Show this QR to receiver to claim'}
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

        {/* Voucher Amount & Status Pill */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">
            {language === 'kn' ? 'ಪಾವತಿಸಿದ ಸುರಕ್ಷಿತ ಮೊತ್ತ' : 'Signed Voucher Amount'}
          </span>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">
            ₹{Number(voucher.amount).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-300">
            {language === 'kn' ? 'ಸ್ವೀಕೃತಿದಾರರು:' : 'For:'} <span className="font-bold text-white">{voucher.to_name}</span> ({voucher.to_wallet})
          </div>
        </div>

        {/* Scannable Signed QR Code Canvas */}
        <div 
          ref={canvasContainerRef}
          className="bg-white p-3.5 rounded-3xl shadow-lg flex flex-col items-center justify-center mx-auto w-fit"
        >
          <QRCodeCanvas
            value={voucherJsonString}
            size={220}
            level="M"
            includeMargin={true}
          />
          <div className="text-center mt-1">
            <span className="text-[9px] text-slate-600 font-mono font-bold tracking-tight">
              HMAC-SHA256 SIGNED • {voucher.tx_id}
            </span>
          </div>
        </div>

        {/* Cryptographic Proof Banner */}
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Two-Way Offline Handshake</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">v1.0</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {language === 'kn'
              ? 'ಈ QR ಅನ್ನು ಸ್ವೀಕರಿಸುವವರು ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ತಕ್ಷಣ ಹಣ ಅವರ ವಾಲೆಟ್‌ಗೆ ಜಮೆಯಾಗುತ್ತದೆ. ನೀವು ಆನ್‌ಲೈನ್‌ಗೆ ಬಾರದಿದ್ದರೂ ಹಣ ಅವರ ಸ್ವಂತದ್ದಾಗುತ್ತದೆ!'
              : 'Receiver scans this signed QR code to immediately own and credit the funds into their wallet, even if you never reconnect!'}
          </p>
        </div>

        {/* Action Buttons: Download PNG & Copy Code */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'QR ಡೌನ್‌ಲೋಡ್' : 'Download QR'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{language === 'kn' ? 'ನಕಲಿಸಲಾಗಿದೆ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{language === 'kn' ? 'ಕೋಡ್ ನಕಲಿಸಿ' : 'Copy Voucher'}</span>
              </>
            )}
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
        >
          {language === 'kn' ? 'ಮುಗಿಯಿತು' : 'Done (Voucher Saved in Outbox)'}
        </button>

      </div>
    </div>
  );
}
