/**
 * Money Matters Deterministic, Explainable Fraud Risk Scoring Engine
 * Evaluates payment context, SEBI registration patterns, UPI collect traps,
 * urgency triggers, malware APK links, and transaction amount anomalies.
 */

// Official SEBI Registered Entities UPI Regex Pattern
// Format example: zerodha.brk@validhdfc, groww.brk@validaxis, hdfc.mf@validhdfc
export const SEBI_VALID_HANDLE_REGEX = /^[a-zA-Z0-9._-]+\.(brk|mf|dp|pms|ra|ia)@valid[a-zA-Z]+$/i;

// Common personal UPI handles frequently misused in informal scam schemes
const PERSONAL_UPI_HANDLES = [
  '@okaxis', '@okhdfcbank', '@oksbi', '@okicici', '@ybl', '@ibl', '@axl',
  '@paytm', '@apl', '@upi', '@barodampay', '@idfcbank', '@federal'
];

// Fraudulent urgency & high-return scam keywords
const SCAM_KEYWORDS = [
  'guaranteed return',
  'guaranteed',
  'double in',
  'vip stock group',
  'vip trade',
  'vip group',
  'ipo quota',
  'pay tax to withdraw',
  'urgent',
  '10 mins',
  '10 min',
  '15 mins',
  'instant profit',
  'risk-free',
  'bonus claim',
  'task reward',
  'telegram earn',
  'crypto double',
  'lottery won'
];

// Dangerous APK or suspicious URL patterns
const SUSPICIOUS_URL_PATTERNS = [
  /\.apk(\?.*)?$/i,
  /bit\.ly\//i,
  /tinyurl\.com\//i,
  /\.top(\/.*)?$/i,
  /\.xyz(\/.*)?$/i,
  /whatsapp\.com\/join/i,
  /t\.me\//i,
  /apk-download/i,
  /mediafire\.com/i
];

/**
 * Real-Time Payment Context & Message Analyzer
 * Evaluates full pasted SMS, email, or WhatsApp messages for fraud red flags.
 */
