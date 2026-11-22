import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  WifiOff, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';

export default function OfflineVoucherModal({ isOpen, onClose, voucher }) {
  const { language } = useWallet();
  const [copied, setCopied] = useState(false);
  const canvasContainerRef = useRef(null);

  if (!isOpen || !voucher) return null;

  // Resilient handling of voucher whether passed as string, string wrapper, or object
  let voucherObj = {};
  let voucherJsonString = '';

  try {
    let raw = voucher;
    if (raw && typeof raw === 'object' && !(raw instanceof String) && raw.tx_id) {
      voucherObj = raw;
      voucherJsonString = JSON.stringify(raw);
    } else {
      let str = typeof raw === 'string' ? raw : String(raw);
      str = str.trim();
      if (str.startsWith('"') && str.endsWith('"')) {
        try { str = JSON.parse(str); } catch {}
      }
      voucherJsonString = typeof str === 'string' ? str : JSON.stringify(str);
      voucherObj = typeof str === 'string' ? JSON.parse(str) : str;
    }
  } catch (err) {
    console.warn('[OfflineVoucherModal] Error parsing voucher:', err);
    voucherObj = voucher || {};
    voucherJsonString = JSON.stringify(voucherObj);
  }

  // Keep QR payload compact and canonical for ultra-fast camera detection
  const compactPayload = {
    v: 1,
    type: 'MM_VOUCHER',
    tx_id: voucherObj.tx_id,
    from_wallet: voucherObj.from_wallet || voucherObj.from,
    from_name: voucherObj.from_name || voucherObj.from_wallet,
    to_wallet: voucherObj.to_wallet || voucherObj.to,
    to_name: voucherObj.to_name || voucherObj.to_wallet,
    amount: Number(voucherObj.amount),
    timestamp: voucherObj.timestamp,
    sig: voucherObj.sig || voucherObj.signature
  };
  const scannableJsonString = JSON.stringify(compactPayload);

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
    a.download = `MM_Voucher_${voucherObj.tx_id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Top Header & Badge */}
        <div className="border-b border-slate-800 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <WifiOff className="w-3.5 h-3.5" />
              <span>
                {language === 'kn' 
                  ? 'ಆಫ್‌ಲೈನ್ ಪಾವತಿ ಅನುಮೋದಿಸಲಾಗಿದೆ — ಸ್ವೀಕೃತಿದಾರರಿಗೆ QR ತೋರಿಸಿ' 
                  : 'Offline Payment Authorized — Show QR to Receiver'}
              </span>
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {language === 'kn' 
              ? 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ ತಕ್ಷಣ ವರ್ಗಾವಣೆ ಪೂರ್ಣಗೊಳಿಸಲು ಈ QR ಅನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿಸಿ.' 
              : 'Receiver scans this QR code to instantly verify & credit funds into their safe wallet.'}
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="text-center pb-2 border-b border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block">
              {language === 'kn' ? 'ಪಾವತಿಸಿದ ಮೊತ್ತ' : 'Amount'}
            </span>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">
              ₹{Number(voucherObj.amount).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{language === 'kn' ? 'ಪಾವತಿಸಿದವರು:' : 'Paid To:'}</span>
              <span className="font-semibold text-white truncate max-w-[170px]" title={voucherObj.to_name}>
                {voucherObj.to_name || voucherObj.to_wallet}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{language === 'kn' ? 'ಸ್ವೀಕೃತಿ ವಾಲೆಟ್ ID:' : 'Recipient Wallet:'}</span>
              <span className="font-mono text-emerald-400 text-[11px] truncate max-w-[170px]">
                {voucherObj.to_wallet}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{language === 'kn' ? 'ವಹಿವಾಟು ID:' : 'Transaction ID:'}</span>
              <span className="font-mono text-slate-300 text-[10px]">
                {voucherObj.tx_id}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5">
              <span className="text-slate-400">{language === 'kn' ? 'ಸ್ಥಿತಿ:' : 'Status:'}</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{language === 'kn' ? 'ನಿಮ್ಮ ಲೋಕಲ್ ವಾಲೆಟ್‌ನಿಂದ ಕಡಿತಗೊಳಿಸಲಾಗಿದೆ' : 'Debited from your local wallet'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Scannable Signed QR Code Canvas (High Contrast, Large Blocks, Level L) */}
        <div 
          ref={canvasContainerRef}
          className="bg-white p-3.5 rounded-2xl shadow-xl flex flex-col items-center justify-center mx-auto w-fit"
        >
          <QRCodeCanvas
            value={scannableJsonString}
            size={245}
            level="L"
            includeMargin={true}
          />
          <div className="text-center mt-1">
            <span className="text-[9px] text-slate-600 font-mono font-bold tracking-tight block">
              HMAC-SHA256 SIGNED • {voucherObj.tx_id}
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
              ? 'ಈ QR ಅನ್ನು ಸ್ವೀಕರಿಸುವವರು ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ತಕ್ಷಣ ಹಣ ಅವರ ವಾಲೆಟ್‌ಗೆ ಜಮೆಯಾಗುತ್ತದೆ. ನೀವು ಮರಳಿ ಆನ್‌ಲೈನ್‌ಗೆ ಬಾರದಿದ್ದರೂ ಹಣ ಅವರದ್ದೇ ಆಗಿರುತ್ತದೆ!'
              : 'Receiver scans this signed QR code to immediately credit funds into their safe wallet, even if you never reconnect!'}
          </p>
        </div>

        {/* Action Buttons: Download Voucher QR PNG & Done */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>{language === 'kn' ? 'QR ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' : 'Download Voucher QR PNG'}</span>
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

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md"
        >
          {language === 'kn' ? 'ಮುಗಿಯಿತು' : 'Done'}
        </button>

      </div>
    </div>
  );
}