import React, { useState, useEffect } from 'react';
import { 
  Waves, 
  Flame, 
  ShieldAlert, 
  Layers, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Info, 
  CheckCircle2, 
  Lock, 
  Crosshair, 
  BarChart3, 
  Magnet, 
  AlertTriangle, 
  Eye, 
  Cpu,
  Activity,
  Gauge,
  Boxes,
  Compass,
  Fish,
  Split,
  Target
} from 'lucide-react';
import { MarketSymbol, SymbolLiquidityHeatmap, SignalDirection } from '../types';

interface LiquidityHeatmapHubProps {
  symbols: MarketSymbol[];
  initialSymbol?: string;
  onOpenChart?: (symbol: string) => void;
  onRefreshData?: () => void;
}

type TabType = 
  | 'HEATMAP_DEPTH' 
  | 'CVD_ABSORPTION' 
  | 'OI_FUNDING' 
  | 'FOOTPRINT_IMBALANCE' 
  | 'FVG_MAGNET' 
  | 'SWEEP_FAKEOUT' 
  | 'WHALE_FLOWS'
  | 'CME_COT' 
  | 'ANTI_SPOOFING';

export const LiquidityHeatmapHub: React.FC<LiquidityHeatmapHubProps> = ({
  symbols,
  initialSymbol = 'BTC/USDT',
  onOpenChart,
  onRefreshData
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [heatmapData, setHeatmapData] = useState<SymbolLiquidityHeatmap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<TabType>('HEATMAP_DEPTH');
  const [isSniping, setIsSniping] = useState<boolean>(false);
  const [snipeSuccessMessage, setSnipeSuccessMessage] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Fetch liquidity heatmap for selected symbol
  const fetchHeatmap = async (sym: string) => {
    try {
      const res = await fetch(`/api/radar/liquidity-heatmap?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json();
      if (data.success && data.heatmap) {
        setHeatmapData(data.heatmap);
      }
    } catch (err) {
      console.error('Error fetching liquidity heatmap:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchHeatmap(selectedSymbol);
  }, [selectedSymbol]);

  // Periodic live refresh every 2.5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHeatmap(selectedSymbol);
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedSymbol, autoRefresh]);

  // Handle Instant Liquidity Snipe Execution
  const handleExecuteLiquiditySnipe = async (customDir?: SignalDirection) => {
    if (!heatmapData) return;
    setIsSniping(true);
    setSnipeSuccessMessage(null);

    try {
      const res = await fetch('/api/radar/liquidity-snipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          customDirection: customDir || heatmapData.liquidityTradeBlueprint.recommendedDirection
        })
      });

      const data = await res.json();
      if (data.success) {
        setSnipeSuccessMessage(data.message);
        if (onRefreshData) onRefreshData();
      } else {
        setSnipeSuccessMessage(data.message || 'فشل فتح الصفقة');
      }
    } catch (err: any) {
      setSnipeSuccessMessage(`خطأ في التنفيذ: ${err.message}`);
    } finally {
      setIsSniping(false);
    }
  };

  const currentSymObj = symbols.find(s => s.symbol === selectedSymbol) || symbols[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                <Waves className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>خريطة السيولة الحقيقية وتدفق الأوامر المؤسساتية</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                    Real Liquidity & Order Flow Suite
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  رصد السيولة المنفذة الحقيقية بعيداً عن التلاعب: CVD Delta، Open Interest، Footprint Imbalances، FVGs، Judas Sweeps، وكتل الحيتان Dark Pool.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                autoRefresh 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'تحديث لحظي نشط (2.5s)' : 'التحديث التلقائي موقوف'}</span>
            </button>

            {onOpenChart && (
              <button
                onClick={() => onOpenChart(selectedSymbol)}
                className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-lg text-xs text-indigo-200 font-bold transition-all flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>فتح الشارت الحي</span>
              </button>
            )}
          </div>
        </div>

        {/* Symbol Quick Switcher Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-bold ml-1">الأصول المتاحة:</span>
          {symbols.map(s => {
            const isSelected = s.symbol === selectedSymbol;
            return (
              <button
                key={s.symbol}
                onClick={() => setSelectedSymbol(s.symbol)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 border-cyan-400/50 text-white shadow-lg shadow-indigo-500/25 scale-105'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>{s.symbol}</span>
                <span className="text-[10px] opacity-75 font-normal">
                  ${s.price.toLocaleString(undefined, { minimumFractionDigits: s.digits, maximumFractionDigits: s.digits })}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${s.change24h >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Snipe Success Alert Message */}
      {snipeSuccessMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-4 text-xs font-bold text-emerald-300 flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{snipeSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setSnipeSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-sm font-mono px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Real-Liquidity Quick Overview Strip */}
      {heatmapData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* CVD Status */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>دلتا CVD</span>
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className={`text-xs font-bold font-mono ${heatmapData.cvdAbsorption.cvdValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {heatmapData.cvdAbsorption.cvdValue > 0 ? `+${heatmapData.cvdAbsorption.cvdValue}` : heatmapData.cvdAbsorption.cvdValue}
            </div>
            <div className="text-[10px] text-indigo-300 font-semibold truncate">
              {heatmapData.cvdAbsorption.cvdDivergence === 'BULLISH_ABSORPTION' ? 'امتصاص شرائي' : heatmapData.cvdAbsorption.cvdDivergence === 'BEARISH_ABSORPTION' ? 'امتصاص بيعي' : 'دلتا متوازنة'}
            </div>
          </div>

          {/* Open Interest */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>الفائدة المفتوحة (OI)</span>
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xs font-bold font-mono text-cyan-300">
              ${(heatmapData.openInterestSqueeze.openInterestUSD / 1000000).toFixed(1)}M
            </div>
            <div className={`text-[10px] font-semibold ${heatmapData.openInterestSqueeze.openInterestChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {heatmapData.openInterestSqueeze.openInterestChange24hPct >= 0 ? `+${heatmapData.openInterestSqueeze.openInterestChange24hPct}%` : `${heatmapData.openInterestSqueeze.openInterestChange24hPct}%`} (24h)
            </div>
          </div>

          {/* Funding Rate */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>معدل التمويل (8h)</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className={`text-xs font-bold font-mono ${heatmapData.openInterestSqueeze.fundingRatePct > 0.02 ? 'text-amber-400' : heatmapData.openInterestSqueeze.fundingRatePct < 0 ? 'text-cyan-400' : 'text-slate-200'}`}>
              {(heatmapData.openInterestSqueeze.fundingRatePct * 100).toFixed(3)}%
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {heatmapData.openInterestSqueeze.squeezeRegime === 'SHORT_SQUEEZE_IMMINENT' ? '🚨 شورت سكويز' : heatmapData.openInterestSqueeze.squeezeRegime === 'LONG_SQUEEZE_RISK' ? '⚠️ لونغ سكويز' : 'تمويل طبيعي'}
            </div>
          </div>

          {/* Footprint Imbalance */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>بصمة Footprint</span>
              <Boxes className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="text-xs font-bold font-mono text-violet-300">
              {heatmapData.footprintImbalance.stackedBuyImbalances.length} مستويات شراء
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              سرعة الشريط: {heatmapData.footprintImbalance.institutionalTapePace}
            </div>
          </div>

          {/* FVG Magnet */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>فجوة FVG (50% CE)</span>
              <Magnet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xs font-bold font-mono text-emerald-400">
              ${heatmapData.fairValueGaps.nearestFvgMagnet?.targetPrice.toFixed(currentSymObj.digits) || '---'}
            </div>
            <div className="text-[10px] text-slate-400">
              مغناطيس ارتداد
            </div>
          </div>

          {/* Whale Net Flow */}
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>صافي تدفق الحيتان</span>
              <Fish className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className={`text-xs font-bold font-mono ${heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD < 0 ? `سحب -$${Math.abs(heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD / 1000000).toFixed(1)}M` : `إيداع +$${(heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD / 1000000).toFixed(1)}M`}
            </div>
            <div className="text-[10px] text-emerald-300 font-semibold truncate">
              {heatmapData.whaleDarkPoolFlow.exchangeNetFlowStatus === 'HEAVY_SUPPLY_SHOCK_OUTFLOW' ? 'صدمة معروض' : 'تدفق مستقر'}
            </div>
          </div>
        </div>
      )}

      {/* View Mode Nav Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
        <button
          onClick={() => setViewMode('HEATMAP_DEPTH')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'HEATMAP_DEPTH'
              ? 'bg-indigo-600/30 border-indigo-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>خريطة التصفية</span>
        </button>

        <button
          onClick={() => setViewMode('CVD_ABSORPTION')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'CVD_ABSORPTION'
              ? 'bg-indigo-600/30 border-indigo-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>دلتا CVD والامتصاص</span>
        </button>

        <button
          onClick={() => setViewMode('OI_FUNDING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'OI_FUNDING'
              ? 'bg-cyan-600/30 border-cyan-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span>الفائدة المفتوحة OI</span>
        </button>

        <button
          onClick={() => setViewMode('FOOTPRINT_IMBALANCE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'FOOTPRINT_IMBALANCE'
              ? 'bg-violet-600/30 border-violet-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-violet-400" />
          <span>بصمة الصفقات</span>
        </button>

        <button
          onClick={() => setViewMode('FVG_MAGNET')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'FVG_MAGNET'
              ? 'bg-emerald-600/30 border-emerald-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Magnet className="w-3.5 h-3.5 text-emerald-400" />
          <span>فجوات FVG & CE</span>
        </button>

        <button
          onClick={() => setViewMode('SWEEP_FAKEOUT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'SWEEP_FAKEOUT'
              ? 'bg-amber-600/30 border-amber-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>اصطياد السيولة Sweep</span>
        </button>

        <button
          onClick={() => setViewMode('WHALE_FLOWS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'WHALE_FLOWS'
              ? 'bg-teal-600/30 border-teal-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fish className="w-3.5 h-3.5 text-teal-400" />
          <span>رادار الحيتان</span>
        </button>

        <button
          onClick={() => setViewMode('CME_COT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'CME_COT'
              ? 'bg-cyan-600/30 border-cyan-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>CME & COT</span>
        </button>

        <button
          onClick={() => setViewMode('ANTI_SPOOFING')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
            viewMode === 'ANTI_SPOOFING'
              ? 'bg-rose-600/30 border-rose-500/60 text-white shadow-md'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>كشف التلاعب والـ Spoofing</span>
        </button>
      </div>

      {isLoading && !heatmapData ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm font-mono text-slate-400">جاري قراءة دفاتر الأوامر اللحظية ورسم خريطة السيولة...</p>
        </div>
      ) : heatmapData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left / Main Column: Heatmap Visualizer & Depth Ladder */}
          <div className="lg:col-span-8 space-y-6">

            {/* TAB 1: Heatmap Depth & Liquidation Zones */}
            {viewMode === 'HEATMAP_DEPTH' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                {/* Gravity Pull Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-950/80 border border-indigo-500/20 rounded-xl gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Magnet className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">جاذبية السيولة الحالية (Liquidity Gravity Pull):</div>
                      <div className="text-[11px] text-slate-400">
                        {heatmapData.liquidityGravityPull === 'PULL_UP_TO_SHORTS' && (
                          <span className="text-emerald-400 font-bold">
                            🧲 سحب صاعد قوي نحو تصفيات البيع المكشوف (Short Squeeze Target)
                          </span>
                        )}
                        {heatmapData.liquidityGravityPull === 'PULL_DOWN_TO_LONGS' && (
                          <span className="text-rose-400 font-bold">
                            🧲 سحب هابط لاصطياد تصفيات الشراء وقيعان السيولة (Long Liquidation Hunt)
                          </span>
                        )}
                        {heatmapData.liquidityGravityPull === 'EQUILIBRIUM' && (
                          <span className="text-amber-400 font-bold">
                            ⚖️ توازن نسبي بين كتل السيولة العلوية والسفلية
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400">سيولة أعلى (Shorts)</div>
                      <div className="text-emerald-400 font-bold">${(heatmapData.totalLiquidityPoolAboveUSD / 1000000).toFixed(1)}M</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">سيولة أسفل (Longs)</div>
                      <div className="text-rose-400 font-bold">${(heatmapData.totalLiquidityPoolBelowUSD / 1000000).toFixed(1)}M</div>
                    </div>
                  </div>
                </div>

                {/* Visual Order Book & Liquidation Ladder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
                    <span>مستويات السيولة والتصفية (Asks / Shorts Liquidation Pool)</span>
                    <span className="font-mono">حجم العقود المتراكمة</span>
                  </div>

                  {/* Asks / Short Liquidations (Red/Orange Heatmap Bars) */}
                  <div className="space-y-1 font-mono text-xs">
                    {heatmapData.asks.slice().reverse().slice(0, 5).map((ask, idx) => {
                      const liqMatch = heatmapData.liquidationClusters.find(c => Math.abs(c.priceLevel - ask.price) < ask.price * 0.002 && c.side === 'SHORT_LIQUIDATION');
                      return (
                        <div 
                          key={`ask-${idx}`}
                          className="relative flex items-center justify-between px-3 py-1.5 rounded-lg border border-rose-950/40 bg-slate-950/60 overflow-hidden group hover:border-rose-500/50 transition-all"
                        >
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-rose-500/15 group-hover:bg-rose-500/25 transition-all"
                            style={{ width: `${ask.intensityPct}%` }}
                          />

                          <div className="relative z-10 flex items-center gap-2">
                            <span className="font-bold text-rose-400">{ask.price.toFixed(currentSymObj.digits)}</span>
                            {ask.isIceberg && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 border border-cyan-400/40 text-cyan-300 font-bold flex items-center gap-1">
                                🧊 Iceberg Wall
                              </span>
                            )}
                            {ask.isSpoofed && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/60 border border-amber-400/40 text-amber-300 font-bold flex items-center gap-1">
                                🚫 Fake Wall
                              </span>
                            )}
                            {liqMatch && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900/70 border border-rose-400/40 text-rose-200 font-bold animate-pulse">
                                🔥 تصفية {liqMatch.leverageTier} (${(liqMatch.estimatedVolumeUSD / 1000000).toFixed(1)}M)
                              </span>
                            )}
                          </div>

                          <div className="relative z-10 text-slate-300 font-bold">
                            ${(ask.totalUSD / 1000).toFixed(1)}k ({ask.quantity} {currentSymObj.symbol.split('/')[0]})
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CURRENT PRICE BAR (The Fulcrum) */}
                  <div className="my-3 py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-900/60 via-cyan-900/60 to-indigo-900/60 border-2 border-cyan-400/60 flex items-center justify-between shadow-lg shadow-cyan-500/10 animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
                      <span className="text-xs font-black text-cyan-200">السعر المباشر (Current Price):</span>
                      <span className="text-sm font-black font-mono text-white">
                        ${heatmapData.currentPrice.toFixed(currentSymObj.digits)}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-cyan-300">
                      ميزان الطلبات: <strong className="text-white font-bold">{Math.round(heatmapData.orderBookImbalanceRatio * 100)}% Bids</strong>
                    </div>
                  </div>

                  {/* Bids / Long Liquidations (Green/Teal Heatmap Bars) */}
                  <div className="space-y-1 font-mono text-xs">
                    {heatmapData.bids.slice(0, 5).map((bid, idx) => {
                      const liqMatch = heatmapData.liquidationClusters.find(c => Math.abs(c.priceLevel - bid.price) < bid.price * 0.002 && c.side === 'LONG_LIQUIDATION');
                      return (
                        <div 
                          key={`bid-${idx}`}
                          className="relative flex items-center justify-between px-3 py-1.5 rounded-lg border border-emerald-950/40 bg-slate-950/60 overflow-hidden group hover:border-emerald-500/50 transition-all"
                        >
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-emerald-500/15 group-hover:bg-emerald-500/25 transition-all"
                            style={{ width: `${bid.intensityPct}%` }}
                          />

                          <div className="relative z-10 flex items-center gap-2">
                            <span className="font-bold text-emerald-400">{bid.price.toFixed(currentSymObj.digits)}</span>
                            {bid.isIceberg && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 border border-cyan-400/40 text-cyan-300 font-bold flex items-center gap-1">
                                🧊 Iceberg Wall
                              </span>
                            )}
                            {bid.isSpoofed && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/60 border border-amber-400/40 text-amber-300 font-bold flex items-center gap-1">
                                🚫 Fake Wall
                              </span>
                            )}
                            {liqMatch && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/70 border border-emerald-400/40 text-emerald-200 font-bold animate-pulse">
                                🔥 تصفية {liqMatch.leverageTier} (${(liqMatch.estimatedVolumeUSD / 1000000).toFixed(1)}M)
                              </span>
                            )}
                          </div>

                          <div className="relative z-10 text-slate-300 font-bold">
                            ${(bid.totalUSD / 1000).toFixed(1)}k ({bid.quantity} {currentSymObj.symbol.split('/')[0]})
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dominant Institutional Wall Card */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-slate-400">الجدار المؤسساتي المهيمن (Dominant Wall): </span>
                      <strong className={heatmapData.dominantWall.side === 'BUY_WALL' ? 'text-emerald-400' : 'text-rose-400'}>
                        {heatmapData.dominantWall.side === 'BUY_WALL' ? 'جدار طلبات شرائية ضخم (Buy Wall)' : 'جدار عروض بيعية (Sell Wall)'}
                      </strong>
                    </div>
                  </div>
                  <div className="font-mono text-slate-300">
                    السعر: <strong className="text-white">${heatmapData.dominantWall.price.toFixed(currentSymObj.digits)}</strong> | السيولة: <strong className="text-cyan-300">${(heatmapData.dominantWall.volumeUSD / 1000000).toFixed(2)}M</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Cumulative Volume Delta (CVD) & Absorption Divergence Engine */}
            {viewMode === 'CVD_ABSORPTION' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        محرك دلتا الحجم التراكمي (Cumulative Volume Delta - CVD)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        كشف الصفقات الحقيقية المنفذة بسعر السوق (Aggressive Market Orders) ورصد الامتصاص المخفي.
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    heatmapData.cvdAbsorption.cvdDivergence === 'BULLISH_ABSORPTION'
                      ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                      : heatmapData.cvdAbsorption.cvdDivergence === 'BEARISH_ABSORPTION'
                      ? 'bg-rose-950 border border-rose-500/50 text-rose-300'
                      : 'bg-slate-950 border border-slate-800 text-slate-300'
                  }`}>
                    {heatmapData.cvdAbsorption.cvdDivergence}
                  </span>
                </div>

                {/* Explanation Banner */}
                <div className="p-4 bg-slate-950 border border-indigo-500/20 rounded-xl space-y-2 text-xs leading-relaxed">
                  <div className="font-bold text-indigo-300 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>تحليل الامتصاص والدايفرجنس المؤسساتي الحقيقي:</span>
                  </div>
                  <p className="text-slate-300">
                    {heatmapData.cvdAbsorption.divergenceSummaryArabic}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80 text-slate-400">
                    <span>نطاق امتصاص الحيتان: <strong className="text-white">{heatmapData.cvdAbsorption.institutionalAbsorptionZone}</strong></span>
                    <span>ميزان الهجوم الشرائي/البيعي: <strong className="text-cyan-400">{heatmapData.cvdAbsorption.deltaImbalancePct}% Buyers</strong></span>
                  </div>
                </div>

                {/* CVD Mini Time Series Grid */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">سلسلة حركة السعر مقارنة بـ CVD التراكمي:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {heatmapData.cvdAbsorption.cvdHistory.map((pt, i) => (
                      <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono space-y-1">
                        <div className="text-slate-500 text-[9px]">{new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-white font-bold">${pt.price}</div>
                        <div className={`font-bold ${pt.cvd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          CVD: {pt.cvd > 0 ? `+${pt.cvd}` : pt.cvd}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Open Interest (OI) & Funding Rate Squeeze Matrix */}
            {viewMode === 'OI_FUNDING' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        مصفوفة الفائدة المفتوحة ومعدلات التمويل (Open Interest & Funding Matrix)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        كشف تراكم الرافعة المالية للأفراد ورصد مصائد الانفجار السعري (Short/Long Squeeze).
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                    {heatmapData.openInterestSqueeze.squeezeRegime}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-slate-400 text-[11px]">إجمالي الفائدة المفتوحة (OI)</div>
                    <div className="text-lg font-bold text-cyan-300">
                      ${(heatmapData.openInterestSqueeze.openInterestUSD / 1000000).toFixed(1)}M
                    </div>
                    <div className={`text-[10px] ${heatmapData.openInterestSqueeze.openInterestChange24hPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      تغير 24 ساعة: {heatmapData.openInterestSqueeze.openInterestChange24hPct >= 0 ? `+${heatmapData.openInterestSqueeze.openInterestChange24hPct}%` : `${heatmapData.openInterestSqueeze.openInterestChange24hPct}%`}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-slate-400 text-[11px]">معدل التمويل الحالي (8h Funding)</div>
                    <div className="text-lg font-bold text-amber-300">
                      {(heatmapData.openInterestSqueeze.fundingRatePct * 100).toFixed(4)}%
                    </div>
                    <div className="text-[10px] text-slate-500">
                      المتوقع: {(heatmapData.openInterestSqueeze.predictedFundingRatePct * 100).toFixed(4)}%
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-slate-400 text-[11px]">تصفيات تم تنظيفها (4h Flushed)</div>
                    <div className="text-lg font-bold text-rose-400">
                      ${(heatmapData.openInterestSqueeze.liquidationsFlushed4hUSD / 1000000).toFixed(2)}M
                    </div>
                    <div className="text-[10px] text-slate-500">
                      محفز الانفجار القادم: ${heatmapData.openInterestSqueeze.estimatedNextCascadePrice}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-cyan-900/30 rounded-xl text-xs leading-relaxed text-slate-300 space-y-1">
                  <div className="font-bold text-cyan-300">💡 تقرير محرك التصفية السريعة:</div>
                  <p>{heatmapData.openInterestSqueeze.regimeSummaryArabic}</p>
                </div>
              </div>
            )}

            {/* TAB 4: Footprint Stacked Imbalances & Unfinished Auctions */}
            {viewMode === 'FOOTPRINT_IMBALANCE' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-violet-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        بصمة الصفقات والمزاد غير المكتمل (Footprint Imbalance Matrix)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        رصد عدم التوازن الحجمي المكدس (Stacked Buying/Selling Imbalance &gt; 300%) وقمم/قيعان المزاد المفتوح.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-950 border border-violet-700 text-violet-300">
                    Tape Pace: {heatmapData.footprintImbalance.institutionalTapePace}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stacked Buy Imbalances */}
                  <div className="space-y-2 font-mono text-xs">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>🟢 عدم توازن شرائي مكدس (Stacked Bids):</span>
                    </h4>
                    {heatmapData.footprintImbalance.stackedBuyImbalances.map((lvl, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950 border border-emerald-950 rounded-lg flex items-center justify-between">
                        <span className="font-bold text-white">${lvl.price}</span>
                        <span className="text-emerald-400 font-bold">{lvl.buyVolume} Buy vs {lvl.sellVolume} Sell</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                          {lvl.imbalanceRatio}x Ratio
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Stacked Sell Imbalances */}
                  <div className="space-y-2 font-mono text-xs">
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <span>🔴 عدم توازن بيعي مكدس (Stacked Asks):</span>
                    </h4>
                    {heatmapData.footprintImbalance.stackedSellImbalances.map((lvl, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950 border border-rose-950 rounded-lg flex items-center justify-between">
                        <span className="font-bold text-white">${lvl.price}</span>
                        <span className="text-rose-400 font-bold">{lvl.sellVolume} Sell vs {lvl.buyVolume} Buy</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700">
                          {lvl.imbalanceRatio}x Ratio
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unfinished Auctions */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>مستويات المزاد غير المكتمل (Unfinished Auctions):</span>
                  </div>
                  {heatmapData.footprintImbalance.unfinishedAuctions.map((ua, i) => (
                    <div key={i} className="p-2 bg-slate-900/60 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">{ua.descriptionArabic}</span>
                      <span className="font-mono font-bold text-cyan-300">قوة الجذب: {ua.magnetPowerPct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: Fair Value Gaps (FVG) & 50% Consequent Encroachment (CE) */}
            {viewMode === 'FVG_MAGNET' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Magnet className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        فجوات القيمة العادلة وعدم الكفاءة الحجمية (FVG & 50% CE)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        تحديد مناطق تمدد السيولة السريعة التي سيعود صانع السوق لموازنتها عند منتصف الفجوة (50% Consequent Encroachment).
                      </p>
                    </div>
                  </div>
                </div>

                {heatmapData.fairValueGaps.nearestFvgMagnet && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-emerald-300 flex items-center justify-between">
                      <span>🎯 أقرب مغناطيس فجوة FVG نشط:</span>
                      <span className="font-mono text-white text-sm">${heatmapData.fairValueGaps.nearestFvgMagnet.targetPrice}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {heatmapData.fairValueGaps.nearestFvgMagnet.descriptionArabic}
                    </p>
                  </div>
                )}

                <div className="space-y-2 font-mono text-xs">
                  <h4 className="text-xs font-bold text-slate-300">الفجوات الحجمية المرصودة عبر الفريمات:</h4>
                  <div className="space-y-2">
                    {heatmapData.fairValueGaps.activeFvgs.map(fvg => (
                      <div key={fvg.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fvg.type === 'BULLISH_FVG' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                              {fvg.type === 'BULLISH_FVG' ? 'Bullish FVG' : 'Bearish FVG'} ({fvg.timeframe})
                            </span>
                            <span className="text-slate-400 text-[11px]">الحالة: {fvg.status}</span>
                          </div>
                          <div className="text-slate-300 text-[11px]">
                            النطاق: ${fvg.bottomPrice} ⟵ ${fvg.topPrice}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">نقطة الارتداد 50% CE</div>
                          <div className="text-sm font-bold text-cyan-300">${fvg.consequentEncroachment50}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Fakeout & Liquidity Sweep Radar (Judas Swing / Turtle Soup) */}
            {viewMode === 'SWEEP_FAKEOUT' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        كاشف الاختراق الكاذب وسحب السيولة (Judas Swing & Turtle Soup)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        رصد سحب ستوبات المتداولين فوق قمم وقيعان الجلسات (PDH/PDL/Asian Range) والانعكاس الفوري.
                      </p>
                    </div>
                  </div>
                </div>

                {heatmapData.sweepLiquidityTraps.activeTrapWarning && (
                  <div className="p-3.5 bg-amber-950/50 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-200">
                    {heatmapData.sweepLiquidityTraps.activeTrapWarning}
                  </div>
                )}

                <div className="space-y-3 font-mono text-xs">
                  <h4 className="text-xs font-bold text-slate-300">نماذج صيد السيولة النشطة:</h4>
                  {heatmapData.sweepLiquidityTraps.sweepEvents.map(ev => (
                    <div key={ev.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">{ev.reactionPattern}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                          المستوى: {ev.levelType} (${ev.sweptPrice})
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] font-sans">
                        {ev.descriptionArabic}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span>حجم السيولة المسحوبة: ${(ev.sweepVolumeUSD / 1000000).toFixed(1)}M</span>
                        <span className={ev.isConfirmedReversal ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          {ev.isConfirmedReversal ? '✅ انعكاس مؤكد (Confirmed)' : '⏳ قيد المراقبة'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: Whale & Dark Pool Net Flow Tracker */}
            {viewMode === 'WHALE_FLOWS' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Fish className="w-5 h-5 text-teal-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        رادار تدفقات الحيتان والصفقات المظلمة (Whale & Dark Pool Tracker)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        تتبع التدفقات الصافية للمنصات (Inflows/Outflows) والصفقات المؤسساتية في الدارك بول.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-teal-950 border border-teal-700 text-teal-300 font-bold">
                    {heatmapData.whaleDarkPoolFlow.exchangeNetFlowStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-slate-400 text-[11px]">صافي تدفق المنصات (24h Net Flow)</div>
                    <div className={`text-base font-bold ${heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD < 0 ? `سحب -$${Math.abs(heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD / 1000000).toFixed(2)}M` : `إيداع +$${(heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD / 1000000).toFixed(2)}M`}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {heatmapData.whaleDarkPoolFlow.whaleNetFlowUSD < 0 ? 'تجفيف معروض من التداول المتاح' : 'احتمال زيادة المعروض البيعي'}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="text-slate-400 text-[11px]">صفقات الدارك بول (Off-Book Blocks)</div>
                    <div className="text-base font-bold text-cyan-300">
                      {heatmapData.whaleDarkPoolFlow.darkPoolBlocksCount24h} صفقات بلوك
                    </div>
                    <div className="text-[10px] text-slate-500">
                      أكبر صفقة مخفية: ${(heatmapData.whaleDarkPoolFlow.largestDarkPoolTransferUSD / 1000000).toFixed(1)}M
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">تنبيهات تحركات المحافظ الضخمة الأخيرة:</h4>
                  {heatmapData.whaleDarkPoolFlow.recentWhaleAlerts.map((alert, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-cyan-300">{alert.entityLabel}</span>
                        <span className="text-slate-400">${(alert.amountUSD / 1000000).toFixed(1)}M</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        {alert.impactArabic}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: CME Futures DOM & COT Institutional Report */}
            {viewMode === 'CME_COT' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      عمق العقود الآجلة لبورصة شيكاغو (CME Futures DOM & Footprint)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-lg">
                    {heatmapData.cmeFutures?.contractCode || 'CME Market Feed'}
                  </span>
                </div>

                {heatmapData.cmeFutures ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">نقطة التحكم المؤسساتية (POC)</div>
                      <div className="text-base font-bold font-mono text-indigo-300">
                        ${heatmapData.cmeFutures.pocPrice.toFixed(currentSymObj.digits)}
                      </div>
                      <div className="text-[10px] text-slate-500">أعلى تركيز حجم تداول من البنوك</div>
                    </div>

                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">منطقة القيمة العليا (VAH)</div>
                      <div className="text-base font-bold font-mono text-rose-400">
                        ${heatmapData.cmeFutures.valueAreaHigh.toFixed(currentSymObj.digits)}
                      </div>
                      <div className="text-[10px] text-slate-500">سقف المقاومة الحجمي للـ Value Area</div>
                    </div>

                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">منطقة القيمة الدنيا (VAL)</div>
                      <div className="text-base font-bold font-mono text-emerald-400">
                        ${heatmapData.cmeFutures.valueAreaLow.toFixed(currentSymObj.digits)}
                      </div>
                      <div className="text-[10px] text-slate-500">قاع الدعم الحجمي المؤسساتي</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 text-center">
                    بيانات CME DOM متاحة للعملات الأجنبية والمعادن (Gold & Forex Pairs).
                  </div>
                )}

                {/* COT Report Breakdown */}
                {heatmapData.cotReport && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">تقرير التزام المتعاملين (CFTC COT Smart Money Report)</span>
                      <span className="text-[10px] font-mono text-slate-400">{heatmapData.cotReport.reportDate}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      💡 {heatmapData.cotReport.summaryArabic}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px]">مراكز التحوط المؤسساتي (Commercials):</span>
                        <div className="font-bold text-emerald-400 mt-0.5">
                          {heatmapData.cotReport.commercialNetPosition > 0 ? `+${heatmapData.cotReport.commercialNetPosition.toLocaleString()}` : heatmapData.cotReport.commercialNetPosition.toLocaleString()} عقود
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[10px]">مراكز كبار المضاربين (Non-Commercials):</span>
                        <div className="font-bold text-indigo-300 mt-0.5">
                          {heatmapData.cotReport.nonCommercialNetPosition > 0 ? `+${heatmapData.cotReport.nonCommercialNetPosition.toLocaleString()}` : heatmapData.cotReport.nonCommercialNetPosition.toLocaleString()} عقود
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 9: Anti-Spoofing & Iceberg Radar */}
            {viewMode === 'ANTI_SPOOFING' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <h3 className="text-sm font-bold text-white">
                      محرك كشف التلاعب وأوامر الـ Iceberg المخفية (Anti-Spoofing Engine)
                    </h3>
                  </div>
                  <div className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                    مؤشر الخداع البصري: <strong className={heatmapData.antiSpoofing.spoofingRiskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}>{heatmapData.antiSpoofing.spoofingRiskScore}/100</strong>
                  </div>
                </div>

                {/* Icebergs list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <span>🧊 الأوامر المخفية المكتشفة (Verified Iceberg Orders):</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    {heatmapData.antiSpoofing.verifiedIcebergOrders.map((ice, i) => (
                      <div key={i} className="p-3 bg-slate-950 border border-cyan-900/40 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${ice.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {ice.side === 'BUY' ? '🟢 جدار شراء Iceberg' : '🔴 جدار بيع Iceberg'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                            حماية: {ice.protectionStrength}
                          </span>
                        </div>
                        <div className="text-slate-200">
                          السعر: <strong className="text-white">${ice.price.toFixed(currentSymObj.digits)}</strong>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          السيولة المخفية المقدرة: <strong className="text-cyan-300">${(ice.hiddenVolumeEstimatedUSD / 1000000).toFixed(2)}M</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fake walls alert */}
                {heatmapData.antiSpoofing.fakeWallsDetected.length > 0 ? (
                  <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>تحذير: تم رصد جدران أوامر وهمية (Spoofing Detected)</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      تم رصد أوامر ضخمة تم وضعها بالقرب من السعر لخداع المتداولين الصغار وإلغاؤها عند اقتراب السعر:
                    </p>
                    {heatmapData.antiSpoofing.fakeWallsDetected.map((fw, idx) => (
                      <div key={idx} className="font-mono text-[11px] text-amber-200 bg-slate-900/60 p-2 rounded border border-amber-900/40 flex justify-between">
                        <span>جدار {fw.side === 'BUY_WALL' ? 'شراء' : 'بيع'} عند ${fw.price.toFixed(currentSymObj.digits)} (${(fw.volumeUSD / 1000).toFixed(1)}k)</span>
                        <span>السلوك: {fw.detectedBehavior} (دقة {fw.confidencePct}%)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>دفتر الأوامر نظيف حالياً ولا توجد محاولات تلاعب بالـ Spoofing مؤكدة.</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Liquidity-Enhanced Sniper Blueprint & Direct Trade Execution */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white">
                    خطة صيد السيولة الحقيقية
                  </h3>
                </div>
                <div className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Smart Money Alpha: {heatmapData.liquidityTradeBlueprint.smartMoneyAlphaScore}/100
                </div>
              </div>

              {/* Blueprint Details */}
              <div className="space-y-3 font-mono text-xs">
                
                {/* Recommended Direction */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400">الاتجاه الموصى به:</span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    heatmapData.liquidityTradeBlueprint.recommendedDirection === 'LONG'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {heatmapData.liquidityTradeBlueprint.recommendedDirection === 'LONG' ? '🟢 شراء (LONG)' : '🔴 بيع (SHORT)'}
                  </span>
                </div>

                {/* Entry Zone */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>نقطة اقتناص الدخول (Sniper Entry Zone):</span>
                    <span className="text-cyan-400">Discount & 50% CE</span>
                  </div>
                  <div className="font-bold text-white text-sm">
                    ${heatmapData.liquidityTradeBlueprint.suggestedEntryPrice.toFixed(currentSymObj.digits)}
                  </div>
                </div>

                {/* Stop Loss Protected behind Iceberg */}
                <div className="p-3 bg-slate-950 border border-rose-950/60 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>وقف الخسارة المحمي (Iceberg Shelter SL):</span>
                    <span className="text-cyan-300 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> محمي بجدار أوامر
                    </span>
                  </div>
                  <div className="font-bold text-rose-400 text-sm">
                    ${heatmapData.liquidityTradeBlueprint.protectedStopLoss.toFixed(currentSymObj.digits)}
                  </div>
                </div>

                {/* Targets aimed at liquidation pools & FVG */}
                <div className="p-3 bg-slate-950 border border-emerald-950/60 rounded-xl space-y-2">
                  <div className="text-slate-400 text-[11px] font-bold">
                    أهداف جني الأرباح (تجمعات التصفية والمزاد):
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-emerald-300">
                      <span>هدف 1 (أقرب كتلة تصفية):</span>
                      <strong className="text-white">${heatmapData.liquidityTradeBlueprint.targetLiquidationPool1.toFixed(currentSymObj.digits)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>هدف 2 (قمة/قاع مزاد غير مكتمل):</span>
                      <strong className="text-white">${heatmapData.liquidityTradeBlueprint.targetLiquidationPool2.toFixed(currentSymObj.digits)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-500">
                      <span>هدف 3 (بركة سيولة متطابقة EQH/EQL):</span>
                      <strong className="text-white">${heatmapData.liquidityTradeBlueprint.targetLiquidationPool3.toFixed(currentSymObj.digits)}</strong>
                    </div>
                  </div>
                </div>

                {/* Confluence Rationale */}
                <div className="p-3 bg-slate-950/90 border border-indigo-900/50 rounded-xl space-y-1 text-slate-300 text-xs font-sans leading-relaxed">
                  <div className="font-bold text-indigo-300 text-[11px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>مبررات بناء الصفقة وفق تدفق السيولة:</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {heatmapData.liquidityTradeBlueprint.confluenceReasonArabic}
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  disabled={isSniping}
                  onClick={() => handleExecuteLiquiditySnipe()}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSniping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التنفيذ...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>⚡ تنفيذ صفقة قناص السيولة</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    disabled={isSniping}
                    onClick={() => handleExecuteLiquiditySnipe('LONG')}
                    className="py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>تنفيذ شراء (Long)</span>
                  </button>

                  <button
                    disabled={isSniping}
                    onClick={() => handleExecuteLiquiditySnipe('SHORT')}
                    className="py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>تنفيذ بيع (Short)</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
};
