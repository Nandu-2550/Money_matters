import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ShieldCheck,
  Zap,
  FileCheck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useWallet } from '../context/WalletContext';
import { verifyOfflineVoucher, isVoucherClaimed } from '../utils/offlineVoucher';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess, onClaimVoucher }) {
  const { currentUser, profiles, language, t } = useWallet();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanError, setScanError] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [claimSuccessData, setClaimSuccessData] = useState(null);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStartingRef = useRef(false);

  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;

  const onClaimVoucherRef = useRef(onClaimVoucher);
  onClaimVoucherRef.current = onClaimVoucher;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const myWalletId = currentUser?.walletId || currentUser?.upiId || 'user@mmwallet';

  // Parse UPI or MM Wallet URI (Case-insensitive & resilient)
  const parseWalletUri = useCallback((rawText) => {
    if (!rawText || typeof rawText !== 'string') return null;
    const trimmed = rawText.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check for mmwallet://pay or upi://pay URI
    if (lower.startsWith('mmwallet://pay') || lower.startsWith('upi://pay')) {
      try {
        const dummyUrl = new URL(trimmed.replace(/^(mmwallet|upi):\/\/pay/i, 'http://dummy.com'));
        let pa = '', pn = '', am = '';
        for (const [k, v] of dummyUrl.searchParams.entries()) {
          const kl = k.toLowerCase();
          if (kl === 'pa') pa = v;
          if (kl === 'pn') pn = v;
          if (kl === 'am') am = v;
        }
        if (pa) {
          return {
            walletId: pa.trim(),
            payeeName: decodeURIComponent(pn || pa).trim(),
            amount: am.trim()
          };
        }
      } catch {
        const paMatch = trimmed.match(/[?&]pa=([^&]+)/i);
        const pnMatch = trimmed.match(/[?&]pn=([^&]+)/i);
        const amMatch = trimmed.match(/[?&]am=([^&]+)/i);
        if (paMatch) {
          return {
            walletId: decodeURIComponent(paMatch[1]).trim(),
            payeeName: pnMatch ? decodeURIComponent(pnMatch[1]).trim() : decodeURIComponent(paMatch[1]).trim(),
            amount: amMatch ? decodeURIComponent(amMatch[1]).trim() : ''
          };
        }
      }
    }

    // 2. Direct Wallet / UPI Handle (e.g. name@okaxis, user@mmwallet)
    if (trimmed.includes('@') && !trimmed.startsWith('{')) {
      return {
        walletId: trimmed,
        payeeName: trimmed.split('@')[0],
        amount: ''
      };
    }

    // 3. Raw URL that contains pa= (e.g. https://.../?pa=...)
    if (lower.includes('pa=')) {
      const paMatch = trimmed.match(/[?&]pa=([^&]+)/i);
      const pnMatch = trimmed.match(/[?&]pn=([^&]+)/i);
      const amMatch = trimmed.match(/[?&]am=([^&]+)/i);
      if (paMatch) {
        return {
          walletId: decodeURIComponent(paMatch[1]).trim(),
          payeeName: pnMatch ? decodeURIComponent(pnMatch[1]).trim() : decodeURIComponent(paMatch[1]).trim(),
          amount: amMatch ? decodeURIComponent(amMatch[1]).trim() : ''
        };
      }
    }

    // 4. Return trimmed raw text if it looks like an identifier
    if (trimmed.length > 2 && !trimmed.startsWith('{')) {
      return {
        walletId: trimmed,
        payeeName: trimmed,
        amount: ''
      };
    }

    return null;
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    isStartingRef.current = false;
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        // ignore already stopped
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Handle Scanning Result (Dual Mode: Offline Voucher QR or Standard Payee QR)
  const handlePayloadResult = useCallback(async (rawText) => {
    setScanError('');
    if (!rawText || typeof rawText !== 'string') return;
    const trimmed = rawText.trim();

    // -----------------------------------------------------------------
    // BRANCH A: SIGNED OFFLINE PAYMENT VOUCHER HANDSHAKE (MM_VOUCHER)
    // -----------------------------------------------------------------
    if (trimmed.startsWith('{') && trimmed.includes('MM_VOUCHER')) {
      try {
        const voucher = JSON.parse(trimmed);
        const hasSig = voucher.sig || voucher.signature;
        if (voucher.type !== 'MM_VOUCHER' || !voucher.tx_id || !hasSig) {
          throw new Error('Malformed voucher schema');
        }

        // 1. Cryptographic HMAC Signature Verification
        const verification = await verifyOfflineVoucher(voucher);
        if (!verification?.valid) {
          setScanError(
            language === 'kn'
              ? 'ವೋಚರ್ ಸಹಿ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ! ಇದು ತಿದ್ದುಪಡಿ ಮಾಡಲಾದ ಅಥವಾ ನಕಲಿ ವೋಚರ್ ಆಗಿದೆ.'
              : (verification?.reason || 'Voucher cryptographic verification failed! Signature mismatch or invalid voucher secret.')
          );
          return;
        }

        // 2. Addressee Verification: Must match current user's wallet ID
        const targetWallet = (voucher.to_wallet || '').toLowerCase();
        const activeWallet = myWalletId.toLowerCase();
        if (targetWallet !== activeWallet) {
          setScanError(
            language === 'kn'
              ? `ಈ ವೋಚರ್ ${voucher.to_wallet} ಗೆ ಉದ್ದೇಶಿಸಲಾಗಿದೆ, ಆದರೆ ನಿಮ್ಮ ಸಕ್ರಿಯ ವಾಲೆಟ್ ${myWalletId} ಆಗಿದೆ.`
              : `Voucher is addressed to ${voucher.to_wallet}, but your active safe wallet is ${myWalletId}.`
          );
          return;
        }

        // 3. Replay Protection: Check if already claimed
        if (isVoucherClaimed(voucher.tx_id)) {
          setScanError(
            language === 'kn'
              ? `ಈ ಪಾವತಿ ವೋಚರ್ (ID: ${voucher.tx_id}) ಈಗಾಗಲೇ ಬಳಸಲಾಗಿದೆ! ಪುನರಾವರ್ತನೆ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ.`
              : `This payment voucher (ID: ${voucher.tx_id}) has already been claimed! Replay attack prevented.`
          );
          return;
        }

        // 4. Success! Claim the voucher
        await stopCamera();
        if (onClaimVoucherRef.current) {
          await onClaimVoucherRef.current(voucher);
        }

        setClaimSuccessData({
          amount: voucher.amount,
          from: voucher.from_wallet,
          txId: voucher.tx_id,
          timestamp: new Date(voucher.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        return;
      } catch (err) {
        setScanError(
          language === 'kn'
            ? 'ಅಮಾನ್ಯ ವೋಚರ್ ಡೇಟಾ. ಮಾನ್ಯವಾದ ಸಹಿ ಮಾಡಿದ ಆಫ್‌ಲೈನ್ ಪಾವತಿ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.'
            : `Could not parse payment voucher: ${err.message}`
        );
        return;
      }
    }

    // -----------------------------------------------------------------
    // BRANCH B: STANDARD RECIPIENT WALLET / UPI QR CODE
    // -----------------------------------------------------------------
    const parsed = parseWalletUri(trimmed);

    if (!parsed || !parsed.walletId) {
      setScanError(
        language === 'kn'
          ? 'ಅಮಾನ್ಯವಾದ QR ಕೋಡ್! ಮಾನ್ಯವಾದ ವಾಲೆಟ್ ಅಥವಾ UPI QR ಕೋಡ್ ಅನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.'
          : 'Could not extract a valid UPI ID or Wallet handle from this QR code.'
      );
      return;
    }

    const cleanWallet = parsed.walletId.toLowerCase();

    // Lookup payee details if profile exists
    const matchedProfile = profiles.find(
      p => (p.walletId && p.walletId.toLowerCase() === cleanWallet) ||
           (p.upiId && p.upiId.toLowerCase() === cleanWallet)
    );
    const finalName = matchedProfile ? matchedProfile.fullName : (parsed.payeeName || parsed.walletId);
    const finalHandle = matchedProfile ? (matchedProfile.walletId || matchedProfile.upiId) : parsed.walletId;

    // Success! Stop camera if running, then trigger callback
    await stopCamera();
    if (onScanSuccessRef.current) {
      onScanSuccessRef.current({
        upiId: finalHandle,
        walletId: finalHandle,
        payeeName: finalName,
        amount: parsed.amount || ''
      });
    }
    onCloseRef.current?.();
  }, [parseWalletUri, profiles, language, stopCamera, myWalletId]);

  const handlePayloadResultRef = useRef(handlePayloadResult);
  handlePayloadResultRef.current = handlePayloadResult;

  // Start Live Camera
  const startCamera = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError('');
    setScanError('');

    try {
      await stopCamera();

      // Check if container element exists in DOM (with wait if mounting)
      let elem = document.getElementById('qr-camera-element');
      if (!elem) {
        await new Promise(r => setTimeout(r, 100));
        elem = document.getElementById('qr-camera-element');
      }
      if (!elem) {
        isStartingRef.current = false;
        return;
      }

      const html5QrCode = new Html5Qrcode('qr-camera-element');
      scannerRef.current = html5QrCode;

      // Select camera: prefers rear camera on mobile, desktop webcam on laptop
      let cameraConfig = { facingMode: 'environment' };
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
          cameraConfig = backCam ? backCam.id : devices[0].id;
        }
      } catch (camErr) {
        console.warn('[QRScanner] Camera enumeration note:', camErr);
      }

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.75);
          return {
            width: Math.max(size, 180),
            height: Math.max(size, 180)
          };
        },
        aspectRatio: 1.0
      };

      try {
        await html5QrCode.start(
          cameraConfig,
          qrConfig,
          (decodedText) => {
            handlePayloadResultRef.current?.(decodedText);
          },
          () => {}
        );
      } catch (firstErr) {
        console.warn('[QRScanner] Primary camera config failed, attempting user camera fallback:', firstErr);
        // Fallback for laptops/desktops where rear/environment camera is absent
        await html5QrCode.start(
          { facingMode: 'user' },
          qrConfig,
          (decodedText) => {
            handlePayloadResultRef.current?.(decodedText);
          },
          () => {}
        );
      }

      setCameraActive(true);
    } catch (err) {
      console.warn('[QRScanner] Camera start failed:', err);
      setCameraActive(false);
      setCameraError(
        language === 'kn'
          ? 'ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್" ಬಳಸಿ.'
          : (err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera permissions in your browser, or use "Upload Image".'
              : 'Camera unavailable or not detected. Please use "Upload Image".')
      );
    } finally {
      isStartingRef.current = false;
    }
  }, [stopCamera, language]);

  // Tab change & open/close handler
  useEffect(() => {
    let timer;
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (activeTab === 'camera') {
      timer = setTimeout(() => {
        startCamera();
      }, 50);
    } else {
      stopCamera();
    }

    return () => {
      clearTimeout(timer);
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
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fileScanner.clear().catch(() => {});
      handlePayloadResultRef.current?.(decodedText);
    } catch (err) {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    setClaimSuccessData(null);
    setScanError('');
    setCameraError('');
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
                {language === 'kn' ? 'ಯಾವುದೇ QR / ವೋಚರ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ' : 'Scan Wallet QR or Payment Voucher'}
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                {language === 'kn' ? '3-ಮೋಡ್ ಸ್ಕ್ಯಾನರ್ + ಆಫ್‌ಲೈನ್ ವೋಚರ್ ಹ್ಯಾಂಡ್‌ಶೇಕ್' : '3-Mode Camera, Image & Offline Handshake'}
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

        {/* Claim Success Celebration Overlay */}
        {claimSuccessData ? (
          <div className="p-6 bg-slate-950 border border-emerald-500/40 rounded-3xl text-center space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <Zap className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400">
                {language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಪಾವತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ!' : 'Offline Voucher Claimed!'}
              </span>
              <h4 className="text-2xl font-black text-white font-mono">
                + ₹{Number(claimSuccessData.amount).toLocaleString('en-IN')}
              </h4>
              <p className="text-xs text-slate-300">
                {language === 'kn' ? 'ಕಳುಹಿಸಿದವರು:' : 'Received from:'}{' '}
                <span className="font-mono text-emerald-400">{claimSuccessData.from}</span>
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-[11px] text-left space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Voucher Ref:</span>
                <span className="font-mono text-slate-200">{claimSuccessData.txId}</span>
              </div>
              <div className="flex justify-between">
                <span>Handshake Time:</span>
                <span className="text-slate-200">{claimSuccessData.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span>Settlement:</span>
                <span className="text-emerald-400 font-semibold">Credited to Safe Wallet</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md"
            >
              {language === 'kn' ? 'ವಾಲೆಟ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Safe Wallet'}
            </button>
          </div>
        ) : (
          <>
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
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  {language === 'kn'
                    ? 'ಕ್ಯಾಮೆರಾವನ್ನು ಯಾವುದೇ ವಾಲೆಟ್ QR ಅಥವಾ ಸಹಿ ಮಾಡಿದ ಆಫ್‌ಲೈನ್ ವೋಚರ್ QR ನ ಮುಂದೆ ಹಿಡಿಯಿರಿ'
                    : 'Point camera at any Wallet QR or Signed Offline Voucher QR'}
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

                <div id="qr-file-dummy" className="w-0 h-0 overflow-hidden" />
              </div>
            )}
          </>
        )}

        {/* Safety compliance notice */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Standalone Safe-Wallet & Offline Cryptography</span>
          </span>
          <span>Zero bank account exposure</span>
        </div>

      </div>
    </div>
  );
}