export function analyzePaymentContext({ message = '', recipientId = '', amount = 0, txType = 'P2P_TRANSFER' }) {
  const text = `${message} ${recipientId}`.toLowerCase();
  let score = 0;
  const flags = [];
  const flagsKn = [];

  // 1. Detect malicious .apk download links or suspicious URLs
  const hasApk = /\.apk(\b|\?|#)/i.test(text);
  const urls = message.match(/https?:\/\/[^\s]+/gi) || [];
  if (hasApk) {
    score += 55;
    flags.push('Malicious .apk file link detected (never install apps from SMS/email links)');
    flagsKn.push('ಅಪಾಯಕಾರಿ .apk ಫೈಲ್ ಲಿಂಕ್ ಪತ್ತೆಯಾಗಿದೆ (SMS ಅಥವಾ ಇಮೇಲ್ ಲಿಂಕ್‌ಗಳಿಂದ ಅಪ್ಲಿಕೇಶನ್‌ಗಳನ್ನು ಎಂದಿಗೂ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಡಿ)');
  } else if (urls.length > 0) {
    score += 25;
    flags.push('External link found inside payment message');
    flagsKn.push('ಪಾವತಿ ಸಂದೇಶದಲ್ಲಿ ಬಾಹ್ಯ ಲಿಂಕ್ ಕಂಡುಬಂದಿದೆ');
  }

  // 2. Detect PIN / OTP harvesting attempts
  if (/(enter|share|type|send).{0,25}(pin|otp|password|cvv)/i.test(text)) {
    score += 45;
    flags.push('Asks you to enter or share your Wallet PIN or OTP');
    flagsKn.push('ನಿಮ್ಮ ವಾಲೆಟ್ PIN ಅಥವಾ OTP ನಮೂದಿಸಲು ಅಥವಾ ಹಂಚಿಕೊಳ್ಳಲು ಕೇಳಲಾಗುತ್ತಿದೆ');
  }

  // 3. Detect fake KYC / Account Freeze / Urgency threats
  if (/(permanently blocked|account freeze|suspended|re-kyc|kyc verification|penalty charges|within \d+ (hour|min))/i.test(text)) {
    score += 35;
    flags.push('Fake KYC suspension or urgency threat detected');
    flagsKn.push('ನಕಲಿ KYC ಅಮಾನತು ಅಥವಾ ತುರ್ತು ಬೆದರಿಕೆ ಪತ್ತೆಯಾಗಿದೆ');
  }

  // 4. Detect Fake Cashback / Reward "Collect Request" PIN traps
  if (txType === 'COLLECT_REQUEST' || /(collect request|cashback voucher|you won|claim your prize|release funds)/i.test(text)) {
    score += 45;
    flags.push('Fake reward or Collect Request trap (you never enter a PIN to receive money)');
    flagsKn.push('ನಕಲಿ ಬಹುಮಾನ ಅಥವಾ ಕಲೆಕ್ಟ್ ರಿಕ್ವೆಸ್ಟ್ ಬಲೆ (ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ PIN ನಮೂದಿಸುವ ಅಗತ್ಯವಿಲ್ಲ)');
  }

  // 5. Extract any embedded UPI / Wallet handles and verify SEBI @valid rules
  const extractedHandles = message.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+/g) || [];
  const allHandles = [...new Set([recipientId, ...extractedHandles].filter(Boolean))];
  const isInvestmentPitch = /(ipo|demat|guaranteed|weekly returns|nifty|broker|trading slot|allotment)/i.test(text);

  for (const handle of allHandles) {
    const lowerHandle = handle.toLowerCase();
    const isSebiValid = lowerHandle.endsWith('.brk@valid') || lowerHandle.endsWith('.mf@valid');
    if (isInvestmentPitch && !isSebiValid) {
      score += 50;
      flags.push(`Unverified investment handle (${handle}) — legitimate brokers use .brk@valid or .mf@valid`);
      flagsKn.push(`ಅನಧಿಕೃತ ಹೂಡಿಕೆ ಹ್ಯಾಂಡಲ್ (${handle}) — ಅಧಿಕೃತ ಬ್ರೋಕರ್‌ಗಳು .brk@valid ಅಥವಾ .mf@valid ಬಳಸುತ್ತಾರೆ`);
    }
  }

  // 6. High-value transfer caution
  if (Number(amount) >= 10000) {
    score += 15;
    flags.push('High-value transfer above ₹10,000');
    flagsKn.push('₹10,000 ಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಮೊತ್ತದ ವರ್ಗಾವಣೆ');
  }

  const finalScore = Math.min(score, 100);
  const isFraud = finalScore >= 60;

  return {
    riskScore: finalScore,
    isFraud,
    status: isFraud ? 'BLOCKED_OR_GUARDIAN_REVIEW' : 'SAFE_TO_PAY',
    flags,
    flagsKn,
    extractedHandles,
  };
}

