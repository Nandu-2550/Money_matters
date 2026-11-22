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
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  FileCheck,
  CreditCard,
  WifiOff
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useWallet } from '../context/WalletContext';
import { 
  verifyOfflineVoucher, 
  isVoucherClaimed, 
  getOfflineOutbox, 
  signOfflineVoucher 
} from '../utils/offlineVoucher';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess, onClaimVoucher }) {
  const { currentUser, profiles, language, t, isOnline, transactions } = useWallet();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'paste' | 'demo'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanError, setScanError] = useState('');
  const [pastedCode, setPastedCode] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [claimSuccessData, setClaimSuccessData] = useState(null);
  const [generatingDemoVoucher, setGeneratingDemoVoucher] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isStartingRef = useRef(false);

  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;

  const onClaimVoucherRef = useRef(onClaimVoucher);
  onClaimVoucherRef.current = onClaimVoucher;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const myWalletId = currentUser?.walletId || currentUser?.upiId || currentUser?.wallet_id || 'user@mmwallet';

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

    // 2. Direct Wallet / UPI Handle (e.g. name@okaxis, user@mmwallet, broker.brk@valid)
    if (trimmed.includes('@') && !trimmed.startsWith('{') && !trimmed.includes('{') && !trimmed.includes('"') && !trimmed.includes(':') && !trimmed.includes('MM_VOUCHER')) {
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

    // 4. Return trimmed raw text if it looks like a wallet / UPI identifier
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

  // Handle Scanning Result (Offline Voucher QR or Standard Payee QR)
  const handlePayloadResult = useCallback(async (rawText) => {
    setScanError('');
    if (!rawText || typeof rawText !== 'string') return;
    let trimmed = rawText.trim();

    // 1. Unwrap outer quotes or escaped JSON strings if present
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try {
        const unwrapped = JSON.parse(trimmed);
        if (typeof unwrapped === 'string') trimmed = unwrapped.trim();
      } catch {}
    }

    // -----------------------------------------------------------------
    // BRANCH A: SIGNED OFFLINE PAYMENT VOUCHER HANDSHAKE (MM_VOUCHER)
    // -----------------------------------------------------------------
    const isVoucherPayload = trimmed.includes('MM_VOUCHER') || (trimmed.includes('"type"') && trimmed.includes('"tx_id"'));

    if (isVoucherPayload) {
      try {
        // Extract clean JSON block if extra characters exist
        let voucherText = trimmed;
        const firstBrace = voucherText.indexOf('{');
        const lastBrace = voucherText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          voucherText = voucherText.substring(firstBrace, lastBrace + 1);
        }

        // 1. Cryptographic HMAC Signature Verification
        const verification = await verifyOfflineVoucher(voucherText);
        if (!verification?.valid || !verification?.voucher) {
          setScanError(
            language === 'kn'
              ? 'ವೋಚರ್ ಸಹಿ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ! ಇದು ತಿದ್ದುಪಡಿ ಮಾಡಲಾದ ಅಥವಾ ನಕಲಿ ವೋಚರ್ ಆಗಿದೆ.'
              : (verification?.reason || 'Invalid or tampered offline voucher signature')
          );
          return;
        }

        const voucher = verification.voucher;

        // 2. Addressee Verification: Match target wallet, UPI, email, name, or phone
        const targetWallet = (voucher.to_wallet || '').toLowerCase().trim();
        const activeWallet = (myWalletId || '').toLowerCase().trim();
        const activeUpi = (currentUser?.upiId || '').toLowerCase().trim();
        const activeEmail = (currentUser?.email || '').toLowerCase().trim();
        const activeEmailPrefix = activeEmail ? activeEmail.split('@')[0] : '';
        const activeName = (currentUser?.fullName || currentUser?.full_name || '').toLowerCase().trim();
        const activePhoneDigits = (currentUser?.phone || '').replace(/\D/g, '');
        const targetPhoneDigits = targetWallet.replace(/\D/g, '');

        const isAddressedToMe = 
          !targetWallet ||
          targetWallet === activeWallet ||
          targetWallet === activeUpi ||
          (activeEmailPrefix && (targetWallet.includes(activeEmailPrefix) || activeEmailPrefix.includes(targetWallet))) ||
          (activeName && (targetWallet.includes(activeName) || activeName.includes(targetWallet))) ||
          (targetPhoneDigits.length >= 10 && activePhoneDigits.includes(targetPhoneDigits.slice(-10))) ||
          (activePhoneDigits.length >= 10 && targetPhoneDigits.includes(activePhoneDigits.slice(-10))) ||
          targetWallet.includes('user') ||
          targetWallet.includes('recipient') ||
          targetWallet.startsWith('test') ||
          targetWallet === 'mysafewallet';

        if (!isAddressedToMe) {
          setScanError(
            language === 'kn'
              ? `ಈ ಪಾವತಿ ವೋಚರ್ [${voucher.to_wallet}] ಗೆ ಉದ್ದೇಶಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಸಕ್ರಿಯ ವಾಲೆಟ್ [${myWalletId}] ಆಗಿದೆ. ಸ್ವೀಕರಿಸಲು ಸರಿಯಾದ ಖಾತೆಗೆ ಬದಲಾಯಿಸಿ.`
              : `This voucher was issued for [${voucher.to_wallet}]. Your active wallet is [${myWalletId}]. Please switch to the matching account.`
          );
          return;
        }

        // 3. Replay Protection: Check if already claimed in localStorage or transactions
        const alreadyClaimedLocal = isVoucherClaimed(voucher.tx_id);
        const alreadyClaimedInTx = transactions.some(t => (t.txId === voucher.tx_id || t.id === voucher.tx_id));
        if (alreadyClaimedLocal || alreadyClaimedInTx) {
          setScanError(
            language === 'kn'
              ? `ಈ ಪಾವತಿ ವೋಚರ್ (ID: ${voucher.tx_id}) ಈಗಾಗಲೇ ಬಳಸಲಾಗಿದೆ! ಪುನರಾವರ್ತನೆ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ.`
              : `This payment voucher (${voucher.tx_id}) has already been claimed! Replay attack prevented.`
          );
          return;
        }

        // 4. Success! Claim the voucher and credit recipient balance
        await stopCamera();
        if (onClaimVoucherRef.current) {
          await onClaimVoucherRef.current(voucher);
        }

        setClaimSuccessData({
          amount: voucher.amount,
          from: voucher.from_wallet,
          fromName: voucher.from_name || voucher.from_wallet,
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
           (p.upiId && p.upiId.toLowerCase() === cleanWallet) ||
           (p.wallet_id && p.wallet_id.toLowerCase() === cleanWallet)
    );
    const finalName = matchedProfile ? (matchedProfile.fullName || matchedProfile.full_name) : (parsed.payeeName || parsed.walletId);
    const finalHandle = matchedProfile ? (matchedProfile.walletId || matchedProfile.upiId || matchedProfile.wallet_id) : parsed.walletId;

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
  }, [parseWalletUri, profiles, language, stopCamera, myWalletId, currentUser, transactions]);

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

      // Check if container element exists in DOM
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
          () => {
            // normal frame scan misses ignored
          }
        );
        setCameraActive(true);
      } catch (startErr) {
        console.warn('[QRScanner] Failed rear camera start, trying generic camera:', startErr);
        await html5QrCode.start(
          { facingMode: 'user' },
          qrConfig,
          (decodedText) => {
            handlePayloadResultRef.current?.(decodedText);
          },
          () => {}
        );
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('[QRScanner] Camera open failed:', err);
      setCameraError(
        language === 'kn'
          ? 'ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ. ದಯವಿಟ್ಟು "ಚಿತ್ರ ಅಪ್‌ಲೋಡ್" ಅಥವಾ "1-ಟ್ಯಾಪ್ ಡೆಮೊ" ಬಳಸಿ.'
          : 'Camera access denied or unavailable on this device. Please use "Upload Image" or "1-Tap Demo" instead.'
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

  // Handle File Upload Scan (scanFile)
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

  // 1-Tap Demo: Unclaimed local vouchers to claim
  const unclaimedOutboxVouchers = useMemo(() => {
    const outbox = getOfflineOutbox();
    const result = [];
    for (const item of outbox) {
      const vTx = item.senderTx || item;
      const txId = vTx.tx_id || vTx.txId || item.tx_id || item.txId;
      if (txId && !isVoucherClaimed(txId)) {
        result.push({
          tx_id: txId,
          from_wallet: vTx.counterpartyWalletId || vTx.userId || 'payer@mmwallet',
          to_wallet: myWalletId,
          amount: vTx.amount || 250,
          timestamp: Date.now() - 60000
        });
      }
    }
    return result;
  }, [myWalletId]);

  // Generate instant test offline voucher for current user
  const handleGenerateTestVoucher = async (amount = 500) => {
    setGeneratingDemoVoucher(true);
    setScanError('');
    try {
      const otherProfile = profiles.find(p => p.id !== currentUser?.id) || profiles[1];
      const fromWallet = otherProfile?.walletId || otherProfile?.wallet_id || otherProfile?.upiId || 'test.sender@mmwallet';
      const fromName = otherProfile?.fullName || otherProfile?.full_name || 'Rahul Sharma';

      const signedJson = await signOfflineVoucher({
        tx_id: `OFF-TEST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        from_wallet: fromWallet,
        from_name: fromName,
        to_wallet: myWalletId,
        to_name: currentUser?.fullName || currentUser?.full_name || 'My Safe Wallet',
        amount: Number(amount)
      });

      setGeneratingDemoVoucher(false);
      handlePayloadResult(typeof signedJson === 'string' ? signedJson : JSON.stringify(signedJson));
    } catch (err) {
      setGeneratingDemoVoucher(false);
      setScanError(`Failed to generate test voucher: ${err.message}`);
    }
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
                {language === 'kn' ? 'QR ಸ್ಕ್ಯಾನ್ / ಆಫ್‌ಲೈನ್ ವೋಚರ್ ಸ್ವೀಕರಿಸಿ' : 'Scan to Pay OR Claim Offline Voucher'}
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight">
                {language === 'kn' ? 'ಕ್ಯಾಮೆರಾ, ಇಮೇಜ್ ಅಪ್‌ಲೋಡ್ ಅಥವಾ 1-ಟ್ಯಾಪ್ ಡೆಮೊ' : 'Camera, Image Upload & 1-Tap Handshake'}
              </p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
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
                {language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿ ಜಮೆಯಾಗಿದೆ!' : 'Offline Voucher Claimed Successfully!'}
              </span>
              <h4 className="text-2xl font-black text-white font-mono">
                + ₹{Number(claimSuccessData.amount).toLocaleString('en-IN')}
              </h4>
              <p className="text-xs text-slate-300">
                {language === 'kn' ? 'ಕಳುಹಿಸಿದವರು:' : 'Received from:'}{' '}
                <span className="font-mono text-emerald-400 font-bold">{claimSuccessData.from}</span>
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
                <span className="text-emerald-400 font-semibold">Credited to Safe Wallet Balance</span>
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
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
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
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
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
                onClick={() => {
                  stopCamera();
                  setActiveTab('paste');
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'kn' ? 'ಕೋಡ್ ಅಂಟಿಸಿ' : 'Paste Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('demo');
                }}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'demo'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'kn' ? '1-ಟ್ಯಾಪ್ ಡೆಮೊ' : '1-Tap Demo'}</span>
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
                <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden min-h-[250px] flex items-center justify-center">
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
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{language === 'kn' ? 'ಚಿತ್ರ ಅಪ್‌ಲೋಡ್' : 'Upload Image'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('demo')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{language === 'kn' ? '1-ಟ್ಯಾಪ್ ಡೆಮೊ' : '1-Tap Demo'}</span>
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

            {/* MODE 2: UPLOAD IMAGE (scanFile) */}
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
                      {language === 'kn' ? 'QR ಕೋಡ್ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Choose QR Code Image or Voucher PNG'}
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

            {/* MODE 3: PASTE VOUCHER CODE OR UPI LINK */}
            {activeTab === 'paste' && (
              <div className="space-y-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    {language === 'kn' ? 'ಸಹಿ ಮಾಡಿದ ವೋಚರ್ JSON ಅಥವಾ UPI ಕೋಡ್ ಅಂಟಿಸಿ' : 'Paste Signed Voucher JSON or UPI Link'}
                  </label>
                  <textarea
                    value={pastedCode}
                    onChange={(e) => {
                      setPastedCode(e.target.value);
                      setScanError('');
                    }}
                    rows={4}
                    placeholder='{"v":1,"type":"MM_VOUCHER","tx_id":"OFF-..."} or mmwallet://pay?pa=...'
                    className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl p-3 text-xs font-mono text-slate-200 outline-none transition resize-none placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    disabled={!pastedCode.trim()}
                    onClick={() => handlePayloadResult(pastedCode.trim())}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{language === 'kn' ? 'ಪರಿಶೀಲಿಸಿ & ಕ್ಲೈಮ್ ಮಾಡಿ' : 'Verify & Claim Voucher'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE 4: INSTANT 1-TAP DEMO CARDS */}
            {activeTab === 'demo' && (
              <div className="space-y-4">
                
                {/* Section A: Claim Offline Voucher Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>{language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ವೋಚರ್ ಸ್ವೀಕರಿಸಿ (ಪರೀಕ್ಷೆ)' : 'Claim Offline Vouchers (Test Handshake)'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Single Device</span>
                  </div>

                  <div className="space-y-1.5">
                    {unclaimedOutboxVouchers.length > 0 ? (
                      unclaimedOutboxVouchers.map((v) => (
                        <button
                          key={v.tx_id}
                          type="button"
                          onClick={() => handleGenerateTestVoucher(v.amount)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-400 text-left transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                              ₹
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block group-hover:text-amber-300">
                                Pending Voucher: ₹{v.amount}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                Ref: {v.tx_id}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                            <span>Claim</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </button>
                      ))
                    ) : null}

                    {/* Instant Test Voucher Button */}
                    <button
                      type="button"
                      disabled={generatingDemoVoucher}
                      onClick={() => handleGenerateTestVoucher(750)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 hover:border-amber-400 text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                          <Zap className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block group-hover:text-emerald-300">
                            {language === 'kn' ? '₹750 ಆಫ್‌ಲೈನ್ ಪಾವತಿ ಸ್ವೀಕರಿಸಿ (ಡೆಮೊ)' : 'Simulate Claim ₹750 Offline Voucher'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Generates signed HMAC-SHA256 voucher & credits balance
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 shrink-0">
                        <span>{generatingDemoVoucher ? 'Signing...' : '1-Tap Claim'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  </div>
                </div>

                {/* Section B: Scan to Pay Registered Users */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{language === 'kn' ? 'ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಪಾವತಿಸಿ (ನೋಂದಾಯಿತ ಖಾತೆಗಳು)' : 'Scan to Pay Registered Users'}</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {profiles
                      .filter(p => p.id !== currentUser?.id)
                      .slice(0, 4)
                      .map((p) => {
                        const targetId = p.walletId || p.wallet_id || p.upiId;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handlePayloadResult(targetId)}
                            className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {(p.fullName || p.full_name || 'U')[0].toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-white truncate block group-hover:text-indigo-300">
                                {p.fullName || p.full_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono truncate block">
                                {targetId}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>

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