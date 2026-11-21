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
