import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Sliders, 
  Info, 
  Building2,
  Filter,
  Check,
  Eye,
  EyeOff
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
import { useWallet } from '../context/WalletContext';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function MoneyFlowDashboard() {
  const { 
    language, 
    t, 
    transactions, 
    computedMetrics, 
    isBalanceRevealed, 
    setIsBalanceRevealed 
  } = useWallet();

  const [monthlyAmount, setMonthlyAmount] = useState(2500);
  const [durationYears, setDurationYears] = useState(3);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [directionFilter, setDirectionFilter] = useState('ALL');

  const totalLoaded = useMemo(() => {
    return transactions
      .filter(t => t.status === 'VERIFIED' && t.direction === 'IN' && (t.txCategory === 'TOPUP' || t.category === 'TOPUP'))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalReceivedP2P = useMemo(() => {
    return transactions
      .filter(t => t.status === 'VERIFIED' && t.direction === 'IN' && t.txCategory !== 'TOPUP' && t.category !== 'TOPUP')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalSpent = useMemo(() => {
    return transactions
      .filter(t => t.status === 'VERIFIED' && t.direction === 'OUT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const chartData = useMemo(() => {
    const dateMap = {};
    const verified = transactions.filter(t => t.status === 'VERIFIED');

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

  const projectorResults = useMemo(() => {
    const P = monthlyAmount;
    const n = durationYears * 12;
    const totalPrincipal = P * n;

    const rRd = 0.065 / 12;
    const rdFutureValue = Math.round(P * (((Math.pow(1 + rRd, n) - 1) / rRd) * (1 + rRd)));
    const rdGains = rdFutureValue - totalPrincipal;

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

  const filteredLedger = useMemo(() => {
    return transactions.filter(tx => {
      const matchStatus = statusFilter === 'ALL' || tx.status === statusFilter;
      const matchDirection = directionFilter === 'ALL' || tx.direction === directionFilter;
      return matchStatus && matchDirection;
    });
  }, [transactions, statusFilter, directionFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-400">
              {t.currentBalanceLabel}
            </span>
            <button
              type="button"
              onClick={() => setIsBalanceRevealed(!isBalanceRevealed)}
              className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
              title={isBalanceRevealed ? "Hide Balance" : "Reveal Balance"}
            >
              {isBalanceRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
            {isBalanceRevealed ? `₹${computedMetrics.currentBalance.toLocaleString('en-IN')}` : '₹ • • • •'}
          </div>
          <span className="text-[10px] text-emerald-400/90 font-medium block mt-1">
            ✓ {language === 'kn' ? 'ಲೆಡ್ಜರ್ ತಾಳೆಯಾಗಿದೆ' : 'Reconciled ledger'}
          </span>
        </div>

        {/* Total In */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            {t.verifiedInflowLabel}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
            +₹{computedMetrics.totalInflow.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 truncate" title={`Top-up: ₹${totalLoaded} | Received: ₹${totalReceivedP2P}`}>
            ₹{totalLoaded.toLocaleString('en-IN')} loaded • ₹{totalReceivedP2P.toLocaleString('en-IN')} received
          </span>
        </div>

        {/* Total Out */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            {t.verifiedOutflowLabel}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-200 tracking-tight">
            -₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {computedMetrics.verifiedTransactions.filter(t => t.direction === 'OUT').length} {language === 'kn' ? 'ಪಾವತಿಗಳು' : 'transfers'}
          </span>
        </div>

        {/* Saved from Scams */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            {t.moneySavedLabel}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
            ₹{computedMetrics.totalSavedFromScams.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {computedMetrics.blockedTransactions.length} {language === 'kn' ? 'ತಡೆದ ವಂಚನೆಗಳು' : 'blocked'}
          </span>
        </div>

      </div>

      {/* Ledger Integrity Note */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-[11px] text-slate-300">
            {isBalanceRevealed
              ? `₹${(computedMetrics.startingBalance || 5000).toLocaleString('en-IN')} + ₹${computedMetrics.totalInflow.toLocaleString('en-IN')} - ₹${computedMetrics.totalOutflow.toLocaleString('en-IN')} = ₹${computedMetrics.currentBalance.toLocaleString('en-IN')}`
              : `₹•••• + ₹•••• - ₹•••• = ₹•••• (Check Balance to Reveal)`}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {t.dashboard.mathVerified}
        </span>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Cash Flow Chart */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t.dashboard.inflowVsOutflow}
            </span>
          </div>

          <div className="h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="inflow" name={t.verifiedInflowLabel} fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="outflow" name={t.verifiedOutflowLabel} fill="#64748b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {t.dashboard.categoryBreakdown}
          </span>

          <div className="h-44 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No data</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-slate-300 truncate">{cat.name}:</span>
                <span className="text-slate-400 font-mono">₹{cat.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Smart Wealth Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {t.dashboard.projectorTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.dashboard.projectorSubtitle}
            </p>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            Regulated Alternatives
          </span>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">
                {t.dashboard.monthlyLabel}
              </label>
              <span className="text-xs font-bold text-emerald-400">
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">
                {t.dashboard.durationLabel}
              </label>
              <span className="text-xs font-bold text-emerald-400">
                {durationYears} {t.dashboard.yearsUnit}
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
          </div>
        </div>

        {/* 3 Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* Bank RD */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{t.dashboard.bankRd}</span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">Safe</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">{t.dashboard.bankRdRate}</p>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t.dashboard.totalInvested}:</span>
                  <span className="font-mono text-slate-300">₹{projectorResults.totalPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t.dashboard.estimatedGains}:</span>
                  <span className="font-mono text-emerald-400">+₹{projectorResults.rdGains.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 block">{t.dashboard.estimatedValue}</span>
              <span className="text-base font-bold text-white">₹{projectorResults.rdFutureValue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Index SIP */}
          <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-400">{t.dashboard.indexSip}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Recommended</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">{t.dashboard.indexSipRate}</p>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t.dashboard.totalInvested}:</span>
                  <span className="font-mono text-slate-300">₹{projectorResults.totalPrincipal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t.dashboard.estimatedGains}:</span>
                  <span className="font-mono text-emerald-400">+₹{projectorResults.sipGains.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 block">{t.dashboard.estimatedValue}</span>
              <span className="text-base font-bold text-emerald-400">₹{projectorResults.sipFutureValue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Fake Scheme */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-400">{t.dashboard.fakeScam}</span>
                <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Illegal</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">{t.dashboard.fakeScamRate}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t.dashboard.scamLossWarning}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 block">{t.dashboard.estimatedValue}</span>
              <span className="text-base font-bold text-rose-400 line-through">₹0 (Total Loss)</span>
            </div>
          </div>

        </div>

        <p className="text-[10px] text-slate-400 text-center mt-3">
          {t.dashboard.projectorDisclaimer}
        </p>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t.dashboard.ledgerTitle} ({filteredLedger.length})
          </span>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 outline-none"
            >
              <option value="ALL">{t.dashboard.filterAll}</option>
              <option value="VERIFIED">{t.dashboard.filterVerified}</option>
              <option value="HELD_FOR_REVIEW">{t.dashboard.filterHeld}</option>
              <option value="BLOCKED">{t.dashboard.filterBlocked}</option>
            </select>

            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 outline-none"
            >
              <option value="ALL">{language === 'kn' ? 'ಎಲ್ಲಾ' : 'All'}</option>
              <option value="IN">{language === 'kn' ? 'ಸ್ವೀಕೃತಿ (IN)' : 'In (Credits)'}</option>
              <option value="OUT">{language === 'kn' ? 'ಪಾವತಿ (OUT)' : 'Out (Debits)'}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium uppercase text-[10px]">
                <th className="py-2.5 px-3">{t.dashboard.colDate}</th>
                <th className="py-2.5 px-3">{t.dashboard.colParty}</th>
                <th className="py-2.5 px-3">{t.dashboard.colCategory}</th>
                <th className="py-2.5 px-3">{t.dashboard.colStatus}</th>
                <th className="py-2.5 px-3 text-right">{t.dashboard.colAmount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLedger.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                    {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-slate-200 block font-medium">{tx.counterparty}</span>
                    {tx.message && <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">{tx.message}</span>}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                    {t.categories[tx.category] || tx.category}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      tx.status === 'VERIFIED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : tx.status === 'HELD_FOR_REVIEW'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {t.statuses[tx.status] || tx.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-right font-medium">
                    {tx.status === 'BLOCKED' ? (
                      <span className="text-slate-400 line-through text-xs">
                        ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                    ) : tx.direction === 'IN' ? (
                      <div className="inline-flex flex-col items-end">
                        <span className="font-bold text-emerald-400">
                          + ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-emerald-400/80 font-medium">
                          ({t.dashboard.credited || 'Credited'})
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-end">
                        <span className="font-bold text-rose-400">
                          - ₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-rose-400/80 font-medium">
                          ({t.dashboard.debited || 'Debited'})
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
