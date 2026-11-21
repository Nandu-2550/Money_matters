/**
 * offlineVoucher.js
 * Cryptographic Offline Payment Voucher Engine for Money Matters Safe-Wallet.
 * Generates and verifies HMAC-SHA256 signed payment vouchers for peer-to-peer
 * offline handshakes (Sender generates voucher QR -> Receiver scans & claims funds).
 */

const VOUCHER_SECRET = import.meta.env.VITE_VOUCHER_SECRET || 'MM_OFFLINE_SAFE_WALLET_2026';
const CLAIMED_VOUCHERS_KEY = 'mm_claimed_vouchers_v1';
const OFFLINE_OUTBOX_KEY = 'mm_offline_outbox_v1';

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// Convert string to Uint8Array UTF-8
function strToBuffer(str) {
  return new TextEncoder().encode(str);
}

// Simple fallback HMAC-SHA256 for non-crypto environments (e.g. non-HTTPS local IP)
async function computeHmacSha256(message, secret) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const keyData = strToBuffer(secret);
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      );
      const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, strToBuffer(message));
      return bufferToHex(signature);
    }
  } catch (err) {
    console.warn('[OfflineVoucher] WebCrypto unavailable, using deterministic fallback hash:', err);
  }

  // Deterministic fallback hash for offline simulation environments without WebCrypto
  let h1 = 0x811c9dc5;
  let h2 = 0x41c64e6d;
  const combined = `${secret}|${message}|${secret}`;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x5bd1e995);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `fallback_${part1}${part2}_${message.length.toString(16)}`;
}

/**
 * Sign an offline payment voucher
 * Canonical payload: `${tx_id}|${from_wallet}|${to_wallet}|${Number(amount).toFixed(2)}|${timestamp}`
 * Returns: JSON string representation of the signed voucher object
 */
export async function signOfflineVoucher({
  tx_id,
  from_wallet,
  from_name,
  to_wallet,
  to_name,
  amount,
  timestamp = Date.now(),
  note = ''
}) {
  const cleanTxId = tx_id || `OFF-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10)).toUpperCase()}`;
  const cleanAmount = Number(amount);
  const normalizedFrom = (from_wallet || '').trim().toLowerCase();
  const normalizedTo = (to_wallet || '').trim().toLowerCase();
  const formattedAmount = cleanAmount.toFixed(2);

  // Canonical payload string: `${tx_id}|${from_wallet}|${to_wallet}|${Number(amount).toFixed(2)}|${timestamp}`
  const canonicalPayload = `${cleanTxId}|${normalizedFrom}|${normalizedTo}|${formattedAmount}|${timestamp}`;
  const sig = await computeHmacSha256(canonicalPayload, VOUCHER_SECRET);

  const voucherObj = {
    v: 1,
    type: 'MM_VOUCHER',
    tx_id: cleanTxId,
    from_wallet: normalizedFrom,
    from_name: from_name || normalizedFrom,
    to_wallet: normalizedTo,
    to_name: to_name || normalizedTo,
    amount: cleanAmount,
    timestamp,
    note: note || 'Offline Safe-Wallet Transfer',
    sig,
    signature: sig
  };

  // Return standard JSON string with parsed object attached for convenience
  const jsonStr = JSON.stringify(voucherObj);
  return Object.assign(jsonStr, voucherObj);
}

/**
 * Verify an offline payment voucher
 * Accepts raw JSON string or voucher object
 * Returns { valid: true, voucher } or { valid: false, reason: string }
 */
export async function verifyOfflineVoucher(rawInput) {
  let voucher = null;
  try {
    if (typeof rawInput === 'string') {
      voucher = JSON.parse(rawInput);
    } else if (rawInput && typeof rawInput === 'object') {
      voucher = rawInput;
    }
  } catch {
    return { valid: false, reason: 'Invalid JSON payload structure.' };
  }

  if (!voucher || voucher.type !== 'MM_VOUCHER') {
    return { valid: false, reason: 'Invalid or unsupported voucher type.' };
  }

  const sigToVerify = voucher.sig || voucher.signature;
  if (!voucher.tx_id || !sigToVerify) {
    return { valid: false, reason: 'Missing voucher ID or signature.' };
  }

  const cleanAmount = Number(voucher.amount);
  if (isNaN(cleanAmount) || cleanAmount <= 0) {
    return { valid: false, reason: 'Invalid or missing voucher amount.' };
  }

  const normalizedFrom = (voucher.from_wallet || '').trim().toLowerCase();
  const normalizedTo = (voucher.to_wallet || '').trim().toLowerCase();
  const formattedAmount = cleanAmount.toFixed(2);

  const canonicalToVerify = `${voucher.tx_id}|${normalizedFrom}|${normalizedTo}|${formattedAmount}|${voucher.timestamp}`;
  const expectedSig = await computeHmacSha256(canonicalToVerify, VOUCHER_SECRET);

  if (sigToVerify !== expectedSig) {
    return {
      valid: false,
      reason: 'Invalid or tampered offline voucher signature'
    };
  }

  return { valid: true, voucher };
}

// ----------------------------------------------------------------------
// Replay Protection & Local Voucher Outbox Storage
// ----------------------------------------------------------------------

export function getClaimedVoucherIds() {
  try {
    const raw = localStorage.getItem(CLAIMED_VOUCHERS_KEY) || localStorage.getItem('mm_claimed_vouchers');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isVoucherClaimed(tx_id) {
  if (!tx_id) return false;
  const list = getClaimedVoucherIds();
  return list.includes(tx_id);
}

export function markVoucherClaimed(tx_id) {
  if (!tx_id) return;
  const list = getClaimedVoucherIds();
  if (!list.includes(tx_id)) {
    list.push(tx_id);
    localStorage.setItem(CLAIMED_VOUCHERS_KEY, JSON.stringify(list));
    localStorage.setItem('mm_claimed_vouchers', JSON.stringify(list));
  }
}

export function getOfflineOutbox() {
  try {
    const raw = localStorage.getItem(OFFLINE_OUTBOX_KEY) || localStorage.getItem('mm_offline_outbox');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineOutbox(items) {
  try {
    localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(items));
    localStorage.setItem('mm_offline_outbox', JSON.stringify(items));
  } catch (err) {
    console.warn('[OfflineVoucher] Failed to persist outbox:', err);
  }
}

export function queueOfflineTransactionPair(senderDebitTx, receiverCreditTx) {
  const outbox = getOfflineOutbox();
  const txIdentifier = senderDebitTx.tx_id || senderDebitTx.txId || senderDebitTx.id;
  const filtered = outbox.filter(item => item.tx_id !== txIdentifier);
  filtered.push({
    tx_id: txIdentifier,
    senderTx: senderDebitTx,
    receiverTx: receiverCreditTx,
    queuedAt: new Date().toISOString()
  });
  saveOfflineOutbox(filtered);
}

export function removeSyncedVouchers(syncedIds) {
  if (!syncedIds || syncedIds.length === 0) return;
  const outbox = getOfflineOutbox();
  const idSet = new Set(syncedIds);
  const remaining = outbox.filter(item => !idSet.has(item.tx_id) && !idSet.has(item.txId));
  saveOfflineOutbox(remaining);
}
