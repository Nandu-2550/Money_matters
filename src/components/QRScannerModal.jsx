import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  Landmark, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const { currentUser, profiles, language, t } = useWallet();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'demo'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanError, setScanError] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Other registered users for instant 1-click test cards
  const otherUsers = profiles.filter(p => p.id !== currentUser?.id);

  // Parse UPI Payload
  const parseUpiPayload = useCallback((rawText) => {
    if (!rawText || typeof rawText !== 'string') return null;

    const trimmed = rawText.trim();

    // 1. Check for standard upi://pay URI
    if (trimmed.startsWith('upi://pay')) {
      try {
        const dummyUrl = new URL(trimmed.replace('upi://pay', 'http://dummy.com'));
        const pa = dummyUrl.searchParams.get('pa') || '';
        const pn = dummyUrl.searchParams.get('pn') || '';
        const am = dummyUrl.searchParams.get('am') || '';
        return {
          upiId: pa.trim(),
          payeeName: decodeURIComponent(pn).trim(),
          amount: am.trim()
        };
      } catch {
        const paMatch = trimmed.match(/[?&]pa=([^&]+)/);
        const pnMatch = trimmed.match(/[?&]pn=([^&]+)/);
        const amMatch = trimmed.match(/[?&]am=([^&]+)/);
        return {
          upiId: paMatch ? decodeURIComponent(paMatch[1]).trim() : '',
          payeeName: pnMatch ? decodeURIComponent(pnMatch[1]).trim() : '',
          amount: amMatch ? decodeURIComponent(amMatch[1]).trim() : ''
        };
      }
    }

    // 2. Direct UPI Handle (e.g. anjaneya@oksbi or broker.brk@validhdfc)
    if (trimmed.includes('@')) {
      return {
        upiId: trimmed,
        payeeName: '',
        amount: ''
      };
    }

    return null;
  }, []);

  // Validate Closed-Loop Recipient
  const handlePayloadResult = useCallback((rawText) => {
    setScanError('');
    const parsed = parseUpiPayload(rawText);

    if (!parsed || !parsed.upiId) {
      setScanError(
        language === 'kn'
          ? 'ಅಮಾನ್ಯವಾದ QR ಕೋಡ್! ಮಾನ್ಯವಾದ UPI QR ಕೋಡ್ ಅನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.'
          : 'Invalid QR code. Please scan a valid UPI payment QR.'
      );
      return;
    }

    const cleanUpi = parsed.upiId.toLowerCase();

    // Closed Loop Verification:
    // Must be in registered profiles, or SEBI @valid handle, or a preset test handle
    const sebiRegex = /^[a-zA-Z0-9._-]+\.(brk|mf|dp|pms|ra|ia)@valid[a-zA-Z]+$/i;
    const isRegisteredProfile = profiles.some(p => p.upiId.toLowerCase() === cleanUpi);
    const isValidSebi = sebiRegex.test(cleanUpi);
    const isTestPreset = cleanUpi.includes('store') || cleanUpi.includes('vip') || cleanUpi.includes('buyer') || cleanUpi.includes('zerodha');

    if (!isRegisteredProfile && !isValidSebi && !isTestPreset) {
      setScanError(
        language === 'kn'
          ? `ಸ್ವೀಕರಿಸುವವರು (${cleanUpi}) ಮನಿ ಮ್ಯಾಟರ್ಸ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿಲ್ಲ. ಮುಚ್ಚಿದ-ಲೂಪ್ ವರ್ಗಾವಣೆಗಳಿಗೆ ನೋಂದಾಯಿತ ಖಾತೆ ಅಗತ್ಯವಿದೆ.`
          : `Recipient (${cleanUpi}) is not registered on Money Matters. Closed-loop P2P requires a registered user or verified SEBI handle.`
      );
      return;
    }

    // Lookup payee details if profile exists
    const matchedProfile = profiles.find(p => p.upiId.toLowerCase() === cleanUpi);
    const finalName = matchedProfile ? matchedProfile.fullName : (parsed.payeeName || parsed.upiId);

    // Success! Stop camera if running, then trigger callback
    stopCamera();
    onScanSuccess({
      upiId: parsed.upiId,
      payeeName: finalName,
      amount: parsed.amount || ''
    });
    onClose();
  }, [parseUpiPayload, profiles, language, onScanSuccess, onClose]);

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // ignore already stopped
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start Live Camera
  const startCamera = useCallback(async () => {
    setCameraError('');
    setScanError('');

    try {
      if (scannerRef.current) {
        await stopCamera();
      }

      const html5QrCode = new Html5Qrcode('qr-camera-element');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handlePayloadResult(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame errors
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.warn('[QRScanner] Camera start failed:', err);
      setCameraActive(false);
      setCameraError(
        language === 'kn'
          ? 'ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು "QR ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ" ಅಥವಾ "ತ್ವರಿತ ಡೆಮೊ QR" ಬಳಸಿ.'
          : 'Camera unavailable or permission denied. Please use "Upload QR Image" or "Quick Demo QR".'
      );
    }
  }, [stopCamera, handlePayloadResult, language]);

  // Tab change handler
  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Handle File Upload Scan
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError('');
    setIsProcessingFile(true);

    try {
      const fileScanner = new Html5Qrcode('qr-file-dummy');
      const decodedText = await fileScanner.scanFile(file, true);
      setIsProcessingFile(false);
      handlePayloadResult(decodedText);
    } catch (err) {
      setIsProcessingFile(false);
      setScanError(
        language === 'kn'
          ? 'ಈ ಚಿತ್ರದಲ್ಲಿ QR ಕೋಡ್ ಓದಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಸ್ಪಷ್ಟವಾದ QR ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.'
          : 'Could not read a valid QR code from this image. Please ensure the QR is clear and well-lit.'
      );
    }
  };

  // Close handler
  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {language === 'kn' ? 'ಯಾವುದೇ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Scan Any QR Code'}
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                {language === 'kn' ? 'ಕ್ಯಾಮೆರಾ, ಇಮೇಜ್ ಅಥವಾ ತ್ವರಿತ ಡೆಮೊ QR' : '3-Mode Camera, Image & Demo Scanner'}
              </p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Mode Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'camera'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಲೈವ್ ಕ್ಯಾಮೆರಾ' : 'Live Camera'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'upload'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{language === 'kn' ? 'ಚಿತ್ರ ಅಪ್‌ಲೋಡ್' : 'Upload Image'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'demo'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'kn' ? 'ಡೆಮೊ QR' : 'Demo QR'}</span>
          </button>
        </div>

        {/* Scan Error Banner */}
        {scanError && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{scanError}</span>
          </div>
        )}

        {/* MODE 1: LIVE CAMERA */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden min-h-[260px] flex items-center justify-center">
              {/* HTML5 QrCode Container */}
              <div id="qr-camera-element" className="w-full h-full max-w-[280px] mx-auto" />

              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center bg-slate-950/90">
                  <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">
                    {language === 'kn' ? 'ಕ್ಯಾಮೆರಾ ಆರಂಭಿಸಲಾಗುತ್ತಿದೆ...' : 'Initializing Camera...'}
                  </span>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-5 text-center bg-slate-950">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                  <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                    {cameraError}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{language === 'kn' ? 'ಚಿತ್ರ ಅಪ್‌ಲೋಡ್' : 'Upload Image'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('demo')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{language === 'kn' ? 'ಡೆಮೊ QR ಕಾರ್ಡ್ಸ್' : 'Demo Cards'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              {language === 'kn'
                ? 'ಕ್ಯಾಮೆರಾವನ್ನು ಯಾವುದೇ UPI QR ಕೋಡ್‌ನ ಮುಂದೆ ಹಿಡಿಯಿರಿ'
                : 'Point camera at any UPI QR code to auto-detect and transfer'}
            </p>
          </div>
        )}

        {/* MODE 2: UPLOAD IMAGE */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-3xl p-7 text-center cursor-pointer transition bg-slate-950/60 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">
                  {language === 'kn' ? 'QR ಕೋಡ್ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Choose QR Code Image'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {language === 'kn' ? 'PNG, JPG ಅಥವಾ ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ಬೆಂಬಲಿಸುತ್ತದೆ' : 'Supports PNG, JPG, or Screenshots'}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {isProcessingFile && (
              <div className="text-center text-xs text-indigo-400 flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>
                  {language === 'kn' ? 'ಚಿತ್ರವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Scanning image payload...'}
                </span>
              </div>
            )}

            {/* Hidden dummy container for HTML5 QR code file parser */}
            <div id="qr-file-dummy" className="hidden" />
          </div>
        )}

        {/* MODE 3: INSTANT DEMO QR CARDS */}
        {activeTab === 'demo' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400">
              {language === 'kn'
                ? 'ತ್ವರಿತ ಪರೀಕ್ಷೆಗಾಗಿ ಕೆಳಗಿನ ಯಾವುದೇ ನೋಂದಾಯಿತ ಬಳಕೆದಾರರ QR ಕಾರ್ಡ್ ಕ್ಲಿಕ್ ಮಾಡಿ:'
                : 'Click any registered Money Matters profile QR to simulate an instant scan:'}
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {otherUsers.map((user) => {
                const userUpiUri = `upi://pay?pa=${user.upiId}&pn=${encodeURIComponent(user.fullName)}&cu=INR`;
                return (
                  <div
                    key={user.id}
                    onClick={() => handlePayloadResult(userUpiUri)}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Mini QR Preview Canvas */}
                      <div className="bg-white p-1 rounded-xl shrink-0 shadow-sm">
                        <QRCodeCanvas
                          value={userUpiUri}
                          size={46}
                          level="M"
                        />
                      </div>

                      <div className="truncate">
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition truncate">
                          {user.fullName}
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-400 block truncate">
                          {user.upiId}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Landmark className="w-2.5 h-2.5" />
                          {user.bankName} •••• {user.accountLast4}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold group-hover:bg-indigo-500 group-hover:text-slate-950 transition shrink-0 flex items-center gap-1"
                    >
                      <span>{language === 'kn' ? 'ಸ್ಕ್ಯಾನ್' : 'Scan'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Safety compliance notice */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Closed-Loop P2P Security</span>
          </span>
          <span>Never reveals real bank PIN</span>
        </div>

      </div>
    </div>
  );
}
