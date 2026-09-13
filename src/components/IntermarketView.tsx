import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Info,
  DollarSign,
  Flame,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { IntermarketMacroState, MarketSymbol } from '../types';

interface IntermarketViewProps {
  symbols: MarketSymbol[];
  onOpenChart?: (symbol: string, timeframe: string) => void;
}

export const IntermarketView: React.FC<IntermarketViewProps> = ({ symbols, onOpenChart }) => {
  const [macroData, setMacroData] = useState<IntermarketMacroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<'GOLD' | 'FOREX' | 'CORRELATIONS'>('GOLD');

  const fetchIntermarketData = async () => {
    try {
      const res = await fetch('/api/radar/intermarket');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMacroData(data.intermarket);
        }
      }
    } catch (err) {
      console.error('Failed to load intermarket macro data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntermarketData();
    const interval = setInterval(fetchIntermarketData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchIntermarketData();
  };

  if (loading && !macroData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">جاري معالجة بيانات التحليل الاقتصادي الكلي (Intermarket Analysis)...</p>
      </div>
    );
  }

  if (!macroData) return null;

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'RISK_ON_EXPANSION':
        return 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400';
      case 'RISK_OFF_DEFENSIVE':
        return 'from-amber-500/20 to-rose-500/10 border-amber-500/40 text-amber-400';
      case 'DOLLAR_YIELD_SQUEEZE':
        return 'from-rose-500/20 to-orange-500/10 border-rose-500/40 text-rose-400';
      case 'STAGFLATIONARY_PRESSURE':
        return 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-400';
      default:
        return 'from-blue-500/20 to-indigo-500/10 border-blue-500/40 text-blue-400';
    }
  };

  const getBiasBadge = (bias: string) => {
    if (bias.includes('BULLISH')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          {bias === 'STRONG_BULLISH' ? 'صعود قوي جداً' : 'إيجابي صاعد'}
        </span>
      );
    }
    if (bias.includes('BEARISH')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
          <TrendingDown className="w-3.5 h-3.5" />
          {bias === 'STRONG_BEARISH' ? 'هبوط قوي جداً' : 'سلبي هابط'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
        حيادي / توازن
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Intermarket Macro Analysis
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  ربط الذهب & العملات بالأسواق الكلية
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                مراقبة حية لتأثير مؤشر الدولار (DXY)، عوائد السندات الأمريكية (US10Y)، مؤشرات الأسهم، ومؤشر الخوف VIX على صفقات التداول
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 block">آخر تحديث لحظي</span>
            <span className="text-xs font-mono text-slate-300">
              {new Date(macroData.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            تحديث المؤشرات
          </button>
        </div>
      </div>

      {/* Global Macro Regime Status */}
      <div className={`p-5 rounded-2xl bg-gradient-to-br border shadow-lg ${getRegimeColor(macroData.macroRegime)}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-extrabold uppercase tracking-wider">النظام الاقتصادي الكلي السائد (Global Macro Regime)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">نسبة الثقة الإحصائية:</span>
            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-slate-950/60 border border-current">
              {macroData.regimeConfidence}%
            </span>
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-white mb-2">
          {macroData.regimeNameArabic}
          <span className="text-xs sm:text-sm font-mono text-slate-300 font-normal mr-2">({macroData.macroRegime})</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-4xl">
          {macroData.regimeSummary}
        </p>
      </div>

      {/* Macro Anchors Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* DXY Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-slate-200">DXY (مؤشر الدولار)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-white">
            {macroData.dxy.price.toFixed(2)}
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${macroData.dxy.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {macroData.dxy.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {macroData.dxy.change24h >= 0 ? '+' : ''}{macroData.dxy.change24h}%
            <span className="text-[10px] text-slate-400 mr-1">({macroData.dxy.trend})</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">{macroData.dxy.impactSummary}</p>
        </div>

        {/* US10Y Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-slate-200">US10Y (عوائد السندات)</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-white">
            {macroData.us10y.yield.toFixed(2)}%
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${macroData.us10y.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {macroData.us10y.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {macroData.us10y.change24h >= 0 ? '+' : ''}{macroData.us10y.change24h}%
            <span className="text-[10px] text-slate-400 mr-1">({macroData.us10y.trend})</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">{macroData.us10y.impactSummary}</p>
        </div>

        {/* SPX500 Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-slate-200">US500 (مؤشر S&P)</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-white">
            {macroData.spx500.price.toFixed(1)}
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${macroData.spx500.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {macroData.spx500.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {macroData.spx500.change24h >= 0 ? '+' : ''}{macroData.spx500.change24h}%
          </div>
          <p className="text-[10px] text-slate-400 mt-2">شهية المخاطرة: {macroData.spx500.sentiment}</p>
        </div>

        {/* VIX Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-slate-200">VIX (مؤشر الخوف)</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-white">
            {macroData.vix.value.toFixed(2)}
          </div>
          <div className="mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              macroData.vix.regime === 'PANIC' ? 'bg-rose-500/20 text-rose-400' :
              macroData.vix.regime === 'ELEVATED' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              حالة التقلب: {macroData.vix.regime}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">تسعير مخاطر السوق الفورية</p>
        </div>

        {/* USOIL Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-slate-200">USOIL (النفط)</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-white">
            ${macroData.oil.price.toFixed(2)}
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${macroData.oil.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {macroData.oil.change24h >= 0 ? '+' : ''}{macroData.oil.change24h}%
          </div>
          <p className="text-[10px] text-slate-400 mt-2">ضغط التضخم: {macroData.oil.inflationPressure}</p>
        </div>
      </div>

      {/* Sub-view Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSelectedAsset('GOLD')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            selectedAsset === 'GOLD'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          تحليل الذهب الكلي (Gold Macro Engine)
        </button>
        <button
          onClick={() => setSelectedAsset('FOREX')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            selectedAsset === 'FOREX'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          تحيزات أزواج الفوركس الكبرى (Forex Biases)
        </button>
        <button
          onClick={() => setSelectedAsset('CORRELATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            selectedAsset === 'CORRELATIONS'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4 text-indigo-400" />
          مصفوفة الارتباط والانحراف (Cross-Asset Divergence)
        </button>
      </div>

      {/* 1. Specialized Gold Macro Bias Engine */}
      {selectedAsset === 'GOLD' && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-base font-extrabold text-white">
                  محرك التحيز الكلي للذهب (XAU/USD Intermarket Confluence)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                تفكيك القوى المحركة للذهب: تأثير الدولار الأمريكي + عوائد السندات الحقيقية + تدفقات الملاذ الآمن
              </p>
            </div>
            {getBiasBadge(macroData.goldMacroBias.bias)}
          </div>

          {/* Breakdown Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* DXY Headwind */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>تأثير الدولار (DXY Impact)</span>
                <span className="font-bold text-slate-200">الارتباط: -0.86</span>
              </div>
              <div className="text-lg font-mono font-bold text-white mb-2">
                {macroData.goldMacroBias.dxyHeadwind > 0 ? `ضغط سلبي (${macroData.goldMacroBias.dxyHeadwind})` : `دعم إيجابي (${Math.abs(macroData.goldMacroBias.dxyHeadwind)})`}
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${macroData.goldMacroBias.dxyHeadwind > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, Math.abs(macroData.goldMacroBias.dxyHeadwind) * 2)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {macroData.dxy.change24h > 0 ? 'صعود الدولار يرفع تكلفة اقتناء الذهب عالمياً' : 'تراجع الدولار يحرر الذهب للصعود'}
              </p>
            </div>

            {/* Real Yields Headwind */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>تأثير العوائد الحقيقية (US10Y)</span>
                <span className="font-bold text-slate-200">الارتباط: -0.79</span>
              </div>
              <div className="text-lg font-mono font-bold text-white mb-2">
                {macroData.goldMacroBias.realYieldsHeadwind > 0 ? `تكلفة فرصة بديلة (+${macroData.goldMacroBias.realYieldsHeadwind})` : `محفز عوائد (-${Math.abs(macroData.goldMacroBias.realYieldsHeadwind)})`}
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${macroData.goldMacroBias.realYieldsHeadwind > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, Math.abs(macroData.goldMacroBias.realYieldsHeadwind) * 2)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {macroData.us10y.yield > 4.3 ? 'ارتفاع العوائد يقلل جاذبية الأصول عديمة الفائدة' : 'استقرار العوائد يدعم الاحتفاظ بالذهب'}
              </p>
            </div>

            {/* Safe Haven Tailwind */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>تدفقات الملاذ الآمن (VIX/Geopolitics)</span>
                <span className="font-bold text-slate-200">التقلب: {macroData.vix.value}</span>
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400 mb-2">
                +{macroData.goldMacroBias.safeHavenTailwind} نقطة دعم
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, macroData.goldMacroBias.safeHavenTailwind * 3)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                {macroData.vix.value > 18 ? 'علاوة مخاطر مفعلة تدعم طلب التحوّط' : 'هدوء التقلبات يعيد التركيز على البيانات الاقتصادية'}
              </p>
            </div>
          </div>

          {/* Synthesis Note */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300">خلاصة التوافق الكلي لصفقات الذهب (Intermarket Verdict):</h4>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {macroData.goldMacroBias.explanation}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-slate-400">النتيجة التراكمية (Macro Score):</span>
                <span className={`font-mono font-bold text-xs ${macroData.goldMacroBias.intermarketScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {macroData.goldMacroBias.intermarketScore > 0 ? '+' : ''}{macroData.goldMacroBias.intermarketScore} / 100
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Major Forex Biases */}
      {selectedAsset === 'FOREX' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(macroData.forexMacroBiases).map(([symbol, info]) => {
            const fxInfo = info as { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; score: number; rationale: string };
            return (
              <div key={symbol} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-white">{symbol}</span>
                  </div>
                  {getBiasBadge(fxInfo.bias)}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {fxInfo.rationale}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>قوة الزخم الكلي:</span>
                  <span className={`font-mono font-bold ${fxInfo.score >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fxInfo.score > 0 ? '+' : ''}{fxInfo.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Cross-Asset Correlations Matrix */}
      {selectedAsset === 'CORRELATIONS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              مصفوفة الارتباط تقيس درجة التأثير بين الأزواج المختلفة لمساعدتك على تجنب الصفقات المتضاربة واكتشاف فرص الانحراف المبكرة.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {macroData.crossAssetCorrelations.map((corr, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">{corr.pairA}</span>
                    <span className="text-xs text-slate-500">↔</span>
                    <span className="text-sm font-extrabold text-slate-300">{corr.pairB}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono font-black text-xs ${
                    corr.correlation < -0.7 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    corr.correlation > 0.7 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {corr.correlation > 0 ? `+${corr.correlation}` : corr.correlation}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {corr.description}
                </p>

                {corr.divergenceDetected && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">انحراف غير معتاد تم رصده (Macro Divergence):</span>
                      <span className="text-[11px] text-slate-200 mt-0.5 block">{corr.divergenceNote}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
