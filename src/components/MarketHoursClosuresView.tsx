import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Globe, 
  ShieldCheck, 
  AlertTriangle, 
  Moon, 
  Sun, 
  Zap, 
  Flame, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronRight, 
  Info,
  Timer,
  Lock,
  Unlock,
  Sliders,
  DollarSign,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { 
  MarketClosuresOverview, 
  MarketSessionStatus, 
  AssetClassMarketStatus, 
  MarketHoliday, 
  MarketSymbolSchedule,
  AssetClass
} from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MarketHoursClosuresViewProps {
  onSelectSymbolForChart?: (symbol: string) => void;
}

export const MarketHoursClosuresView: React.FC<MarketHoursClosuresViewProps> = ({
  onSelectSymbolForChart
}) => {
  const { t, language } = useLanguage();
  const [overview, setOverview] = useState<MarketClosuresOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedHolidayYear, setSelectedHolidayYear] = useState<'ALL' | '2025' | '2026'>('ALL');
  const [selectedHolidayMarket, setSelectedHolidayMarket] = useState<string>('ALL');
  const [searchSymbolInput, setSearchSymbolInput] = useState<string>('XAU/USD');
  const [customSchedule, setCustomSchedule] = useState<MarketSymbolSchedule | null>(null);
  const [inspectingSymbol, setInspectingSymbol] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/market-hours/overview');
      const data = await res.json();
      if (data.success && data.overview) {
        setOverview(data.overview);
      }
    } catch (err) {
      console.error('Failed to fetch market closures overview:', err);
    }
  };

  const inspectSymbolSchedule = async (symbol: string) => {
    setInspectingSymbol(true);
    try {
      const clean = symbol.trim().toUpperCase();
      const res = await fetch(`/api/market-hours/symbol/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.success && data.schedule) {
        setCustomSchedule(data.schedule);
      }
    } catch (err) {
      console.error('Failed to inspect symbol schedule:', err);
    } finally {
      setInspectingSymbol(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    inspectSymbolSchedule('XAU/USD');
    const interval = setInterval(fetchOverview, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const getAssetClassIcon = (ac: AssetClass) => {
    switch (ac) {
      case 'forex': return '💱';
      case 'commodity': return '🪙';
      case 'indices': return '📊';
      case 'stock': return '🏢';
      case 'crypto': return '⚡';
      default: return '📈';
    }
  };

  const getStateBadge = (state: string, stateArabic: string) => {
    switch (state) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {language === 'ar' ? stateArabic : 'OPEN'}
          </span>
        );
      case 'CLOSED_WEEKEND':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <Lock className="w-3 h-3" />
            {language === 'ar' ? stateArabic : 'WEEKEND CLOSED'}
          </span>
        );
      case 'DAILY_ROLLOVER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-3 h-3" />
            {language === 'ar' ? stateArabic : 'ROLLOVER SETTLEMENT'}
          </span>
        );
      case 'DAILY_MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-400 border border-indigo-500/30">
            <Clock className="w-3 h-3" />
            {language === 'ar' ? stateArabic : 'CME BREAK'}
          </span>
        );
      case 'PRE_MARKET':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
            <Sun className="w-3 h-3" />
            {language === 'ar' ? stateArabic : 'PRE-MARKET'}
          </span>
        );
      case 'AFTER_HOURS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-950/80 text-purple-400 border border-purple-500/30">
            <Moon className="w-3 h-3" />
            {language === 'ar' ? stateArabic : 'AFTER-HOURS'}
          </span>
        );
      case 'HOLIDAY_CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <Calendar className="w-3 h-3" />
            {language === 'ar' ? stateArabic : 'HOLIDAY'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {state}
          </span>
        );
    }
  };

  const allHolidaysList = [
    ...(overview?.activeHolidaysToday || []),
    ...(overview?.upcomingHolidays || [])
  ];

  const filteredHolidays = allHolidaysList.filter(hol => {
    if (selectedHolidayYear !== 'ALL' && !hol.date.startsWith(selectedHolidayYear)) return false;
    if (selectedHolidayMarket !== 'ALL' && !hol.country.toLowerCase().includes(selectedHolidayMarket.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
      
      {/* Top Banner & Bot Guard Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  {language === 'ar' ? 'مركز إغلاقات وأوقات الأسواق والأعياد' : 'Global Market Hours & Holiday Closures'}
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE UTC
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {language === 'ar' 
                    ? 'المحرك الزمني المتكامل لمعرفة الجلسات العالمية، الإغلاقات الأسبوعية، وفترات التسوية البنكية وحماية البوت من فجوات الافتتاح.' 
                    : 'Real-time multi-market session tracker, daily/weekly closure countdowns, holiday calendars, and bot execution guardrails.'}
                </p>
              </div>
            </div>
          </div>

          {/* Real-Time UTC Clock & Weekend Countdown Widget */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  {overview?.dayOfWeek || 'UTC TIME'}
                </div>
                <div className="text-lg font-mono font-bold text-white tracking-tight">
                  {overview?.utcTimeStr || '--:--:-- UTC'}
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchOverview()}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/60 flex items-center justify-center"
              title="Refresh Market Times"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Warning / Bot Execution Guard Notice */}
        {overview?.botExecutionGuard.globalWarningMessage && (
          <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold flex items-center gap-2">
                <span>{language === 'ar' ? 'تنبيه حارس إغلاقات الأسواق للبوت' : 'Bot Market Closure Guard Active'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30">
                  {overview.isWeekend ? (language === 'ar' ? 'عطلة أسبوعية' : 'Weekend Mode') : (language === 'ar' ? 'حماية السيولة' : 'Liquidity Guard')}
                </span>
              </div>
              <p className="text-slate-300 text-xs">
                {language === 'ar' ? overview.botExecutionGuard.globalWarningMessageArabic : overview.botExecutionGuard.globalWarningMessage}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4 Major World Trading Sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {language === 'ar' ? 'الجلسات المالية العالمية الكبرى (World Sessions)' : 'Global Major Trading Sessions'}
            </h3>
          </div>
          {overview?.overlapWindow.isOverlapActive && (
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {language === 'ar' ? overview.overlapWindow.nameArabic : overview.overlapWindow.name}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overview?.allSessions.map(sess => {
            const isOpen = sess.isOpen;
            return (
              <div 
                key={sess.id}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  isOpen 
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                    : 'bg-slate-900/40 border-slate-800/80 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{sess.flag}</span>
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          {language === 'ar' ? sess.nameArabic.split('(')[0] : sess.name}
                          {sess.isKillzone && isOpen && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              KILLZONE
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sess.openUtc} - {sess.closeUtc} UTC
                        </span>
                      </div>
                    </div>
                    <div>
                      {isOpen ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {language === 'ar' ? 'مفتوحة' : 'OPEN'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                          {language === 'ar' ? 'مغلقة' : 'CLOSED'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar of session */}
                  <div className="my-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{isOpen ? (language === 'ar' ? 'التقدم:' : 'Progress:') : (language === 'ar' ? 'الافتتاح خلال:' : 'Opens in:')}</span>
                      <span className="font-bold text-slate-200">
                        {isOpen ? `${sess.progressPct}%` : sess.timeRemaining}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOpen ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-slate-700'
                        }`}
                        style={{ width: `${isOpen ? sess.progressPct : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Active Pairs for Session */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 text-[10px]">{language === 'ar' ? 'الأزواج النشطة:' : 'Key Pairs:'}</span>
                  <div className="flex items-center gap-1">
                    {sess.activePairs.slice(0, 2).map(p => (
                      <button
                        key={p}
                        onClick={() => onSelectSymbolForChart && onSelectSymbolForChart(p)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono font-medium transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asset Classes Market Matrix & Schedule Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              {language === 'ar' ? 'مصفوفة إغلاقات وتداول فئات الأصول (Asset Classes)' : 'Asset Classes & Real-Time Trading Clearance'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'معرفة مواعيد فتح وإغلاق كل سوق وسلوك السبريد وملاءمة البوت للتداول' : 'Real-time open/closed status, liquidity depth, spread risk, and bot authorization'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">{language === 'ar' ? 'حالة البوت:' : 'Bot Mode:'}</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {overview?.isWeekend ? (language === 'ar' ? 'حظر صفقات الأسواق المغلقة' : 'Weekend Guard Active') : (language === 'ar' ? 'تداول نشط' : 'Active Trading')}
            </span>
          </div>
        </div>

        {overview?.assetClasses && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(overview.assetClasses) as AssetClass[]).map(key => {
              const ac = overview.assetClasses[key];
              const isAllowed = (key === 'crypto') || (ac.isOpen && !overview.dailyRolloverCountdown.isRolloverActive);

              return (
                <div 
                  key={key}
                  className={`p-4 rounded-2xl border transition-all ${
                    ac.isOpen 
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-950/30 border-rose-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getAssetClassIcon(key)}</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">
                          {language === 'ar' ? ac.titleArabic : ac.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ac.symbolsCount} {language === 'ar' ? 'أصول مراقبة' : 'Monitored Assets'}
                        </span>
                      </div>
                    </div>
                    <div>{getStateBadge(ac.state, ac.stateArabic)}</div>
                  </div>

                  <div className="space-y-2 text-xs py-2 border-y border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{language === 'ar' ? 'الحدث القادم:' : 'Next Event:'}</span>
                      <span className="font-semibold text-slate-200">
                        {language === 'ar' ? ac.nextEventTitleArabic : ac.nextEventTitle}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{language === 'ar' ? 'عمق السيولة:' : 'Liquidity Depth:'}</span>
                      <span className={`font-bold ${
                        ac.liquidityTier === 'OPTIMAL' ? 'text-emerald-400' :
                        ac.liquidityTier === 'MODERATE' ? 'text-teal-400' :
                        ac.liquidityTier === 'THIN' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {ac.liquidityTier}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{language === 'ar' ? 'إذن تنفيذ البوت:' : 'Bot Execution:'}</span>
                      <span className={`font-bold flex items-center gap-1 ${isAllowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isAllowed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {isAllowed ? (language === 'ar' ? 'مصرّح للتداول' : 'Allowed') : (language === 'ar' ? 'محظور (مغلق)' : 'Blocked')}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
                    {language === 'ar' ? ac.notesArabic : ac.notes}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Symbol Market Schedule Inspector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <Search className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {language === 'ar' ? 'فاحص مواعيد تداول الرمز وإغلاقاته اللحظية' : 'Symbol-Specific Market Schedule Inspector'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'افحص حالة أي أصل لمعرفة ما إذا كان متاحاً للتداول الفوري أو مغلقاً لعطلة أو تسوية' : 'Inspect any market symbol for open/closed state, rollover warnings, and spread multipliers'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchSymbolInput}
              onChange={(e) => setSearchSymbolInput(e.target.value.toUpperCase())}
              placeholder="e.g. XAU/USD, EUR/USD, US30, BTC/USD, NVDA"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 uppercase"
            />
          </div>
          <button
            onClick={() => inspectSymbolSchedule(searchSymbolInput)}
            disabled={inspectingSymbol}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-2 shrink-0"
          >
            <Clock className="w-4 h-4" />
            {language === 'ar' ? 'فحص حالة السوق' : 'Check Schedule'}
          </button>
        </div>

        {customSchedule && (
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl font-bold text-emerald-400 font-mono">
                {customSchedule.symbol.split('/')[0] || customSchedule.symbol.slice(0, 3)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{customSchedule.symbol}</h4>
                  <span className="text-xs text-slate-400 font-mono uppercase">({customSchedule.assetClass})</span>
                  {getStateBadge(customSchedule.state, customSchedule.stateArabic)}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                  <span>{language === 'ar' ? 'الحدث التالي:' : 'Next Event:'} {language === 'ar' ? customSchedule.nextEventArabic : customSchedule.nextEvent}</span>
                  <span>•</span>
                  <span className="text-emerald-400">{customSchedule.countdownText}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-slate-400">{language === 'ar' ? 'معامل السبريد:' : 'Spread Mult:'}</span>
                <div className={`font-bold ${customSchedule.currentSpreadMultiplier > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {customSchedule.currentSpreadMultiplier}x
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-400">{language === 'ar' ? 'إذن البوت:' : 'Bot Clearance:'}</span>
                <div className={`font-bold ${customSchedule.tradingAllowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {customSchedule.tradingAllowed ? (language === 'ar' ? 'مسموح للتداول ✅' : 'Allowed ✅') : (language === 'ar' ? 'محظور (مغلق) ⛔' : 'Blocked ⛔')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Financial Exchange Holidays Calendar 2025-2027 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              {language === 'ar' ? 'تقويم الأعياد والعطلات الرسمية للأسواق المالية (2025 - 2027)' : 'Global Financial Exchange Holidays Calendar (2025 - 2027)'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? 'قائمة شاملة بالعطلات الرسمية، الإغلاقات المبكرة، وتأثير كل عطلة على استراتيجيات البوت' : 'Comprehensive directory of market bank holidays, early closures, and bot risk guidance'}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
              {(['ALL', '2025', '2026'] as const).map(yr => (
                <button
                  key={yr}
                  onClick={() => setSelectedHolidayYear(yr)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedHolidayYear === yr 
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {yr === 'ALL' ? (language === 'ar' ? 'الكل' : 'All') : yr}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              {[
                { id: 'ALL', label: language === 'ar' ? 'جميع البورصات' : 'All Markets' },
                { id: 'USA', label: '🇺🇸 USA' },
                { id: 'UK', label: '🇬🇧 UK' },
                { id: 'Global', label: '🌐 Global' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedHolidayMarket(m.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedHolidayMarket === m.id 
                      ? 'bg-slate-800 text-white font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Holidays List */}
        <div className="space-y-3">
          {filteredHolidays.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-mono">
              {language === 'ar' ? 'لا توجد عطلات تطابق الفلتر المحدد.' : 'No holidays matching the selected criteria.'}
            </div>
          ) : (
            filteredHolidays.map(hol => {
              const isToday = hol.isToday;
              const isFullClose = hol.status === 'FULL_CLOSE';
              const isEarlyClose = hol.status === 'EARLY_CLOSE';

              return (
                <div 
                  key={hol.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isToday 
                      ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-500/5' 
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="text-2xl shrink-0 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      {hol.countryFlag}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-white">
                          {language === 'ar' ? hol.nameArabic : hol.name}
                        </h4>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 animate-bounce">
                            {language === 'ar' ? 'اليوم!' : 'TODAY!'}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isFullClose 
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/30' 
                            : isEarlyClose 
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                            : 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                        }`}>
                          {hol.status === 'FULL_CLOSE' 
                            ? (language === 'ar' ? 'إغلاق شامل' : 'FULL CLOSE') 
                            : hol.status === 'EARLY_CLOSE' 
                            ? (language === 'ar' ? `إغلاق مبكر ${hol.earlyCloseTimeUtc || ''}` : `EARLY CLOSE ${hol.earlyCloseTimeUtc || ''}`)
                            : (language === 'ar' ? 'سيولة شحيحة' : 'THIN LIQUIDITY')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                        <span className="font-semibold text-slate-300">{hol.date}</span>
                        <span>•</span>
                        <span>{hol.country}</span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {language === 'ar' ? 'الأسواق المتأثرة:' : 'Affected:'} {hol.affectedMarkets.join(', ')}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          <strong className="text-emerald-400">{language === 'ar' ? 'توجيه البوت: ' : 'Bot Guidance: '}</strong>
                          {language === 'ar' ? hol.botActionGuidanceArabic : hol.botActionGuidance}
                        </span>
                      </p>
                    </div>
                  </div>

                  {hol.daysUntil !== undefined && hol.daysUntil > 0 && (
                    <div className="shrink-0 text-right font-mono text-xs text-slate-400">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                        {language === 'ar' ? `خلال ${hol.daysUntil} يوم` : `in ${hol.daysUntil} days`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
