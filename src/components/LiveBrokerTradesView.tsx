import React, { useState } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign, 
  Award, 
  ShieldCheck, 
  Zap, 
  LineChart as LineChartIcon, 
  Download, 
  Flame, 
  Key, 
  Server, 
  Lock, 
  ExternalLink,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PaperTrade, BotStatus, BotSettings } from '../types';

interface LiveBrokerTradesViewProps {
  trades: PaperTrade[];
  status: BotStatus | null;
  settings?: BotSettings;
  onCloseTrade: (tradeId: string) => void;
  onOpenBrokerSettings?: () => void;
  language?: 'ar' | 'en';
}

export const LiveBrokerTradesView: React.FC<LiveBrokerTradesViewProps> = ({
  trades,
  status,
  settings,
  onCloseTrade,
  onOpenBrokerSettings,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED' | 'EQUITY'>('OPEN');

  const openTrades = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  // Broker connection details
  const activeBroker = settings?.brokerApiCredentials?.activeBroker || 'BINANCE';
  const isBrokerValidated = Boolean(
    (activeBroker === 'BINANCE' && settings?.brokerApiCredentials?.binance?.isValidated) ||
    (activeBroker === 'JUSTMARKETS' && settings?.brokerApiCredentials?.justmarkets?.isValidated) ||
    (activeBroker === 'XM' && settings?.brokerApiCredentials?.xm?.isValidated) ||
    (activeBroker === 'BYBIT' && settings?.brokerApiCredentials?.bybit?.isValidated)
  );

  const realBalance = status?.accountBalance ?? 0.00;
  const totalPnL = +trades.reduce((acc, t) => acc + (t.status === 'CLOSED' ? t.pnl : 0), 0).toFixed(2);
  const openPnL = +openTrades.reduce((acc, t) => acc + t.pnl, 0).toFixed(2);
  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 100;

  // Build Equity Growth Curve dataset
  let runningEquity = realBalance;
  const equityData = [
    { time: isAr ? 'البداية' : 'Start', equity: realBalance, pnl: 0 },
    ...trades.slice().reverse().map((t, idx) => {
      runningEquity += t.pnl;
      return {
        time: `#${idx + 1}`,
        equity: +runningEquity.toFixed(2),
        pnl: t.pnl,
        symbol: t.symbol,
      };
    })
  ];

  // CSV Export Function
  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const headers = ['Order ID', 'Symbol', 'Direction', 'Lot Size', 'Entry Price', 'Current/Exit Price', 'Stop Loss', 'Take Profit', 'Status', 'PnL ($)', 'PnL (%)', 'Opened At', 'Close Reason'];
    const rows = trades.map(t => [
      t.id,
      t.symbol,
      t.direction,
      t.lotSize,
      t.entryPrice,
      t.currentPrice,
      t.stopLoss,
      t.takeProfit1,
      t.status,
      t.pnl,
      t.pnlPercentage,
      new Date(t.openedAt).toISOString(),
      t.closeReason || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MarketRadar_LiveOrders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Live Broker Connection Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span>{isAr ? 'محفظة التداول الحقيقية وأوامر البروكر المباشرة' : 'Live Broker Portfolio & Order Book'}</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {activeBroker} DIRECT API
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {isAr
                ? 'تنفيذ حقيقي مباشر عبر واجهة برمجة التطبيقات (Direct API) مع نظام حماية الرصيد وإلغاء أي تداول وهمي.'
                : 'Direct live broker execution via API with strict portfolio drawdown protection and zero simulated trades.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenBrokerSettings && (
              <button
                onClick={onOpenBrokerSettings}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAr ? 'إعدادات ربط البروكر' : 'Broker API Config'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Real Account Equity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{isAr ? 'رصيد المحفظة الفعلي' : 'Broker Equity'}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-white">
            ${(realBalance + totalPnL + openPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">
            {isBrokerValidated ? (isAr ? 'متصل بالبروكر الحي' : 'Live Broker Linked') : (isAr ? 'يرجى ربط المفاتيح' : 'Connect Broker API')}
          </p>
        </div>

        {/* Realized & Floating PnL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{isAr ? 'صافي الربح الإجمالي' : 'Total Net PnL'}</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className={`text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono ${(totalPnL + openPnL) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(totalPnL + openPnL) >= 0 ? '+' : ''}${(totalPnL + openPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'الأرباح العائمة:' : 'Floating:'} <span className="text-emerald-300 font-mono font-bold">{openPnL >= 0 ? '+' : ''}${openPnL}</span>
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{isAr ? 'نسبة النجاح' : 'Win Rate'}</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-cyan-400">
            {winRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{winningTrades.length} {isAr ? 'صفقة رابحة' : 'Wins'} / {closedTrades.length} {isAr ? 'مغلقة' : 'Closed'}</p>
        </div>

        {/* Trailing Stop Locks */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{isAr ? 'حماية الأرباح (ATR)' : 'ATR Profit Lock'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-white">
            {openTrades.filter(t => t.trailingStopActive).length} / {openTrades.length}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">{isAr ? 'حارس تأمين الدخول مفعل' : 'Auto BE Guard Armed'}</p>
        </div>

        {/* Execution Grade */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm col-span-1 xs:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{isAr ? 'كفاءة التنفيذ' : 'Execution Grade'}</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-amber-300">
            {status?.metrics?.executionQuality?.fillEfficiencyPct || 96}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'الانزلاق:' : 'Slippage:'} <span className="text-slate-200 font-mono font-bold">{status?.metrics?.executionQuality?.avgSlippagePoints || 0.1} pips</span>
          </p>
        </div>
      </div>

      {/* Tabs & CSV Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('OPEN')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'OPEN'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأوامر الحية النشطة' : 'Live Open Orders'} ({openTrades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLOSED')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'CLOSED'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'سجل الصفقات المنفذة' : 'Execution History'} ({closedTrades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EQUITY')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'EQUITY'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>{isAr ? 'منحنى نمو رأس المال' : 'Equity Curve'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Live Open Orders */}
      {activeTab === 'OPEN' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'الأوامر الحقيقية المفتوحة بالبروكر' : 'Live Broker Open Positions'} ({openTrades.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'الوقف المتحرك ATR يعمل باستمرار لتأمين الأرباح ونقل الوقف إلى نقطة الدخول (Break-Even) فور تحقيق الهدف الأول' : 'Dynamic ATR Trailing Stop actively trailing profit locks'}
              </p>
            </div>
          </div>

          {openTrades.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm font-mono space-y-2">
              <p>{isAr ? 'لا توجد صفقات مفتوحة حالياً. البوت يراقب السوق وسيفتح الصفقات المطابقة لمعايير الأمان فوراً.' : 'No open orders currently. Bot is actively scanning live markets.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 pl-2">{isAr ? 'الرمز' : 'Asset'}</th>
                    <th className="pb-3">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="pb-3">{isAr ? 'حجم اللوت' : 'Lot'}</th>
                    <th className="pb-3">{isAr ? 'سعر الدخول' : 'Entry'}</th>
                    <th className="pb-3">{isAr ? 'السعر اللحظي' : 'Current'}</th>
                    <th className="pb-3">{isAr ? 'وقف الخسارة' : 'Stop Loss'}</th>
                    <th className="pb-3">{isAr ? 'الهدف TP1' : 'Target 1'}</th>
                    <th className="pb-3">{isAr ? 'حالة التأمين' : 'Status'}</th>
                    <th className="pb-3">{isAr ? 'الربح الصافي (بعد السبريد)' : 'Net PnL (After Spread)'}</th>
                    <th className="pb-3 text-right pr-2">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {openTrades.map((t) => {
                    const isLong = t.direction === 'LONG';
                    const isProfit = t.pnl >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 pl-2 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isProfit ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            <span>{t.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded font-bold w-max ${
                              isLong ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                            }`}>
                              {t.direction}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold w-max ${
                              t.tradeType === 'DAILY_SWING' || t.tradeType === 'SWING'
                                ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            }`}>
                              {t.tradeType === 'DAILY_SWING' || t.tradeType === 'SWING' ? (isAr ? '🌊 سوينق يومي' : '🌊 Daily Swing') : (isAr ? '⚡ مضاربة' : '⚡ Scalp')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-300">{t.lotSize}</td>
                        <td className="py-3.5">
                          <span className="text-slate-200 font-bold">${t.entryPrice}</span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">${t.currentPrice}</span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Live
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="text-rose-400 font-bold">${t.stopLoss}</span>
                        </td>
                        <td className="py-3.5 text-emerald-400 font-bold">${t.takeProfit1}</td>
                        <td className="py-3.5">
                          {t.trailingStopActive ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                              {isAr ? 'تأمين الوقف ATR' : 'ATR TRAIL LOCK'}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">{isAr ? 'حماية تأمين الدخول' : 'AUTO-BE ARMED'}</span>
                          )}
                        </td>
                        <td className="py-3.5 font-bold">
                          <div className="flex flex-col">
                            <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                              {isProfit ? '+' : ''}${t.pnl} ({isProfit ? '+' : ''}{t.pnlPercentage}%)
                            </span>
                            <span className="text-[9px] text-cyan-400/80 font-mono font-normal">
                              {isAr ? 'مخصوم السبريد والعمولة' : 'Spread & Fee Deducted'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button
                            onClick={() => onCloseTrade(t.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition"
                          >
                            {isAr ? 'إغلاق فوري' : 'Close'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Execution History */}
      {activeTab === 'CLOSED' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'سجل الصفقات المغلقة بالبروكر' : 'Closed Broker Orders Ledger'} ({closedTrades.length})</span>
              </h3>
            </div>
          </div>

          {closedTrades.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm font-mono">
              {isAr ? 'لا توجد صفقات مغلقة في هذه الجلسة بعد.' : 'No closed orders recorded yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 pl-2">{isAr ? 'الرمز' : 'Asset'}</th>
                    <th className="pb-3">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="pb-3">{isAr ? 'سعر الدخول' : 'Entry'}</th>
                    <th className="pb-3">{isAr ? 'سعر الخروج' : 'Exit'}</th>
                    <th className="pb-3">{isAr ? 'سبب الإغلاق' : 'Close Trigger'}</th>
                    <th className="pb-3">{isAr ? 'الربح المحقق ($)' : 'Realized PnL'}</th>
                    <th className="pb-3 text-right pr-2">{isAr ? 'الوقت' : 'Time'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {closedTrades.map((t) => {
                    const isProfit = t.pnl >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 pl-2 font-bold text-white">{t.symbol}</td>
                        <td className="py-3.5 font-bold">
                          <div className="flex flex-col gap-1">
                            <span className={t.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>
                              {t.direction}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold w-max ${
                              t.tradeType === 'DAILY_SWING' || t.tradeType === 'SWING'
                                ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            }`}>
                              {t.tradeType === 'DAILY_SWING' || t.tradeType === 'SWING' ? (isAr ? '🌊 سوينق يومي' : '🌊 Daily Swing') : (isAr ? '⚡ مضاربة' : '⚡ Scalp')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-300">${t.entryPrice}</td>
                        <td className="py-3.5 text-white font-bold">${t.currentPrice}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            {t.closeReason || 'TP1_PROFIT_LOCK'}
                          </span>
                        </td>
                        <td className={`py-3.5 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div className="flex flex-col">
                            <span>
                              {isProfit ? '+' : ''}${t.pnl} ({isProfit ? '+' : ''}{t.pnlPercentage}%)
                            </span>
                            <span className="text-[9px] text-cyan-400/80 font-mono font-normal">
                              {isAr ? 'صافي بعد السبريد' : 'Net After Spread'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right pr-2 text-slate-400 text-[11px]">
                          {t.closedAt ? new Date(t.closedAt).toLocaleTimeString() : 'Just now'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Equity Growth Curve */}
      {activeTab === 'EQUITY' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'منحنى نمو رأس المال التراكمي' : 'Cumulative Portfolio Growth'}</span>
              </h3>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400">{isAr ? 'الرصيد الفعلي:' : 'Current Equity:'} </span>
              <strong className="text-emerald-400 text-sm">${(realBalance + totalPnL).toFixed(2)}</strong>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="liveEquityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#liveEquityGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
