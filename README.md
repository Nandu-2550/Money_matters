# Money Matters — Two-Way Payment Scam Shield & Cash Flow Guardian
> **HackSprint 3.0 FinTech Domain Prototype**  
> *Bilingual (English & Kannada / ಕನ್ನಡ) Mobile-First PWA for Indian Families, Retailers, and Small Shopkeepers.*

---

## 🚀 Key Highlights & Hackathon Demo Features

1. **Deterministic, Explainable Risk-Scoring Engine (`fraudEngine.js`)**:
   - **SEBI `@valid` Registered Broker Check**: Rejects unregistered personal handles (`@okaxis`, `@ybl`, `@paytm`) for investments. Only accepts official SEBI-regulated protocols (`/^[a-zA-Z0-9._-]+\.(brk|mf|dp|pms|ra|ia)@valid[a-zA-Z]+$/i`).
   - **Fake UPI Collect-Request Trap Detection**: Flags deceptive "Approve PIN to receive money" prompts (Score 95+).
   - **Malicious APK & Link Filter**: Detects `.apk` downloads, link shorteners, and suspicious domain patterns.
   - **Urgency & Keyword Check**: Scans for "guaranteed returns", "double in", "VIP stock group", "pay tax to withdraw", etc.
   - **Smart Routing**: Score $\ge 60$ intercepts funds to the **Family Guardian Review Queue** (`HELD_FOR_REVIEW`); $< 60$ verifies and credits immediately.

2. **Strict Double-Entry Math Ledger Integrity**:
   $$\text{Starting Balance } (₹25,000) + \text{Verified Inflows} - \text{Verified Outflows} \equiv \text{Current Balance}$$
   - Any transaction with status `HELD_FOR_REVIEW` or `BLOCKED` is **strictly excluded** from Current Balance until an authorized family guardian resolves it.

3. **Family Guardian Review Queue with Text-to-Speech (TTS)**:
   - High-risk payments are frozen before money leaves your account.
   - **"Read Warning Aloud"** synthesizes speech in English or Kannada (`kn-IN`) via the browser's native `window.speechSynthesis`.
   - Guardians can **"Block Scam"** (saving funds from theft) or **"Approve Anyway"** (updating wallet ledger).

4. **100% Offline PWA (`vite-plugin-pwa`)**:
   - Installable on mobile home screens (Android/iOS) and desktop.
   - Cached via Workbox for complete offline operation in areas with low or zero connectivity.
   - Unified data layer (`supabaseClient.js`) that persists to Supabase Cloud and gracefully falls back to `localStorage`.

5. **Safe Wealth Alternative Projector**:
   - Interactive compound interest simulator educating users away from fake 40% scams towards regulated wealth builders:
     - **Bank Recurring Deposit (RD)** @ ~6.5% p.a. (Govt insured capital)
     - **Nifty 50 Index Mutual Fund (SIP)** @ ~11.0% p.a. (SEBI regulated market equity)
     - Side-by-side contrast against fraudulent VIP Telegram schemes (100% capital loss).

6. **Instant 1-Click Bilingual Toggling**:
   - Complete coverage for English (`en`) and Kannada (`kn`) across all UI elements, labels, chart legends, audit ledger, and fraud explanation notes.

---

## 🛠️ Quick Start & Running the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Production PWA Build & Preview
```bash
npm run build
npm run preview
```

---

## 📁 5-Member Team Architecture

```text
├── src/
│   ├── components/
│   │   ├── Navbar.jsx                 # Top branding, live balance badge, PWA install & bilingual toggle
│   │   ├── ScannerSimulator.jsx       # Tab 1: 4 Judge Demo Presets, payment screen & visual risk gauge
│   │   ├── ReviewQueue.jsx            # Tab 2: Guardian review queue, TTS audio read aloud, block/approve
│   │   └── MoneyFlowDashboard.jsx     # Tab 3: KPI summary cards, Recharts flow graphs, wealth projector & ledger
│   ├── context/
│   │   └── WalletContext.jsx          # Global wallet state, ledger math reconciliation & seed data
│   ├── lib/
│   │   └── supabaseClient.js          # Cloud Supabase integration with automatic localStorage offline fallback
│   ├── utils/
│   │   ├── fraudEngine.js             # Deterministic explainable fraud risk scoring & SEBI regex validator
│   │   └── translations.js            # Complete dictionary for English & Kannada (ಕನ್ನಡ)
│   ├── App.jsx                        # Root component with toast alert notifications & footer
│   ├── main.jsx                       # Entry point & PWA service worker registration
│   └── index.css                      # Tailwind base & custom fintech glassmorphism styles
├── public/
│   ├── favicon.svg                    # Vector shield & rupee icon
│   ├── pwa-192x192.png                # Mobile PWA icon
│   └── pwa-512x512.png                # High-res PWA icon
├── supabase_schema.sql                # Production Supabase PostgreSQL schema with RLS policies
├── vite.config.js                     # Vite + React + VitePWA configuration
└── tailwind.config.js                 # Tailwind CSS design system configuration
```

---

## 🧪 1-Click Judge Demo Scenarios

In **Tab 1 (Scan & Protect)**, click any of the 4 quick-run buttons:

| Scenario | Input | Expected Risk Score | Routing Outcome |
| :--- | :--- | :---: | :--- |
| **1. Safe Customer Inflow** | ₹1,200 from `ravi.store@okicici` | `5/100 (SAFE)` | Immediately `VERIFIED` & added to balance |
| **2. Fake Collect-Request Trap** | ₹8,500 from `olx.buyer99@paytm` asking for PIN | `95/100 (HIGH RISK)` | Intercepted to `HELD_FOR_REVIEW` (Funds frozen) |
| **3. WhatsApp Stock Scam** | ₹15,000 to `vip.trades@okaxis` promising 40% | `95/100 (HIGH RISK)` | Intercepted to `HELD_FOR_REVIEW` (Funds frozen) |
| **4. Verified SEBI Broker SIP** | ₹2,500 to `zerodha.brk@validhdfc` | `5/100 (SAFE)` | Immediately `VERIFIED` & deducted from balance |

---

## 🛡️ Safety & Disclaimers

> **Demo Simulation Mode:** This application operates on 100% dummy/simulated data. It never requests or stores real UPI PINs, OTPs, net banking passwords, or Aadhaar/PAN details.
> 
> **Advisory Estimates Notice:** Fraud risk scores and investment projections are advisory estimates computed for educational awareness and are not guaranteed outcomes.
