import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  ShieldX, 
  CheckCircle2, 
  Sliders, 
  Info, 
  AlertTriangle,
  Building2,
  LineChart as ChartIcon,
  Filter,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useWallet, STARTING_BALANCE } from '../context/WalletContext';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function MoneyFlowDashboard() {
  const { language, t, transactions, computedMetrics } = useWallet();

  // Projector Simulator Sliders State
  const [monthlyAmount, setMonthlyAmount] = useState(2500); // ₹500 to ₹20,000
  const [durationYears, setDurationYears] = useState(3); // 1 to 5 years

  // Ledger Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');

  // ==========================================
  // 1. Chart Data Preparation (Inflows vs Outflows)
  // ==========================================
  const chartData = useMemo(() => {
    // Group verified transactions by date (last 7 active days)
    const dateMap = {};
    const verified = transactions.filter(t => t.status === 'VERIFIED');

    // Default seed dates for clean visual timeline if sparse
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', { month: 'short', day: 'numeric' });
      dateMap[key] = { name: key, inflow: 0, outflow: 0 };
    }

    verified.forEach(tx => {
      const d = new Date(tx.createdAt);
      const key = d.toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', { month: 'short', day: 'numeric' });
      if (!dateMap[key]) {
        dateMap[key] = { name: key, inflow: 0, outflow: 0 };
      }
      if (tx.direction === 'IN') {
        dateMap[key].inflow += Number(tx.amount);
      } else if (tx.direction === 'OUT') {
        dateMap[key].outflow += Number(tx.amount);
      }
    });

    return Object.values(dateMap);
  }, [transactions, language]);

  // Category Breakdown Data
  const categoryData = useMemo(() => {
    const catMap = {};
    const verified = transactions.filter(t => t.status === 'VERIFIED');
    
    verified.forEach(tx => {
      const catKey = tx.category || 'Other';
      catMap[catKey] = (catMap[catKey] || 0) + Number(tx.amount);
    });

    return Object.entries(catMap).map(([name, value]) => ({
      name: t.categories[name] || name,
      value
    }));
  }, [transactions, t]);

  // ==========================================
  // 2. Safe Wealth Projector Math
  // Bank RD (~6.5% p.a.) vs Index SIP (~11.0% p.a.)
  // Compound monthly SIP formula: FV = P * [((1 + i)^n - 1) / i] * (1 + i)
  // ==========================================
  const projectorResults = useMemo(() => {
    const P = monthlyAmount;
    const n = durationYears * 12; // total months
    const totalPrincipal = P * n;

    // Bank Recurring Deposit (approx 6.5% compound quarterly/monthly)
    const rRd = 0.065 / 12;
    const rdFutureValue = Math.round(P * (((Math.pow(1 + rRd, n) - 1) / rRd) * (1 + rRd)));
    const rdGains = rdFutureValue - totalPrincipal;

    // Nifty 50 Regulated Index Fund SIP (approx 11.0% compound monthly)
    const rSip = 0.11 / 12;
    const sipFutureValue = Math.round(P * (((Math.pow(1 + rSip, n) - 1) / rSip) * (1 + rSip)));
    const sipGains = sipFutureValue - totalPrincipal;

    return {
      totalPrincipal,
      rdFutureValue,
      rdGains,
      sipFutureValue,
      sipGains
    };
  }, [monthlyAmount, durationYears]);

  // ==========================================
  // 3. Filtered Ledger Transactions
  // ==========================================
  const filteredLedger = useMemo(() => {
    return transactions.filter(tx => {
      const matchStatus = statusFilter === 'ALL' || tx.status === statusFilter;
      const matchDirection = directionFilter === 'ALL' || tx.direction === directionFilter;
      return matchStatus && matchDirection;
    });
  }, [transactions, statusFilter, directionFilter]);

  return (
    <div className="space-y-6">
      
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Current Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.currentBalanceLabel}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-white">
              ₹{computedMetrics.currentBalance.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>{t.dashboard.mathProofTitle}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Verified Money In */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.verifiedInflowLabel}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              +₹{computedMetrics.totalInflow.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {computedMetrics.verifiedTransactions.filter(t => t.direction === 'IN').length}{' '}
              {language === 'kn' ? 'ಸ್ವೀಕರಿಸಿದ ವಹಿವಾಟುಗಳು' : 'verified credits'}
            </span>
          </div>
        </div>

        {/* Card 3: Verified Money Out */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.verifiedOutflowLabel}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-400">
              -₹{computedMetrics.totalOutflow.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {computedMetrics.verifiedTransactions.filter(t => t.direction === 'OUT').length}{' '}
              {language === 'kn' ? 'ಪಾವತಿಸಿದ ವಹಿವಾಟುಗಳು' : 'verified debits'}
            </span>
          </div>
        </div>

        {/* Card 4: Money Saved from Scams */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {t.moneySavedLabel}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              ₹{computedMetrics.totalSavedFromScams.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-400/80 block mt-1 font-semibold">
              {computedMetrics.blockedTransactions.length}{' '}
              {language === 'kn' ? 'ತಡೆದ ವಂಚನೆಗಳು' : 'scams intercepted'}
            </span>
          </div>
        </div>

      </div>

      {/* Math Integrity Proof Banner */}
      <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-inner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              ✓
            </div>
            <div>
              <span className="font-extrabold text-white block">
                {t.dashboard.mathProofTitle}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {`₹${STARTING_BALANCE.toLocaleString('en-IN')} (Start) + ₹${computedMetrics.totalInflow.toLocaleString('en-IN')} (In) - ₹${computedMetrics.totalOutflow.toLocaleString('en-IN')} (Out) === ₹${computedMetrics.currentBalance.toLocaleString('en-IN')} (Balance)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.dashboard.mathVerified}</span>
          </div>
        </div>
      </div>

      {/* Visual Recharts Section: Inflows vs Outflows & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cash Flow Bar Chart */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {t.dashboard.inflowVsOutflow}
            </h3>
            <span className="text-[11px] text-slate-400">
              {language === 'kn' ? 'ದೃಢೀಕರಿಸಿದ ವಹಿವಾಟುಗಳು' : 'Verified only'}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="inflow" name={t.verifiedInflowLabel} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name={t.verifiedOutflowLabel} fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-emerald-400" />
              {t.dashboard.categoryBreakdown}
            </h3>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No category data</p>
            )}
          </div>

          {/* Category Mini Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-slate-300 truncate">{cat.name}:</span>
                <span className="text-slate-400 font-mono">₹{cat.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Safe Wealth Alternative Projector (Anti-Fraud Education) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sliders className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-white">
                {t.dashboard.projectorTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.dashboard.projectorSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0 text-xs text-slate-300">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>SEBI & RBI Regulated Vehicles</span>
          </div>
        </div>

        {/* Sliders Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-800/80 mb-6">
          
          {/* Monthly Amount Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t.dashboard.monthlyLabel}
              </label>
              <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                ₹{monthlyAmount.toLocaleString('en-IN')} / mo
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="20000"
              step="500"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹500</span>
              <span>₹10,000</span>
              <span>₹20,000</span>
            </div>
          </div>

          {/* Duration Horizon Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t.dashboard.durationLabel}
              </label>
              <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                {durationYears} {t.dashboard.yearsUnit} ({durationYears * 12} mo)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={durationYears}
              onChange={(e) => setDurationYears(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 Year</span>
              <span>3 Years</span>
              <span>5 Years</span>
            </div>
          </div>
        </div>

        {/* 3 Columns Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Option A: Bank RD */}
          <div className="bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white">{t.dashboard.bankRd}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Low Risk
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">{t.dashboard.bankRdRate}</p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.dashboard.totalInvested}:</span>
                  <span className="font-mono text-slate-200">₹{projectorResults.totalPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.dashboard.estimatedGains}:</span>
                  <span className="font-mono text-emerald-400 font-bold">+₹{projectorResults.rdGains.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.dashboard.estimatedValue}</span>
              <span className="text-xl font-black text-white">₹{projectorResults.rdFutureValue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Option B: Regulated Index SIP */}
          <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-lg shadow-emerald-500/10 flex flex-col justify-between relative">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
              {language === 'kn' ? 'ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ' : 'Recommended'}
            </span>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-400">{t.dashboard.indexSip}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Moderate
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">{t.dashboard.indexSipRate}</p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.dashboard.totalInvested}:</span>
                  <span className="font-mono text-slate-200">₹{projectorResults.totalPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.dashboard.estimatedGains}:</span>
                  <span className="font-mono text-emerald-400 font-bold">+₹{projectorResults.sipGains.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.dashboard.estimatedValue}</span>
              <span className="text-xl font-black text-emerald-400">₹{projectorResults.sipFutureValue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Option C: Fake WhatsApp Scam Scheme */}
          <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between opacity-90">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-rose-400">{t.dashboard.fakeScam}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  EXTREME DANGER
                </span>
              </div>
              <p className="text-[11px] text-rose-300/80 mb-4">{t.dashboard.fakeScamRate}</p>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-[11px] text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 mb-1" />
                <p>{t.dashboard.scamLossWarning}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.dashboard.estimatedValue}</span>
              <span className="text-xl font-black text-rose-500 line-through">₹0 (Total Loss)</span>
            </div>
          </div>

        </div>

        {/* Responsible Disclaimer */}
        <p className="text-[11px] text-slate-400 text-center mt-4">
          <Info className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
          {t.dashboard.projectorDisclaimer}
        </p>
      </div>

      {/* Complete Reconciled Transaction Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span>{t.dashboard.ledgerTitle}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {filteredLedger.length} {language === 'kn' ? 'ದಾಖಲೆಗಳು' : 'records'}
              </span>
            </h3>
          </div>

          {/* Filters: Status & Direction */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">{t.dashboard.filterAll}</option>
                <option value="VERIFIED">{t.dashboard.filterVerified}</option>
                <option value="HELD_FOR_REVIEW">{t.dashboard.filterHeld}</option>
                <option value="BLOCKED">{t.dashboard.filterBlocked}</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">{language === 'kn' ? 'ಎಲ್ಲಾ ದಿಕ್ಕುಗಳು' : 'All Directions'}</option>
                <option value="IN">{language === 'kn' ? 'ಒಳಬರುವ (IN)' : 'Inflow (IN)'}</option>
                <option value="OUT">{language === 'kn' ? 'ಹೊರಹೋಗುವ (OUT)' : 'Outflow (OUT)'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">{t.dashboard.colDate}</th>
                <th className="py-3 px-3">{t.dashboard.colType}</th>
                <th className="py-3 px-3">{t.dashboard.colParty}</th>
                <th className="py-3 px-3">{t.dashboard.colCategory}</th>
                <th className="py-3 px-3">{t.dashboard.colRisk}</th>
                <th className="py-3 px-3">{t.dashboard.colStatus}</th>
                <th className="py-3 px-3 text-right">{t.dashboard.colAmount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    {language === 'kn' ? 'ಯಾವುದೇ ವಹಿವಾಟುಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No transactions match selected filter.'}
                  </td>
                </tr>
              ) : (
                filteredLedger.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    
                    {/* Timestamp */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString(language === 'kn' ? 'kn-IN' : 'en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Direction Pill */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.direction === 'IN' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.direction === 'IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        <span>{tx.direction}</span>
                      </span>
                    </td>

                    {/* Counterparty & Note */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="font-mono font-bold text-slate-200 truncate">{tx.counterparty}</div>
                      {tx.message && (
                        <div className="text-[11px] text-slate-400 truncate">{tx.message}</div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                      {t.categories[tx.category] || tx.category}
                    </td>

                    {/* Risk Level Gauge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        tx.riskScore >= 60 ? 'text-rose-400' : tx.riskScore >= 35 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        <span>{tx.riskScore}/100</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        tx.status === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : tx.status === 'HELD_FOR_REVIEW'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 line-through'
                      }`}>
                        {t.statuses[tx.status] || tx.status}
                      </span>
                    </td>

                    {/* Reconciled Amount */}
                    <td className="py-3 px-3 whitespace-nowrap text-right font-black">
                      <span className={
                        tx.status === 'BLOCKED'
                          ? 'text-slate-400 line-through'
                          : tx.status === 'HELD_FOR_REVIEW'
                          ? 'text-amber-300'
                          : tx.direction === 'IN'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }>
                        {tx.direction === 'IN' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