export function scoreTransaction(tx) {
  const direction = (tx.direction || 'OUT').toUpperCase();
  const amount = Number(tx.amount) || 0;
  const counterparty = (tx.counterparty || '').trim();
  const category = (tx.category || 'Other');
  const message = (tx.message || '').toLowerCase();
  const isCollect = Boolean(tx.isCollectRequest);

  let score = 0;
  const reasons = [];
  const reasonsKn = [];

  // ==========================================
  // 1. INCOMING MONEY (direction === 'IN') CHECKS
  // ==========================================
  if (direction === 'IN') {
    // Check A: Fake "UPI Collect / Request Money" Traps (CRITICAL)
    const collectTrapKeywords = [
      'approve pin', 'collect request', 'receive money via pin',
      'enter pin to receive', 'pin for payment', 'accept payment pin',
      'approve collect', 'claim money pin', 'enter upi pin'
    ];

    const hasCollectPhrases = collectTrapKeywords.some(phrase => message.includes(phrase));

    if (isCollect || hasCollectPhrases) {
      score += 95;
      reasons.push(
        "CRITICAL: Fake UPI Collect Request Trap! You NEVER need to enter your UPI PIN to receive money. Entering your PIN transfers money OUT of your bank account."
      );
      reasonsKn.push(
        "ಗಂಭೀರ ಎಚ್ಚರಿಕೆ: ನಕಲಿ UPI ಕಲೆಕ್ಟ್ ರಿಕ್ವೆಸ್ಟ್ ಬಲೆ! ಹಣ ಪಡೆಯಲು ಎಂದಿಗೂ UPI PIN ನಮೂದಿಸುವ ಅಗತ್ಯವಿಲ್ಲ. PIN ನಮೂದಿಸಿದರೆ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತಗೊಳ್ಳುತ್ತದೆ."
      );
    }

    // Check B: Sudden High-Value Inflow / Money Mule Trap
    if (amount > 15000) {
      const isPersonalHandle = PERSONAL_UPI_HANDLES.some(h => counterparty.toLowerCase().endsWith(h));
      score += 45;
      reasons.push(
        `High-value unverified inflow (₹${amount.toLocaleString('en-IN')}). Beware of 'wrong transfer' refund scams or unauthorized money mule attempts.`
      );
      reasonsKn.push(
        `ಹೆಚ್ಚಿನ ಮೊತ್ತದ ಅನಿರೀಕ್ಷಿತ ಒಳಹರಿವು (₹${amount.toLocaleString('en-IN')}). 'ತಪ್ಪಾಗಿ ಕಳುಹಿಸಿದ ಹಣ ಹಿಂತಿರುಗಿಸಿ' ಎಂಬ ವಂಚನೆ ಅಥವಾ ಮನಿ-ಮ್ಯೂಲ್ ತಂತ್ರಗಳ ಬಗ್ಗೆ ಎಚ್ಚರವಿರಲಿ.`
      );
    }
  }

  // ==========================================
  // 2. OUTGOING PAYMENT & INVESTMENT CHECKS
  // ==========================================
  if (direction === 'OUT') {
    const isInvestmentContext = 
      category === 'Investment' ||
      message.includes('stock') ||
      message.includes('share') ||
      message.includes('ipo') ||
      message.includes('mutual fund') ||
      message.includes('crypto') ||
      message.includes('trading') ||
      message.includes('profit');

    // Check A: SEBI @valid Broker / MF Handle Check
    if (isInvestmentContext) {
      const isSebiValid = SEBI_VALID_HANDLE_REGEX.test(counterparty);
      if (isSebiValid) {
        // Regulated broker - safe factor
        score = Math.max(0, score - 20);
        reasons.push(
          "VERIFIED SEBI ENTITY: Counterparty handle matches official SEBI-registered broker/mutual fund protocol (*.brk@valid* or *.mf@valid*)."
        );
        reasonsKn.push(
          "ದೃಢೀಕರಿಸಿದ SEBI ಸಂಸ್ಥೆ: ಸ್ವೀಕೃತಿದಾರರ ಹ್ಯಾಂಡಲ್ ಅಧಿಕೃತ SEBI ನೋಂದಾಯಿತ ಬ್ರೋಕರ್/ಮ್ಯೂಚುಯಲ್ ಫಂಡ್ ಪ್ರೋಟೋಕಾಲ್‌ಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ."
        );
      } else {
        // Unregistered handle for investment!
        const usesPersonal = PERSONAL_UPI_HANDLES.some(h => counterparty.toLowerCase().endsWith(h));
        score += 55;
        reasons.push(
          "UNREGISTERED INVESTMENT RECIPIENT: Legitimate SEBI stockbrokers & MFs use verified handles (.brk@valid* or .mf@valid*). Sending investment funds to personal handles (@okaxis, @ybl, etc.) indicates illegal dabba trading or VIP group fraud."
        );
        reasonsKn.push(
          "ಅನಧಿಕೃತ ಹೂಡಿಕೆ ಖಾತೆ: ಅಧಿಕೃತ SEBI ಬ್ರೋಕರ್‌ಗಳು .brk@valid* ಅಥವಾ .mf@valid* ಹ್ಯಾಂಡಲ್ ಬಳಸುತ್ತಾರೆ. ವೈಯಕ್ತಿಕ UPI ID (@okaxis, @ybl) ಗೆ ಹೂಡಿಕೆ ಹಣ ಕಳುಹಿಸುವುದು ನಕಲಿ ಹೂಡಿಕೆ ವಂಚನೆಯ ಸಂಕೇತವಾಗಿದೆ."
        );
      }
    }

    // Check B: Scam Keyword & Urgency Check
    const detectedKeywords = SCAM_KEYWORDS.filter(kw => message.includes(kw));
    if (detectedKeywords.length > 0) {
      score += 40;
      reasons.push(
        `High-pressure scam keywords detected: "${detectedKeywords.slice(0, 3).join('", "')}". Urgency and guaranteed return promises are standard financial fraud red flags.`
      );
      reasonsKn.push(
        `ವಂಚನೆಯ ಪದಗಳು ಪತ್ತೆಯಾಗಿವೆ: "${detectedKeywords.slice(0, 3).join('", "')}". ತುರ್ತು ಒತ್ತಡ ಮತ್ತು ಖಚಿತ ಲಾಭದ ಭರವಸೆಗಳು ಹಣಕಾಸು ವಂಚನೆಯ ಮುಖ್ಯ ಲಕ್ಷಣಗಳಾಗಿವೆ.`
      );
    }

    // Check C: Suspicious Link / APK Check
    const hasSuspiciousLink = SUSPICIOUS_URL_PATTERNS.some(pat => pat.test(message));
    if (hasSuspiciousLink) {
      score += 45;
      reasons.push(
        "Malicious APK file or unverified external link detected. Scammers use APKs to install screen-sharing spyware to steal banking OTPs."
      );
      reasonsKn.push(
        "ಅಪಾಯಕಾರಿ APK ಫೈಲ್ ಅಥವಾ ಶಂಕಿತ ಲಿಂಕ್ ಪತ್ತೆಯಾಗಿದೆ. ಬ್ಯಾಂಕಿಂಗ್ OTP ಕದಿಯಲು ವಂಚಕರು ಇಂತಹ ಆ್ಯಪ್‌ಗಳ ಮೂಲಕ ಸ್ಕ್ರೀನ್-ಶೇರಿಂಗ್ ಸ್ಪೈವೇರ್ ಸ್ಥಾಪಿಸುತ್ತಾರೆ."
      );
    }

    // Check D: Amount Anomaly Check (> ₹10,000)
    if (amount > 10000) {
      score += 25;
      reasons.push(
        `High-value outgoing payment (₹${amount.toLocaleString('en-IN')}) requires extra scrutiny before funds leave your account.`
      );
      reasonsKn.push(
        `ಹೆಚ್ಚಿನ ಮೊತ್ತದ ಪಾವತಿ (₹${amount.toLocaleString('en-IN')}) ಖಾತೆಯಿಂದ ಹೊರಹೋಗುವ ಮುನ್ನ ಹೆಚ್ಚುವರಿ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ.`
      );
    }
  }

  // Bound score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine Risk Level & System Status Routing
  let riskLevel = 'SAFE';
  if (finalScore >= 75) {
    riskLevel = 'HIGH_RISK';
  } else if (finalScore >= 35) {
    riskLevel = 'SUSPICIOUS';
  }

  // Routing Rule: >= 60 -> HELD_FOR_REVIEW; otherwise -> VERIFIED
  const status = finalScore >= 60 ? 'HELD_FOR_REVIEW' : 'VERIFIED';

  if (reasons.length === 0) {
    reasons.push("Standard verified transaction. No suspicious fraud indicators or anomalous routing patterns detected.");
    reasonsKn.push("ಸಾಮಾನ್ಯ ದೃಢೀಕರಿಸಿದ ವಹಿವಾಟು. ಯಾವುದೇ ಅನುಮಾನಾಸ್ಪದ ವಂಚನೆ ಸೂಚಕಗಳು ಅಥವಾ ಅಸಹಜ ಮಾದರಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ.");
  }

  return {
    riskScore: finalScore,
    riskLevel,
    status,
    reasons,
    reasonsKn
  };
}
