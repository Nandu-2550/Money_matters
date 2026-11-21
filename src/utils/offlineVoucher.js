/**
 * offlineVoucher.js
 * Cryptographic Offline Payment Voucher Engine for Money Matters Safe-Wallet.
 * Generates and verifies HMAC-SHA256 signed payment vouchers for peer-to-peer
 * offline handshakes (User 1 generates voucher QR -> User 2 scans & immediately claims funds).
 */

const VOUCHER_SECRET = import.meta.env.VITE_VOUCHER_SECRET || 'MM_OFFLINE_SAFE_WALLET_2026';
const CLAIMED_VOUCHERS_KEY = 'mm_claimed_vouchers_v1';
const OFFLINE_OUTBOX_KEY = 'mm_offline_outbox_v1';

// Convert ArrayBuffer to Hex string
function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert string to Uint8Array UTF-8
function strToBuffer(str) {
  return new TextEncoder().encode(str);
}

// Simple fallback HMAC-SHA256 for non-crypto environments
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
    console.warn('[OfflineVoucher] WebCrypto unavailable, using deterministic hash:', err);
  }

  // Deterministic fallback hash for offline simulation environments
  let hash = 0x811c9dc5;
  const combined = `${secret}#${message}#${secret}`;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `fallback_${Math.abs(hash).toString(16).padStart(16, '0')}_${message.length}`;
}

/**
 * Sign an offline payment voucher
 * Message structure: `${tx_id}|${from_wallet}|${to_wallet}|${amount}|${timestamp}`
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
  const cleanTxId = tx_id || `vtx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanAmount = Number(amount);
  const normalizedFrom = (from_wallet || '').trim().toLowerCase();
  const normalizedTo = (to_wallet || '').trim().toLowerCase();

  const messageToSign = `${cleanTxId}|${normalizedFrom}|${normalizedTo}|${cleanAmount}|${timestamp}`;
  const sig = await computeHmacSha256(messageToSign, VOUCHER_SECRET);

  const voucherPayload = {
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

  return voucherPayload;
}

/**
 * Verify an offline payment voucher payload
 */
export async function verifyOfflineVoucher(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, reason: 'Malformed voucher payload.' };
  }

  const sigToVerify = payload.sig || payload.signature;
  if (payload.type !== 'MM_VOUCHER' || !payload.tx_id || !sigToVerify) {
    return { valid: false, reason: 'Invalid voucher type or missing signature.' };
  }

  const cleanAmount = Number(payload.amount);
  if (!cleanAmount || cleanAmount <= 0) {
    return { valid: false, reason: 'Invalid voucher amount.' };
  }

  const normalizedFrom = (payload.from_wallet || '').trim().toLowerCase();
  const normalizedTo = (payload.to_wallet || '').trim().toLowerCase();

  const messageToVerify = `${payload.tx_id}|${normalizedFrom}|${normalizedTo}|${cleanAmount}|${payload.timestamp}`;
  const expectedSig = await computeHmacSha256(messageToVerify, VOUCHER_SECRET);

  if (sigToVerify !== expectedSig) {
    return {
      valid: false,
      reason: 'Cryptographic signature mismatch! Voucher may have been altered or tampered with.'
    };
  }

  return { valid: true };
}

// ----------------------------------------------------------------------
// Replay Protection & Local Voucher Outbox Storage
// ----------------------------------------------------------------------

export function getClaimedVoucherIds() {
  try {
    const raw = localStorage.getItem(CLAIMED_VOUCHERS_KEY);
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
  }
}

export function getOfflineOutbox() {
  try {
    const raw = localStorage.getItem(OFFLINE_OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineOutbox(items) {
  try {
    localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('[OfflineVoucher] Failed to persist outbox:', err);
  }
}

export function queueOfflineTransactionPair(senderDebitTx, receiverCreditTx) {
  const outbox = getOfflineOutbox();
  const txIdentifier = senderDebitTx.tx_id || senderDebitTx.txId || senderDebitTx.id;
  // Avoid duplicate pairs
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
